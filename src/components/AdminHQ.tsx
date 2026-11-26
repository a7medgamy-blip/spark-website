import { useState, FormEvent, useEffect } from 'react';
import {
  Building,
  Film,
  Cpu,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Server,
  Send,
  Copy,
  LogOut,
  Sun,
  Moon,
  Languages,
  Eye,
  EyeOff,
  Link2,
  Wallet,
  KeyRound,
  MessageCircle,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  AiEmployee,
  BotFlow,
  BridgeJob,
  ChannelSocialLinks,
  ClientOrder,
  CompoundSettings,
  Lang,
  MediaChannel,
  OrderStatus,
  ShiftSlot,
  Theme,
  WingNumber,
} from '../types.ts';
import { UI_COPY } from '../i18n/translations.ts';
import { PosSimulator } from './PosSimulator.tsx';
import { WorkstationModal } from './WorkstationModal.tsx';
import { PWAInstallButton } from './PWAInstallButton.tsx';

interface AdminHQProps {
  lang: Lang;
  theme: Theme;
  token: string;
  settings: CompoundSettings;
  channels: MediaChannel[];
  employees: AiEmployee[];
  orders: ClientOrder[];
  botFlows: BotFlow[];
  bridgeJobs: BridgeJob[];
  onToggleLang: () => void;
  onToggleTheme: () => void;
  onLogout: () => void;
  onSettingsUpdated: (s: CompoundSettings) => void;
  onChannelsUpdated: (c: MediaChannel[]) => void;
  onEmployeesUpdated: (e: AiEmployee[]) => void;
  onOrdersUpdated: (o: ClientOrder[]) => void;
  onBotsUpdated: (b: BotFlow[]) => void;
  onBridgeJobsUpdated: (j: BridgeJob[]) => void;
}

