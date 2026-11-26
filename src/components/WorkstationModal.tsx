import { useState } from 'react';
import {
  X,
  TrendingUp,
  FileText,
  Mic,
  Film,
  Share2,
  Copy,
  Check,
  Loader2,
} from 'lucide-react';
import {
  AiEmployee,
  EmployeeStatus,
  Lang,
  ShiftSlot,
  WorkstationTool,
} from '../types.ts';
import { UI_COPY } from '../i18n/translations.ts';

interface WorkstationModalProps {
  employee: AiEmployee | null;
  lang: Lang;
  token: string;
  onClose: () => void;
  onEmployeeUpdated: (updated: AiEmployee) => void;
}

const PUBLISH_PLATFORMS = [
  'YouTube',
  'Facebook',
  'Reels',
  'TikTok',
  'X',
  'Telegram',
];

export function WorkstationModal({
  employee,
  lang,
  token,
  onClose,
  onEmployeeUpdated,
}: WorkstationModalProps) {
  const t = UI_COPY[lang];
  const [activeTool, setActiveTool] = useState<WorkstationTool>('trend_scanner');
  const [topic, setTopic] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([
    'YouTube',
    'TikTok',
    'Reels',
    'Telegram',
  ]);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const [editNameEn, setEditNameEn] = useState(employee?.nameEn ?? '');
  const [editNameAr, setEditNameAr] = useState(employee?.nameAr ?? '');
  const [editShift, setEditShift] = useState<ShiftSlot>(
    employee?.shift ?? '08:00–16:00'
  );
  const [editStatus, setEditStatus] = useState<EmployeeStatus>(
    employee?.status ?? 'active'
  );
  const [savingEmp, setSavingEmp] = useState(false);

  if (!employee) return null;

  const tools: { id: WorkstationTool; label: string; icon: typeof TrendingUp }[] = [
    { id: 'trend_scanner', label: t.toolTrend, icon: TrendingUp },
    { id: 'script_generator', label: t.toolScript, icon: FileText },
    { id: 'edge_tts_prep', label: t.toolTts, icon: Mic },
    { id: 'visual_prompt_builder', label: t.toolVisual, icon: Film },
    { id: 'auto_publisher', label: t.toolPublish, icon: Share2 },
  ];

  async function handleSaveEmployee() {
    if (!employee) return;
    setSavingEmp(true);
    try {
      const res = await fetch(`/api/admin/employees/${employee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nameEn: editNameEn,
          nameAr: editNameAr,
          shift: editShift,
          status: editStatus,
        }),
      });
      const data = await res.json();
      if (res.ok && data.employee) {
        onEmployeeUpdated(data.employee);
      }
    } finally {
      setSavingEmp(false);
    }
  }

  async function handleRunAi() {
    if (!employee) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/ai/workstation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          employeeId: employee.id,
          tool: activeTool,
          topic:
            topic.trim() ||
            (lang === 'ar'
              ? employee.specialtyAr
              : employee.specialtyEn),
          lang,
          platforms: selectedPlatforms,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Gemini request failed.');
      } else {
        setOutput(data.output || '');
        if (data.employee) {
          onEmployeeUpdated(data.employee);
        }
      }
    } catch {
      setError(
        lang === 'ar'
          ? 'فشل الاتصال بمحرك الذكاء الاصطناعي.'
          : 'Network error reaching AI workstation endpoint.'
      );
    } finally {
      setLoading(false);
    }
  }

  function togglePlatform(platform: string) {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  }

  async function handleCopy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="glass-elevated w-full max-w-4xl rounded-2xl border border-slate-200/80 dark:border-white/15 p-6 shadow-2xl my-8">
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200/70 dark:border-white/10">
          <div>
            <div className="text-xs font-medium text-amber-600 dark:text-amber-400">
              {t.workstationTitle} · Wing {employee.wing}
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              {lang === 'ar' ? employee.nameAr : employee.nameEn}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {lang === 'ar' ? employee.roleAr : employee.roleEn} ·{' '}
              <span className="font-mono-tabular">
                {employee.tasksCompleted} tasks
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close workstation"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Employee Shift, Name & Status Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 py-4 border-b border-slate-200/70 dark:border-white/10">
          <input
            type="text"
            value={lang === 'ar' ? editNameAr : editNameEn}
            onChange={(e) =>
              lang === 'ar'
                ? setEditNameAr(e.target.value)
                : setEditNameEn(e.target.value)
            }
            aria-label="Employee name"
            className="px-3 py-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 text-xs text-slate-900 dark:text-white"
          />
          <select
            value={editShift}
            onChange={(e) => setEditShift(e.target.value as ShiftSlot)}
            className="px-3 py-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 text-xs text-slate-900 dark:text-white font-mono-tabular"
          >
            <option value="00:00–08:00">00:00–08:00 (8h)</option>
            <option value="08:00–16:00">08:00–16:00 (8h)</option>
            <option value="16:00–24:00">16:00–24:00 (8h)</option>
          </select>
          <select
            value={editStatus}
            onChange={(e) => setEditStatus(e.target.value as EmployeeStatus)}
            className="px-3 py-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 text-xs text-slate-900 dark:text-white"
          >
            <option value="active">{t.statusActive}</option>
            <option value="processing">{t.statusProcessing}</option>
            <option value="standby">{t.statusStandby}</option>
          </select>
          <button
            type="button"
            onClick={handleSaveEmployee}
            disabled={savingEmp}
            className="px-3 py-2 rounded-lg bg-slate-900 dark:bg-slate-700 text-white text-xs font-medium hover:bg-slate-800 dark:hover:bg-slate-600 cursor-pointer"
          >
            {savingEmp ? '...' : t.saveSettings}
          </button>
        </div>

        {/* 5 AI Tools Tabs */}
        <div className="flex flex-wrap gap-1.5 mt-4 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-900/80">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const active = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => setActiveTool(tool.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-white dark:bg-amber-500 text-slate-900 dark:text-slate-950 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tool.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              {t.topicLabel}
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={t.topicPlaceholder}
              className="w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-white/15 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {activeTool === 'auto_publisher' && (
            <div>
              <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t.publishTargets}
              </div>
              <div className="flex flex-wrap gap-2">
                {PUBLISH_PLATFORMS.map((platform) => {
                  const selected = selectedPlatforms.includes(platform);
                  return (
                    <button
                      key={platform}
                      type="button"
                      onClick={() => togglePlatform(platform)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                        selected
                          ? 'border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-300'
                          : 'border-slate-200 dark:border-white/15 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {platform}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleRunAi}
              disabled={loading}
              className="px-5 py-2.5 rounded-lg bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 text-sm font-semibold hover:bg-slate-800 dark:hover:bg-amber-400 disabled:opacity-50 transition-colors flex items-center gap-2 cursor-pointer"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{loading ? t.runningAi : t.runAiTool}</span>
            </button>

            {output && (
              <button
                type="button"
                onClick={handleCopy}
                className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-white/15 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copied ? t.copied : t.copyOutput}</span>
              </button>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs">
              {error}
            </div>
          )}

          {output && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-white/10 max-h-72 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-xs leading-relaxed text-slate-800 dark:text-slate-200 font-sans">
                {output}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
