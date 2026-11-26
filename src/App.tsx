import { useEffect, useState } from 'react';
import {
  INITIAL_BOT_FLOWS,
  INITIAL_BRIDGE_JOBS,
  INITIAL_CHANNELS,
  INITIAL_EMPLOYEES,
  INITIAL_ORDERS,
  INITIAL_SETTINGS,
} from './data/seedData.ts';
import {
  AiEmployee,
  BotFlow,
  BridgeJob,
  ClientOrder,
  CompoundSettings,
  Lang,
  MediaChannel,
  Theme,
} from './types.ts';
import { UI_COPY } from './i18n/translations.ts';
import { PublicPortal } from './components/PublicPortal.tsx';
import { AdminHQ } from './components/AdminHQ.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import {
  MobileSplashScreen,
  OfflineIndicator,
} from './components/PWAInstallButton.tsx';

function readStoredJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [lang, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem('jsm_lang');
    return saved === 'ar' ? 'ar' : 'en';
  });
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('jsm_theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  // Admin session token held strictly in memory
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'public' | 'admin'>('public');
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const [channels, setChannels] = useState<MediaChannel[]>(() =>
    readStoredJson('jsm_channels', INITIAL_CHANNELS)
  );
  const [employees, setEmployees] = useState<AiEmployee[]>(() =>
    readStoredJson('jsm_employees', INITIAL_EMPLOYEES)
  );
  const [orders, setOrders] = useState<ClientOrder[]>(() =>
    readStoredJson('jsm_orders', INITIAL_ORDERS)
  );
  const [botFlows, setBotFlows] = useState<BotFlow[]>(() =>
    readStoredJson('jsm_bot_flows', INITIAL_BOT_FLOWS)
  );
  const [bridgeJobs, setBridgeJobs] = useState<BridgeJob[]>(() =>
    readStoredJson('jsm_bridge_jobs', INITIAL_BRIDGE_JOBS)
  );
  const [settings, setSettings] = useState<CompoundSettings>(() => {
    const stored = readStoredJson<Partial<CompoundSettings>>(
      'jsm_settings',
      {}
    );
    return {
      ...INITIAL_SETTINGS,
      ...stored,
      channelVisibility: {
        ...INITIAL_SETTINGS.channelVisibility,
        ...(stored.channelVisibility || {}),
      },
      channelLinks: {
        ...INITIAL_SETTINGS.channelLinks,
        ...(stored.channelLinks || {}),
      },
    };
  });
  const [subscribedIds, setSubscribedIds] = useState<string[]>(() =>
    readStoredJson('jsm_subs', [])
  );

  const t = UI_COPY[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('jsm_lang', lang);
  }, [lang]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('jsm_theme', theme);
  }, [theme]);

  // Persist domain state cleanly in LocalStorage so nothing is lost on refresh
  useEffect(() => {
    try {
      localStorage.setItem('jsm_settings', JSON.stringify(settings));
    } catch {
      // Ignore storage quota warnings
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem('jsm_channels', JSON.stringify(channels));
    } catch {
      // Ignore storage quota warnings
    }
  }, [channels]);

  useEffect(() => {
    try {
      localStorage.setItem('jsm_orders', JSON.stringify(orders));
    } catch {
      // Ignore storage quota warnings
    }
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem('jsm_bot_flows', JSON.stringify(botFlows));
    } catch {
      // Ignore storage quota warnings
    }
  }, [botFlows]);

  useEffect(() => {
    try {
      localStorage.setItem('jsm_bridge_jobs', JSON.stringify(bridgeJobs));
    } catch {
      // Ignore storage quota warnings
    }
  }, [bridgeJobs]);

  useEffect(() => {
    try {
      localStorage.setItem('jsm_employees', JSON.stringify(employees));
    } catch {
      // Ignore storage quota warnings
    }
  }, [employees]);

  useEffect(() => {
    fetch('/api/public/state')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        if (Array.isArray(data.channels)) setChannels(data.channels);
        if (Array.isArray(data.botFlows)) setBotFlows(data.botFlows);
        if (data.publicSettings) {
          setSettings((prev) => ({
            ...prev,
            contactPhone: data.publicSettings.contactPhone ?? prev.contactPhone,
            telegramHandle:
              data.publicSettings.telegramHandle ?? prev.telegramHandle,
            showChannelsToPublic:
              typeof data.publicSettings.showChannelsToPublic === 'boolean'
                ? data.publicSettings.showChannelsToPublic
                : prev.showChannelsToPublic,
            channelVisibility: {
              ...prev.channelVisibility,
              ...(data.publicSettings.channelVisibility ?? {}),
            },
            whatsappBusinessUrl:
              data.publicSettings.whatsappBusinessUrl ??
              prev.whatsappBusinessUrl,
            telegramSalesBotUrl:
              data.publicSettings.telegramSalesBotUrl ??
              prev.telegramSalesBotUrl,
            channelLinks: {
              ...prev.channelLinks,
              ...(data.publicSettings.channelLinks ?? {}),
            },
            vodafoneCashNumber:
              data.publicSettings.vodafoneCashNumber ?? prev.vodafoneCashNumber,
            instaPayAddress:
              data.publicSettings.instaPayAddress ?? prev.instaPayAddress,
            instaPayPhone:
              data.publicSettings.instaPayPhone ?? prev.instaPayPhone,
            usdToEgpRate:
              data.publicSettings.usdToEgpRate ?? prev.usdToEgpRate,
          }));
        }
      })
      .catch(() => {
        // Keep persisted LocalStorage / seeded data when offline
      });
  }, []);

  async function loadAdminState(token: string) {
    try {
      const res = await fetch('/api/admin/state', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.settings) setSettings(data.settings);
      if (Array.isArray(data.channels)) setChannels(data.channels);
      if (Array.isArray(data.employees)) setEmployees(data.employees);
      if (Array.isArray(data.orders)) {
        // Merge any offline-submitted local orders not yet on server
        setOrders((localOrders) => {
          const serverIds = new Set(
            (data.orders as ClientOrder[]).map((o) => o.id)
          );
          const localOnly = localOrders.filter((o) => !serverIds.has(o.id));
          return [...localOnly, ...(data.orders as ClientOrder[])];
        });
      }
      if (Array.isArray(data.botFlows)) setBotFlows(data.botFlows);
      if (Array.isArray(data.bridgeJobs)) setBridgeJobs(data.bridgeJobs);
    } catch {
      // Keep LocalStorage data if offline
    }
  }

  function handleAuthenticated(token: string) {
    setAdminToken(token);
    setViewMode('admin');
    loadAdminState(token);
  }

  function handleLogout() {
    setAdminToken(null);
    setViewMode('public');
  }

  function handleOrderCreated(newOrder: ClientOrder) {
    setOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)]);
  }

  async function handleToggleSubscribe(channelId: string) {
    const alreadySub = subscribedIds.includes(channelId);
    const nextSubs = alreadySub
      ? subscribedIds.filter((id) => id !== channelId)
      : [...subscribedIds, channelId];
    setSubscribedIds(nextSubs);
    localStorage.setItem('jsm_subs', JSON.stringify(nextSubs));

    setChannels((prev) =>
      prev.map((c) =>
        c.id === channelId
          ? {
              ...c,
              subscribers: Math.max(0, c.subscribers + (alreadySub ? -1 : 1)),
            }
          : c
      )
    );

    try {
      const res = await fetch('/api/public/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId, unsubscribe: alreadySub }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.channel) {
          setChannels((prev) =>
            prev.map((c) => (c.id === channelId ? data.channel : c))
          );
        }
      }
    } catch {
      // Local state already updated cleanly
    }
  }

  function handleHeaderPrimaryClick() {
    if (adminToken) {
      setViewMode((m) => (m === 'admin' ? 'public' : 'admin'));
    } else {
      setAuthModalOpen(true);
    }
  }

  const hasVisibleChannels =
    settings.showChannelsToPublic &&
    channels.some((c) => settings.channelVisibility?.[c.id] !== false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070B14] text-slate-900 dark:text-slate-100 transition-colors">
      <MobileSplashScreen />

      {/* Ambient architectural background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute -top-40 start-1/4 w-[38rem] h-[38rem] rounded-full bg-amber-500/8 dark:bg-amber-500/10 blur-3xl" />
        <div className="absolute top-1/3 end-1/4 w-[32rem] h-[32rem] rounded-full bg-sky-500/8 dark:bg-sky-500/10 blur-3xl" />
      </div>

      {/* Strictly 3-Zone Top Navigation Bar */}
      <header className="sticky top-0 z-30 glass-panel border-b border-slate-200/80 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line brand wordmark */}
          <a
            href="#top"
            onClick={(e) => {
              if (viewMode === 'admin') {
                e.preventDefault();
                setViewMode('public');
              }
            }}
            className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 font-display"
          >
            {t.brand}
          </a>

          {/* Zone 2: Concise single-line navigation links */}
          {viewMode === 'public' ? (
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
              {hasVisibleChannels && (
                <a
                  href="#channels"
                  className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
                >
                  {t.navChannels}
                </a>
              )}
              <a
                href="#store"
                className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
              >
                {t.navStore}
              </a>
              <a
                href="#pos-solutions"
                className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
              >
                {t.navPos}
              </a>
              <a
                href="#bot-engine"
                className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
              >
                {t.navBots}
              </a>
              <a
                href="#contact"
                className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
              >
                {t.navContact}
              </a>
            </nav>
          ) : (
            <div className="hidden md:flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
              <span>{t.brand}</span>
              <span>/</span>
              <span className="text-slate-900 dark:text-amber-400">
                {t.hqTitle}
              </span>
            </div>
          )}

          {/* Zone 3: 1 Primary Action Button */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={handleHeaderPrimaryClick}
              className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 text-xs font-semibold hover:bg-slate-800 dark:hover:bg-amber-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {adminToken && viewMode === 'admin' ? t.exitAdminBtn : t.adminBtn}
            </button>
          </div>
        </div>
      </header>

      <main id="top" className="relative z-10 pb-20">
        {viewMode === 'admin' && adminToken ? (
          <AdminHQ
            lang={lang}
            theme={theme}
            token={adminToken}
            settings={settings}
            channels={channels}
            employees={employees}
            orders={orders}
            botFlows={botFlows}
            bridgeJobs={bridgeJobs}
            onToggleLang={() => setLang((l) => (l === 'en' ? 'ar' : 'en'))}
            onToggleTheme={() =>
              setTheme((th) => (th === 'dark' ? 'light' : 'dark'))
            }
            onLogout={handleLogout}
            onSettingsUpdated={setSettings}
            onChannelsUpdated={setChannels}
            onEmployeesUpdated={setEmployees}
            onOrdersUpdated={setOrders}
            onBotsUpdated={setBotFlows}
            onBridgeJobsUpdated={setBridgeJobs}
          />
        ) : (
          <PublicPortal
            lang={lang}
            theme={theme}
            channels={channels}
            botFlows={botFlows}
            settings={settings}
            subscribedIds={subscribedIds}
            onToggleLang={() => setLang((l) => (l === 'en' ? 'ar' : 'en'))}
            onToggleTheme={() =>
              setTheme((th) => (th === 'dark' ? 'light' : 'dark'))
            }
            onToggleSubscribe={handleToggleSubscribe}
            onOrderCreated={handleOrderCreated}
          />
        )}
      </main>

      <AuthModal
        open={authModalOpen}
        lang={lang}
        onClose={() => setAuthModalOpen(false)}
        onAuthenticated={handleAuthenticated}
      />

      <OfflineIndicator lang={lang} />
    </div>
  );
}
