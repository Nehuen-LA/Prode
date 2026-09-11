import React, { useMemo, useState } from "react";
import { BellRing, CheckCircle2, Eye, FileImage, Inbox, ThumbsDown, XCircle } from "lucide-react";
import { useStore } from "../../store";
import type { Prediction } from "../../types";
import { fmtFull, fmtMoney, nick, userById } from "../../utils";
import { PredictionViewModal, ReceiptModal } from "../../components/modals";
import { Chip, Confirm, EmptyState, PAYMENT_LABEL, PAYMENT_TONE, useToast } from "../../components/ui";

export default function PaymentsTab() {
  const { db, approvePayment, rejectPayment } = useStore();
  const toast = useToast();
  const [receiptSrc, setReceiptSrc] = useState<string | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const [toReject, setToReject] = useState<Prediction | null>(null);

  const byStatus = useMemo(() => {
    const get = (s: Prediction["paymentStatus"]) =>
      db.predictions.filter((p) => p.paymentStatus === s).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return { pending: get("pending_review"), draft: get("draft"), approved: get("approved"), rejected: get("rejected") };
  }, [db.predictions]);

  const roundName = (id: string) => db.rounds.find((r) => r.id === id)?.name ?? "—";

  const PredCard = ({ p, pending }: { p: Prediction; pending?: boolean }) => {
    const u = userById(db, p.userId);
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-sm font-extrabold text-white">{u?.nickname}</span>
          <span className="text-xs text-zinc-400">{u?.fullName} · {u?.phone}</span>
          <span className="ml-auto text-[11px] font-semibold text-zinc-500">{fmtFull(p.createdAt)}</span>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <Chip tone={PAYMENT_TONE[p.paymentStatus]}>{PAYMENT_LABEL[p.paymentStatus]}</Chip>
          <span className="text-xs font-bold text-emerald-300">{roundName(p.roundId)}</span>
          <span className="text-xs text-zinc-500">Esperado: <b className="text-zinc-300">{fmtMoney(db.settings.entryFee)}</b></span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {p.receipt && (
            <button onClick={() => setReceiptSrc(p.receipt)} className="flex items-center gap-1.5 rounded-lg border border-sky-400/30 bg-sky-400/10 px-3 py-2 text-xs font-bold text-sky-300 transition hover:bg-sky-400/20 active:scale-95">
              <FileImage size={14} /> Ver comprobante
            </button>
          )}
          <button onClick={() => setViewId(p.id)} className="flex items-center gap-1.5 rounded-lg border border-white/12 bg-white/5 px-3 py-2 text-xs font-bold text-zinc-300 transition hover:bg-white/10 active:scale-95">
            <Eye size={14} /> Ver pronóstico
          </button>
          {pending && (
            <>
              <button onClick={() => { approvePayment(p.id); toast.push("ok", "Pago aprobado", `${nick(db, p.userId)} ya está en la tabla.`); }}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-2 text-xs font-extrabold uppercase text-emerald-950 transition hover:bg-emerald-400 active:scale-95">
                <CheckCircle2 size={14} /> Aprobar
              </button>
              <button onClick={() => setToReject(p)} className="flex items-center gap-1.5 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs font-bold text-red-300 transition hover:bg-red-400/20 active:scale-95">
                <XCircle size={14} /> Rechazar
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  const Section = ({ title, icon, count, tone, children }: { title: string; icon: React.ReactNode; count: number; tone: string; children: React.ReactNode }) => (
    <section className="mb-7">
      <h2 className="mb-2.5 flex items-center gap-2 font-display text-lg uppercase tracking-wide text-white">
        {icon} {title} <span className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${tone}`}>{count}</span>
      </h2>
      {children}
    </section>
  );

  return (
    <div>
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="mb-2 flex flex-wrap items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-zinc-500">
          <BellRing size={13} className="text-sky-300" /> Avisos al administrador
          {db.settings.telegramChatId ? <Chip tone="sky">Telegram {db.settings.telegramChatId}</Chip> : <Chip tone="zinc">Telegram sin configurar</Chip>}
        </p>
        {db.notifications.length === 0 ? (
          <p className="text-xs text-zinc-600">Sin avisos por ahora.</p>
        ) : (
          <ul className="space-y-1.5">
            {db.notifications.slice(0, 5).map((n) => (
              <li key={n.id} className="flex items-baseline justify-between gap-3 text-xs">
                <span className="font-semibold text-zinc-300">{n.text}</span>
                <span className="shrink-0 text-[10px] text-zinc-600">{fmtFull(n.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Section title="Pagos pendientes de aprobación" icon={<Inbox size={17} className="text-amber-400" />} count={byStatus.pending.length} tone="bg-amber-400/15 text-amber-300">
        {byStatus.pending.length === 0 ? (
          <EmptyState icon={<Inbox size={28} />} title="No hay pagos pendientes" desc="Cuando un jugador toque “Ya transferí”, su comprobante aparece acá." />
        ) : (
          <div className="stagger space-y-2.5">{byStatus.pending.map((p) => <PredCard key={p.id} p={p} pending />)}</div>
        )}
      </Section>

      <Section title="Pronósticos sin notificar" icon={<Eye size={17} className="text-zinc-400" />} count={byStatus.draft.length} tone="bg-white/10 text-zinc-400">
        {byStatus.draft.length === 0 ? (
          <p className="text-xs text-zinc-600">Nadie dejó pronósticos a medio pagar.</p>
        ) : (
          <div className="space-y-2.5">{byStatus.draft.map((p) => <PredCard key={p.id} p={p} />)}</div>
        )}
      </Section>

      <Section title="Pagos aprobados" icon={<CheckCircle2 size={17} className="text-emerald-400" />} count={byStatus.approved.length} tone="bg-emerald-400/15 text-emerald-300">
        {byStatus.approved.length === 0 ? (
          <p className="text-xs text-zinc-600">Todavía no aprobaste pagos.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-white/10">
            {byStatus.approved.map((p, i) => {
              const u = userById(db, p.userId);
              return (
                <button key={p.id} onClick={() => setViewId(p.id)}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-white/[0.05] ${i % 2 ? "bg-white/[0.02]" : ""}`}>
                  <span className="w-24 shrink-0 text-[11px] text-zinc-500">{fmtFull(p.createdAt)}</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-bold text-zinc-200">{u?.nickname} <span className="font-medium text-zinc-500">· {u?.fullName}</span></span>
                  <span className="shrink-0 text-xs font-semibold text-emerald-300">{roundName(p.roundId)}</span>
                </button>
              );
            })}
          </div>
        )}
      </Section>

      {byStatus.rejected.length > 0 && (
        <Section title="Pagos rechazados" icon={<ThumbsDown size={17} className="text-red-400" />} count={byStatus.rejected.length} tone="bg-red-400/15 text-red-300">
          <div className="space-y-2.5">{byStatus.rejected.map((p) => <PredCard key={p.id} p={p} />)}</div>
        </Section>
      )}

      <ReceiptModal src={receiptSrc} onClose={() => setReceiptSrc(null)} />
      <PredictionViewModal predictionId={viewId} onClose={() => setViewId(null)} />
      <Confirm
        open={!!toReject}
        onClose={() => setToReject(null)}
        onYes={() => { if (toReject) { rejectPayment(toReject.id); toast.push("info", "Pago rechazado", "El jugador puede subir un comprobante nuevo."); } }}
        title="Rechazar pago"
        desc={`Vas a rechazar el pago de ${toReject ? nick(db, toReject.userId) : ""}. El jugador va a poder volver a subir un comprobante desde su pantalla.`}
        yesLabel="Rechazar"
        danger
      />
    </div>
  );
}
