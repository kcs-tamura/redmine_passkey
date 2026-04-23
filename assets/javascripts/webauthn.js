// WebAuthn utilities for Redmine Passkey plugin

function bufferToBase64url(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlToBuffer(base64url) {
  const stripped = base64url.replace(/=/g, '');
  const padding  = '='.repeat((4 - stripped.length % 4) % 4);
  const base64   = (stripped + padding).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0)).buffer;
}

function csrfToken() {
  return document.querySelector('meta[name="csrf-token"]')?.content || '';
}

function jsonFetch(url, options = {}) {
  return fetch(url, {
    credentials: 'include',
    ...options,
    headers: {
      'Accept':       'application/json',
      'X-CSRF-Token': csrfToken(),
      ...options.headers
    }
  });
}

async function registerPasskey(nickname) {
  const optRes = await jsonFetch('/passkeys/registration/options', { method: 'POST' });
  if (!optRes.ok) {
    alert('Error: ' + optRes.status);
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

  let credential;
  try {
    credential = await navigator.credentials.create({ publicKey: options });
  } catch (e) {
    console.error('[passkey] create error:', e);
    return;
  }

  const verifyRes = await jsonFetch('/passkeys/registration/verify', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nickname,
      id:       credential.id,
      rawId:    bufferToBase64url(credential.rawId),
      type:     credential.type,
      response: {
        clientDataJSON:    bufferToBase64url(credential.response.clientDataJSON),
        attestationObject: bufferToBase64url(credential.response.attestationObject)
      }
    })
  });

  if (verifyRes.ok) {
    window.location.reload();
  } else {
    const data = await verifyRes.json().catch(() => ({}));
    alert('Registration failed: ' + (data.error || verifyRes.status));
  }
}

async function authenticatePasskey() {
  const optRes = await jsonFetch('/passkeys/authentication/options', { method: 'POST' });
  if (!optRes.ok) {
    console.error('[passkey] authentication/options failed:', optRes.status);
    alert('Error: ' + optRes.status);
    return;
  }

  const options = await optRes.json();
  options.challenge = base64urlToBuffer(options.challenge);

  let assertion;
  try {
    assertion = await navigator.credentials.get({ publicKey: options });
  } catch (e) {
    console.error('[passkey] get error:', e);
    return;
  }

  const verifyRes = await jsonFetch('/passkeys/authentication/verify', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
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
                             : null
      }
    })
  });

  if (verifyRes.ok) {
    const data = await verifyRes.json();
    window.location.href = data.redirect || '/';
  } else {
    alert('Authentication failed');
  }
}

(function () {
  const loginBtn = document.getElementById('passkey-login-btn');
  if (loginBtn) {
    loginBtn.addEventListener('click', authenticatePasskey);

    const submitBtn = document.querySelector('#login-form input[type=submit], form input[name=login]');
    const passkeyDiv = document.getElementById('passkey-login');
    if (submitBtn && passkeyDiv) {
      submitBtn.closest('p, div') ? submitBtn.parentNode.after(passkeyDiv) : submitBtn.after(passkeyDiv);
    }
  }

  const registerBtn = document.getElementById('passkey-register-btn');
  if (registerBtn) {
    registerBtn.addEventListener('click', () => {
      const nickname = document.getElementById('passkey-nickname').value;
      registerPasskey(nickname);
    });
  }
})();
