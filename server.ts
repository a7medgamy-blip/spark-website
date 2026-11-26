import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import {
  INITIAL_BOT_FLOWS,
  INITIAL_BRIDGE_JOBS,
  INITIAL_CHANNELS,
  INITIAL_EMPLOYEES,
  INITIAL_ORDERS,
  INITIAL_SETTINGS,
} from './src/data/seedData.ts';
import type {
  AiEmployee,
  BotFlow,
  BridgeJob,
  ClientOrder,
  CompoundSettings,
  MediaChannel,
} from './src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '.data');
const STATE_FILE = path.resolve(DATA_DIR, 'compound-state.json');

interface PersistedState {
  adminHash: { salt: string; hash: string } | null;
  settings: CompoundSettings;
  channels: MediaChannel[];
  employees: AiEmployee[];
  orders: ClientOrder[];
  botFlows: BotFlow[];
  bridgeJobs: BridgeJob[];
}

function getDefaultState(): PersistedState {
  return {
    adminHash: hashPassword('admin11234'),
    settings: { ...INITIAL_SETTINGS },
    channels: INITIAL_CHANNELS.map((c) => ({ ...c })),
    employees: INITIAL_EMPLOYEES.map((e) => ({ ...e })),
    orders: INITIAL_ORDERS.map((o) => ({ ...o })),
    botFlows: INITIAL_BOT_FLOWS.map((b) => ({ ...b })),
    bridgeJobs: INITIAL_BRIDGE_JOBS.map((j) => ({ ...j })),
  };
}

function loadState(): PersistedState {
  try {
    if (!STATE_FILE.startsWith(DATA_DIR + path.sep)) {
      return getDefaultState();
    }
    if (!fs.existsSync(STATE_FILE)) {
      return getDefaultState();
    }
    const raw = fs.readFileSync(STATE_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    const defaults = getDefaultState();
    return {
      adminHash: parsed.adminHash ?? defaults.adminHash,
      settings: {
        ...defaults.settings,
        ...(parsed.settings ?? {}),
        channelVisibility: {
          ...defaults.settings.channelVisibility,
          ...(parsed.settings?.channelVisibility ?? {}),
        },
        channelLinks: {
          ...defaults.settings.channelLinks,
          ...(parsed.settings?.channelLinks ?? {}),
        },
      },
      channels: Array.isArray(parsed.channels) ? parsed.channels : defaults.channels,
      employees: Array.isArray(parsed.employees) ? parsed.employees : defaults.employees,
      orders: Array.isArray(parsed.orders) ? parsed.orders : defaults.orders,
      botFlows: Array.isArray(parsed.botFlows) ? parsed.botFlows : defaults.botFlows,
      bridgeJobs: Array.isArray(parsed.bridgeJobs) ? parsed.bridgeJobs : defaults.bridgeJobs,
    };
  } catch {
    return getDefaultState();
  }
}

let state: PersistedState = loadState();

function saveState() {
  try {
    if (!STATE_FILE.startsWith(DATA_DIR + path.sep)) return;
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to persist state:', err);
  }
}

// Ephemeral fallback signing key when SESSION_SECRET env var is not configured
const SIGNING_SECRET =
  process.env.SESSION_SECRET && process.env.SESSION_SECRET.trim().length >= 16
    ? process.env.SESSION_SECRET.trim()
    : crypto.randomBytes(32).toString('hex');

function hashPassword(password: string, salt?: string): { salt: string; hash: string } {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, actualSalt, 64).toString('hex');
  return { salt: actualSalt, hash: derived };
}

function constantTimeCompareStr(a: string, b: string): boolean {
  const digestA = crypto.createHash('sha256').update(a).digest();
  const digestB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(digestA, digestB);
}

function isPasswordConfigured(): boolean {
  const envPass = process.env.ADMIN_PASSWORD?.trim();
  return Boolean(envPass && envPass.length > 0) || state.adminHash !== null;
}

