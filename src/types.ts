export type Lang = 'en' | 'ar';
export type Theme = 'dark' | 'light';
export type EmployeeStatus = 'active' | 'processing' | 'standby';
export type ShiftSlot = '00:00–08:00' | '08:00–16:00' | '16:00–24:00';
export type WingNumber = 1 | 2 | 3;
export type PosSector = 'company' | 'restaurant' | 'hotel' | 'hospital';
export type OrderStatus =
  | 'new'
  | 'in_review'
  | 'deployed'
  | 'pending_payment'
  | 'confirmed'
  | 'rejected';
export type PaymentMethod = 'vodafone_cash' | 'instapay' | 'quote_only';
export type WorkstationTool =
  | 'trend_scanner'
  | 'script_generator'
  | 'edge_tts_prep'
  | 'visual_prompt_builder'
  | 'auto_publisher';

export interface ChannelSocialLinks {
  youtube?: string;
  telegram?: string;
  facebook?: string;
  tiktok?: string;
  x?: string;
}

export interface MediaChannel {
  id: string;
  nameEn: string;
  nameAr: string;
  categoryEn: string;
  categoryAr: string;
  descriptionEn: string;
  descriptionAr: string;
  subscribers: number;
  image: string;
  platforms: string[];
  previewTitleEn: string;
  previewTitleAr: string;
  previewDuration: string;
  previewScriptEn: string;
  previewScriptAr: string;
}

export interface AiEmployee {
  id: string;
  wing: WingNumber;
  nameEn: string;
  nameAr: string;
  roleEn: string;
  roleAr: string;
  specialtyEn: string;
  specialtyAr: string;
  channelId?: string;
  shift: ShiftSlot;
  status: EmployeeStatus;
  tasksCompleted: number;
  lastOutputEn: string;
  lastOutputAr: string;
}

export interface ClientOrder {
  id: string;
  clientName: string;
  phone: string;
  organization: string;
  sector: string;
  notes: string;
  status: OrderStatus;
  createdAt: string;
  orderType?: 'pos_system' | 'bot_package' | 'subscription' | 'custom_quote';
  packageTitle?: string;
  amountUsd?: number;
  amountEgp?: number;
  paymentMethod?: PaymentMethod;
  senderAccount?: string;
  transactionRef?: string;
  receiptImage?: string;
}

export interface BotFlow {
  id: string;
  platform: 'Telegram' | 'WhatsApp';
  nameEn: string;
  nameAr: string;
  triggerKeyword: string;
  welcomeReplyEn: string;
  welcomeReplyAr: string;
  funnelStepEn: string;
  funnelStepAr: string;
  active: boolean;
}

export interface BridgeJob {
  id: string;
  taskType: 'video_render' | 'python_fmsyson' | 'edge_tts_batch' | 'thumbnail_render';
  targetNode: string;
  payloadSummary: string;
  jsonPacket: string;
  createdAt: string;
  dispatchMode: 'queued_packet' | 'lan_dispatched';
}

export interface CompoundSettings {
  contactPhone: string;
  telegramHandle: string;
  pcBridgeUrl: string;
  pcBridgeConnected: boolean;
  supabaseUrl: string;
  supabaseReady: boolean;
  showChannelsToPublic: boolean;
  channelVisibility: Record<string, boolean>;
  whatsappBusinessUrl: string;
  telegramSalesBotUrl: string;
  channelLinks: Record<string, ChannelSocialLinks>;
  vodafoneCashNumber: string;
  instaPayAddress: string;
  instaPayPhone: string;
  usdToEgpRate: number;
}

export interface PosCatalogItem {
  id: string;
  sector: PosSector;
  sku: string;
  nameEn: string;
  nameAr: string;
  unitPrice: number;
  unitEn: string;
  unitAr: string;
}

export interface PosCartItem {
  item: PosCatalogItem;
  qty: number;
}

export interface StoreProduct {
  id: string;
  category: 'pos' | 'bot' | 'subscription';
  nameEn: string;
  nameAr: string;
  summaryEn: string;
  summaryAr: string;
  priceUsd: number;
  billingEn: string;
  billingAr: string;
  sectorTagEn: string;
  sectorTagAr: string;
}
