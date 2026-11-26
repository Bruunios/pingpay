// Biometria no navegador via WebAuthn: o próprio celular confirma a
// identidade (digital, rosto ou PIN) e o navegador só responde sim/não.
// É uma trava local do app, sem servidor conferindo a assinatura — o mesmo
// papel do local_auth no APK.
(function () {
  function aleatorio(tamanho) {
    const bytes = new Uint8Array(tamanho);
    crypto.getRandomValues(bytes);
    return bytes;
  }

  function paraBase64(buffer) {
    let texto = '';
    new Uint8Array(buffer).forEach((b) => (texto += String.fromCharCode(b)));
    return btoa(texto);
  }

  function deBase64(base64) {
    return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  }

  function suportado() {
    return !!(window.PublicKeyCredential && navigator.credentials && window.isSecureContext);
  }

  window.pingpayBiometria = {
    disponivel: async function () {
      if (!suportado()) return false;
      try {
        return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      } catch (_) {
        return false;
      }
    },

    // Cria a credencial no aparelho. Chame direto do toque do usuário (o
    // Safari recusa se houver espera antes). Devolve o id ou null.
    registrar: async function (nome) {
      if (!suportado()) return null;
      try {
        const credencial = await navigator.credentials.create({
          publicKey: {
            challenge: aleatorio(32),
            rp: { name: 'PingPay' },
            user: { id: aleatorio(16), name: nome || 'PingPay', displayName: nome || 'PingPay' },
            pubKeyCredParams: [
              { type: 'public-key', alg: -7 },
              { type: 'public-key', alg: -257 },
            ],
            authenticatorSelection: {
              authenticatorAttachment: 'platform',
              userVerification: 'required',
              residentKey: 'discouraged',
            },
            timeout: 60000,
          },
        });
        return credencial ? paraBase64(credencial.rawId) : null;
      } catch (_) {
        return null;
      }
    },

    autenticar: async function (id) {
      if (!suportado() || !id) return false;
      try {
        const resposta = await navigator.credentials.get({
          publicKey: {
            challenge: aleatorio(32),
            allowCredentials: [{ type: 'public-key', id: deBase64(id) }],
            userVerification: 'required',
            timeout: 60000,
          },
        });
        return !!resposta;
      } catch (_) {
        return false;
      }
    },
  };
})();
