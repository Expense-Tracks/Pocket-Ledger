import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Fingerprint, Lock, RefreshCw } from 'lucide-react';

interface LockScreenProps {
  isLocked: boolean;
  onUnlock: () => void;
  isSupported: boolean;
  isLoading: boolean;
}

export function LockScreen({ isLocked, onUnlock, isSupported, isLoading }: LockScreenProps) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLocked && !isLoading && isSupported) {
      const timer = setTimeout(() => {
        handleUnlock();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLocked, isLoading, isSupported]);

  const handleUnlock = async () => {
    setError(null);
    onUnlock();
  };

  if (!isLocked || isLoading) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-background p-6">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-6">
        <Lock className="h-10 w-10 text-primary" />
      </div>
      
      <h1 className="text-2xl font-bold mb-2">Pocket Ledger</h1>
      <p className="text-muted-foreground text-center mb-8">
        {isLoading
          ? 'Checking security...'
          : isSupported
          ? 'Use biometrics to unlock'
          : 'Biometric not available'}
      </p>

      {error && (
        <p className="text-destructive text-sm mb-4">{error}</p>
      )}

      <Button
        onClick={handleUnlock}
        disabled={isLoading}
        className="gap-2"
        size="lg"
      >
        {isLoading ? (
          <RefreshCw className="h-5 w-5 animate-spin" />
        ) : isSupported ? (
          <Fingerprint className="h-5 w-5" />
        ) : (
          <Lock className="h-5 w-5" />
        )}
        {isLoading ? 'Checking...' : 'Unlock'}
      </Button>
    </div>
  );
}
