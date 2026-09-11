import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, Copy, FlaskConical, RotateCcw, Save, Trophy } from "lucide-react";
import { useStore } from "../../store";
import type { Prize } from "../../types";
import { fmtDay, fmtFull, fmtMoney, nick, userById } from "../../utils";
import { PredictionViewModal } from "../../components/modals";
import { btnPrimary, Chip, Confirm, EmptyState, Field, inputCls, PRIZE_LABEL, PRIZE_TONE, useToast } from "../../components/ui";

/* ─────────────── Premios ─────────────── */

export function PrizesTab() {
  const { db, markPaid } = useStore();
  const toast = useToast();
  const [detail, setDetail] = useState<Prize | null>(null);
  const [viewPred, setViewPred] = useState<string | null>(null);

  const groups = {
    unclaimed: db.prizes.filter((z) => z.status === "unclaimed").sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    pending: db.prizes.filter((z) => z.status === "pending_payment").sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    paid: db.prizes.filter((z) => z.status === "paid").sort((a, b) => (b.paidAt ?? "").localeCompare(a.paidAt ?? "")),
  };

  const PrizeCard = ({ z, showCbu, showPay }: { z: Prize; showCbu?: boolean; showPay?: boolean }) => {
    const u = userById(db, z.userId);
    const round = db.rounds.find((r) => r.id === z.roundId);
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Trophy size={18} className={z.status === "paid" ? "text-emerald-400" : "text-gold-400"} />
          <span className="text-sm font-extrabold text-white">{u?.nickname}</span>
          <span className="text-xs text-zinc-400">{u?.fullName} · {u?.phone}</span>
          <span className="ml-auto font-display text-lg text-gold-300">{fmtMoney(z.amount)}</span>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <Chip tone={PRIZE_TONE[z.status]}>{PRIZE_LABEL[z.status]}</Chip>
          <span className="text-xs font-bold text-emerald-300">{round?.name}</span>
          {showCbu && z.cbuAlias && (
            <span className="flex items-center gap-1.5 rounded-lg bg-black/25 px-2.5 py-1 text-xs font-bold text-sky-300">
              {z.cbuAlias}
              <button onClick={async () => { try { await navigator.clipboard.writeText(z.cbuAlias!); toast.push("ok", "CBU/Alias copiado"); } catch { /* noop */ } }}
                className="text-sky-400 transition hover:text-sky-200 active:scale-90"><Copy size={12} /></button>
            </span>
          )}
          {z.paidAt && <span className="text-[11px] text-zinc-500">Pagado el {fmtDay(z.paidAt)}</span>}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {showPay && (
            <button onClick={() => { markPaid(z.id); toast.push("ok", "Premio marcado como pagado", nick(db, z.userId)); }}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-2 text-xs font-extrabold uppercase text-emerald-950 transition hover:bg-emerald-400 active:scale-95">
              <CheckCircle2 size={14} /> Marcar como pagado
            </button>
          )}
          <button onClick={() => setDetail(z)} className="flex items-center gap-1.5 rounded-lg border border-white/12 bg-white/5 px-3 py-2 text-xs font-bold text-zinc-300 transition hover:bg-white/10 active:scale-95">
            Ver detalle
          </button>
        </div>
      </div>
    );
  };

  const Section = ({ title, list, tone, empty, showCbu, showPay }: {
    title: string; list: Prize[]; tone: string; empty: string; showCbu?: boolean; showPay?: boolean;
  }) => (
    <section className="mb-7">
      <h2 className="mb-2.5 flex items-center gap-2 font-display text-lg uppercase tracking-wide text-white">
        <Trophy size={17} className="text-gold-400" /> {title} <span className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${tone}`}>{list.length}</span>
      </h2>
      {list.length === 0 ? <p className="text-xs text-zinc-600">{empty}</p> : <div className="stagger space-y-2.5">{list.map((z) => <PrizeCard key={z.id} z={z} showCbu={showCbu} showPay={showPay} />)}</div>}
    </section>
  );

  return (
    <div>
      <Section title="Premios sin reclamar" list={groups.unclaimed} tone="bg-amber-400/15 text-amber-300" empty="Nadie tiene premios pendientes de reclamo." />
      <Section title="Reclamos esperando tu transferencia" list={groups.pending} tone="bg-sky-400/15 text-sky-300" empty="Nadie reclamó premios por ahora." showCbu showPay />
      <Section title="Premios pagados" list={groups.paid} tone="bg-emerald-400/15 text-emerald-300" empty="Todavía no pagaste premios." />

      {detail && (
        <PrizeDetail z={detail} onClose={() => setDetail(null)} onViewPred={(id) => { setDetail(null); setViewPred(id); }} />
      )}
      <PredictionViewModal predictionId={viewPred} onClose={() => setViewPred(null)} />
    </div>
  );
}

function PrizeDetail({ z, onClose, onViewPred }: { z: Prize; onClose: () => void; onViewPred: (id: string) => void }) {
  const { db } = useStore();
  const u = userById(db, z.userId);
  const round = db.rounds.find((r) => r.id === z.roundId);
  return (
    <div className="fixed inset-0 z-[85] flex items-end justify-center sm:items-center sm:p-4">
      <button aria-label="Cerrar" onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade" />
      <div className="relative max-h-[90dvh] w-full overflow-y-auto rounded-t-2xl border border-white/10 bg-pitch-900 p-5 shadow-2xl animate-pop sm:max-w-md sm:rounded-2xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Detalle de premio</p>
            <p className="font-display text-2xl uppercase text-gold-300">{fmtMoney(z.amount)}</p>
          </div>
          <Chip tone={PRIZE_TONE[z.status]}>{PRIZE_LABEL[z.status]}</Chip>
        </div>
        <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm">
          <p className="flex justify-between gap-3"><span className="text-zinc-500">Jugador</span><b className="text-white">{u?.nickname}</b></p>
          <p className="flex justify-between gap-3"><span className="text-zinc-500">Nombre real</span><b className="text-white">{u?.fullName}</b></p>
          <p className="flex justify-between gap-3"><span className="text-zinc-500">Teléfono</span><b className="text-white">{u?.phone}</b></p>
          <p className="flex justify-between gap-3"><span className="text-zinc-500">Fecha ganada</span><b className="text-white">{round?.name}</b></p>
          <p className="flex justify-between gap-3"><span className="text-zinc-500">Reclamado</span><b className="text-white">{z.claimedAt ? fmtFull(z.claimedAt) : "—"}</b></p>
          <p className="flex justify-between gap-3"><span className="text-zinc-500">CBU / Alias</span><b className="text-sky-300">{z.cbuAlias ?? "No cargado"}</b></p>
          <p className="flex justify-between gap-3"><span className="text-zinc-500">Pagado</span><b className="text-white">{z.paidAt ? fmtFull(z.paidAt) : "—"}</b></p>
        </div>
        {z.winningPredictionId && (
          <button onClick={() => onViewPred(z.winningPredictionId!)} className={`${btnPrimary} mt-4 w-full`}>
            <Trophy size={16} /> Ver pronóstico ganador
          </button>
        )}
        <button onClick={onClose} className="mt-2 w-full rounded-xl border border-white/12 bg-white/5 px-4 py-3 text-sm font-bold text-zinc-300 transition hover:bg-white/10">
          Cerrar
        </button>
      </div>
    </div>
  );
}

/* ─────────────── Ajustes ─────────────── */

export function SettingsTab() {
  const { db, saveSettings } = useStore();
  const toast = useToast();
  const [f, setF] = useState({ ...db.settings, entryFee: String(db.settings.entryFee) });

  const save = () => {
    const fee = Number(f.entryFee);
    if (!Number.isFinite(fee) || fee <= 0) return toast.push("err", "El precio debe ser un número mayor a 0");
    saveSettings({
      adminFullName: f.adminFullName.trim(),
      adminAlias: f.adminAlias.trim(),
      adminCbu: f.adminCbu.trim(),
      telegramChatId: f.telegramChatId.trim(),
      entryFee: fee,
    });
    toast.push("ok", "Ajustes guardados", "Los jugadores ya ven los datos de cobro actualizados.");
  };

  return (
    <div className="max-w-xl">
      <div className="card space-y-4 p-5">
        <h2 className="flex items-center gap-2 font-display text-lg uppercase tracking-wide text-white">
          <Save size={17} className="text-emerald-400" /> Datos de cobro
        </h2>
        <Field label="Titular de la cuenta" hint="Este nombre ven los jugadores en la pantalla de pago.">
          <input className={inputCls} value={f.adminFullName} onChange={(e) => setF({ ...f, adminFullName: e.target.value })} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Alias de cobro">
            <input className={inputCls} value={f.adminAlias} onChange={(e) => setF({ ...f, adminAlias: e.target.value })} />
          </Field>
          <Field label="CBU / CVU (opcional)">
            <input className={inputCls} value={f.adminCbu} onChange={(e) => setF({ ...f, adminCbu: e.target.value })} />
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Precio por pronóstico (ARS)">
            <input className={inputCls} type="number" min={1} value={f.entryFee} onChange={(e) => setF({ ...f, entryFee: e.target.value })} />
          </Field>
          <Field label="Telegram Chat ID" hint="Para recibir avisos de pagos en tu Telegram.">
            <input className={inputCls} value={f.telegramChatId} onChange={(e) => setF({ ...f, telegramChatId: e.target.value })} placeholder="Ej.: 123456789" />
          </Field>
        </div>
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/6 p-3.5 text-xs text-zinc-300">
          Regla del pozo: <b className="text-white">80%</b> para el ganador/es · <b className="text-white">20%</b> para vos. Con {db.predictions.filter((p) => p.paymentStatus === "approved").length} pronósticos aprobados en total, eso hoy son <b className="text-gold-300">{fmtMoney(db.predictions.filter((p) => p.paymentStatus === "approved").length * Number(f.entryFee || 0) * 0.2)}</b> de comisión acumulada.
        </div>
        <button onClick={save} className={`${btnPrimary} w-full`}>
          <Save size={16} /> Guardar ajustes
        </button>
      </div>
    </div>
  );
}

/* ─────────────── Modo prueba ─────────────── */

export function TestTab() {
  const { db, approveAllPending } = useStore();
  const toast = useToast();
  const pending = db.predictions.filter((p) => p.paymentStatus === "pending_review").length;
  const testRounds = db.rounds.filter((r) => r.isTest).length;

  return (
    <div className="max-w-xl space-y-3">
      <div className="rounded-2xl border border-sky-400/25 bg-sky-400/6 p-4">
        <p className="flex items-center gap-2 text-sm font-extrabold text-sky-300">
          <FlaskConical size={17} /> Modo prueba
        </p>
        <p className="mt-1 text-xs leading-relaxed text-zinc-400">
          Todo lo que hagas acá queda marcado como prueba y <b className="text-zinc-200">solo lo ves vos</b>: los jugadores no ven las fechas de prueba.
          Ideal para simular una fecha completa antes del lanzamiento.
        </p>
        <p className="mt-2 text-xs font-semibold text-emerald-300">
          Las fechas de prueba se crean desde la pestaña Fechas marcando "Modo prueba".
        </p>
      </div>

      <button
        onClick={() => { const n = approveAllPending(); toast.push(n ? "ok" : "info", n ? `${n} pagos aprobados` : "No había pagos pendientes"); }}
        disabled={pending === 0}
        className="card flex w-full items-center gap-4 p-4 text-left transition hover:border-emerald-400/30 active:scale-[0.99] disabled:opacity-40"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
          <CheckCircle2 size={20} />
        </span>
        <span>
          <span className="block text-sm font-extrabold text-white">
            Aprobar todos los pagos pendientes {pending > 0 && <Chip tone="amber" className="ml-1">{pending}</Chip>}
          </span>
          <span className="block text-xs text-zinc-500">Atajo para probar la tabla sin aprobar comprobantes de a uno.</span>
        </span>
      </button>

      <div className="flex items-start gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs text-zinc-500">
        <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-400" />
        <p>
          Fechas de prueba actuales: <b className="text-zinc-300">{testRounds}</b>. Podés crear partidos y cargarlos con resultados para verificar las clasificaciones.
        </p>
      </div>
    </div>
  );
}
