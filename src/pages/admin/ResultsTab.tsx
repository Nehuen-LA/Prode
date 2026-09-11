import React, { useMemo, useState } from "react";
import { Calculator, RotateCcw, Table2, Trophy, Zap } from "lucide-react";
import { useStore } from "../../store";
import type { Match, Selection } from "../../types";
import { fmtDay, fmtMoney, fmtTime, nick, roundPhase, roundStats, sortedRoundMatches, validRoundMatches, winnersInfo } from "../../utils";
import { btnGold, Chip, Confirm, EmptyState, PhaseChip, useToast } from "../../components/ui";

export default function ResultsTab() {
  const { db, setResult, setMatchStatus, settleRound, isAdmin } = useStore();
  const toast = useToast();
  const now = Date.now();

  const rounds = useMemo(
    () => db.rounds.filter((r) => isAdmin || !r.isTest).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [db, isAdmin]
  );
  const [roundId, setRoundId] = useState<string | null>(null);
  const round = rounds.find((r) => r.id === roundId) ?? rounds.find((r) => roundPhase(r, db.matches, now) === "en_juego") ?? rounds[0] ?? null;
  const [confirmSettle, setConfirmSettle] = useState(false);

  const matches = round ? sortedRoundMatches(db.matches, round.id) : [];
  const valid = round ? validRoundMatches(db.matches, round.id) : [];
  const finished = valid.filter((m) => m.status === "finished" && m.result);
  const phase = round ? roundPhase(round, db.matches, now) : null;
  const stats = round ? roundStats(db, round.id) : null;
  const win = round ? winnersInfo(db, round.id) : null;
  const roundPrizes = round ? db.prizes.filter((z) => z.roundId === round.id) : [];

  const doSettle = () => {
    if (!round) return;
    const res = settleRound(round.id);
    if (res.ok) toast.push("ok", "¡Fecha liquidada!", "Los premios ya están creados y los ganadores pueden reclamarlos.");
    else toast.push("err", "No se pudo liquidar", res.error);
  };

  return (
    <div>
      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto pb-1">
        {rounds.map((r) => (
          <button key={r.id} onClick={() => setRoundId(r.id)}
            className={`shrink-0 rounded-xl border px-4 py-2.5 text-sm font-bold transition active:scale-[0.97] ${
              r.id === round?.id ? "border-gold-400/50 bg-gold-400/12 text-gold-300" : "border-white/10 bg-white/[0.04] text-zinc-400 hover:bg-white/8"
            }`}>
            {r.name}
          </button>
        ))}
      </div>

      {!round ? (
        <EmptyState icon={<Table2 size={28} />} title="No hay fechas" desc="Creá una fecha en la pestaña Fechas." />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
            <PhaseChip phase={phase ?? "abierta"} />
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex justify-between text-[11px] font-bold text-zinc-500">
                <span>Resultados cargados</span><span className="text-emerald-300">{finished.length}/{valid.length}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/8">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300 transition-all duration-500" style={{ width: `${valid.length ? (finished.length / valid.length) * 100 : 0}%` }} />
              </div>
            </div>
          </div>

          <div className="stagger space-y-2.5">
            {matches.map((m) => (
              <ResultRow key={m.id} m={m} disabled={round.status === "settled" || round.status === "cancelled"}
                onResult={(s) => { setResult(m.id, s); toast.push("ok", "Resultado guardado", `${m.home} vs ${m.away} · ${s === "L" ? m.home : s === "V" ? m.away : "Empate"}`); }}
                onClear={() => { setResult(m.id, null); toast.push("info", "Resultado quitado"); }}
                onSuspend={() => { setMatchStatus(m.id, m.status === "suspended" ? "scheduled" : "suspended"); toast.push("info", m.status === "suspended" ? "Partido reprogramado" : "Partido suspendido", "No suma ni resta puntos."); }}
              />
            ))}
          </div>

          {phase === "completa" && win && stats && (
            <div className="mt-5 rounded-2xl border border-gold-400/30 bg-gradient-to-b from-gold-400/12 to-transparent p-5 animate-glow">
              <p className="flex items-center gap-2 font-display text-lg uppercase tracking-wide text-gold-300">
                <Calculator size={18} /> Todos los resultados están cargados
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                <div className="rounded-xl bg-black/25 p-3"><p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Recaudado</p><p className="font-display text-xl text-white">{fmtMoney(stats.recaudado)}</p></div>
                <div className="rounded-xl bg-black/25 p-3"><p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Pozo 80%</p><p className="font-display text-xl text-gold-300">{fmtMoney(stats.pozo)}</p></div>
                <div className="rounded-xl bg-black/25 p-3"><p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Tu 20%</p><p className="font-display text-xl text-emerald-300">{fmtMoney(stats.commission)}</p></div>
                <div className="rounded-xl bg-black/25 p-3"><p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Ganadores</p><p className="font-display text-xl text-white">{win.winnerIds.length} · {win.maxHits} aciertos</p></div>
              </div>
              <p className="mt-2.5 text-xs text-zinc-300">
                Ganan <b className="text-white">{win.winnerIds.map((w) => nick(db, w)).join(", ")}</b> · {fmtMoney(win.perWinner)} para cada uno.
              </p>
              <p className="mt-1 text-xs text-gold-300/80">
                Desglose: {win.winnerIds.length} ganador{win.winnerIds.length > 1 ? "es" : ""} × {fmtMoney(win.perWinner)} = {fmtMoney(win.perWinner * win.winnerIds.length)} · Resto: {fmtMoney(win.remainder ?? 0)} → comisión admin
              </p>
              <button onClick={() => setConfirmSettle(true)} className={`${btnGold} mt-4 w-full sm:w-auto`}>
                <Trophy size={16} /> Calcular ganadores y liquidar
              </button>
            </div>
          )}

          {phase === "liquidada" && (
            <div className="mt-5 rounded-2xl border border-gold-400/25 bg-gold-400/6 p-5">
              <p className="font-display text-lg uppercase tracking-wide text-gold-300">Fecha liquidada</p>
              <div className="mt-2 space-y-1.5">
                {roundPrizes.map((z) => (
                  <p key={z.id} className="flex items-center gap-2 text-sm">
                    <Trophy size={14} className="text-gold-400" />
                    <b className="text-white">{nick(db, z.userId)}</b>
                    <span className="text-zinc-400">{fmtMoney(z.amount)}</span>
                    <Chip tone={z.status === "paid" ? "emerald" : z.status === "pending_payment" ? "sky" : "amber"}>
                      {z.status === "paid" ? "Pagado" : z.status === "pending_payment" ? "Esperando pago" : "Sin reclamar"}
                    </Chip>
                  </p>
                ))}
              </div>
              <p className="mt-3 text-xs text-zinc-500">Gestioná los pagos en la pestaña Premios.</p>
            </div>
          )}
        </>
      )}

      <Confirm open={confirmSettle} onClose={() => setConfirmSettle(false)} onYes={doSettle}
        title="Liquidar la fecha" yesLabel="Sí, liquidar"
        desc="Se crean los premios para el/los ganadores con el 80% del pozo y la fecha queda finalizada. Después no se pueden cambiar resultados." />
    </div>
  );
}