export function AdminHQ({
  lang,
  theme,
  token,
  settings,
  channels,
  employees,
  orders,
  botFlows,
  bridgeJobs,
  onToggleLang,
  onToggleTheme,
  onLogout,
  onSettingsUpdated,
  onChannelsUpdated,
  onEmployeesUpdated,
  onOrdersUpdated,
  onBotsUpdated,
  onBridgeJobsUpdated,
}: AdminHQProps) {
  const t = UI_COPY[lang];
  const [activeWing, setActiveWing] = useState<WingNumber>(1);
  const [selectedEmployee, setSelectedEmployee] = useState<AiEmployee | null>(
    null
  );
  const [shiftFilter, setShiftFilter] = useState<'all' | ShiftSlot>('all');

  // Wing 1 Executive & Payment Settings
  const [phoneInput, setPhoneInput] = useState(settings.contactPhone);
  const [telegramInput, setTelegramInput] = useState(settings.telegramHandle);
  const [bridgeUrlInput, setBridgeUrlInput] = useState(settings.pcBridgeUrl);
  const [bridgeOnline, setBridgeOnline] = useState(settings.pcBridgeConnected);
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(settings.supabaseUrl);

  // Visibility Controls
  const [showChannelsToPublic, setShowChannelsToPublic] = useState(
    settings.showChannelsToPublic
  );
  const [channelVisibility, setChannelVisibility] = useState<
    Record<string, boolean>
  >(settings.channelVisibility || {});

  // Real Channel & Bot Links
  const [whatsappBusinessUrl, setWhatsappBusinessUrl] = useState(
    settings.whatsappBusinessUrl || ''
  );
  const [telegramSalesBotUrl, setTelegramSalesBotUrl] = useState(
    settings.telegramSalesBotUrl || ''
  );
  const [channelLinks, setChannelLinks] = useState<
    Record<string, ChannelSocialLinks>
  >(settings.channelLinks || {});
  const [selectedLinkChannelId, setSelectedLinkChannelId] = useState(
    channels[0]?.id || 'xg-sport'
  );

  // Egyptian Payment Gateway Settings
  const [vodafoneCashNumber, setVodafoneCashNumber] = useState(
    settings.vodafoneCashNumber || ''
  );
  const [instaPayAddress, setInstaPayAddress] = useState(
    settings.instaPayAddress || ''
  );
  const [instaPayPhone, setInstaPayPhone] = useState(
    settings.instaPayPhone || ''
  );
  const [usdToEgpRate, setUsdToEgpRate] = useState(
    String(settings.usdToEgpRate || 50)
  );

  const [settingsSavedMsg, setSettingsSavedMsg] = useState(false);

  // Sync local form state when parent settings update from server
  useEffect(() => {
    setPhoneInput(settings.contactPhone);
    setTelegramInput(settings.telegramHandle);
    setBridgeUrlInput(settings.pcBridgeUrl);
    setBridgeOnline(settings.pcBridgeConnected);
    setSupabaseUrlInput(settings.supabaseUrl);
    setShowChannelsToPublic(settings.showChannelsToPublic);
    setChannelVisibility(settings.channelVisibility || {});
    setWhatsappBusinessUrl(settings.whatsappBusinessUrl || '');
    setTelegramSalesBotUrl(settings.telegramSalesBotUrl || '');
    setChannelLinks(settings.channelLinks || {});
    setVodafoneCashNumber(settings.vodafoneCashNumber || '');
    setInstaPayAddress(settings.instaPayAddress || '');
    setInstaPayPhone(settings.instaPayPhone || '');
    setUsdToEgpRate(String(settings.usdToEgpRate || 50));
  }, [settings]);

  // Admin Password Change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<{
    type: 'ok' | 'err';
    msg: string;
  } | null>(null);

  // Financial Verification Hub
  const [orderFilter, setOrderFilter] = useState<
    'all' | 'pending_payment' | 'confirmed' | 'rejected'
  >('all');
  const [inspectReceiptOrder, setInspectReceiptOrder] =
    useState<ClientOrder | null>(null);
  const [copiedNotifyId, setCopiedNotifyId] = useState<string | null>(null);

  // Channel CRUD form
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
  const [chNameEn, setChNameEn] = useState('');
  const [chNameAr, setChNameAr] = useState('');
  const [chCatEn, setChCatEn] = useState('');
  const [chCatAr, setChCatAr] = useState('');
  const [chDescEn, setChDescEn] = useState('');
  const [chDescAr, setChDescAr] = useState('');

  // Wing 3 Bot Builder form
  const [botPlatform, setBotPlatform] = useState<'WhatsApp' | 'Telegram'>(
    'WhatsApp'
  );
  const [botNameEn, setBotNameEn] = useState('');
  const [botTrigger, setBotTrigger] = useState('');
  const [botReplyEn, setBotReplyEn] = useState('');
  const [botReplyAr, setBotReplyAr] = useState('');

  // Wing 3 Local PC Bridge
  const [bridgeTaskType, setBridgeTaskType] = useState<
    'video_render' | 'python_fmsyson' | 'edge_tts_batch' | 'thumbnail_render'
  >('video_render');
  const [bridgeSummary, setBridgeSummary] = useState('');
  const [bridgeChannel, setBridgeChannel] = useState('xg-sport');
  const [lanStatus, setLanStatus] = useState('');
  const [copiedJobId, setCopiedJobId] = useState<string | null>(null);

  const totalSubscribers = channels.reduce((sum, c) => sum + c.subscribers, 0);
  const activeAgentsCount = employees.filter(
    (e) => e.status === 'active' || e.status === 'processing'
  ).length;
  const pendingReceiptsCount = orders.filter(
    (o) => o.status === 'pending_payment'
  ).length;

  async function persistSettingsPayload(nextSettings: CompoundSettings) {
    onSettingsUpdated(nextSettings);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(nextSettings),
      });
      const data = await res.json();
      if (res.ok && data.settings) {
        onSettingsUpdated(data.settings);
      }
    } catch {
      // LocalStorage persistence already updated via onSettingsUpdated
    }
    setSettingsSavedMsg(true);
    setTimeout(() => setSettingsSavedMsg(false), 2200);
  }

  async function handleSaveAllSettings(e?: FormEvent) {
    if (e) e.preventDefault();
    const rateNum = Number(usdToEgpRate);
    const nextSettings: CompoundSettings = {
      ...settings,
      contactPhone: phoneInput.trim() || settings.contactPhone,
      telegramHandle:
        telegramInput.trim().replace(/^@/, '') || settings.telegramHandle,
      pcBridgeUrl: bridgeUrlInput.trim() || settings.pcBridgeUrl,
      pcBridgeConnected: bridgeOnline,
      supabaseUrl: supabaseUrlInput.trim(),
      supabaseReady: Boolean(supabaseUrlInput.trim().startsWith('http')),
      showChannelsToPublic,
      channelVisibility,
      whatsappBusinessUrl: whatsappBusinessUrl.trim(),
      telegramSalesBotUrl: telegramSalesBotUrl.trim(),
      channelLinks,
      vodafoneCashNumber: vodafoneCashNumber.trim(),
      instaPayAddress: instaPayAddress.trim(),
      instaPayPhone: instaPayPhone.trim(),
      usdToEgpRate: Number.isFinite(rateNum) && rateNum > 0 ? rateNum : 50,
    };
    await persistSettingsPayload(nextSettings);
  }

  async function handleToggleMasterChannels() {
    const nextVal = !showChannelsToPublic;
    setShowChannelsToPublic(nextVal);
    await persistSettingsPayload({
      ...settings,
      showChannelsToPublic: nextVal,
      channelVisibility,
    });
  }

  async function handleToggleIndividualChannel(channelId: string) {
    const current = channelVisibility[channelId] !== false;
    const nextMap = { ...channelVisibility, [channelId]: !current };
    setChannelVisibility(nextMap);
    await persistSettingsPayload({
      ...settings,
      showChannelsToPublic,
      channelVisibility: nextMap,
    });
  }

  function updateChannelLinkField(
    channelId: string,
    field: keyof ChannelSocialLinks,
    val: string
  ) {
    setChannelLinks((prev) => ({
      ...prev,
      [channelId]: {
        ...(prev[channelId] || {}),
        [field]: val,
      },
    }));
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    setPasswordStatus(null);
    if (newPassword.length < 6) {
      setPasswordStatus({
        type: 'err',
        msg:
          lang === 'ar'
            ? 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل.'
            : 'New password must be at least 6 characters.',
      });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordStatus({
        type: 'err',
        msg:
          lang === 'ar'
            ? 'كلمة المرور الجديدة غير متطابقة.'
            : 'New passwords do not match.',
      });
      return;
    }
    try {
      const res = await fetch('/api/admin/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordStatus({
          type: 'err',
          msg: data.error || 'Failed to update password.',
        });
        return;
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setPasswordStatus({
        type: 'ok',
        msg:
          lang === 'ar'
            ? 'تم تحديث كلمة مرور المدير بنجاح.'
            : 'Admin password updated successfully.',
      });
    } catch {
      setPasswordStatus({
        type: 'err',
        msg:
          lang === 'ar'
            ? 'تعذر الاتصال بالخادم لتحديث كلمة المرور.'
            : 'Could not reach server to update password.',
      });
    }
  }

  function startEditChannel(ch: MediaChannel) {
    setEditingChannelId(ch.id);
    setChNameEn(ch.nameEn);
    setChNameAr(ch.nameAr);
    setChCatEn(ch.categoryEn);
    setChCatAr(ch.categoryAr);
    setChDescEn(ch.descriptionEn);
    setChDescAr(ch.descriptionAr);
  }

  function resetChannelForm() {
    setEditingChannelId(null);
    setChNameEn('');
    setChNameAr('');
    setChCatEn('');
    setChCatAr('');
    setChDescEn('');
    setChDescAr('');
  }

  async function handleSaveChannel(e: FormEvent) {
    e.preventDefault();
    if (!chNameEn.trim() || !chNameAr.trim()) return;
    if (editingChannelId) {
      const res = await fetch(`/api/admin/channels/${editingChannelId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nameEn: chNameEn,
          nameAr: chNameAr,
          categoryEn: chCatEn || 'Media',
          categoryAr: chCatAr || 'إعلام',
          descriptionEn: chDescEn,
          descriptionAr: chDescAr,
        }),
      });
      const data = await res.json();
      if (res.ok && data.channel) {
        onChannelsUpdated(
          channels.map((c) => (c.id === editingChannelId ? data.channel : c))
        );
        resetChannelForm();
      }
    } else {
      const res = await fetch('/api/admin/channels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nameEn: chNameEn,
          nameAr: chNameAr,
          categoryEn: chCatEn || 'AI Media',
          categoryAr: chCatAr || 'إعلام ذكي',
          descriptionEn: chDescEn,
          descriptionAr: chDescAr,
        }),
      });
      const data = await res.json();
      if (res.ok && data.channel) {
        onChannelsUpdated([...channels, data.channel]);
        setChannelVisibility((prev) => ({ ...prev, [data.channel.id]: true }));
        resetChannelForm();
      }
    }
  }

  async function handleDeleteChannel(id: string) {
    const res = await fetch(`/api/admin/channels/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      onChannelsUpdated(channels.filter((c) => c.id !== id));
    }
  }

  async function handleOrderStatus(id: string, status: OrderStatus) {
    onOrdersUpdated(orders.map((o) => (o.id === id ? { ...o, status } : o)));
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (res.ok && data.order) {
        onOrdersUpdated(orders.map((o) => (o.id === id ? data.order : o)));
      }
    } catch {
      // Local state & localStorage already updated
    }
  }

  function buildConfirmationText(ord: ClientOrder) {
    const pkg = ord.packageTitle || ord.sector;
    const amt = ord.amountEgp
      ? `${ord.amountEgp.toLocaleString()} EGP`
      : ord.amountUsd
        ? `$${ord.amountUsd}`
        : '';
    if (ord.status === 'rejected') {
      return lang === 'ar'
        ? `مرحباً ${ord.clientName}، بخصوص طلبك (${ord.id}) - ${pkg}: يرجى مراجعة بيانات التحويل وإعادة إرسال الإيصال الواضح عبر جيمي سبارك ميديا.`
        : `Hello ${ord.clientName}, regarding order ${ord.id} (${pkg}): please verify your transfer details and re-upload a clear receipt for Jimmy Spark Media.`;
    }
    return lang === 'ar'
      ? `مرحباً ${ord.clientName}، تم تأكيد استلام الإيداع بنجاح للطلب (${ord.id}) - ${pkg} ${amt ? `بقيمة ${amt}` : ''}. جاري التفعيل والتواصل معك فوراً من فريق جيمي سبارك ميديا.`
      : `Hello ${ord.clientName}, your payment for order ${ord.id} (${pkg}${amt ? ` · ${amt}` : ''}) has been CONFIRMED & PAID! Jimmy Spark Media team is activating your system now.`;
  }

  function getWhatsappNotifyUrl(ord: ClientOrder) {
    const digits = ord.phone.replace(/[^0-9]/g, '');
    const text = encodeURIComponent(buildConfirmationText(ord));
    if (digits.length >= 7) {
      return `https://wa.me/${digits}?text=${text}`;
    }
    return `https://wa.me/?text=${text}`;
  }

  function getTelegramNotifyUrl(ord: ClientOrder) {
    const text = encodeURIComponent(buildConfirmationText(ord));
    const cleanHandle = ord.phone.trim().replace(/^@/, '');
    if (
      cleanHandle &&
      !/^[0-9+\s-]+$/.test(cleanHandle) &&
      !cleanHandle.includes(' ')
    ) {
      return `https://t.me/${cleanHandle}`;
    }
    return `https://t.me/share/url?url=${encodeURIComponent('https://jimmyspark.media')}&text=${text}`;
  }

  async function handleAddBotFlow(e: FormEvent) {
    e.preventDefault();
    if (!botNameEn.trim() || !botTrigger.trim()) return;
    const res = await fetch('/api/admin/bots', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        platform: botPlatform,
        nameEn: botNameEn,
        nameAr: botNameEn,
        triggerKeyword: botTrigger,
        welcomeReplyEn: botReplyEn,
        welcomeReplyAr: botReplyAr || botReplyEn,
      }),
    });
    const data = await res.json();
    if (res.ok && data.botFlow) {
      onBotsUpdated([data.botFlow, ...botFlows]);
      setBotNameEn('');
      setBotTrigger('');
      setBotReplyEn('');
      setBotReplyAr('');
    }
  }

  async function handleDispatchBridge(e: FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/admin/bridge/dispatch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        taskType: bridgeTaskType,
        payloadSummary: bridgeSummary,
        channel: bridgeChannel,
      }),
    });
    const data = await res.json();
    if (res.ok && data.job) {
      onBridgeJobsUpdated([data.job, ...bridgeJobs]);
      setBridgeSummary('');
    }
  }

  async function handleBrowserLanDispatch(job: BridgeJob) {
    setLanStatus(
      lang === 'ar'
        ? `جاري الإرسال إلى ${job.targetNode}...`
        : `Sending POST to ${job.targetNode}...`
    );
    try {
      const res = await fetch(job.targetNode, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: job.jsonPacket,
      });
      setLanStatus(
        res.ok
          ? lang === 'ar'
            ? 'تم استلام المهمة على الجهاز المحلي بنجاح.'
            : 'Local PC FastAPI node accepted the task.'
          : `HTTP ${res.status}`
      );
    } catch {
      setLanStatus(
        lang === 'ar'
          ? 'تعذر الوصول للشبكة المحلية من المتصفح (شغّل خادم FastAPI على جهازك أو انسخ حزمة JSON).'
          : 'Local LAN node unreachable from browser preview. Copy JSON packet below to run on your GTX 1050 Ti FastAPI node.'
      );
    }
  }

  function statusBadgeLabel(status: AiEmployee['status']) {
    if (status === 'active') return t.statusActive;
    if (status === 'processing') return t.statusProcessing;
    return t.statusStandby;
  }

  function statusColorClass(status: AiEmployee['status']) {
    if (status === 'active') return 'text-emerald-600 dark:text-emerald-400';
    if (status === 'processing') return 'text-amber-600 dark:text-amber-400';
    return 'text-slate-500 dark:text-slate-400';
  }

  function orderStatusText(status: OrderStatus) {
    if (status === 'pending_payment') return t.statusPendingPayment;
    if (status === 'confirmed') return t.statusConfirmed;
    if (status === 'rejected') return t.statusRejected;
    if (status === 'in_review') return t.statusReview;
    if (status === 'deployed') return t.statusDeployed;
    return t.statusNew;
  }

  function orderStatusColor(status: OrderStatus) {
    if (status === 'confirmed' || status === 'deployed')
      return 'text-emerald-600 dark:text-emerald-400';
    if (status === 'rejected') return 'text-rose-600 dark:text-rose-400';
    if (status === 'pending_payment' || status === 'in_review')
      return 'text-amber-600 dark:text-amber-400';
    return 'text-sky-600 dark:text-sky-400';
  }

  const filteredOrders =
    orderFilter === 'all'
      ? orders
      : orders.filter((o) => o.status === orderFilter);

  const wingEmployees = employees.filter((e) => e.wing === activeWing);
  const filteredWingEmployees =
    activeWing === 2 && shiftFilter !== 'all'
      ? wingEmployees.filter((e) => e.shift === shiftFilter)
      : wingEmployees;

  const wingCards: {
    wing: WingNumber;
    title: string;
    count: number;
    icon: typeof Building;
  }[] = [
    { wing: 1, title: t.wing1Title, count: 4, icon: Building },
    { wing: 2, title: t.wing2Title, count: 12, icon: Film },
    { wing: 3, title: t.wing3Title, count: 8, icon: Cpu },
  ];

  const activeChannelLinks: ChannelSocialLinks =
    channelLinks[selectedLinkChannelId] || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Workspace Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl glass-panel border border-slate-200/80 dark:border-white/10">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            {t.hqTitle}
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            {t.hqSubtitle}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PWAInstallButton lang={lang} variant="compact" />
          <button
            type="button"
            onClick={onToggleLang}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/15 text-xs font-medium text-slate-800 dark:text-slate-100 flex items-center gap-1.5 cursor-pointer"
          >
            <Languages className="w-3.5 h-3.5 text-amber-500" />
            <span>{t.langSwitch}</span>
          </button>
          <button
            type="button"
            onClick={onToggleTheme}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/15 text-xs font-medium text-slate-800 dark:text-slate-100 flex items-center gap-1.5 cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5" />
            )}
            <span>{theme === 'dark' ? t.themeLight : t.themeDark}</span>
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="px-3 py-1.5 rounded-lg border border-rose-500/30 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t.logout}</span>
          </button>
        </div>
      </div>

      {/* 3 Glass Wings Selector */}
      <div className="compound-perspective grid grid-cols-1 md:grid-cols-3 gap-4">
        {wingCards.map((w) => {
          const Icon = w.icon;
          const selected = activeWing === w.wing;
          return (
            <button
              key={w.wing}
              type="button"
              onClick={() => setActiveWing(w.wing)}
              className={`wing-card-3d text-start p-5 rounded-2xl border cursor-pointer ${
                selected
                  ? 'glass-elevated border-amber-500/80 dark:border-amber-400/70'
                  : 'glass-panel border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/25'
              }`}
            >
              <div className="flex items-center justify-between">
                <Icon
                  className={`w-5 h-5 ${
                    selected
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                />
                <span className="text-xs font-mono-tabular text-slate-500 dark:text-slate-400">
                  {w.count} AI
                </span>
              </div>
              <div className="text-base font-bold text-slate-900 dark:text-white mt-3">
                {w.title}
              </div>
            </button>
          );
        })}
      </div>

      {/* WING 1: EXECUTIVE SUITE, VISIBILITY CONTROLS, LINKS MANAGER, PAYMENT HUB & ORDERS */}
      {activeWing === 1 && (
        <div className="space-y-6">
          {/* CEO KPI Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel rounded-xl border border-slate-200/80 dark:border-white/10 p-4">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {t.totalSubsMetric}
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono-tabular mt-1">
                {totalSubscribers.toLocaleString()}
              </div>
            </div>
            <div className="glass-panel rounded-xl border border-slate-200/80 dark:border-white/10 p-4">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {t.ordersMetric}
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono-tabular mt-1">
                {orders.length}{' '}
                {pendingReceiptsCount > 0 && (
                  <span className="text-xs font-normal text-amber-600 dark:text-amber-400">
                    ({pendingReceiptsCount}{' '}
                    {lang === 'ar' ? 'بانتظار التأكيد' : 'pending'})
                  </span>
                )}
              </div>
            </div>
            <div className="glass-panel rounded-xl border border-slate-200/80 dark:border-white/10 p-4">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {t.activeAgentsMetric}
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono-tabular mt-1">
                {activeAgentsCount} / 24
              </div>
            </div>
            <div className="glass-panel rounded-xl border border-slate-200/80 dark:border-white/10 p-4">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {t.pcNodeMetric}
              </div>
              <div
                className={`text-sm font-bold mt-2 flex items-center gap-1.5 ${
                  settings.pcBridgeConnected
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                <Server className="w-4 h-4" />
                <span>
                  {settings.pcBridgeConnected ? t.connected : t.offline}
                </span>
              </div>
            </div>
          </div>

          {/* 1. Financial Verification Hub (Wing 1 - Finance & Sponsorship Officer) */}
          <div className="glass-panel rounded-xl border border-slate-200/80 dark:border-white/10 p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200/70 dark:border-white/10">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-amber-500" />
                  <span>{t.financeHubTitle}</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {lang === 'ar'
                    ? 'مراجعة إيصالات فودافون كاش وإنستا باي، تأكيد الإيداع بنقرة واحدة، وإشعار العميل عبر واتساب أو تليجرام.'
                    : 'Review Vodafone Cash & InstaPay deposit screenshots, approve/reject orders in 1 click, and send instant client notifications.'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/70 self-start">
                {(
                  [
                    { id: 'all', label: t.filterAll },
                    { id: 'pending_payment', label: t.statusPendingPayment },
                    { id: 'confirmed', label: t.statusConfirmed },
                    { id: 'rejected', label: t.statusRejected },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setOrderFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap cursor-pointer ${
                      orderFilter === tab.id
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-amber-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">
                {t.noOrders}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-start border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400">
                      <th className="py-2.5 pe-4 font-medium">
                        {lang === 'ar' ? 'العميل والتواصل' : 'Client & Contact'}
                      </th>
                      <th className="py-2.5 pe-4 font-medium">
                        {lang === 'ar' ? 'الباقة / النظام' : 'Order Details'}
                      </th>
                      <th className="py-2.5 pe-4 font-medium">
                        {lang === 'ar' ? 'المبلغ وطريقة الدفع' : 'Payment & Ref'}
                      </th>
                      <th className="py-2.5 pe-4 font-medium">
                        {lang === 'ar' ? 'صورة الإيصال' : 'Receipt'}
                      </th>
                      <th className="py-2.5 pe-4 font-medium">
                        {lang === 'ar' ? 'الحالة' : 'Status'}
                      </th>
                      <th className="py-2.5 font-medium">
                        {lang === 'ar' ? 'التحقق والإشعار' : 'Verify & Notify'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((ord) => (
                      <tr
                        key={ord.id}
                        className="border-b border-slate-200/60 dark:border-white/5 align-top"
                      >
                        <td className="py-3.5 pe-4">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {ord.clientName}
                          </div>
                          <div className="font-mono-tabular text-slate-600 dark:text-slate-300 mt-0.5">
                            {ord.phone}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono-tabular mt-0.5">
                            {ord.createdAt}
                          </div>
                        </td>
                        <td className="py-3.5 pe-4">
                          <div className="font-medium text-slate-900 dark:text-slate-100">
                            {ord.packageTitle || ord.organization}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {ord.sector}
                          </div>
                          {ord.notes && (
                            <div className="text-[11px] text-slate-500 truncate max-w-xs mt-0.5">
                              {ord.notes}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 pe-4 font-mono-tabular">
                          {ord.amountEgp ? (
                            <div className="font-bold text-amber-700 dark:text-amber-400">
                              {ord.amountEgp.toLocaleString()} EGP
                              {ord.amountUsd ? ` ($${ord.amountUsd})` : ''}
                            </div>
                          ) : (
                            <div className="text-slate-500">Custom Quote</div>
                          )}
                          {ord.paymentMethod && ord.paymentMethod !== 'quote_only' && (
                            <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                              {ord.paymentMethod === 'vodafone_cash'
                                ? 'Vodafone Cash'
                                : 'InstaPay'}
                            </div>
                          )}
                          {ord.senderAccount && (
                            <div className="text-[11px] text-slate-500">
                              From: {ord.senderAccount}
                            </div>
                          )}
                          {ord.transactionRef && (
                            <div className="text-[11px] text-slate-700 dark:text-slate-200">
                              Ref: {ord.transactionRef}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 pe-4">
                          {ord.receiptImage ? (
                            <button
                              type="button"
                              onClick={() => setInspectReceiptOrder(ord)}
                              className="group relative w-16 h-12 rounded-lg overflow-hidden border border-slate-300 dark:border-white/20 bg-slate-900 flex items-center justify-center cursor-pointer"
                              title={t.viewReceiptBtn}
                            >
                              <img
                                src={ord.receiptImage}
                                alt="Deposit receipt"
                                className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                              />
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 flex items-center gap-1">
                              <ImageIcon className="w-3.5 h-3.5" />
                              <span>{lang === 'ar' ? 'لا يوجد' : 'None'}</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 pe-4">
                          <div
                            className={`font-semibold ${orderStatusColor(ord.status)}`}
                          >
                            {orderStatusText(ord.status)}
                          </div>
                          <select
                            value={ord.status}
                            onChange={(e) =>
                              handleOrderStatus(
                                ord.id,
                                e.target.value as OrderStatus
                              )
                            }
                            className="mt-1.5 px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/15 text-[11px] text-slate-800 dark:text-slate-200"
                          >
                            <option value="pending_payment">
                              {t.statusPendingPayment}
                            </option>
                            <option value="confirmed">{t.statusConfirmed}</option>
                            <option value="rejected">{t.statusRejected}</option>
                            <option value="new">{t.statusNew}</option>
                            <option value="in_review">{t.statusReview}</option>
                            <option value="deployed">{t.statusDeployed}</option>
                          </select>
                        </td>
                        <td className="py-3.5 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOrderStatus(ord.id, 'confirmed')}
                              className="px-2.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold flex items-center gap-1 whitespace-nowrap cursor-pointer"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{t.approvePaymentBtn}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOrderStatus(ord.id, 'rejected')}
                              className="px-2.5 py-1.5 rounded-md border border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 text-[11px] font-semibold flex items-center gap-1 whitespace-nowrap cursor-pointer"
                            >
                              <XCircle className="w-3 h-3" />
                              <span>{t.rejectPaymentBtn}</span>
                            </button>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <a
                              href={getWhatsappNotifyUrl(ord)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 rounded-md bg-emerald-600/15 border border-emerald-500/35 text-emerald-700 dark:text-emerald-300 text-[11px] font-medium flex items-center gap-1 whitespace-nowrap"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>{t.notifyWhatsappBtn}</span>
                            </a>
                            <a
                              href={getTelegramNotifyUrl(ord)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 rounded-md bg-sky-600/15 border border-sky-500/35 text-sky-700 dark:text-sky-300 text-[11px] font-medium flex items-center gap-1 whitespace-nowrap"
                            >
                              <Send className="w-3 h-3" />
                              <span>{t.notifyTelegramBtn}</span>
                            </a>
                            <button
                              type="button"
                              onClick={async () => {
                                await navigator.clipboard.writeText(
                                  buildConfirmationText(ord)
                                );
                                setCopiedNotifyId(ord.id);
                                setTimeout(() => setCopiedNotifyId(null), 1500);
                              }}
                              className="px-2 py-1 rounded-md border border-slate-200 dark:border-white/15 text-[11px] text-slate-600 dark:text-slate-300 cursor-pointer"
                            >
                              {copiedNotifyId === ord.id ? t.copied : t.copyOutput}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 2. Visibility Controls + Links Manager */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Admin Visibility Controls (Show/Hide Channels for Public Visitors) */}
            <div className="lg:col-span-5 glass-panel rounded-xl border border-slate-200/80 dark:border-white/10 p-5 space-y-4">
              <div className="flex items-center gap-2">
                {showChannelsToPublic ? (
                  <Eye className="w-4 h-4 text-amber-500" />
                ) : (
                  <EyeOff className="w-4 h-4 text-slate-400" />
                )}
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {t.visibilityTitle}
                </h2>
              </div>

              {/* Master Toggle */}
              <div className="p-3.5 rounded-xl border border-amber-500/35 bg-amber-500/10 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {t.masterChannelsToggle}
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                    {t.masterChannelsHint}
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={showChannelsToPublic}
                  onClick={handleToggleMasterChannels}
                  className={`w-12 h-6 rounded-full transition-colors p-0.5 shrink-0 cursor-pointer ${
                    showChannelsToPublic
                      ? 'bg-amber-500'
                      : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                      showChannelsToPublic
                        ? 'ltr:translate-x-6 rtl:-translate-x-6'
                        : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Individual Channel Switches */}
              <div className="space-y-2">
                {channels.map((ch) => {
                  const isShown = channelVisibility[ch.id] !== false;
                  return (
                    <div
                      key={ch.id}
                      className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg border border-slate-200/70 dark:border-white/10 bg-white/50 dark:bg-slate-900/50"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {lang === 'ar' ? ch.nameAr : ch.nameEn}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {isShown
                            ? lang === 'ar'
                              ? 'ظاهرة للزوار'
                              : 'Visible to visitors'
                            : lang === 'ar'
                              ? 'مخفية عن الزوار'
                              : 'Hidden from visitors'}
                        </div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isShown}
                        onClick={() => handleToggleIndividualChannel(ch.id)}
                        className={`w-11 h-6 rounded-full transition-colors p-0.5 shrink-0 cursor-pointer ${
                          isShown
                            ? 'bg-emerald-600'
                            : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                      >
                        <span
                          className={`block w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                            isShown
                              ? 'ltr:translate-x-5 rtl:-translate-x-5'
                              : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Real Channel Links & Bot Integration Panel */}
            <form
              onSubmit={handleSaveAllSettings}
              className="lg:col-span-7 glass-panel rounded-xl border border-slate-200/80 dark:border-white/10 p-5 space-y-4"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-amber-500" />
                  <span>{t.linksManagerTitle}</span>
                </h2>
                {settingsSavedMsg && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    {t.settingsSaved}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-slate-200/70 dark:border-white/10">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    WhatsApp Business URL
                  </label>
                  <input
                    type="url"
                    value={whatsappBusinessUrl}
                    onChange={(e) => setWhatsappBusinessUrl(e.target.value)}
                    placeholder="https://wa.me/201000000000"
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/15 text-xs text-slate-900 dark:text-white font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Telegram Sales Bot URL
                  </label>
                  <input
                    type="url"
                    value={telegramSalesBotUrl}
                    onChange={(e) => setTelegramSalesBotUrl(e.target.value)}
                    placeholder="https://t.me/JimmySparkSalesBot"
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/15 text-xs text-slate-900 dark:text-white font-mono-tabular"
                  />
                </div>
              </div>

              {/* Channel Selector Tabs */}
              <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/70">
                {channels.map((ch) => (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => setSelectedLinkChannelId(ch.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap cursor-pointer ${
                      selectedLinkChannelId === ch.id
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-amber-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {lang === 'ar' ? ch.nameAr : ch.nameEn}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    YouTube Channel URL
                  </label>
                  <input
                    type="url"
                    value={activeChannelLinks.youtube || ''}
                    onChange={(e) =>
                      updateChannelLinkField(
                        selectedLinkChannelId,
                        'youtube',
                        e.target.value
                      )
                    }
                    placeholder="https://youtube.com/@..."
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/15 text-xs text-slate-900 dark:text-white font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Telegram Channel URL
                  </label>
                  <input
                    type="url"
                    value={activeChannelLinks.telegram || ''}
                    onChange={(e) =>
                      updateChannelLinkField(
                        selectedLinkChannelId,
                        'telegram',
                        e.target.value
                      )
                    }
                    placeholder="https://t.me/..."
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/15 text-xs text-slate-900 dark:text-white font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Facebook Page URL
                  </label>
                  <input
                    type="url"
                    value={activeChannelLinks.facebook || ''}
                    onChange={(e) =>
                      updateChannelLinkField(
                        selectedLinkChannelId,
                        'facebook',
                        e.target.value
                      )
                    }
                    placeholder="https://facebook.com/..."
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/15 text-xs text-slate-900 dark:text-white font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    TikTok Profile URL
                  </label>
                  <input
                    type="url"
                    value={activeChannelLinks.tiktok || ''}
                    onChange={(e) =>
                      updateChannelLinkField(
                        selectedLinkChannelId,
                        'tiktok',
                        e.target.value
                      )
                    }
                    placeholder="https://tiktok.com/@..."
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/15 text-xs text-slate-900 dark:text-white font-mono-tabular"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    X (Twitter) Profile URL
                  </label>
                  <input
                    type="url"
                    value={activeChannelLinks.x || ''}
                    onChange={(e) =>
                      updateChannelLinkField(
                        selectedLinkChannelId,
                        'x',
                        e.target.value
                      )
                    }
                    placeholder="https://x.com/..."
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/15 text-xs text-slate-900 dark:text-white font-mono-tabular"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 text-xs font-semibold cursor-pointer"
              >
                {t.saveSettings}
              </button>
            </form>
          </div>

          {/* 3. CEO Settings + Egyptian Payment Wallets + Password + Channel CRUD */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-6">
              <form
                onSubmit={handleSaveAllSettings}
                className="glass-panel rounded-xl border border-slate-200/80 dark:border-white/10 p-5 space-y-4"
              >
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {t.ceoOverview} & {t.paymentSettingsTitle}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Vodafone Cash Number
                    </label>
                    <input
                      type="text"
                      value={vodafoneCashNumber}
                      onChange={(e) => setVodafoneCashNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/15 text-xs text-slate-900 dark:text-white font-mono-tabular"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      InstaPay Address (IPA)
                    </label>
                    <input
                      type="text"
                      value={instaPayAddress}
                      onChange={(e) => setInstaPayAddress(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/15 text-xs text-slate-900 dark:text-white font-mono-tabular"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      InstaPay Linked Mobile
                    </label>
                    <input
                      type="text"
                      value={instaPayPhone}
                      onChange={(e) => setInstaPayPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/15 text-xs text-slate-900 dark:text-white font-mono-tabular"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      USD → EGP Rate
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      value={usdToEgpRate}
                      onChange={(e) => setUsdToEgpRate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/15 text-xs text-slate-900 dark:text-white font-mono-tabular"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {t.officialPhoneLabel}
                  </label>
                  <input
                    type="text"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/15 text-xs text-slate-900 dark:text-white font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {t.telegramHandleLabel}
                  </label>
                  <input
                    type="text"
                    value={telegramInput}
                    onChange={(e) => setTelegramInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/15 text-xs text-slate-900 dark:text-white font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {t.pcBridgeUrlLabel}
                  </label>
                  <input
                    type="url"
                    value={bridgeUrlInput}
                    onChange={(e) => setBridgeUrlInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/15 text-xs text-slate-900 dark:text-white font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Supabase REST Endpoint (Optional)
                  </label>
                  <input
                    type="url"
                    value={supabaseUrlInput}
                    onChange={(e) => setSupabaseUrlInput(e.target.value)}
                    placeholder="https://your-project.supabase.co"
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/15 text-xs text-slate-900 dark:text-white font-mono-tabular"
                  />
                </div>
                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bridgeOnline}
                    onChange={(e) => setBridgeOnline(e.target.checked)}
                  />
                  <span>
                    {lang === 'ar'
                      ? 'حالة السيرفر المنزلي: متصل'
                      : 'Local PC Server Status: Connected'}
                  </span>
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 text-xs font-semibold cursor-pointer"
                  >
                    {t.saveSettings}
                  </button>
                  {settingsSavedMsg && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      {t.settingsSaved}
                    </span>
                  )}
                </div>
              </form>

              {/* Change Admin Password */}
              <form
                onSubmit={handleChangePassword}
                className="glass-panel rounded-xl border border-slate-200/80 dark:border-white/10 p-5 space-y-3"
              >
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-500" />
                  <span>{t.passwordSettingsTitle} (Jimmy)</span>
                </h2>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={
                    lang === 'ar' ? 'كلمة المرور الحالية' : 'Current Password'
                  }
                  required
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/15 text-xs text-slate-900 dark:text-white"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={
                      lang === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'
                    }
                    required
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/15 text-xs text-slate-900 dark:text-white"
                  />
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder={
                      lang === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'
                    }
                    required
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/15 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                {passwordStatus && (
                  <div
                    className={`text-xs ${
                      passwordStatus.type === 'ok'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {passwordStatus.msg}
                  </div>
                )}
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-white/15 text-xs font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {lang === 'ar' ? 'تحديث كلمة المرور' : 'Update Password'}
                </button>
              </form>
            </div>

            {/* Channels CRUD */}
            <div className="lg:col-span-7 glass-panel rounded-xl border border-slate-200/80 dark:border-white/10 p-5 space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {t.channelManager}
              </h2>

              <form
                onSubmit={handleSaveChannel}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4 border-b border-slate-200/70 dark:border-white/10"
              >
                <input
                  type="text"
                  value={chNameEn}
                  onChange={(e) => setChNameEn(e.target.value)}
                  placeholder="Channel Name (EN)"
                  required
                  className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/15 text-xs text-slate-900 dark:text-white"
                />
                <input
                  type="text"
                  value={chNameAr}
                  onChange={(e) => setChNameAr(e.target.value)}
                  placeholder="اسم القناة (عربي)"
                  required
                  className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/15 text-xs text-slate-900 dark:text-white"
                />
                <input
                  type="text"
                  value={chCatEn}
                  onChange={(e) => setChCatEn(e.target.value)}
                  placeholder="Category (EN)"
                  className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/15 text-xs text-slate-900 dark:text-white"
                />
                <input
                  type="text"
                  value={chCatAr}
                  onChange={(e) => setChCatAr(e.target.value)}
                  placeholder="التصنيف (عربي)"
                  className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/15 text-xs text-slate-900 dark:text-white"
                />
                <input
                  type="text"
                  value={chDescEn}
                  onChange={(e) => setChDescEn(e.target.value)}
                  placeholder="Short description (EN)"
                  className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/15 text-xs text-slate-900 dark:text-white"
                />
                <input
                  type="text"
                  value={chDescAr}
                  onChange={(e) => setChDescAr(e.target.value)}
                  placeholder="وصف مختصر (عربي)"
                  className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/15 text-xs text-slate-900 dark:text-white"
                />
                <div className="sm:col-span-2 flex items-center gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>
                      {editingChannelId ? t.saveSettings : t.addChannel}
                    </span>
                  </button>
                  {editingChannelId && (
                    <button
                      type="button"
                      onClick={resetChannelForm}
                      className="px-3 py-2 rounded-lg border border-slate-300 dark:border-white/15 text-xs text-slate-600 dark:text-slate-300 cursor-pointer"
                    >
                      {t.authCancel}
                    </button>
                  )}
                </div>
              </form>

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {channels.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg border border-slate-200/70 dark:border-white/10 bg-white/50 dark:bg-slate-900/50"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {lang === 'ar' ? c.nameAr : c.nameEn}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-mono-tabular">
                        {lang === 'ar' ? c.categoryAr : c.categoryEn} ·{' '}
                        {c.subscribers.toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEditChannel(c)}
                        className="p-2 rounded-lg border border-slate-200 dark:border-white/15 text-slate-600 dark:text-slate-300 hover:text-amber-600 cursor-pointer"
                        aria-label={t.editChannel}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteChannel(c.id)}
                        className="p-2 rounded-lg border border-slate-200 dark:border-white/15 text-slate-600 dark:text-slate-300 hover:text-rose-600 cursor-pointer"
                        aria-label={t.deleteChannel}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WING 2 SHIFT FILTER */}
      {activeWing === 2 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-semibold text-slate-900 dark:text-white">
            {t.employeesWingTitle}
          </div>
          <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/70">
            {(['all', '00:00–08:00', '08:00–16:00', '16:00–24:00'] as const).map(
              (slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setShiftFilter(slot)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium font-mono-tabular cursor-pointer ${
                    shiftFilter === slot
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-amber-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {slot === 'all' ? t.filterAll : slot}
                </button>
              )
            )}
          </div>
        </div>
      )}

      {/* EMPLOYEES GRID FOR CURRENT WING (4 in Wing 1, 12 in Wing 2, 8 in Wing 3) */}
      <div className="space-y-3">
        {activeWing !== 2 && (
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {t.employeesWingTitle}
          </h2>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredWingEmployees.map((emp) => (
            <button
              key={emp.id}
              type="button"
              onClick={() => setSelectedEmployee(emp)}
              className="glass-panel text-start p-4 rounded-xl border border-slate-200/80 dark:border-white/10 hover:border-amber-500/60 dark:hover:border-amber-400/50 transition-colors flex flex-col justify-between gap-3 cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-mono-tabular text-slate-500 dark:text-slate-400">
                    {emp.shift}
                  </span>
                  <span
                    className={`font-semibold ${statusColorClass(emp.status)}`}
                  >
                    {statusBadgeLabel(emp.status)}
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white mt-2">
                  {lang === 'ar' ? emp.nameAr : emp.nameEn}
                </div>
                <div className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                  {lang === 'ar' ? emp.roleAr : emp.roleEn}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-2">
                  {lang === 'ar' ? emp.lastOutputAr : emp.lastOutputEn}
                </p>
              </div>
              <div className="pt-2 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-mono-tabular">
                  {emp.tasksCompleted} tasks
                </span>
                <span className="font-medium text-slate-900 dark:text-amber-400">
                  {t.openWorkstation}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* WING 3: BOTS ENGINE, POS DEMO & LOCAL PC PYTHON BRIDGE */}
      {activeWing === 3 && (
        <div className="space-y-6 pt-2">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Telegram & WhatsApp Bot Builder */}
            <div className="lg:col-span-5 glass-panel rounded-xl border border-slate-200/80 dark:border-white/10 p-5 space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {t.botBuilderTitle}
              </h2>
              <form onSubmit={handleAddBotFlow} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={botPlatform}
                    onChange={(e) =>
                      setBotPlatform(e.target.value as 'WhatsApp' | 'Telegram')
                    }
                    className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/15 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Telegram">Telegram</option>
                  </select>
                  <input
                    type="text"
                    value={botTrigger}
                    onChange={(e) => setBotTrigger(e.target.value)}
                    placeholder="Trigger (e.g. /pos)"
                    required
                    className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/15 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <input
                  type="text"
                  value={botNameEn}
                  onChange={(e) => setBotNameEn(e.target.value)}
                  placeholder="Flow Title"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/15 text-xs text-slate-900 dark:text-white"
                />
                <textarea
                  rows={2}
                  value={botReplyEn}
                  onChange={(e) => setBotReplyEn(e.target.value)}
                  placeholder="Auto-reply message (EN)"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/15 text-xs text-slate-900 dark:text-white"
                />
                <textarea
                  rows={2}
                  value={botReplyAr}
                  onChange={(e) => setBotReplyAr(e.target.value)}
                  placeholder="رسالة الرد التلقائي (عربي)"
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/15 text-xs text-slate-900 dark:text-white"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 text-xs font-semibold cursor-pointer"
                >
                  {t.addBotFlow}
                </button>
              </form>

              <div className="space-y-2 pt-3 border-t border-slate-200/70 dark:border-white/10 max-h-56 overflow-y-auto">
                {botFlows.map((flow) => (
                  <div
                    key={flow.id}
                    className="p-3 rounded-lg bg-white/50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-white/10 text-xs"
                  >
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {flow.platform} ·{' '}
                      {lang === 'ar' ? flow.nameAr : flow.nameEn}
                    </div>
                    <div className="text-amber-700 dark:text-amber-400 font-mono-tabular mt-0.5">
                      Trigger: {flow.triggerKeyword}
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 mt-1">
                      {lang === 'ar'
                        ? flow.welcomeReplyAr
                        : flow.welcomeReplyEn}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Local PC Python Bridge */}
            <div className="lg:col-span-7 glass-panel rounded-xl border border-slate-200/80 dark:border-white/10 p-5 space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {t.pcBridgeTitle}
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {t.pcBridgeDesc}
                </p>
              </div>

              <form
                onSubmit={handleDispatchBridge}
                className="grid grid-cols-1 sm:grid-cols-3 gap-3"
              >
                <select
                  value={bridgeTaskType}
                  onChange={(e) =>
                    setBridgeTaskType(
                      e.target.value as
                        | 'video_render'
                        | 'python_fmsyson'
                        | 'edge_tts_batch'
                        | 'thumbnail_render'
                    )
                  }
                  className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/15 text-xs text-slate-900 dark:text-white"
                >
                  <option value="video_render">FFmpeg NVENC Render</option>
                  <option value="python_fmsyson">Python / Fmsyson Task</option>
                  <option value="edge_tts_batch">Edge-TTS Audio Batch</option>
                  <option value="thumbnail_render">Thumbnail Render</option>
                </select>
                <select
                  value={bridgeChannel}
                  onChange={(e) => setBridgeChannel(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/15 text-xs text-slate-900 dark:text-white"
                >
                  {channels.map((c) => (
                    <option key={c.id} value={c.id}>
                      {lang === 'ar' ? c.nameAr : c.nameEn}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={bridgeSummary}
                  onChange={(e) => setBridgeSummary(e.target.value)}
                  placeholder="Task description..."
                  className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/15 text-xs text-slate-900 dark:text-white"
                />
                <div className="sm:col-span-3">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{t.dispatchJob}</span>
                  </button>
                </div>
              </form>

              {lanStatus && (
                <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/25 rounded-lg px-3 py-2">
                  {lanStatus}
                </div>
              )}

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {bridgeJobs.map((job) => (
                  <div
                    key={job.id}
                    className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-white/10 space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">
                        {job.payloadSummary}
                      </span>
                      <span className="text-[11px] font-mono-tabular text-slate-500">
                        {job.createdAt}
                      </span>
                    </div>
                    <pre className="text-[11px] font-mono-tabular text-slate-700 dark:text-slate-300 overflow-x-auto bg-white/80 dark:bg-slate-900/90 p-2.5 rounded border border-slate-200/60 dark:border-white/10">
                      {job.jsonPacket}
                    </pre>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleBrowserLanDispatch(job)}
                        className="px-3 py-1.5 rounded bg-slate-900 dark:bg-slate-800 text-white text-[11px] font-medium cursor-pointer"
                      >
                        {t.testLanPing}
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await navigator.clipboard.writeText(job.jsonPacket);
                          setCopiedJobId(job.id);
                          setTimeout(() => setCopiedJobId(null), 1500);
                        }}
                        className="px-3 py-1.5 rounded border border-slate-200 dark:border-white/15 text-[11px] text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedJobId === job.id ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{t.copyOutput}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Embedded Enterprise POS Simulator in Wing 3 */}
          <div>
            <PosSimulator lang={lang} contactPhone={settings.contactPhone} />
          </div>
        </div>
      )}

      {/* Receipt Inspection Lightbox Modal */}
      {inspectReceiptOrder && inspectReceiptOrder.receiptImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="glass-elevated w-full max-w-xl rounded-2xl border border-slate-200/80 dark:border-white/15 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200/70 dark:border-white/10">
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {inspectReceiptOrder.clientName} ·{' '}
                  <span className="font-mono-tabular text-amber-500">
                    {inspectReceiptOrder.transactionRef}
                  </span>
                </div>
                <div className="text-xs text-slate-500 font-mono-tabular">
                  {inspectReceiptOrder.senderAccount} ·{' '}
                  {inspectReceiptOrder.amountEgp?.toLocaleString()} EGP
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectReceiptOrder(null)}
                aria-label="Close receipt preview"
                className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-slate-950 flex items-center justify-center">
              <img
                src={inspectReceiptOrder.receiptImage}
                alt="Full transfer receipt"
                className="max-h-[65vh] rounded-lg object-contain"
              />
            </div>
            <div className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/70 dark:border-white/10">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleOrderStatus(inspectReceiptOrder.id, 'confirmed');
                    setInspectReceiptOrder(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold cursor-pointer"
                >
                  {t.approvePaymentBtn}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleOrderStatus(inspectReceiptOrder.id, 'rejected');
                    setInspectReceiptOrder(null);
                  }}
                  className="px-4 py-2 rounded-lg border border-rose-500/40 text-rose-500 text-xs font-semibold cursor-pointer"
                >
                  {t.rejectPaymentBtn}
                </button>
              </div>
              <a
                href={getWhatsappNotifyUrl(inspectReceiptOrder)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 text-xs font-semibold flex items-center gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>{t.notifyWhatsappBtn}</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Employee Glass Workstation Modal */}
      <WorkstationModal
        key={selectedEmployee?.id ?? 'closed'}
        employee={selectedEmployee}
        lang={lang}
        token={token}
        onClose={() => setSelectedEmployee(null)}
        onEmployeeUpdated={(updated) => {
          onEmployeesUpdated(
            employees.map((e) => (e.id === updated.id ? updated : e))
          );
          setSelectedEmployee(updated);
        }}
      />
    </div>
  );
}
