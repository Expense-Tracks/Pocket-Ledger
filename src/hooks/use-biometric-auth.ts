import { useState, useCallback, useEffect } from 'react';

const CREDENTIAL_ID_KEY = 'pocket-ledger-biometric-credential';

function isPWA(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as Navigator & { standalone?: boolean }).standalone === true ||
         window.innerWidth <= 768;
}

export function useBiometricAuth(enabled: boolean) {
  const [isLocked, setIsLocked] = useState(true);
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSupport = async () => {
      if (!isPWA()) {
        setIsSupported(false);
        setIsLoading(false);
        return;
      }
      
      try {
        const supported = !!(
          window.PublicKeyCredential &&
          await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        );
        setIsSupported(supported);
      } catch {
        setIsSupported(false);
      }
      setIsLoading(false);
    };
    checkSupport();
  }, []);

  // Auto-unlock when biometric is not enabled or not supported
  useEffect(() => {
    if (!isLoading && (!enabled || !isSupported)) {
      setIsLocked(false);
    }
  }, [enabled, isSupported, isLoading]);

  const registerBiometric = useCallback(async (): Promise<boolean> => {
    try {
      const userId = new Uint8Array(16);
      crypto.getRandomValues(userId);
      
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { id: window.location.hostname, name: 'Pocket Ledger' },
          user: {
            id: userId,
            name: 'Pocket Ledger User',
            displayName: 'User',
          },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7 },
            { type: 'public-key', alg: -257 },
          ],
          authenticatorSelection: {
            userVerification: 'preferred',
            residentKey: 'preferred',
            authenticatorAttachment: 'platform',
          },
          timeout: 60000,
        },
      });

      if (credential) {
        const cred = credential as PublicKeyCredential;
        // Store credential ID as base64
        const base64 = btoa(String.fromCharCode(...new Uint8Array(cred.rawId)));
        localStorage.setItem(CREDENTIAL_ID_KEY, base64);
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  }, []);

  const authenticate = useCallback(async (): Promise<boolean> => {
    if (!enabled) return true;

    const credentialId = localStorage.getItem(CREDENTIAL_ID_KEY);
    if (!credentialId) return true;

    try {
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      // Decode base64 credential ID
      const decoded = Uint8Array.from(atob(credentialId), c => c.charCodeAt(0));

      const credential = await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials: [
            {
              id: decoded,
              type: 'public-key',
            },
          ],
          userVerification: 'preferred',
          timeout: 60000,
        },
      });

      return !!credential;
    } catch {
      return false;
    }
  }, [enabled]);

  const unlock = useCallback(async () => {
    if (!enabled || !isSupported) {
      setIsLocked(false);
      return;
    }

    const success = await authenticate();
    setIsLocked(!success);
  }, [enabled, isSupported, authenticate]);

  const lock = useCallback(() => {
    if (enabled) {
      setIsLocked(true);
    }
  }, [enabled]);

  const disableBiometric = useCallback(() => {
    localStorage.removeItem(CREDENTIAL_ID_KEY);
  }, []);

  const isBiometricAvailable = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;
    try {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch {
      return false;
    }
  }, [isSupported]);

  return {
    isLocked,
    isSupported,
    isLoading,
    isEnabled: enabled,
    registerBiometric,
    unlock,
    lock,
    disableBiometric,
    isBiometricAvailable,
  };
}