function ResultRow({ m, disabled, onResult, onClear, onSuspend }: {
  m: Match; disabled: boolean;
  onResult: (s: Selection) => void; onClear: () => void; onSuspend: () => void;
}) {
  const invalid = m.status === "suspended" || m.status === "cancelled";
  const sel = (s: Selection, label: string) => {
    const active = m.result === s && m.status === "finished";
    return (
      <button disabled={disabled || invalid} onClick={() => (active ? onClear() : onResult(s))}
        className={`flex-1 rounded-lg px-2 py-2.5 text-xs font-extrabold uppercase transition active:scale-[0.95] ${
          active ? "bg-emerald-500 text-emerald-950 shadow-lg shadow-emerald-500/25" : "bg-white/[0.05] text-zinc-400 hover:bg-white/10 hover:text-zinc-200 disabled:opacity-40"
        }`}>
        {label}
      </button>
    );
  };
  return (
    <div className={`card p-3.5 ${invalid ? "opacity-60" : ""}`}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-extrabold text-white">{m.home} <span className="text-zinc-600">vs</span> {m.away}</p>
          <p className="text-[11px] font-semibold capitalize text-zinc-500">{fmtDay(m.matchDate)} · {fmtTime(m.matchDate)}</p>
        </div>
        {invalid ? (
          <div className="flex items-center gap-2">
            <Chip tone="red">{m.status === "suspended" ? "Suspendido" : "Cancelado"}</Chip>
            <button onClick={onSuspend} disabled={disabled} className="flex items-center gap-1 rounded-lg border border-white/12 bg-white/5 px-2.5 py-1.5 text-[11px] font-bold text-zinc-300 transition hover:bg-white/10 active:scale-95">
              <RotateCcw size={12} /> Reprogramar
            </button>
          </div>
        ) : m.status === "finished" ? (
          <Chip tone="emerald"><Zap size={11} /> Finalizado</Chip>
        ) : (
          <button onClick={onSuspend} disabled={disabled} className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[11px] font-bold text-zinc-500 transition hover:border-red-400/30 hover:text-red-300 active:scale-95">
            Suspender
          </button>
        )}
      </div>
      <div className="mt-2.5 flex gap-2">
        {sel("L", `Local · ${m.home.split(" ")[0]}`)}
        {sel("E", "Empate")}
        {sel("V", `Visitante · ${m.away.split(" ")[0]}`)}
      </div>
    </div>
  );
}
