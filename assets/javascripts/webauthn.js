// WebAuthn ユーティリティ
// Base64url <-> ArrayBuffer 変換

function bufferToBase64url(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlToBuffer(base64url) {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  return Uint8Array.from(binary, c => c.charCodeAt(0)).buffer;
}

// --- 登録フロー ---
async function registerPasskey(nickname) {
  // 1. サーバーからオプション取得
  const optRes = await fetch('/passkeys/registration/options', { method: 'POST', headers: { 'X-CSRF-Token': csrfToken() } });
  const options = await optRes.json();

  // ArrayBuffer変換
  options.challenge = base64urlToBuffer(options.challenge);
  options.user.id   = base64urlToBuffer(options.user.id);
  if (options.excludeCredentials) {
    options.excludeCredentials = options.excludeCredentials.map(c => ({
      ...c, id: base64urlToBuffer(c.id)
    }));
  }

  // 2. ブラウザにPasskey作成を要求
  const credential = await navigator.credentials.create({ publicKey: options });

  // 3. サーバーへ送信
  const verifyRes = await fetch('/passkeys/registration/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken() },
    body: JSON.stringify({
      nickname,
      id:       credential.id,
      rawId:    bufferToBase64url(credential.rawId),
      type:     credential.type,
      response: {
        clientDataJSON:    bufferToBase64url(credential.response.clientDataJSON),
        attestationObject: bufferToBase64url(credential.response.attestationObject),
      }
    })
  });
  return verifyRes.ok;
}

// --- 認証フロー ---
async function authenticatePasskey() {
  const optRes = await fetch('/passkeys/authentication/options', { method: 'POST', headers: { 'X-CSRF-Token': csrfToken() } });
  const options = await optRes.json();
  options.challenge = base64urlToBuffer(options.challenge);

  const assertion = await navigator.credentials.get({ publicKey: options });

  const verifyRes = await fetch('/passkeys/authentication/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken() },
    body: JSON.stringify({
      id:       assertion.id,
      rawId:    bufferToBase64url(assertion.rawId),
      type:     assertion.type,
      response: {
        clientDataJSON:    bufferToBase64url(assertion.response.clientDataJSON),
        authenticatorData: bufferToBase64url(assertion.response.authenticatorData),
        signature:         bufferToBase64url(assertion.response.signature),
        userHandle:        assertion.response.userHandle ? bufferToBase64url(assertion.response.userHandle) : null,
      }
    })
  });

  if (verifyRes.ok) {
    const data = await verifyRes.json();
    window.location.href = data.redirect || '/';
  } else {
    alert('Passkey認証に失敗しました');
  }
}

function csrfToken() {
  return document.querySelector('meta[name="csrf-token"]')?.content || '';
}
