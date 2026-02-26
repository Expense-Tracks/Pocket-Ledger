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
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: 'Pocket Ledger' },
          user: {
            id: new Uint8Array(16),
            name: 'Pocket Ledger User',
            displayName: 'User',
          },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7 },
            { type: 'public-key', alg: -257 },
          ],
          authenticatorSelection: {
            userVerification: 'required',
            residentKey: 'required',
            authenticatorAttachment: 'platform',
          },
        },
      });

      if (credential) {
        const cred = credential as PublicKeyCredential;
        localStorage.setItem(CREDENTIAL_ID_KEY, cred.id);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Biometric registration failed:', err);
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

      const credential = await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials: [
            {
              id: new TextEncoder().encode(credentialId),
              type: 'public-key',
            },
          ],
          userVerification: 'required',
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
