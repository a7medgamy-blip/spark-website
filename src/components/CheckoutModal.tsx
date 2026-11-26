import { ChangeEvent, FormEvent, useState } from 'react';
import {
  X,
  Copy,
  Check,
  Upload,
  CreditCard,
  Smartphone,
  ShieldCheck,
  Image as ImageIcon,
} from 'lucide-react';
import {
  ClientOrder,
  CompoundSettings,
  Lang,
  PaymentMethod,
} from '../types.ts';
import { UI_COPY } from '../i18n/translations.ts';

export interface CheckoutItemPayload {
  orderType: 'pos_system' | 'bot_package' | 'subscription' | 'custom_quote';
  packageTitle: string;
  sector: string;
  amountUsd: number;
  notes?: string;
}

interface CheckoutModalProps {
  open: boolean;
  lang: Lang;
  item: CheckoutItemPayload | null;
  settings: CompoundSettings;
  onClose: () => void;
  onOrderCreated: (order: ClientOrder) => void;
}

function compressReceiptImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Invalid image file.'));
        }
      };
      img.onload = () => {
        const maxDim = 1080;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(typeof reader.result === 'string' ? reader.result : '');
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      };
      if (typeof reader.result === 'string') {
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
  });
}

export function CheckoutModal({
  open,
  lang,
  item,
  settings,
  onClose,
  onOrderCreated,
}: CheckoutModalProps) {
  const t = UI_COPY[lang];
  const [paymentMethod, setPaymentMethod] =
    useState<Exclude<PaymentMethod, 'quote_only'>>('vodafone_cash');
  const [copiedTarget, setCopiedTarget] = useState(false);

  const [clientName, setClientName] = useState('');
  const [contact, setContact] = useState('');
  const [organization, setOrganization] = useState('');
  const [senderAccount, setSenderAccount] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [receiptPreview, setReceiptPreview] = useState('');
  const [receiptFileName, setReceiptFileName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<ClientOrder | null>(
    null
  );

  if (!open || !item) return null;

  const egpRate = settings.usdToEgpRate || 50;
  const amountEgp = Math.round(item.amountUsd * egpRate);
  const destinationValue =
    paymentMethod === 'vodafone_cash'
      ? settings.vodafoneCashNumber || '01000000000'
      : settings.instaPayAddress || 'jimmyspark@instapay';

  async function handleCopyDestination() {
    try {
      await navigator.clipboard.writeText(destinationValue);
      setCopiedTarget(true);
      setTimeout(() => setCopiedTarget(false), 1800);
    } catch {
      // Fallback ignored
    }
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    setError('');
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError(
        lang === 'ar'
          ? 'يرجى اختيار ملف صورة صالح للإيصال (PNG / JPG).'
          : 'Please upload a valid image file (PNG, JPG, WEBP).'
      );
      return;
    }
    try {
      const compressed = await compressReceiptImage(file);
      setReceiptPreview(compressed);
      setReceiptFileName(file.name);
    } catch {
      setError(
        lang === 'ar'
          ? 'تعذر قراءة صورة الإيصال.'
          : 'Could not process receipt image.'
      );
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!item) return;

    if (
      clientName.trim().length < 2 ||
      contact.trim().length < 4 ||
      senderAccount.trim().length < 3 ||
      transactionRef.trim().length < 3 ||
      !receiptPreview
    ) {
      setError(
        lang === 'ar'
          ? 'جميع الحقول مطلوبة بما في ذلك رقم المرجع وصورة إيصال التحويل.'
          : 'All deposit verification fields and a transfer receipt screenshot are required.'
      );
      return;
    }

    setSubmitting(true);
    const payload = {
      clientName: clientName.trim(),
      phone: contact.trim(),
      organization: organization.trim() || clientName.trim(),
      sector: item.sector,
      notes:
        item.notes ||
        `${item.packageTitle} ($${item.amountUsd.toFixed(2)} / ${amountEgp.toLocaleString()} EGP)`,
      orderType: item.orderType,
      packageTitle: item.packageTitle,
      amountUsd: item.amountUsd,
      amountEgp,
      paymentMethod,
      senderAccount: senderAccount.trim(),
      transactionRef: transactionRef.trim(),
      receiptImage: receiptPreview,
    };

    try {
      const res = await fetch('/api/public/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.order) {
        onOrderCreated(data.order);
        setSubmittedOrder(data.order);
      } else {
        setError(data.error || 'Submission failed.');
      }
    } catch {
      // Offline / PWA fallback: create local order record so nothing is lost
      const fallbackOrder: ClientOrder = {
        id: `ord-${Date.now()}`,
        clientName: payload.clientName,
        phone: payload.phone,
        organization: payload.organization,
        sector: payload.sector,
        notes: payload.notes,
        status: 'pending_payment',
        createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        orderType: payload.orderType,
        packageTitle: payload.packageTitle,
        amountUsd: payload.amountUsd,
        amountEgp: payload.amountEgp,
        paymentMethod: payload.paymentMethod,
        senderAccount: payload.senderAccount,
        transactionRef: payload.transactionRef,
        receiptImage: payload.receiptImage,
      };
      onOrderCreated(fallbackOrder);
      setSubmittedOrder(fallbackOrder);
    } finally {
      setSubmitting(false);
    }
  }

  function handleResetAndClose() {
    setSubmittedOrder(null);
    setClientName('');
    setContact('');
    setOrganization('');
    setSenderAccount('');
    setTransactionRef('');
    setReceiptPreview('');
    setReceiptFileName('');
    setError('');
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="glass-elevated w-full max-w-2xl rounded-2xl border border-slate-200/80 dark:border-white/15 shadow-2xl my-auto max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/70 dark:border-white/10">
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
              {t.checkoutTitle}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {t.checkoutSubtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            aria-label="Close checkout"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {submittedOrder ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {t.paymentSubmittedTitle}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                {t.paymentSubmittedBody}
              </p>
              <div className="max-w-sm mx-auto rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 p-4 text-xs text-start space-y-1.5 font-mono-tabular">
                <div className="flex justify-between">
                  <span className="text-slate-500">Order ID:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {submittedOrder.id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ref:</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    {submittedOrder.transactionRef}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {amountEgp.toLocaleString()} EGP (${item.amountUsd.toFixed(2)})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 text-xs font-semibold cursor-pointer"
              >
                {lang === 'ar' ? 'إغلاق والعودة' : 'Done'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Order Summary */}
              <div className="rounded-xl bg-slate-100/80 dark:bg-slate-900/70 border border-slate-200/80 dark:border-white/10 p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {item.sector}
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    {item.packageTitle}
                  </div>
                </div>
                <div className="text-end font-mono-tabular">
                  <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
                    {amountEgp.toLocaleString()} EGP
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    (${item.amountUsd.toFixed(2)} USD)
                  </div>
                </div>
              </div>

              {/* Step 1: Payment Method Selection */}
              <div className="space-y-2.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t.paymentMethodLabel}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('vodafone_cash');
                      setCopiedTarget(false);
                    }}
                    className={`p-3.5 rounded-xl border text-start flex items-center gap-3 transition-colors cursor-pointer ${
                      paymentMethod === 'vodafone_cash'
                        ? 'border-rose-500 bg-rose-500/10 text-slate-900 dark:text-white'
                        : 'border-slate-200 dark:border-white/15 bg-white/60 dark:bg-slate-900/40 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">{t.vodafoneCashLabel}</div>
                      <div className="text-[11px] opacity-75">
                        {lang === 'ar' ? 'تحويل فوري للمحفظة' : 'Instant Mobile Wallet'}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('instapay');
                      setCopiedTarget(false);
                    }}
                    className={`p-3.5 rounded-xl border text-start flex items-center gap-3 transition-colors cursor-pointer ${
                      paymentMethod === 'instapay'
                        ? 'border-purple-500 bg-purple-500/10 text-slate-900 dark:text-white'
                        : 'border-slate-200 dark:border-white/15 bg-white/60 dark:bg-slate-900/40 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">{t.instaPayLabel}</div>
                      <div className="text-[11px] opacity-75">
                        {lang === 'ar' ? 'تحويل بنكي عبر IPA / الهاتف' : 'Bank / IPA Instant Transfer'}
                      </div>
                    </div>
                  </button>
                </div>

                {/* Wallet Number / IPA Display + 1-Click Copy */}
                <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-medium text-amber-800 dark:text-amber-300">
                      {t.transferToLabel} ({paymentMethod === 'vodafone_cash' ? t.vodafoneCashLabel : t.instaPayLabel})
                    </div>
                    <div className="text-base sm:text-lg font-bold font-mono-tabular text-slate-900 dark:text-white mt-0.5 select-all">
                      {destinationValue}
                    </div>
                    {paymentMethod === 'instapay' && settings.instaPayPhone && (
                      <div className="text-xs text-slate-600 dark:text-slate-300 font-mono-tabular mt-0.5">
                        {lang === 'ar' ? 'أو رقم الهاتف المرتبط:' : 'Linked Mobile:'}{' '}
                        {settings.instaPayPhone}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyDestination}
                    className="px-4 py-2.5 rounded-lg bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {copiedTarget ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-slate-950" />
                        <span>{t.copiedNumberBtn}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>{t.copyNumberBtn}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Step 2: Deposit Receipt Verification Form */}
              <div className="space-y-3 pt-2 border-t border-slate-200/70 dark:border-white/10">
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {t.receiptSectionTitle}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      {t.fieldName} *
                    </label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/15 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      {lang === 'ar' ? 'واتساب أو تليجرام العميل *' : 'Client WhatsApp / Telegram *'}
                    </label>
                    <input
                      type="text"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      required
                      placeholder="+2010... or @username"
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/15 text-xs text-slate-900 dark:text-white font-mono-tabular"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      {t.senderAccountLabel} *
                    </label>
                    <input
                      type="text"
                      value={senderAccount}
                      onChange={(e) => setSenderAccount(e.target.value)}
                      required
                      placeholder={
                        paymentMethod === 'vodafone_cash'
                          ? '010XXXXXXXX'
                          : 'name@instapay'
                      }
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/15 text-xs text-slate-900 dark:text-white font-mono-tabular"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      {t.transactionRefLabel} *
                    </label>
                    <input
                      type="text"
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                      required
                      placeholder="REF-12345678"
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/15 text-xs text-slate-900 dark:text-white font-mono-tabular"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t.fieldOrg}
                  </label>
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder={
                      lang === 'ar'
                        ? 'اختياري: اسم الشركة / الفندق / المستشفى'
                        : 'Optional: Company / Hotel / Hospital name'
                    }
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/15 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                {/* Receipt Screenshot Upload + Live Preview */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    {t.uploadReceiptLabel} *
                  </label>
                  <label className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl border border-dashed border-slate-300 dark:border-white/25 bg-white/60 dark:bg-slate-900/50 hover:border-amber-500 cursor-pointer transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400">
                        {receiptPreview ? (
                          <ImageIcon className="w-5 h-5" />
                        ) : (
                          <Upload className="w-5 h-5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {receiptFileName || t.uploadReceiptLabel}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {t.uploadReceiptHint}
                        </div>
                      </div>
                    </div>
                    <span className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-800 text-white text-xs font-medium shrink-0">
                      {lang === 'ar' ? 'اختيار صورة' : 'Choose Image'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="sr-only"
                    />
                  </label>

                  {receiptPreview && (
                    <div className="mt-3 rounded-xl overflow-hidden border border-slate-200 dark:border-white/15 bg-slate-950/90 p-2 flex items-center justify-center">
                      <img
                        src={receiptPreview}
                        alt="Transfer receipt preview"
                        className="max-h-48 rounded-lg object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="text-xs text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/25 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/15 text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  {t.authCancel}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 text-xs font-semibold hover:bg-slate-800 dark:hover:bg-amber-400 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {submitting
                    ? lang === 'ar'
                      ? 'جاري الإرسال...'
                      : 'Submitting...'
                    : t.submitPaymentBtn}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
