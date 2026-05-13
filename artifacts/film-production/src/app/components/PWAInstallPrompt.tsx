import React, { useEffect, useState } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { Button } from './ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    // Check if user dismissed before
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) return;

    if (ios) {
      // Show iOS instructions after a short delay
      setTimeout(() => setShowBanner(true), 3000);
      return;
    }

    // Listen for Android/Chrome install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowBanner(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-install-dismissed', '1');
  };

  if (isInstalled || !showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto sm:left-auto sm:right-4 sm:mx-0">
      <div className="bg-[#1E3A8A] text-white rounded-xl shadow-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Install FilmBudget Pro</p>
            {isIOS ? (
              <p className="text-xs text-white/70 mt-0.5">
                Tap <strong>Share</strong> then <strong>"Add to Home Screen"</strong> to install this app.
              </p>
            ) : (
              <p className="text-xs text-white/70 mt-0.5">
                Add to your home screen for quick access — works offline too.
              </p>
            )}
          </div>
          <button
            onClick={handleDismiss}
            className="text-white/60 hover:text-white transition-colors flex-shrink-0 mt-0.5"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!isIOS && deferredPrompt && (
          <div className="mt-3 flex gap-2">
            <Button
              onClick={handleInstall}
              size="sm"
              className="flex-1 bg-white text-[#1E3A8A] hover:bg-white/90 font-medium"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Install App
            </Button>
            <Button
              onClick={handleDismiss}
              size="sm"
              variant="ghost"
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              Not now
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