function verifyAdminPassword(password: string): boolean {
  const envPass = process.env.ADMIN_PASSWORD?.trim();
  if (envPass && envPass.length > 0) {
    return constantTimeCompareStr(password, envPass);
  }
  if (!state.adminHash) return false;
  const check = hashPassword(password, state.adminHash.salt);
  return constantTimeCompareStr(check.hash, state.adminHash.hash);
}

function createSessionToken(username: string): string {
  const payload = {
    sub: username,
    role: 'CEO',
    exp: Date.now() + 1000 * 60 * 60 * 12,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto
    .createHmac('sha256', SIGNING_SECRET)
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${sig}`;
}

function verifySessionToken(token: string): { sub: string; role: string } | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', SIGNING_SECRET)
    .update(encoded)
    .digest('base64url');
  if (!constantTimeCompareStr(sig, expectedSig)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as {
      sub: string;
      role: string;
      exp: number;
    };
    if (!payload.exp || payload.exp < Date.now()) return null;
    return { sub: payload.sub, role: payload.role };
  } catch {
    return null;
  }
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  const token = authHeader.slice(7).trim();
  const verified = verifySessionToken(token);
  if (!verified || verified.sub !== 'Jimmy') {
    res.status(401).json({ error: 'Invalid or expired session.' });
    return;
  }
  next();
}

function isValidHttpUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Auth routes
  app.get('/api/auth/status', (_req, res) => {
    res.json({
      configured: isPasswordConfigured(),
      usesEnvOverride: Boolean(process.env.ADMIN_PASSWORD?.trim()),
    });
  });

  app.post('/api/auth/claim', (req, res) => {
    if (isPasswordConfigured()) {
      res.status(409).json({ error: 'Admin passcode is already configured.' });
      return;
    }
    const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (username.toLowerCase() !== 'jimmy') {
      res.status(400).json({ error: 'Only username Jimmy can claim Admin HQ access.' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: 'Passcode must be at least 6 characters.' });
      return;
    }
    state.adminHash = hashPassword(password);
    saveState();
    const token = createSessionToken('Jimmy');
    res.json({ token, user: { username: 'Jimmy', role: 'CEO' } });
  });

  app.post('/api/auth/login', (req, res) => {
    if (!isPasswordConfigured()) {
      res.status(409).json({ error: 'Admin passcode has not been initialized yet.' });
      return;
    }
    const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (username.toLowerCase() !== 'jimmy' || !verifyAdminPassword(password)) {
      res.status(401).json({ error: 'Invalid username or password.' });
      return;
    }
    const token = createSessionToken('Jimmy');
    res.json({ token, user: { username: 'Jimmy', role: 'CEO' } });
  });

  // Public routes
  app.get('/api/public/state', (_req, res) => {
    res.json({
      channels: state.channels,
      publicSettings: {
        contactPhone: state.settings.contactPhone,
        telegramHandle: state.settings.telegramHandle,
        showChannelsToPublic: state.settings.showChannelsToPublic,
        channelVisibility: state.settings.channelVisibility,
        whatsappBusinessUrl: state.settings.whatsappBusinessUrl,
        telegramSalesBotUrl: state.settings.telegramSalesBotUrl,
        channelLinks: state.settings.channelLinks,
        vodafoneCashNumber: state.settings.vodafoneCashNumber,
        instaPayAddress: state.settings.instaPayAddress,
        instaPayPhone: state.settings.instaPayPhone,
        usdToEgpRate: state.settings.usdToEgpRate,
      },
      botFlows: state.botFlows.filter((b) => b.active),
    });
  });

  app.post('/api/public/subscribe', (req, res) => {
    const channelId = typeof req.body?.channelId === 'string' ? req.body.channelId : '';
    const delta = req.body?.unsubscribe ? -1 : 1;
    const ch = state.channels.find((c) => c.id === channelId);
    if (!ch) {
      res.status(404).json({ error: 'Channel not found.' });
      return;
    }
    ch.subscribers = Math.max(0, ch.subscribers + delta);
    saveState();
    res.json({ channel: ch });
  });

  app.post('/api/public/orders', (req, res) => {
    const clientName = typeof req.body?.clientName === 'string' ? req.body.clientName.trim() : '';
    const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';
    const organization =
      typeof req.body?.organization === 'string' ? req.body.organization.trim() : '';
    const sector = typeof req.body?.sector === 'string' ? req.body.sector.trim() : '';
    const notes = typeof req.body?.notes === 'string' ? req.body.notes.trim() : '';

    const paymentMethod =
      req.body?.paymentMethod === 'vodafone_cash' || req.body?.paymentMethod === 'instapay'
        ? req.body.paymentMethod
        : 'quote_only';
    const senderAccount =
      typeof req.body?.senderAccount === 'string' ? req.body.senderAccount.trim().slice(0, 120) : '';
    const transactionRef =
      typeof req.body?.transactionRef === 'string' ? req.body.transactionRef.trim().slice(0, 120) : '';
    const packageTitle =
      typeof req.body?.packageTitle === 'string' ? req.body.packageTitle.trim().slice(0, 140) : '';
    const amountUsd =
      typeof req.body?.amountUsd === 'number' && req.body.amountUsd >= 0
        ? req.body.amountUsd
        : undefined;
    const amountEgp =
      typeof req.body?.amountEgp === 'number' && req.body.amountEgp >= 0
        ? req.body.amountEgp
        : undefined;
    const orderType =
      req.body?.orderType === 'pos_system' ||
      req.body?.orderType === 'bot_package' ||
      req.body?.orderType === 'subscription' ||
      req.body?.orderType === 'custom_quote'
        ? req.body.orderType
        : 'custom_quote';
    const receiptImage =
      typeof req.body?.receiptImage === 'string' &&
      req.body.receiptImage.startsWith('data:image/') &&
      req.body.receiptImage.length <= 6_000_000
        ? req.body.receiptImage
        : undefined;

    if (clientName.length < 2 || phone.length < 4) {
      res.status(400).json({ error: 'Please provide valid client name and contact.' });
      return;
    }
    if (paymentMethod === 'quote_only' && organization.length < 2) {
      res.status(400).json({ error: 'Please provide valid name, phone number, and organization.' });
      return;
    }

    const newOrder: ClientOrder = {
      id: `ord-${Date.now()}`,
      clientName: clientName.slice(0, 100),
      phone: phone.slice(0, 60),
      organization: (organization || packageTitle || 'Direct Checkout').slice(0, 120),
      sector: sector.slice(0, 80) || 'Enterprise POS',
      notes: notes.slice(0, 600),
      status: paymentMethod === 'quote_only' ? 'new' : 'pending_payment',
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      orderType,
      packageTitle: packageTitle || undefined,
      amountUsd,
      amountEgp,
      paymentMethod,
      senderAccount: senderAccount || undefined,
      transactionRef: transactionRef || undefined,
      receiptImage,
    };
    state.orders.unshift(newOrder);
    saveState();
    res.status(201).json({ order: newOrder });
  });

  // Protected Admin routes
  app.get('/api/admin/state', requireAdmin, (_req, res) => {
    res.json({
      settings: state.settings,
      channels: state.channels,
      employees: state.employees,
      orders: state.orders,
      botFlows: state.botFlows,
      bridgeJobs: state.bridgeJobs,
    });
  });

  app.put('/api/admin/password', requireAdmin, (req, res) => {
    const currentPassword =
      typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : '';
    const newPassword =
      typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';
    if (!verifyAdminPassword(currentPassword)) {
      res.status(401).json({ error: 'Current password is incorrect.' });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters.' });
      return;
    }
    state.adminHash = hashPassword(newPassword);
    saveState();
    res.json({ ok: true });
  });

  app.put('/api/admin/settings', requireAdmin, (req, res) => {
    const next = req.body as Partial<CompoundSettings>;
    if (typeof next.contactPhone === 'string' && next.contactPhone.trim()) {
      state.settings.contactPhone = next.contactPhone.trim().slice(0, 30);
    }
    if (typeof next.telegramHandle === 'string' && next.telegramHandle.trim()) {
      state.settings.telegramHandle = next.telegramHandle.trim().replace(/^@/, '').slice(0, 60);
    }
    if (typeof next.pcBridgeUrl === 'string' && isValidHttpUrl(next.pcBridgeUrl.trim())) {
      state.settings.pcBridgeUrl = next.pcBridgeUrl.trim().slice(0, 120);
    }
    if (typeof next.pcBridgeConnected === 'boolean') {
      state.settings.pcBridgeConnected = next.pcBridgeConnected;
    }
    if (typeof next.supabaseUrl === 'string') {
      state.settings.supabaseUrl = next.supabaseUrl.trim().slice(0, 160);
      state.settings.supabaseReady = isValidHttpUrl(state.settings.supabaseUrl);
    }
    if (typeof next.showChannelsToPublic === 'boolean') {
      state.settings.showChannelsToPublic = next.showChannelsToPublic;
    }
    if (next.channelVisibility && typeof next.channelVisibility === 'object') {
      const cleaned: Record<string, boolean> = { ...state.settings.channelVisibility };
      for (const [k, v] of Object.entries(next.channelVisibility)) {
        if (typeof v === 'boolean') cleaned[k] = v;
      }
      state.settings.channelVisibility = cleaned;
    }
    if (typeof next.whatsappBusinessUrl === 'string') {
      const u = next.whatsappBusinessUrl.trim().slice(0, 200);
      if (!u || isValidHttpUrl(u)) state.settings.whatsappBusinessUrl = u;
    }
    if (typeof next.telegramSalesBotUrl === 'string') {
      const u = next.telegramSalesBotUrl.trim().slice(0, 200);
      if (!u || isValidHttpUrl(u)) state.settings.telegramSalesBotUrl = u;
    }
    if (next.channelLinks && typeof next.channelLinks === 'object') {
      const cleanedLinks = { ...state.settings.channelLinks };
      for (const [chId, links] of Object.entries(next.channelLinks)) {
        if (links && typeof links === 'object') {
          cleanedLinks[chId] = {
            youtube:
              typeof links.youtube === 'string' ? links.youtube.trim().slice(0, 220) : '',
            telegram:
              typeof links.telegram === 'string' ? links.telegram.trim().slice(0, 220) : '',
            facebook:
              typeof links.facebook === 'string' ? links.facebook.trim().slice(0, 220) : '',
            tiktok:
              typeof links.tiktok === 'string' ? links.tiktok.trim().slice(0, 220) : '',
            x: typeof links.x === 'string' ? links.x.trim().slice(0, 220) : '',
          };
        }
      }
      state.settings.channelLinks = cleanedLinks;
    }
    if (typeof next.vodafoneCashNumber === 'string') {
      state.settings.vodafoneCashNumber = next.vodafoneCashNumber.trim().slice(0, 30);
    }
    if (typeof next.instaPayAddress === 'string') {
      state.settings.instaPayAddress = next.instaPayAddress.trim().slice(0, 100);
    }
    if (typeof next.instaPayPhone === 'string') {
      state.settings.instaPayPhone = next.instaPayPhone.trim().slice(0, 30);
    }
    if (typeof next.usdToEgpRate === 'number' && next.usdToEgpRate > 0) {
      state.settings.usdToEgpRate = Math.min(500, Math.max(1, next.usdToEgpRate));
    }
    saveState();
    res.json({ settings: state.settings });
  });

  app.post('/api/admin/channels', requireAdmin, (req, res) => {
    const body = req.body as Partial<MediaChannel>;
    if (!body.nameEn || !body.nameAr) {
      res.status(400).json({ error: 'Channel English and Arabic names are required.' });
      return;
    }
    const created: MediaChannel = {
      id: `ch-${Date.now()}`,
      nameEn: String(body.nameEn).trim().slice(0, 80),
      nameAr: String(body.nameAr).trim().slice(0, 80),
      categoryEn: String(body.categoryEn || 'AI Media').trim().slice(0, 60),
      categoryAr: String(body.categoryAr || 'إعلام ذكي').trim().slice(0, 60),
      descriptionEn: String(body.descriptionEn || '').trim().slice(0, 300),
      descriptionAr: String(body.descriptionAr || '').trim().slice(0, 300),
      subscribers: Number(body.subscribers) > 0 ? Number(body.subscribers) : 1000,
      image:
        typeof body.image === 'string' && body.image.startsWith('/src/assets/images/')
          ? body.image
          : '/src/assets/images/hero_glass_compound_1795687097806.jpg',
      platforms: Array.isArray(body.platforms) && body.platforms.length > 0
        ? body.platforms.map((p) => String(p).slice(0, 24))
        : ['YouTube', 'Telegram'],
      previewTitleEn: String(body.previewTitleEn || body.nameEn).slice(0, 120),
      previewTitleAr: String(body.previewTitleAr || body.nameAr).slice(0, 120),
      previewDuration: String(body.previewDuration || '03:30').slice(0, 12),
      previewScriptEn: String(body.previewScriptEn || body.descriptionEn || '').slice(0, 400),
      previewScriptAr: String(body.previewScriptAr || body.descriptionAr || '').slice(0, 400),
    };
    state.channels.push(created);
    state.settings.channelVisibility[created.id] = true;
    saveState();
    res.status(201).json({ channel: created });
  });

  app.put('/api/admin/channels/:id', requireAdmin, (req, res) => {
    const idx = state.channels.findIndex((c) => c.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Channel not found.' });
      return;
    }
    const body = req.body as Partial<MediaChannel>;
    const existing = state.channels[idx];
    state.channels[idx] = {
      ...existing,
      nameEn: typeof body.nameEn === 'string' ? body.nameEn.trim().slice(0, 80) : existing.nameEn,
      nameAr: typeof body.nameAr === 'string' ? body.nameAr.trim().slice(0, 80) : existing.nameAr,
      categoryEn:
        typeof body.categoryEn === 'string'
          ? body.categoryEn.trim().slice(0, 60)
          : existing.categoryEn,
      categoryAr:
        typeof body.categoryAr === 'string'
          ? body.categoryAr.trim().slice(0, 60)
          : existing.categoryAr,
      descriptionEn:
        typeof body.descriptionEn === 'string'
          ? body.descriptionEn.trim().slice(0, 300)
          : existing.descriptionEn,
      descriptionAr:
        typeof body.descriptionAr === 'string'
          ? body.descriptionAr.trim().slice(0, 300)
          : existing.descriptionAr,
      subscribers:
        typeof body.subscribers === 'number' && body.subscribers >= 0
          ? body.subscribers
          : existing.subscribers,
    };
    saveState();
    res.json({ channel: state.channels[idx] });
  });

  app.delete('/api/admin/channels/:id', requireAdmin, (req, res) => {
    const before = state.channels.length;
    state.channels = state.channels.filter((c) => c.id !== req.params.id);
    if (state.channels.length === before) {
      res.status(404).json({ error: 'Channel not found.' });
      return;
    }
    saveState();
    res.json({ deletedId: req.params.id });
  });

  app.put('/api/admin/employees/:id', requireAdmin, (req, res) => {
    const emp = state.employees.find((e) => e.id === req.params.id);
    if (!emp) {
      res.status(404).json({ error: 'Employee not found.' });
      return;
    }
    const body = req.body as Partial<AiEmployee>;
    if (typeof body.nameEn === 'string' && body.nameEn.trim()) {
      emp.nameEn = body.nameEn.trim().slice(0, 80);
    }
    if (typeof body.nameAr === 'string' && body.nameAr.trim()) {
      emp.nameAr = body.nameAr.trim().slice(0, 80);
    }
    if (
      body.shift === '00:00–08:00' ||
      body.shift === '08:00–16:00' ||
      body.shift === '16:00–24:00'
    ) {
      emp.shift = body.shift;
    }
    if (
      body.status === 'active' ||
      body.status === 'processing' ||
      body.status === 'standby'
    ) {
      emp.status = body.status;
    }
    saveState();
    res.json({ employee: emp });
  });

  app.put('/api/admin/orders/:id', requireAdmin, (req, res) => {
    const ord = state.orders.find((o) => o.id === req.params.id);
    if (!ord) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }
    const status = req.body?.status;
    if (
      status === 'new' ||
      status === 'in_review' ||
      status === 'deployed' ||
      status === 'pending_payment' ||
      status === 'confirmed' ||
      status === 'rejected'
    ) {
      ord.status = status;
      saveState();
    }
    res.json({ order: ord });
  });

  app.post('/api/admin/bots', requireAdmin, (req, res) => {
    const b = req.body as Partial<BotFlow>;
    if (!b.nameEn || !b.triggerKeyword) {
      res.status(400).json({ error: 'Bot name and trigger keyword are required.' });
      return;
    }
    const existing = b.id ? state.botFlows.find((x) => x.id === b.id) : undefined;
    if (existing) {
      existing.platform = b.platform === 'Telegram' ? 'Telegram' : 'WhatsApp';
      existing.nameEn = String(b.nameEn).slice(0, 80);
      existing.nameAr = String(b.nameAr || b.nameEn).slice(0, 80);
      existing.triggerKeyword = String(b.triggerKeyword).slice(0, 40);
      existing.welcomeReplyEn = String(b.welcomeReplyEn || existing.welcomeReplyEn).slice(0, 300);
      existing.welcomeReplyAr = String(b.welcomeReplyAr || existing.welcomeReplyAr).slice(0, 300);
      existing.funnelStepEn = String(b.funnelStepEn || existing.funnelStepEn).slice(0, 200);
      existing.funnelStepAr = String(b.funnelStepAr || existing.funnelStepAr).slice(0, 200);
      existing.active = typeof b.active === 'boolean' ? b.active : existing.active;
      saveState();
      res.json({ botFlow: existing });
      return;
    }
    const created: BotFlow = {
      id: `bot-${Date.now()}`,
      platform: b.platform === 'Telegram' ? 'Telegram' : 'WhatsApp',
      nameEn: String(b.nameEn).slice(0, 80),
      nameAr: String(b.nameAr || b.nameEn).slice(0, 80),
      triggerKeyword: String(b.triggerKeyword).slice(0, 40),
      welcomeReplyEn: String(b.welcomeReplyEn || '').slice(0, 300),
      welcomeReplyAr: String(b.welcomeReplyAr || b.welcomeReplyEn || '').slice(0, 300),
      funnelStepEn: String(b.funnelStepEn || 'Route lead to Executive Reception').slice(0, 200),
      funnelStepAr: String(b.funnelStepAr || 'تحويل العميل إلى مكتب الاستقبال').slice(0, 200),
      active: true,
    };
    state.botFlows.unshift(created);
    saveState();
    res.status(201).json({ botFlow: created });
  });

  app.post('/api/admin/bridge/dispatch', requireAdmin, (req, res) => {
    const taskType = req.body?.taskType;
    const allowedTypes = ['video_render', 'python_fmsyson', 'edge_tts_batch', 'thumbnail_render'];
    if (!allowedTypes.includes(taskType)) {
      res.status(400).json({ error: 'Invalid bridge task type.' });
      return;
    }
    const summary =
      typeof req.body?.payloadSummary === 'string' && req.body.payloadSummary.trim()
        ? req.body.payloadSummary.trim().slice(0, 180)
        : `Manual ${taskType} dispatch from Wing 3`;
    const channel =
      typeof req.body?.channel === 'string' ? req.body.channel.slice(0, 60) : 'xg-sport';
    const jobId = `job-${Date.now()}`;
    const packet = {
      job_id: jobId,
      task_type: taskType,
      channel,
      hardware_profile: 'nvidia_gtx_1050_ti_nvenc',
      python_runtime: 'fmsyson_worker_v3',
      requested_by: 'Jimmy',
      summary,
      timestamp: new Date().toISOString(),
    };
    const job: BridgeJob = {
      id: jobId,
      taskType,
      targetNode: `${state.settings.pcBridgeUrl.replace(/\/$/, '')}/dispatch`,
      payloadSummary: summary,
      jsonPacket: JSON.stringify(packet, null, 2),
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      dispatchMode: 'queued_packet',
    };
    state.bridgeJobs.unshift(job);
    if (state.bridgeJobs.length > 20) state.bridgeJobs = state.bridgeJobs.slice(0, 20);
    saveState();
    res.status(201).json({ job });
  });

  // Server-side Gemini AI Workstation endpoint
  app.post('/api/ai/workstation', requireAdmin, async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      res.status(400).json({
        error:
          'GEMINI_API_KEY is not configured. Please add your Gemini API key in Settings > Secrets.',
      });
      return;
    }

    const employeeId = typeof req.body?.employeeId === 'string' ? req.body.employeeId : '';
    const tool = typeof req.body?.tool === 'string' ? req.body.tool : 'script_generator';
    const topic = typeof req.body?.topic === 'string' ? req.body.topic.trim().slice(0, 300) : '';
    const lang = req.body?.lang === 'ar' ? 'ar' : 'en';
    const platforms = Array.isArray(req.body?.platforms)
      ? req.body.platforms.map((p: unknown) => String(p).slice(0, 30)).join(', ')
      : 'YouTube, Facebook, Reels, TikTok, X, Telegram';

    const employee = state.employees.find((e) => e.id === employeeId);
    const channel = employee?.channelId
      ? state.channels.find((c) => c.id === employee.channelId)
      : undefined;

    if (!topic) {
      res.status(400).json({ error: 'Please enter a topic or angle first.' });
      return;
    }

    const channelContext = channel
      ? `${channel.nameEn} (${channel.categoryEn}): ${channel.descriptionEn}`
      : `${employee?.nameEn || 'Jimmy Spark Media'} — ${employee?.roleEn || 'Media Production'}`;

    const toolInstructions: Record<string, string> = {
      trend_scanner:
        'Act as a senior media trend analyst. Provide 4 high-retention topic hooks, target search angles, and optimal posting windows.',
      script_generator:
        'Write a crisp, production-ready video script with Hook (0-5s), Core Narrative/Analysis, and Closing CTA.',
      edge_tts_prep:
        'Format the narrative for Microsoft Edge-TTS synthesis: recommend an exact neural voice (e.g., en-US-AndrewNeural or ar-EG-SalmaNeural), rate/pitch settings, and segmented lines with [pause:400ms] markers.',
      visual_prompt_builder:
        'Provide 4 detailed cinematic visual/storyboard prompts suitable for AI image/video rendering on a 16:9 or 9:16 frame, avoiding clichés.',
      auto_publisher:
        `Prepare platform-ready publishing copy (Title, Hook Caption, Hashtags, and Best Time) tailored for: ${platforms}.`,
    };

    const promptText = `Channel/Role Context: ${channelContext}
Requested Tool: ${tool}
Output Language: ${lang === 'ar' ? 'Arabic (Modern Standard Arabic, crisp & natural)' : 'English'}
Topic: ${topic}

Instructions: ${toolInstructions[tool] || toolInstructions.script_generator}
Keep formatting clean, structured, and immediately actionable for production.`;

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: promptText,
        config: {
          systemInstruction:
            'You are a production specialist inside Jimmy Spark Media. Deliver accurate, concise, copyright-safe, and platform-ready media production outputs.',
        },
      });

      const text = response.text?.trim() || '';
      if (!text) {
        res.status(502).json({ error: 'Gemini returned an empty response. Try refining the topic.' });
        return;
      }

      if (employee) {
        employee.tasksCompleted += 1;
        employee.lastOutputEn = `${tool.replace('_', ' ')}: ${topic.slice(0, 70)}`;
        employee.lastOutputAr = `${tool.replace('_', ' ')}: ${topic.slice(0, 70)}`;
        saveState();
      }

      res.json({ output: text, employee });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gemini request failed.';
      res.status(500).json({ error: message });
    }
  });

  // Vite or static production middleware
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Jimmy Spark Media server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
