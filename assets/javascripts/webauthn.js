// WebAuthn ユーティリティ

function bufferToBase64url(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlToBuffer(base64url) {
  // 既存パディングを除去してから正しい量を付与
  const stripped = base64url.replace(/=/g, '');
  const padding  = '='.repeat((4 - stripped.length % 4) % 4);
  const base64   = (stripped + padding).replace(/-/g, '+').replace(/_/g, '/');
  console.debug('[passkey] base64urlToBuffer input:', base64url, '→', base64);
  const binary   = atob(base64);
  return Uint8Array.from(binary, c => c.charCodeAt(0)).buffer;
}

function csrfToken() {
  return document.querySelector('meta[name="csrf-token"]')?.content || '';
}

async function registerPasskey(nickname) {
  const token  = csrfToken();
  console.debug('[passkey] csrf token:', token);
  const optRes = await fetch('/passkeys/registration/options', {
    method:      'POST',
    credentials: 'include',
    headers:     { 'Accept': 'application/json', 'X-CSRF-Token': token }
  });
  console.debug('[passkey] registration/options status:', optRes.status, optRes.headers.get('content-type'));
  if (!optRes.ok || !optRes.headers.get('content-type')?.includes('json')) {
    const text = await optRes.text();
    console.error('[passkey] unexpected response:', text.slice(0, 200));
    alert('サーバーエラー: ' + optRes.status + '\n詳細はConsoleを確認してください');
    return;
  }
  const options = await optRes.json();

  options.challenge = base64urlToBuffer(options.challenge);
  options.user.id   = base64urlToBuffer(options.user.id);
  if (options.excludeCredentials) {
    options.excludeCredentials = options.excludeCredentials.map(c => ({
      ...c, id: base64urlToBuffer(c.id)
    }));
  }

  const credential = await navigator.credentials.create({ publicKey: options });

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

  if (verifyRes.ok) {
    window.location.reload();
  } else {
    const data = await verifyRes.json();
    alert('登録失敗: ' + (data.error || '不明なエラー'));
  }
}

async function authenticatePasskey() {
  const optRes = await fetch('/passkeys/authentication/options', {
    method:      'POST',
    credentials: 'include',
    headers:     { 'Accept': 'application/json', 'X-CSRF-Token': csrfToken() }
  });
  if (!optRes.ok) {
    console.error('[passkey] authentication/options failed:', optRes.status);
    alert('認証オプション取得に失敗しました: ' + optRes.status);
    return;
  }
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
        userHandle:        assertion.response.userHandle
                             ? bufferToBase64url(assertion.response.userHandle)
                             : null,
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

// スクリプトはボタンの直後に配置されるため、ここ実行時点でDOMに存在する
(function () {
  const loginBtn = document.getElementById('passkey-login-btn');
  if (loginBtn) {
    loginBtn.addEventListener('click', authenticatePasskey);
  }

  const registerBtn = document.getElementById('passkey-register-btn');
  if (registerBtn) {
    registerBtn.addEventListener('click', function () {
      const nickname = document.getElementById('passkey-nickname').value;
      registerPasskey(nickname);
    });
  }
})();
