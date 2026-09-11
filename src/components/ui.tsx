import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import type { PaymentStatus, PrizeStatus } from "../types";
import { PHASE_LABEL, type RoundPhase } from "../utils";

/* ─────────────── Toasts ─────────────── */

type Tone = "ok" | "err" | "info";
interface Toast { id: number; tone: Tone; title: string; desc?: string; }
const ToastCtx = createContext<{ push: (tone: Tone, title: string, desc?: string) => void }>(null!);
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);
  const push = useCallback((tone: Tone, title: string, desc?: string) => {
    const id = ++idRef.current;
    setToasts((t) => [...t.slice(-2), { id, tone, title, desc }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  useEffect(() => {
    const onStorageFull = (e: Event) => {
      const custom = e as CustomEvent<string>;
      push("err", "Almacenamiento lleno", custom.detail || "Contactá al administrador.");
    };
    window.addEventListener("storage-full", onStorageFull);
    return () => window.removeEventListener("storage-full", onStorageFull);
  }, [push]);

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[90] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto w-full max-w-sm rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-xl animate-pop ${
              t.tone === "ok" ? "border-emerald-400/30 bg-emerald-950/90 text-emerald-100"
              : t.tone === "err" ? "border-red-400/30 bg-red-950/90 text-red-100"
              : "border-white/15 bg-pitch-850/95 text-zinc-100"
            }`}
          >
            <p className="text-sm font-bold">{t.title}</p>
            {t.desc && <p className="mt-0.5 text-xs opacity-80">{t.desc}</p>}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ─────────────── Modal accesible con Focus Trap ─────────────── */

export function Modal({ open, onClose, title, children, wide }: {
  open: boolean; onClose: () => void; title: React.ReactNode; children: React.ReactNode; wide?: boolean;
}) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const modalEl = modalRef.current;
    if (modalEl) {
      const focusables = modalEl.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length > 0) {
        focusables[0].focus();
      }
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab" && modalEl) {
        const focusables = Array.from(
          modalEl.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => !el.hasAttribute("disabled") && el.offsetParent !== null);
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4">
      <button aria-label="Cerrar modal" onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade" />
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`relative max-h-[90dvh] w-full overflow-y-auto rounded-t-2xl border border-white/10 bg-pitch-900 shadow-2xl animate-pop sm:rounded-2xl ${wide ? "sm:max-w-2xl" : "sm:max-w-md"}`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/8 bg-pitch-900/95 px-5 py-4 backdrop-blur">
          <h3 id="modal-title" className="font-display text-lg tracking-wide text-white uppercase">{title}</h3>
          <button aria-label="Cerrar" onClick={onClose} className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-white/10 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

export function Confirm({ open, onClose, onYes, title, desc, yesLabel = "Confirmar", danger }: {
  open: boolean; onClose: () => void; onYes: () => void; title: string; desc: string; yesLabel?: string; danger?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm text-zinc-300">{desc}</p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <button onClick={onClose} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-zinc-200 transition hover:bg-white/10">
          Cancelar
        </button>
        <button
          onClick={() => { onYes(); onClose(); }}
          className={`rounded-xl px-4 py-3 text-sm font-bold transition active:scale-[0.98] ${danger ? "bg-red-600 text-white hover:bg-red-500" : "bg-emerald-500 text-emerald-950 hover:bg-emerald-400"}`}
        >
          {yesLabel}
        </button>
      </div>
    </Modal>
  );
}

/* ─────────────── Chips / estados ─────────────── */

const tones = {
  emerald: "bg-emerald-400/12 text-emerald-300 border-emerald-400/25",
  amber: "bg-amber-400/12 text-amber-300 border-amber-400/25",
  red: "bg-red-400/12 text-red-300 border-red-400/25",
  sky: "bg-sky-400/12 text-sky-300 border-sky-400/25",
  zinc: "bg-white/6 text-zinc-300 border-white/12",
  gold: "bg-gold-400/12 text-gold-300 border-gold-400/30",
};
type ToneKey = keyof typeof tones;

export function Chip({ tone = "zinc", children, className = "" }: { tone?: ToneKey; children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}

export const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  draft: "Borrador", pending_review: "A revisar", approved: "Aprobado", rejected: "Rechazado",
};
export const PAYMENT_TONE: Record<PaymentStatus, ToneKey> = {
  draft: "zinc", pending_review: "amber", approved: "emerald", rejected: "red",
};
export const PRIZE_LABEL: Record<PrizeStatus, string> = {
  unclaimed: "Sin reclamar", pending_payment: "Pago pendiente", paid: "Pagado",
};
export const PRIZE_TONE: Record<PrizeStatus, ToneKey> = {
  unclaimed: "amber", pending_payment: "sky", paid: "emerald",
};
export function PhaseChip({ phase }: { phase: RoundPhase }) {
  const tone: ToneKey = phase === "abierta" ? "emerald" : phase === "en_juego" ? "sky" : phase === "completa" ? "amber" : phase === "liquidada" ? "gold" : "red";
  return <Chip tone={tone}>{PHASE_LABEL[phase]}</Chip>;
}

/* ─────────────── Inputs / vacíos ─────────────── */

export const inputCls =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-emerald-400/60 focus:bg-white/8";

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-zinc-400">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-zinc-500">{hint}</span>}
    </label>
  );
}

export type EmptyIllustration = "ball" | "trophy" | "whistle" | "table";

function IllustrationSvg({ type }: { type: EmptyIllustration }) {
  if (type === "trophy") {
    return (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="mx-auto mb-3 text-gold-400">
        <path d="M20 12h24v16a12 12 0 01-24 0V12z" stroke="currentColor" strokeWidth="2.5" fill="rgba(251,191,36,0.12)" />
        <path d="M20 18H12a6 6 0 006 6h2M44 18h8a6 6 0 01-6 6h-2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M32 40v12M22 52h20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="32" cy="22" r="4" fill="currentColor" opacity="0.6" />
      </svg>
    );
  }
  if (type === "whistle") {
    return (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="mx-auto mb-3 text-emerald-400">
        <path d="M16 28h18l12-10h6v18a10 10 0 01-10 10H26a10 10 0 01-10-10V28z" stroke="currentColor" strokeWidth="2.5" fill="rgba(16,185,129,0.12)" />
        <circle cx="26" cy="38" r="4" fill="currentColor" opacity="0.6" />
        <path d="M34 28v-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === "table") {
    return (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="mx-auto mb-3 text-sky-400">
        <rect x="12" y="14" width="40" height="36" rx="6" stroke="currentColor" strokeWidth="2.5" fill="rgba(56,189,248,0.1)" />
        <path d="M12 26h40M26 14v36" stroke="currentColor" strokeWidth="2" strokeDasharray="2 2" />
        <path d="M18 20h4M32 20h14M18 33h4M32 33h14M18 43h4M32 43h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }
  // "ball" default
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="mx-auto mb-3 text-emerald-400">
      <circle cx="32" cy="32" r="22" stroke="currentColor" strokeWidth="2.5" fill="rgba(16,185,129,0.1)" />
      <polygon points="32,22 41,29 37,39 27,39 23,29" stroke="currentColor" strokeWidth="2" fill="currentColor" opacity="0.3" />
      <line x1="32" y1="10" x2="32" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="53" y1="26" x2="41" y2="29" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="45" y1="50" x2="37" y2="39" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="19" y1="50" x2="27" y2="39" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="11" y1="26" x2="23" y2="29" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function EmptyState({
  icon,
  illustration,
  title,
  desc,
  action,
}: {
  icon?: React.ReactNode;
  illustration?: EmptyIllustration;
  title: string;
  desc?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-10 text-center transition animate-pop">
      {illustration ? (
        <IllustrationSvg type={illustration} />
      ) : icon ? (
        <div className="mb-3 text-zinc-400">{icon}</div>
      ) : (
        <IllustrationSvg type="ball" />
      )}
      <p className="text-sm font-bold text-zinc-200">{title}</p>
      {desc && <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-zinc-400">{desc}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ─────────────── Hooks ─────────────── */

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

export function useCountUp(target: number, duration = 700) {
  const [val, setVal] = useState(target);
  const fromRef = useRef(target);
  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;
    const start = performance.now();
    let raf: number;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - k, 3);
      setVal(Math.round(from + (target - from) * eased));
      if (k < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

/* ─────────────── Botones base ─────────────── */

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3.5 text-sm font-extrabold uppercase tracking-wide text-emerald-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40";
export const btnGold =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-gold-400 px-5 py-3.5 text-sm font-extrabold uppercase tracking-wide text-amber-950 shadow-lg shadow-amber-500/20 transition hover:bg-gold-300 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40";
export const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/5 px-5 py-3.5 text-sm font-bold text-zinc-200 transition hover:bg-white/10 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40";
