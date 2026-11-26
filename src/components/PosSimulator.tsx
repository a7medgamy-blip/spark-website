import { useState } from 'react';
import {
  Plus,
  Minus,
  Trash2,
  Receipt,
  CheckCircle2,
  CreditCard,
} from 'lucide-react';
import { POS_CATALOG } from '../data/seedData.ts';
import { Lang, PosCartItem, PosSector } from '../types.ts';
import { UI_COPY } from '../i18n/translations.ts';
import type { CheckoutItemPayload } from './CheckoutModal.tsx';

interface PosSimulatorProps {
  lang: Lang;
  contactPhone?: string;
  onCheckout?: (item: CheckoutItemPayload) => void;
}

export function PosSimulator({
  lang,
  contactPhone,
  onCheckout,
}: PosSimulatorProps) {
  const t = UI_COPY[lang];
  const [sector, setSector] = useState<PosSector>('company');
  const [cart, setCart] = useState<PosCartItem[]>([
    { item: POS_CATALOG[0], qty: 1 },
  ]);
  const [receiptSuccess, setReceiptSuccess] = useState(false);

  const sectorTabs: { id: PosSector; label: string }[] = [
    { id: 'company', label: t.sectorCompany },
    { id: 'restaurant', label: t.sectorRestaurant },
    { id: 'hotel', label: t.sectorHotel },
    { id: 'hospital', label: t.sectorHospital },
  ];

  const visibleItems = POS_CATALOG.filter((i) => i.sector === sector);

  function handleSectorChange(next: PosSector) {
    setSector(next);
    setReceiptSuccess(false);
    const firstItem = POS_CATALOG.find((i) => i.sector === next);
    setCart(firstItem ? [{ item: firstItem, qty: 1 }] : []);
  }

  function addToCart(itemId: string) {
    const found = POS_CATALOG.find((i) => i.id === itemId);
    if (!found) return;
    setReceiptSuccess(false);
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === itemId);
      if (existing) {
        return prev.map((c) =>
          c.item.id === itemId ? { ...c, qty: c.qty + 1 } : c
        );
      }
      return [...prev, { item: found, qty: 1 }];
    });
  }

  function updateQty(itemId: string, delta: number) {
    setReceiptSuccess(false);
    setCart((prev) =>
      prev
        .map((c) => (c.item.id === itemId ? { ...c, qty: c.qty + delta } : c))
        .filter((c) => c.qty > 0)
    );
  }

  const subtotal = cart.reduce((sum, c) => sum + c.item.unitPrice * c.qty, 0);
  const tax = subtotal * 0.14;
  const total = subtotal + tax;

  function handleProceedToCheckout() {
    if (!onCheckout || cart.length === 0) return;
    const summaryList = cart
      .map(
        (c) =>
          `${lang === 'ar' ? c.item.nameAr : c.item.nameEn} x${c.qty}`
      )
      .join(', ');
    const activeSectorLabel =
      sectorTabs.find((s) => s.id === sector)?.label || 'Enterprise POS';
    onCheckout({
      orderType: 'pos_system',
      packageTitle: `${activeSectorLabel} POS Order (${cart.length} items)`,
      sector: activeSectorLabel,
      amountUsd: Number(total.toFixed(2)),
      notes: summaryList,
    });
  }

  return (
    <div className="glass-panel rounded-xl border border-slate-200/80 dark:border-white/10 p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200/70 dark:border-white/10">
        <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/70">
          {sectorTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleSectorChange(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                sector === tab.id
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono-tabular">
          POS-SIM · USD
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-5">
        <div className="lg:col-span-7 space-y-3">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t.catalogTitle}
          </div>
          <div className="space-y-2">
            {visibleItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => addToCart(item.id)}
                className="w-full flex items-center justify-between gap-4 p-3.5 rounded-lg border border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-slate-900/50 hover:border-amber-500/60 dark:hover:border-amber-400/50 transition-colors text-start cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {lang === 'ar' ? item.nameAr : item.nameEn}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-mono-tabular mt-0.5">
                    {item.sku} · {lang === 'ar' ? item.unitAr : item.unitEn}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-semibold text-amber-700 dark:text-amber-400 font-mono-tabular">
                    ${item.unitPrice.toFixed(2)}
                  </span>
                  <span className="w-8 h-8 rounded-md bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col justify-between border-t lg:border-t-0 lg:border-s border-slate-200/70 dark:border-white/10 pt-5 lg:pt-0 lg:ps-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t.receiptTitle}
              </span>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setCart([]);
                    setReceiptSuccess(false);
                  }}
                  className="text-xs text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t.clearCart}</span>
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center">
                {t.emptyCart}
              </p>
            ) : (
              <div className="space-y-2.5 max-h-52 overflow-y-auto pe-1">
                {cart.map(({ item, qty }) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2 text-sm py-2 border-b border-slate-200/60 dark:border-white/5"
                  >
                    <div className="min-w-0">
                      <div className="text-slate-900 dark:text-slate-100 font-medium truncate">
                        {lang === 'ar' ? item.nameAr : item.nameEn}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-mono-tabular">
                        ${item.unitPrice.toFixed(2)} × {qty}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        onClick={() => updateQty(item.id, -1)}
                        className="w-7 h-7 rounded border border-slate-200 dark:border-white/15 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-mono-tabular text-slate-900 dark:text-slate-100">
                        {qty}
                      </span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        onClick={() => updateQty(item.id, 1)}
                        className="w-7 h-7 rounded border border-slate-200 dark:border-white/15 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-200/80 dark:border-white/10 space-y-2">
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>{t.subtotal}</span>
              <span className="font-mono-tabular">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>{t.tax}</span>
              <span className="font-mono-tabular">${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-slate-900 dark:text-white pt-1">
              <span>{t.total}</span>
              <span className="font-mono-tabular text-amber-700 dark:text-amber-400">
                ${total.toFixed(2)}
              </span>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                disabled={cart.length === 0}
                onClick={() => setReceiptSuccess(true)}
                className="w-full px-4 py-2.5 rounded-lg bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 text-sm font-semibold hover:bg-slate-800 dark:hover:bg-amber-400 disabled:opacity-40 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Receipt className="w-4 h-4" />
                <span className="whitespace-nowrap">{t.issueReceipt}</span>
              </button>

              {onCheckout && (
                <button
                  type="button"
                  disabled={cart.length === 0}
                  onClick={handleProceedToCheckout}
                  className="w-full px-4 py-2.5 rounded-lg border border-amber-500/50 bg-amber-500/10 text-amber-800 dark:text-amber-300 hover:bg-amber-500/20 disabled:opacity-40 text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span className="whitespace-nowrap">{t.checkoutCartBtn}</span>
                </button>
              )}
            </div>

            {receiptSuccess && (
              <div className="mt-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <div>{t.receiptIssued}</div>
                  {contactPhone && (
                    <div className="font-mono-tabular mt-1 opacity-80">
                      WhatsApp Sync · {contactPhone}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
