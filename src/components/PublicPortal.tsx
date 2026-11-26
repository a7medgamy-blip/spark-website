import { useState, FormEvent } from 'react';
import {
  Play,
  Check,
  Send,
  MessageCircle,
  Sun,
  Moon,
  Languages,
  X,
  ArrowUpRight,
  Building2,
  ExternalLink,
  ShoppingBag,
  Youtube,
  Globe,
} from 'lucide-react';
import { HERO_COMPOUND_IMAGE, STORE_PRODUCTS } from '../data/seedData.ts';
import {
  BotFlow,
  ChannelSocialLinks,
  ClientOrder,
  CompoundSettings,
  Lang,
  MediaChannel,
  StoreProduct,
  Theme,
} from '../types.ts';
import { UI_COPY } from '../i18n/translations.ts';
import { PosSimulator } from './PosSimulator.tsx';
import { PWAInstallButton } from './PWAInstallButton.tsx';
import { CheckoutItemPayload, CheckoutModal } from './CheckoutModal.tsx';

interface PublicPortalProps {
  lang: Lang;
  theme: Theme;
  channels: MediaChannel[];
  botFlows: BotFlow[];
  settings: CompoundSettings;
  subscribedIds: string[];
  onToggleLang: () => void;
  onToggleTheme: () => void;
  onToggleSubscribe: (channelId: string) => void;
  onOrderCreated: (order: ClientOrder) => void;
}

