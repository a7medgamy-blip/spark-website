import { useEffect, useState } from 'react';
import { Smartphone, Download, Share, PlusSquare, X, WifiOff } from 'lucide-react';
import { Lang } from '../types.ts';
import { UI_COPY } from '../i18n/translations.ts';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall.ts';

interface PWAInstallButtonProps {
  lang: Lang;
  variant?: 'prominent' | 'compact';
}

export function PWAInstallButton({
  lang,
  variant = 'prominent',
}: PWAInstallButtonProps) {
  const t = UI_COPY[lang];
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  async function handleClick() {
    if (isInstallable) {
      const result = await install();
      if (result === 'unavailable') {
        setShowGuide(true);
      }
    } else {
      setShowGuide(true);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={
          variant === 'prominent'
            ? 'px-3.5 py-1.5 rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-xs transition-colors cursor-pointer'
            : 'px-3 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer'
        }
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span>{t.installAppBtn}</span>
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="glass-elevated w-full max-w-md rounded-2xl border border-slate-200/80 dark:border-white/15 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/70 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 flex items-center justify-center">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {t.installAppBtn}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Jimmy Spark Media · Standalone PWA
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Close"
                className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <div className="space-y-3 text-sm text-slate-700 dark:text-slate-200">
                <p className="font-medium">
                  {lang === 'ar'
                    ? 'لتثبيت التطبيق على الآيفون أو الآيباد (Safari):'
                    : 'To install on iPhone or iPad (Safari):'}
                </p>
                <div className="space-y-2 text-xs bg-slate-100/80 dark:bg-slate-900/80 p-3.5 rounded-xl border border-slate-200/70 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <Share className="w-4 h-4 text-sky-500 shrink-0" />
                    <span>
                      {lang === 'ar'
                        ? '1. اضغط على زر المشاركة (Share) في شريط Safari السفلي.'
                        : '1. Tap the Share button in the Safari toolbar.'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <PlusSquare className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>
                      {lang === 'ar'
                        ? '2. مرر للأسفل واختر "إضافة إلى الشاشة الرئيسية" (Add to Home Screen).'
                        : '2. Scroll down and tap "Add to Home Screen".'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-sm text-slate-700 dark:text-slate-200">
                <p className="font-medium">
                  {lang === 'ar'
                    ? 'لتثبيت التطبيق كتطبيق أصلي على الهاتف أو الكمبيوتر:'
                    : 'Install as a standalone native-like app:'}
                </p>
                <div className="space-y-2 text-xs bg-slate-100/80 dark:bg-slate-900/80 p-3.5 rounded-xl border border-slate-200/70 dark:border-white/10">
                  <div>
                    {lang === 'ar'
                      ? '• أندرويد (Chrome / Edge): افتح قائمة المتصفح (⋮) واختر "تثبيت التطبيق" أو "الإضافة للشاشة الرئيسية".'
                      : '• Android (Chrome / Edge): Open browser menu (⋮) and tap "Install app" or "Add to Home screen".'}
                  </div>
                  <div>
                    {lang === 'ar'
                      ? '• آيفون (Safari): اضغط على زر المشاركة ثم اختر "إضافة إلى الشاشة الرئيسية".'
                      : '• iPhone (Safari): Tap Share and choose "Add to Home Screen".'}
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 text-xs font-semibold cursor-pointer"
            >
              {lang === 'ar' ? 'حسناً' : 'Got It'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function OfflineIndicator({ lang }: { lang: Lang }) {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 start-4 z-50 flex items-center gap-2 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-semibold text-slate-950 shadow-lg">
      <WifiOff className="w-3.5 h-3.5" />
      <span>
        {lang === 'ar'
          ? 'وضع عدم الاتصال — يتم استخدام البيانات المحفوظة محلياً.'
          : 'Offline Mode — Cached local data active.'}
      </span>
    </div>
  );
}

export function MobileSplashScreen() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false;
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone ===
        true;
    return isStandalone;
  });

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setVisible(false), 650);
    return () => clearTimeout(timer);
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#070B14] text-white transition-opacity duration-300"
    >
      <img
        src="/pwa-192x192.png"
        alt="Jimmy Spark Media"
        className="w-20 h-20 rounded-2xl shadow-2xl mb-4"
      />
      <div className="text-lg font-bold tracking-tight font-display">
        Jimmy Spark Media
      </div>
      <div className="text-xs text-amber-400 mt-1">
        AI Media & Enterprise Systems
      </div>
    </div>
  );
}