export function PublicPortal({
  lang,
  theme,
  channels,
  botFlows,
  settings,
  subscribedIds,
  onToggleLang,
  onToggleTheme,
  onToggleSubscribe,
  onOrderCreated,
}: PublicPortalProps) {
  const t = UI_COPY[lang];
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [previewChannel, setPreviewChannel] = useState<MediaChannel | null>(null);
  const [heroImgError, setHeroImgError] = useState(false);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
  const [checkoutItem, setCheckoutItem] = useState<CheckoutItemPayload | null>(
    null
  );

  // Bot simulator state
  const [botInput, setBotInput] = useState('');
  const [botMessages, setBotMessages] = useState<
    { sender: 'user' | 'bot'; text: string; platform: string }[]
  >([
    {
      sender: 'bot',
      platform: 'WhatsApp',
      text:
        lang === 'ar'
          ? 'مرحباً بك في مساعد جيمي سبارك للأعمال. اكتب "نظام مبيعات" أو "/start" للتجربة.'
          : 'Welcome to Jimmy Spark Business Bot. Type "POS" or "/start" to test automated routing.',
    },
  ]);

  // Lead / Order Form state
  const [clientName, setClientName] = useState('');
  const [phone, setPhone] = useState('');
  const [organization, setOrganization] = useState('');
  const [sector, setSector] = useState('Company & Retail POS');
  const [notes, setNotes] = useState('');
  const [orderError, setOrderError] = useState('');
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderSubmitted, setOrderSubmitted] = useState(false);

  // Admin Visibility Filter for Public Channels Showcase
  const visibleChannels = settings.showChannelsToPublic
    ? channels.filter((c) => settings.channelVisibility?.[c.id] !== false)
    : [];
  const channelsSectionVisible =
    settings.showChannelsToPublic && visibleChannels.length > 0;

  const categories = Array.from(
    new Set(
      visibleChannels.map((c) => (lang === 'ar' ? c.categoryAr : c.categoryEn))
    )
  );

  const filteredChannels =
    categoryFilter === 'all'
      ? visibleChannels
      : visibleChannels.filter(
          (c) => (lang === 'ar' ? c.categoryAr : c.categoryEn) === categoryFilter
        );

  const cleanPhoneDigits = settings.contactPhone.replace(/[^0-9]/g, '');
  const whatsappUrl =
    settings.whatsappBusinessUrl?.trim() ||
    `https://wa.me/${cleanPhoneDigits || '201000000000'}`;
  const telegramBotUrl =
    settings.telegramSalesBotUrl?.trim() ||
    `https://t.me/${settings.telegramHandle || 'JimmySparkMedia'}`;

  function getChannelLinkButtons(channelId: string) {
    const links: ChannelSocialLinks = settings.channelLinks?.[channelId] || {};
    const entries: { key: keyof ChannelSocialLinks; label: string; url: string }[] = [
      { key: 'youtube', label: 'YouTube', url: links.youtube || '' },
      { key: 'telegram', label: 'Telegram', url: links.telegram || '' },
      { key: 'facebook', label: 'Facebook', url: links.facebook || '' },
      { key: 'tiktok', label: 'TikTok', url: links.tiktok || '' },
      { key: 'x', label: 'X', url: links.x || '' },
    ];
    return entries.filter((e) => e.url.trim().length > 0);
  }

  function handleOpenProductCheckout(prod: StoreProduct) {
    setCheckoutItem({
      orderType:
        prod.category === 'pos'
          ? 'pos_system'
          : prod.category === 'bot'
            ? 'bot_package'
            : 'subscription',
      packageTitle: lang === 'ar' ? prod.nameAr : prod.nameEn,
      sector: lang === 'ar' ? prod.sectorTagAr : prod.sectorTagEn,
      amountUsd: prod.priceUsd,
      notes: lang === 'ar' ? prod.summaryAr : prod.summaryEn,
    });
  }

  function handleBotTest(e: FormEvent) {
    e.preventDefault();
    const q = botInput.trim();
    if (!q) return;
    const matched = botFlows.find((b) =>
      q.toLowerCase().includes(b.triggerKeyword.toLowerCase().split(' ')[0])
    );
    const reply = matched
      ? lang === 'ar'
        ? `${matched.welcomeReplyAr} — (${matched.funnelStepAr})`
        : `${matched.welcomeReplyEn} — (${matched.funnelStepEn})`
      : lang === 'ar'
        ? `تم استلام رسالتك "${q}". تواصل مباشرة على ${settings.contactPhone} أو أرسل "POS" لعرض باقات الكاشير.`
        : `Received "${q}". Reply "POS" for Cashier packages or "/start" for Media Channel alerts.`;

    setBotMessages((prev) => [
      ...prev,
      { sender: 'user', platform: 'Client', text: q },
      {
        sender: 'bot',
        platform: matched?.platform || 'WhatsApp',
        text: reply,
      },
    ]);
    setBotInput('');
  }

  async function handleOrderSubmit(e: FormEvent) {
    e.preventDefault();
    setOrderError('');
    if (
      clientName.trim().length < 2 ||
      phone.trim().length < 7 ||
      organization.trim().length < 2
    ) {
      setOrderError(
        lang === 'ar'
          ? 'يرجى إدخال الاسم ورقم الهاتف واسم الجهة بشكل صحيح.'
          : 'Please enter a valid name, mobile number, and organization name.'
      );
      return;
    }
    setOrderSubmitting(true);
    try {
      const res = await fetch('/api/public/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName,
          phone,
          organization,
          sector,
          notes,
          orderType: 'custom_quote',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOrderError(data.error || 'Submission failed.');
      } else {
        if (data.order) onOrderCreated(data.order);
        setOrderSubmitted(true);
        setClientName('');
        setPhone('');
        setOrganization('');
        setNotes('');
      }
    } catch {
      const offlineOrder: ClientOrder = {
        id: `ord-${Date.now()}`,
        clientName: clientName.trim(),
        phone: phone.trim(),
        organization: organization.trim(),
        sector,
        notes: notes.trim(),
        status: 'new',
        createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        orderType: 'custom_quote',
      };
      onOrderCreated(offlineOrder);
      setOrderSubmitted(true);
      setClientName('');
      setPhone('');
      setOrganization('');
      setNotes('');
    } finally {
      setOrderSubmitting(false);
    }
  }

  return (
    <div className="relative">
      {/* Workspace Mode, Language & PWA Install Toolbar below Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-3 py-2.5 px-4 rounded-xl glass-panel border border-slate-200/80 dark:border-white/10">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate">
            {t.heroKicker}
          </p>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <PWAInstallButton lang={lang} variant="prominent" />
            <button
              type="button"
              onClick={onToggleLang}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/15 text-xs font-medium text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Languages className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>{t.langSwitch}</span>
            </button>
            <button
              type="button"
              onClick={onToggleTheme}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/15 text-xs font-medium text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t.themeLight}</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-700" />
                  <span>{t.themeDark}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
            <h1
              className="font-bold tracking-tight text-slate-900 dark:text-white leading-[1.12] text-balance"
              style={{ fontSize: 'clamp(2.25rem, 4vw, 3.5rem)' }}
            >
              {channelsSectionVisible ? t.heroTitle : t.heroTitleB2B}
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
              {channelsSectionVisible ? t.heroSubtitle : t.heroSubtitleB2B}
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href={channelsSectionVisible ? '#channels' : '#store'}
                className="px-6 py-3 rounded-xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 text-sm font-semibold hover:bg-slate-800 dark:hover:bg-amber-400 transition-colors whitespace-nowrap shrink-0"
              >
                {channelsSectionVisible ? t.heroCta : t.heroCtaB2B}
              </a>
              <a
                href="#pos-solutions"
                className="px-5 py-3 rounded-xl border border-slate-300 dark:border-white/15 text-sm font-medium text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors whitespace-nowrap shrink-0"
              >
                {t.heroSecondary}
              </a>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative h-72 sm:h-96 lg:h-full min-h-[340px] rounded-2xl overflow-hidden border border-slate-200/80 dark:border-white/10 bg-slate-900">
              {!heroImgError ? (
                <img
                  src={HERO_COMPOUND_IMAGE}
                  alt="Jimmy Spark Media 3-Wing Smart Glass Compound"
                  referrerPolicy="no-referrer"
                  onError={() => setHeroImgError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950/50 p-6 text-center">
                  <Building2 className="w-12 h-12 text-amber-400 mb-3" />
                  <span className="text-sm font-semibold text-white">
                    Jimmy Spark Media HQ
                  </span>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                <div className="text-xs text-amber-300 font-medium">
                  {lang === 'ar'
                    ? 'المجمع الزجاجي الذكي · 3 أجنحة مترابطة'
                    : 'Smart Glass Compound · 3 Interconnected Wings'}
                </div>
                <div className="text-sm text-white/95 font-medium mt-0.5">
                  {channelsSectionVisible
                    ? lang === 'ar'
                      ? 'إنتاج القنوات · أنظمة الكاشير · جسر السيرفر المنزلي'
                      : 'Media Factory · Enterprise POS · Local Python Bridge'
                    : lang === 'ar'
                      ? 'أنظمة الكاشير للمؤسسات · بوتات واتساب وتليجرام · دفع إلكتروني فوري'
                      : 'Enterprise POS Systems · WhatsApp & Telegram Bots · Instant Checkout'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Full-Width 4-Column Studio Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          <div className="glass-panel rounded-xl border border-slate-200/80 dark:border-white/10 p-5">
            <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono-tabular">
              {channelsSectionVisible ? visibleChannels.length : STORE_PRODUCTS.length}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              {channelsSectionVisible
                ? t.statChannels
                : lang === 'ar'
                  ? 'باقات الأنظمة والبوتات'
                  : 'Software & Bot Packages'}
            </div>
          </div>
          <div className="glass-panel rounded-xl border border-slate-200/80 dark:border-white/10 p-5">
            <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono-tabular">
              24
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              {t.statAgents}
            </div>
          </div>
          <div className="glass-panel rounded-xl border border-slate-200/80 dark:border-white/10 p-5">
            <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono-tabular">
              4
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              {t.statSectors}
            </div>
          </div>
          <div className="glass-panel rounded-xl border border-slate-200/80 dark:border-white/10 p-5">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono-tabular">
              24/7
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              {t.statBots}
            </div>
          </div>
        </div>
      </section>

      {/* Section 01: Media Channels Showcase (Controlled by Admin Master & Channel Toggles) */}
      {channelsSectionVisible && (
        <section
          id="channels"
          className="max-w-7xl mx-auto px-4 sm:px-6 py-12 border-t border-slate-200/70 dark:border-white/10"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                {t.channelsHeading}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 max-w-2xl">
                {t.channelsSub}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/70 self-start">
              <button
                type="button"
                onClick={() => setCategoryFilter('all')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                  categoryFilter === 'all'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-amber-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {t.filterAll}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-amber-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredChannels.map((ch) => {
              const isSub = subscribedIds.includes(ch.id);
              const imgFailed = brokenImages[ch.id];
              const socialLinks = getChannelLinkButtons(ch.id);
              return (
                <article
                  key={ch.id}
                  className="glass-panel rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden flex flex-col"
                >
                  <div className="aspect-[16/10] w-full bg-slate-900 overflow-hidden relative">
                    {!imgFailed ? (
                      <img
                        src={ch.image}
                        alt={lang === 'ar' ? ch.nameAr : ch.nameEn}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setBrokenImages((prev) => ({ ...prev, [ch.id]: true }))
                        }
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950 text-amber-400 font-semibold">
                        {lang === 'ar' ? ch.nameAr : ch.nameEn}
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/35 to-transparent flex items-end justify-between text-white">
                      <span className="text-xs font-medium">
                        {lang === 'ar' ? ch.categoryAr : ch.categoryEn} ·{' '}
                        <span className="font-mono-tabular">
                          {ch.previewDuration}
                        </span>
                      </span>
                      <span className="text-xs font-mono-tabular text-amber-300">
                        {ch.subscribers.toLocaleString()} {t.subscribersLabel}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                        {lang === 'ar' ? ch.nameAr : ch.nameEn}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mt-2">
                        {lang === 'ar' ? ch.descriptionAr : ch.descriptionEn}
                      </p>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                        {ch.platforms.join(' · ')}
                      </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-slate-200/70 dark:border-white/10">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => setPreviewChannel(ch)}
                          className="px-4 py-2 rounded-lg border border-slate-300 dark:border-white/15 text-xs font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span>{t.watchPreview}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onToggleSubscribe(ch.id)}
                          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                            isSub
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                              : 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-amber-400'
                          }`}
                        >
                          {isSub && <Check className="w-3.5 h-3.5" />}
                          <span>{isSub ? t.subscribed : t.subscribe}</span>
                        </button>
                      </div>

                      {/* Real Saved Channel Links */}
                      {socialLinks.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
                          {socialLinks.map((lnk) => (
                            <a
                              key={lnk.key}
                              href={lnk.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-white/15 bg-white/50 dark:bg-slate-900/50 text-[11px] font-medium text-slate-700 dark:text-slate-200 hover:border-amber-500/60 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-1 whitespace-nowrap"
                            >
                              {lnk.key === 'youtube' ? (
                                <Youtube className="w-3 h-3 text-rose-500" />
                              ) : lnk.key === 'telegram' ? (
                                <Send className="w-3 h-3 text-sky-500" />
                              ) : (
                                <Globe className="w-3 h-3 text-slate-400" />
                              )}
                              <span>{lnk.label}</span>
                              <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* Enterprise Software & Automation Store (B2B Commercial Sales & Checkout) */}
      <section
        id="store"
        className="max-w-7xl mx-auto px-4 sm:px-6 py-12 border-t border-slate-200/70 dark:border-white/10"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              {t.storeHeading}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 max-w-2xl">
              {t.storeSub}
            </p>
          </div>
          <div className="text-xs font-mono-tabular text-slate-500 dark:text-slate-400">
            Vodafone Cash · InstaPay · 1 USD ≈ {settings.usdToEgpRate || 50} EGP
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {STORE_PRODUCTS.map((prod) => {
            const egpPrice = Math.round(
              prod.priceUsd * (settings.usdToEgpRate || 50)
            );
            return (
              <div
                key={prod.id}
                className="glass-panel rounded-2xl border border-slate-200/80 dark:border-white/10 p-6 flex flex-col justify-between space-y-5"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>
                      {lang === 'ar' ? prod.sectorTagAr : prod.sectorTagEn}
                    </span>
                    <span className="font-mono-tabular">
                      {lang === 'ar' ? prod.billingAr : prod.billingEn}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-2">
                    {lang === 'ar' ? prod.nameAr : prod.nameEn}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mt-2">
                    {lang === 'ar' ? prod.summaryAr : prod.summaryEn}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-200/70 dark:border-white/10 flex items-center justify-between gap-3">
                  <div className="font-mono-tabular">
                    <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
                      {egpPrice.toLocaleString()} EGP
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      ${prod.priceUsd.toFixed(2)} USD
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenProductCheckout(prod)}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 text-xs font-semibold hover:bg-slate-800 dark:hover:bg-amber-400 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>{t.buyNowBtn}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section: Enterprise POS & Bot Solutions */}
      <section
        id="pos-solutions"
        className="max-w-7xl mx-auto px-4 sm:px-6 py-12 border-t border-slate-200/70 dark:border-white/10"
      >
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            {channelsSectionVisible ? t.posHeading : t.posHeadingB2B}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 max-w-2xl">
            {t.posSub}
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <div className="xl:col-span-8">
            <PosSimulator
              lang={lang}
              contactPhone={settings.contactPhone}
              onCheckout={(payload) => setCheckoutItem(payload)}
            />
          </div>

          <div
            id="bot-engine"
            className="xl:col-span-4 glass-panel rounded-xl border border-slate-200/80 dark:border-white/10 p-5 md:p-6 flex flex-col justify-between space-y-4"
          >
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t.botPreviewTitle}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                WhatsApp Business · Telegram Bot API
              </p>

              <div className="mt-4 space-y-2.5 h-56 overflow-y-auto pe-1">
                {botMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 ms-6'
                        : 'bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 me-6'
                    }`}
                  >
                    <div className="text-[11px] opacity-70 mb-1">
                      {msg.platform}
                    </div>
                    <div>{msg.text}</div>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleBotTest} className="flex gap-2">
              <input
                type="text"
                value={botInput}
                onChange={(e) => setBotInput(e.target.value)}
                placeholder={t.botInputPlaceholder}
                className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-white/15 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 text-xs font-semibold hover:bg-slate-800 dark:hover:bg-amber-400 shrink-0 cursor-pointer"
              >
                {t.sendTest}
              </button>
            </form>

            {/* Real Saved Bot Links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2 pt-2 border-t border-slate-200/70 dark:border-white/10">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full px-3.5 py-2 rounded-lg bg-emerald-600/15 border border-emerald-500/35 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600/25 text-xs font-semibold flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>{t.openWhatsappBot}</span>
                </span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
              <a
                href={telegramBotUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full px-3.5 py-2 rounded-lg bg-sky-600/15 border border-sky-500/35 text-sky-700 dark:text-sky-300 hover:bg-sky-600/25 text-xs font-semibold flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <Send className="w-3.5 h-3.5" />
                  <span>{t.openTelegramBot}</span>
                </span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Request Custom POS or Bot Deployment */}
      <section
        id="contact"
        className="max-w-7xl mx-auto px-4 sm:px-6 py-12 border-t border-slate-200/70 dark:border-white/10"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 space-y-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              {channelsSectionVisible ? t.orderHeading : t.orderHeadingB2B}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {t.orderSub}
            </p>
            <div className="pt-2 space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <div>
                WhatsApp / Mobile:{' '}
                <span className="font-mono-tabular font-semibold text-amber-700 dark:text-amber-400">
                  {settings.contactPhone}
                </span>
              </div>
              <div>
                Telegram:{' '}
                <span className="font-mono-tabular font-semibold">
                  @{settings.telegramHandle}
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-mono-tabular">
                Vodafone Cash: {settings.vodafoneCashNumber} · InstaPay:{' '}
                {settings.instaPayAddress}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 glass-panel rounded-2xl border border-slate-200/80 dark:border-white/10 p-6">
            {orderSubmitted ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-11 h-11 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <Check className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {t.orderSuccessTitle}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                  {t.orderSuccessBody}
                </p>
                <button
                  type="button"
                  onClick={() => setOrderSubmitted(false)}
                  className="mt-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-white/15 text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  {lang === 'ar' ? 'إرسال طلب آخر' : 'Submit Another Request'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleOrderSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      {t.fieldName}
                    </label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-white/15 text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      {t.fieldPhone}
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      placeholder="+20..."
                      className="w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-white/15 text-sm text-slate-900 dark:text-white font-mono-tabular"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      {t.fieldOrg}
                    </label>
                    <input
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-white/15 text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      {t.fieldSector}
                    </label>
                    <select
                      value={sector}
                      onChange={(e) => setSector(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-white/15 text-sm text-slate-900 dark:text-white"
                    >
                      <option value="Company & Retail POS">
                        {t.sectorCompany}
                      </option>
                      <option value="Restaurant & Cafe POS">
                        {t.sectorRestaurant}
                      </option>
                      <option value="Hotel PMS & Booking">
                        {t.sectorHotel}
                      </option>
                      <option value="Hospital & Clinic ERP">
                        {t.sectorHospital}
                      </option>
                      <option value="Telegram & WhatsApp Business Bot">
                        Telegram & WhatsApp Bot
                      </option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    {t.fieldNotes}
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-white/15 text-sm text-slate-900 dark:text-white"
                  />
                </div>

                {orderError && (
                  <div className="text-xs text-rose-600 dark:text-rose-400">
                    {orderError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={orderSubmitting}
                  className="px-6 py-3 rounded-xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 text-sm font-semibold hover:bg-slate-800 dark:hover:bg-amber-400 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{t.submitOrder}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Quiet Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 py-8 border-t border-slate-200/70 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
        <div>{t.footerCopy}</div>
        <div className="flex items-center gap-5">
          {channelsSectionVisible && (
            <a
              href="#channels"
              className="hover:text-slate-900 dark:hover:text-white"
            >
              {t.navChannels}
            </a>
          )}
          <a href="#store" className="hover:text-slate-900 dark:hover:text-white">
            {t.navStore}
          </a>
          <a
            href="#pos-solutions"
            className="hover:text-slate-900 dark:hover:text-white"
          >
            {t.navPos}
          </a>
          <a
            href="#contact"
            className="hover:text-slate-900 dark:hover:text-white"
          >
            {t.navContact}
          </a>
        </div>
      </footer>

      {/* Channel Episode Preview Modal */}
      {previewChannel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="glass-elevated w-full max-w-2xl rounded-2xl border border-slate-200/80 dark:border-white/15 overflow-hidden shadow-2xl">
            <div className="relative h-56 bg-slate-900">
              <img
                src={previewChannel.image}
                alt={previewChannel.nameEn}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
              <button
                type="button"
                onClick={() => setPreviewChannel(null)}
                aria-label="Close preview"
                className="absolute top-4 end-4 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-4 inset-x-6 text-white">
                <div className="text-xs text-amber-300 font-medium">
                  {lang === 'ar'
                    ? previewChannel.nameAr
                    : previewChannel.nameEn}{' '}
                  ·{' '}
                  <span className="font-mono-tabular">
                    {previewChannel.previewDuration}
                  </span>
                </div>
                <h3 className="text-xl font-bold mt-1">
                  {lang === 'ar'
                    ? previewChannel.previewTitleAr
                    : previewChannel.previewTitleEn}
                </h3>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {lang === 'ar' ? 'معاينة نص الحلقة' : 'Episode Script Excerpt'}
              </div>
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                {lang === 'ar'
                  ? previewChannel.previewScriptAr
                  : previewChannel.previewScriptEn}
              </p>

              {getChannelLinkButtons(previewChannel.id).length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {getChannelLinkButtons(previewChannel.id).map((lnk) => (
                    <a
                      key={lnk.key}
                      href={lnk.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/15 text-xs font-medium text-slate-800 dark:text-slate-100 hover:border-amber-500 flex items-center gap-1"
                    >
                      <span>{lnk.label}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-slate-200/70 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400">
                <span>{previewChannel.platforms.join(' · ')}</span>
                <button
                  type="button"
                  onClick={() => onToggleSubscribe(previewChannel.id)}
                  className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 font-semibold cursor-pointer"
                >
                  {subscribedIds.includes(previewChannel.id)
                    ? t.subscribed
                    : t.subscribe}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Checkout & Egyptian Payment Gateway Modal */}
      <CheckoutModal
        open={checkoutItem !== null}
        lang={lang}
        item={checkoutItem}
        settings={settings}
        onClose={() => setCheckoutItem(null)}
        onOrderCreated={onOrderCreated}
      />

      {/* Compact Floating WhatsApp & Telegram Quick-Connect */}
      <div className="fixed bottom-4 end-4 z-40 flex items-center gap-2">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="h-11 px-4 rounded-full bg-emerald-600 text-white text-xs font-semibold shadow-lg hover:bg-emerald-500 transition-colors flex items-center gap-1.5"
        >
          <MessageCircle className="w-4 h-4" />
          <span>{t.whatsappQuick}</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
        <a
          href={telegramBotUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="h-11 px-4 rounded-full bg-sky-600 text-white text-xs font-semibold shadow-lg hover:bg-sky-500 transition-colors flex items-center gap-1.5"
        >
          <Send className="w-4 h-4" />
          <span>{t.telegramQuick}</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
