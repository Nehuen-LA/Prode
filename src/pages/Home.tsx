import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarClock, ChevronRight, Crown, Hourglass, Info, ListChecks, Pencil, Receipt, Share2, Sparkles, Ticket, Trash2, Trophy, Users, Wallet, X, Zap } from "lucide-react";
import { useStore } from "../store";
import type { Match, Prediction, Prize, Selection } from "../types";
import {
  effectiveClose, fmtDay, fmtMoney, fmtTime, isPredictionOpen, nick, roundPhase, roundStats,
  short, sortedRoundMatches, timeLeft, validRoundMatches, winnersInfo,
} from "../utils";
import { AuthModal, ClaimModal, PredictionViewModal } from "../components/modals";
import { btnPrimary, Chip, Confirm, EmptyState, PAYMENT_LABEL, PAYMENT_TONE, PhaseChip, useCountUp, useNow, useToast } from "../components/ui";

function paymentNote(preds: Prediction[]): string | null {
  if (preds.some((x) => x.paymentStatus === "draft")) return "Tenés un pronóstico sin pagar: subí el comprobante para confirmar tu participación.";
  if (preds.some((x) => x.paymentStatus === "pending_review")) return "Tu pago está siendo verificado por el administrador.";
  if (preds.some((x) => x.paymentStatus === "rejected")) return "Tu pago fue rechazado. Podés subir un comprobante nuevo desde “Reintentar”.";
  return null;
}

export default function Home() {
  const { db, me, isAdmin, savePrediction, updatePredictionItems, deletePrediction } = useStore();
  const navigate = useNavigate();
  const toast = useToast();
  const now = useNow(1000);

  const visibleRounds = useMemo(
    () => db.rounds.filter((r) => isAdmin || !r.isTest).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [db.rounds, isAdmin]
  );

  const [roundId, setRoundId] = useState<string | null>(null);
  const [selections, setSelections] = useState<Record<string, Selection>>({});
  const [editingPredId, setEditingPredId] = useState<string | null>(null);
  const [deletingPredId, setDeletingPredId] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [claiming, setClaiming] = useState<Prize | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const pendingSave = useRef(false);

  const round = visibleRounds.find((r) => r.id === roundId) ?? visibleRounds.find((r) => roundPhase(r, db.matches, now) === "abierta") ?? visibleRounds[0] ?? null;

  useEffect(() => {
    setSelections({});
    setEditingPredId(null);
  }, [round?.id]);

  const matches = useMemo(() => (round ? sortedRoundMatches(db.matches, round.id) : []), [db.matches, round]);
  const valid = useMemo(() => (round ? validRoundMatches(db.matches, round.id) : []), [db.matches, round]);
  const suspended = matches.filter((m) => m.status === "suspended" || m.status === "cancelled");
  const open = round ? isPredictionOpen(round, db.matches, now) : false;
  const phase = round ? roundPhase(round, db.matches, now) : null;
  const stats = round ? roundStats(db, round.id) : null;
  const pot = useCountUp(stats?.pozo ?? 0);
  const close = round ? effectiveClose(round, db.matches) : null;

  const myPreds = useMemo(
    () => (me && round ? db.predictions.filter((p) => p.userId === me.id && p.roundId === round.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt)) : []),
    [db.predictions, me, round]
  );
  const myLatest = myPreds[myPreds.length - 1] ?? null;
  const drafts = useMemo(() => myPreds.filter((p) => p.paymentStatus === "draft"), [myPreds]);

  const myUnclaimed = me ? db.prizes.find((z) => z.userId === me.id && z.status === "unclaimed") : null;
  const myPending = me ? db.prizes.find((z) => z.userId === me.id && z.status === "pending_payment") : null;

  const lastSettled = useMemo(() => {
    const settled = db.rounds.filter((r) => r.status === "settled" && (isAdmin || !r.isTest) && db.prizes.some((z) => z.roundId === r.id));
    return settled.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
  }, [db, isAdmin]);
  const lastSettledPrizes = lastSettled ? db.prizes.filter((z) => z.roundId === lastSettled.id) : [];

  const handleShareRound = async () => {
    try {
      const current = parseInt(localStorage.getItem("prode_shares_count") || "0", 10);
      localStorage.setItem("prode_shares_count", String(current + 1));
    } catch {}

    const text = `¡Sumate a pronosticar la ${round?.name ?? "fecha"} en Prode Liga y competí por el pozo!`;
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Prode Liga", text, url });
        toast.push("ok", "Compartido", "¡Gracias por invitar amigos!");
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      toast.push("ok", "Enlace copiado", "Pegalo en WhatsApp o tus redes para invitar.");
    } catch {
      toast.push("info", "Enlace", url);
    }
  };

  const doSave = () => {
    if (!round) return;
    const items = valid.map((m) => ({ matchId: m.id, selection: selections[m.id] }));

    if (editingPredId) {
      const res = updatePredictionItems(editingPredId, items);
      if (res.error) {
        toast.push("err", "No se pudo actualizar", res.error);
        return;
      }
      toast.push("ok", "Pronóstico actualizado", "Podés abonarlo ahora.");
      const savedId = editingPredId;
      setEditingPredId(null);
      setSelections({});
      navigate(`/pago/${savedId}`);
      return;
    }

    const res = savePrediction(round.id, items);
    if (res.error) { toast.push("err", "No se pudo guardar", res.error); return; }
    toast.push("ok", "Pronóstico guardado", "Ahora completá el pago para participar.");
    setSelections({});
    navigate(`/pago/${res.id}`);
  };

  const onSaveClick = () => {
    if (!me) { pendingSave.current = true; setAuthOpen(true); return; }
    doSave();
  };

  const startEditDraft = (p: Prediction) => {
    const selMap: Record<string, Selection> = {};
    p.items.forEach((it) => { selMap[it.matchId] = it.selection; });
    setSelections(selMap);
    setEditingPredId(p.id);
    window.scrollTo({ top: 380, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingPredId(null);
    setSelections({});
  };

  const chosen = valid.filter((m) => selections[m.id]).length;
  const win = round ? winnersInfo(db, round.id) : null;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-44 pt-5">
      {/* encabezado */}
      <div className="mb-4 flex items-center justify-between gap-3 animate-fade-up">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300/80">Torneo Apertura · Liga Argentina</p>
          <h1 className="font-display text-3xl uppercase leading-none text-white sm:text-4xl">Pronosticá la fecha</h1>
        </div>
        <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
          {phase && <PhaseChip phase={phase} />}
          {close && open && <span className="text-[11px] font-semibold text-zinc-500">Cierra {fmtDay(close.toISOString())} {fmtTime(close.toISOString())}</span>}
        </div>
      </div>

      {round && (
        <>
          {/* scoreboard */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-pitch-800 to-pitch-900 p-5 shadow-2xl animate-fade-up">
            <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-emerald-500/12 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-10 h-52 w-52 rounded-full bg-gold-400/8 blur-3xl" />
            <div className="relative flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.2em] text-zinc-400">
                  <Trophy size={13} className="text-gold-400" /> Pozo para el ganador
                </p>
                <p className="font-display text-[52px] leading-none text-gold-300 drop-shadow-[0_0_28px_rgba(251,191,36,0.25)] sm:text-6xl">
                  {fmtMoney(pot)}
                </p>
                <p className="mt-1.5 text-[11px] font-semibold text-zinc-500">Pozo acumulado · entrada {fmtMoney(db.settings.entryFee)}</p>
              </div>
              <div className="grid grid-cols-3 gap-2.5 text-center">
                {[
                  { l: "Recaudado", v: fmtMoney(stats?.recaudado ?? 0), i: <Wallet size={13} /> },
                  { l: "Jugadores", v: String(stats?.players ?? 0), i: <Users size={13} /> },
                  { l: "Pronóst.", v: String(stats?.approvedCount ?? 0), i: <Ticket size={13} /> },
                ].map((s) => (
                  <div key={s.l} className="rounded-xl border border-white/8 bg-white/[0.04] px-3 py-2.5">
                    <p className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">{s.i}{s.l}</p>
                    <p className="font-display text-xl text-white">{s.v}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative mt-4 flex flex-wrap items-center gap-2 border-t border-white/8 pt-3.5">
              {open && close ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 text-xs font-extrabold text-emerald-300">
                  <Hourglass size={13} /> Cierra en {timeLeft(close, now)}
                </span>
              ) : phase === "liquidada" && win ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-400/30 bg-gold-400/10 px-3 py-1.5 text-xs font-extrabold text-gold-300">
                  <Crown size={13} /> Ganaron {win.winnerIds.map((w) => nick(db, w)).join(", ")} · {fmtMoney(win.perWinner)} c/u
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/25 bg-sky-400/10 px-3 py-1.5 text-xs font-extrabold text-sky-300">
                  <Zap size={13} /> Pronósticos cerrados · esperando resultados
                </span>
              )}
              <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/4 px-3 py-1.5 text-xs font-bold text-zinc-400">
                <CalendarClock size={13} /> {valid.filter((m) => m.status === "finished").length}/{valid.length} resultados
              </span>
            </div>
          </div>

          {/* contador de jugadores y compartir */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 animate-fade-up">
            <span className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <b className="text-white">{stats?.players ?? 0} jugadores</b> participando en esta fecha
            </span>
            <button
              onClick={handleShareRound}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-extrabold text-emerald-300 transition hover:bg-emerald-400/20 active:scale-95"
              title="Compartir fecha con amigos"
            >
              <Share2 size={13} /> Compartir fecha
            </button>
          </div>

          {/* banner persistente de borradores sin pagar */}
          {drafts.length > 0 && (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 animate-fade-up">
              <div className="flex items-center gap-3">
                <Hourglass size={22} className="shrink-0 text-amber-400" />
                <div>
                  <p className="text-sm font-extrabold text-amber-200">
                    Tenés {drafts.length} pronóstico{drafts.length > 1 ? "s" : ""} sin pagar
                  </p>
                  <p className="text-xs text-zinc-300">
                    Subí el comprobante para confirmar tu participación en el pozo.
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate(`/pago/${drafts[0].id}`)}
                className="shrink-0 rounded-xl bg-amber-400 px-3.5 py-2 text-xs font-black uppercase text-amber-950 transition hover:bg-amber-300 active:scale-95"
              >
                Pagar ahora
              </button>
            </div>
          )}

          {/* aviso de modo edición */}
          {editingPredId && (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-3.5 animate-fade-up">
              <div className="flex items-center gap-2.5">
                <Pencil size={17} className="text-emerald-400" />
                <span className="text-xs font-bold text-emerald-200">
                  Modificando pronóstico. Elegí tus resultados y guardá los cambios.
                </span>
              </div>
              <button
                onClick={cancelEdit}
                className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-bold text-zinc-300 transition hover:bg-white/10"
              >
                <X size={13} /> Cancelar
              </button>
            </div>
          )}

          {/* banner reclamo de premio */}
          {myUnclaimed && (
            <button onClick={() => setClaiming(myUnclaimed)}
              className="pulse-ring mt-3 flex w-full items-center gap-4 rounded-2xl border border-gold-400/40 bg-gradient-to-r from-gold-400/15 to-amber-500/8 p-4 text-left transition hover:from-gold-400/25 animate-fade-up">
              <Trophy size={34} className="shrink-0 text-gold-400" />
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg uppercase leading-tight text-gold-300">¡Felicitaciones, {me?.nickname}!</p>
                <p className="text-xs text-zinc-300">
                  Ganaste <b className="text-gold-300">{fmtMoney(myUnclaimed.amount)}</b> en {db.rounds.find((r) => r.id === myUnclaimed.roundId)?.name}. Reclamá tu premio.
                </p>
              </div>
              <ChevronRight size={20} className="shrink-0 text-gold-400" />
            </button>
          )}
          {myPending && !myUnclaimed && (
            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-sky-400/25 bg-sky-400/8 p-4 animate-fade-up">
              <Wallet size={22} className="shrink-0 text-sky-300" />
              <p className="text-xs text-zinc-300">
                Tu premio de <b className="text-sky-300">{fmtMoney(myPending.amount)}</b> está en camino: el administrador ya tiene tu CBU/Alias <b className="text-zinc-100">{myPending.cbuAlias}</b>.
              </p>
            </div>
          )}

          {/* ganadores anteriores */}
          {lastSettled && !myUnclaimed && (
            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 animate-fade-up">
              <Crown size={22} className="shrink-0 text-gold-400" />
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Ganadores de la fecha anterior</p>
                <p className="truncate text-sm font-bold text-zinc-100">
                  {lastSettledPrizes.map((z) => nick(db, z.userId)).join(", ")}
                  <span className="font-semibold text-gold-300"> · {fmtMoney(lastSettledPrizes[0]?.amount ?? 0)} c/u</span>
                </p>
              </div>
            </div>
          )}

          {/* selector de fechas */}
          <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto pb-1 animate-fade-up">
            {visibleRounds.map((r) => {
              const ph = roundPhase(r, db.matches, now);
              const active = r.id === round.id;
              return (
                <button key={r.id} onClick={() => setRoundId(r.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition active:scale-[0.97] ${
                    active ? "border-emerald-400/50 bg-emerald-400/12 text-emerald-200" : "border-white/10 bg-white/[0.04] text-zinc-400 hover:bg-white/8 hover:text-zinc-200"
                  }`}>
                  <span className={`h-2 w-2 rounded-full ${ph === "abierta" ? "bg-emerald-400" : ph === "en_juego" ? "animate-pulse bg-sky-400" : ph === "completa" ? "bg-amber-400" : ph === "liquidada" ? "bg-gold-400" : "bg-red-400"}`} />
                  {r.name}
                  {r.isTest && <Chip tone="sky">test</Chip>}
                </button>
              );
            })}
          </div>

          {/* partidos */}
          <div className="stagger mt-4 space-y-3">
            {valid.length === 0 && (
              <EmptyState icon={<CalendarClock size={30} />} title="Todavía no hay partidos cargados" desc="El administrador aún no cargó el fixture de esta fecha. Volvé más tarde." />
            )}
            {valid.map((m, i) => (
              <MatchCard key={m.id} match={m} index={i} open={open} selection={selections[m.id] ?? null}
                onPick={(s) => setSelections((prev) => ({ ...prev, [m.id]: s }))} myPick={myLatest?.items.find((it) => it.matchId === m.id)?.selection ?? null} />
            ))}
            {suspended.length > 0 && (
              <div className="rounded-xl border border-red-400/20 bg-red-400/6 px-4 py-3 text-xs font-semibold text-red-300">
                {suspended.length} partido{suspended.length > 1 ? "s" : ""} suspendido{suspended.length > 1 ? "s" : ""} · no suman puntos
              </div>
            )}
          </div>

          {/* mis pronósticos de esta fecha */}
          {myPreds.length > 0 && (
            <div className="mt-7 animate-fade-up">
              <h2 className="mb-2.5 flex items-center gap-2 font-display text-lg uppercase tracking-wide text-white">
                <ListChecks size={17} className="text-emerald-400" /> Mis pronósticos · {round.name}
              </h2>
              <div className="space-y-2">
                {myPreds.map((p, i) => (
                  <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
                    <span className="font-display text-lg text-emerald-300">#{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-zinc-100">
                        {p.name && <span className="mr-1.5 font-extrabold text-emerald-300">"{p.name}" ·</span>}
                        {p.items.length} partidos
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        {p.paymentStatus === "approved" ? `${p.totalHits} aciertos hasta ahora` : `Guardado ${fmtDay(p.createdAt)} ${fmtTime(p.createdAt)}`}
                      </p>
                    </div>
                    <Chip tone={PAYMENT_TONE[p.paymentStatus]}>{PAYMENT_LABEL[p.paymentStatus]}</Chip>
                    <div className="flex flex-wrap items-center gap-2">
                      {p.paymentStatus === "draft" && (
                        <>
                          <button
                            onClick={() => navigate(`/pago/${p.id}`)}
                            className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-extrabold uppercase text-emerald-950 transition hover:bg-emerald-400 active:scale-95"
                          >
                            Pagar
                          </button>
                          {open && (
                            <button
                              onClick={() => startEditDraft(p)}
                              title="Editar pronóstico"
                              className="flex items-center gap-1 rounded-lg border border-white/12 bg-white/5 px-2.5 py-1.5 text-xs font-bold text-zinc-300 transition hover:bg-white/10 active:scale-95"
                            >
                              <Pencil size={13} /> Editar
                            </button>
                          )}
                          <button
                            onClick={() => setDeletingPredId(p.id)}
                            title="Eliminar borrador"
                            className="flex items-center gap-1 rounded-lg border border-red-400/20 bg-red-400/5 px-2.5 py-1.5 text-xs font-bold text-red-400 transition hover:bg-red-400/10 active:scale-95"
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                      {p.paymentStatus === "rejected" && (
                        <>
                          <button
                            onClick={() => navigate(`/pago/${p.id}`)}
                            className="rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-extrabold uppercase text-amber-950 transition hover:bg-amber-300 active:scale-95"
                          >
                            Reintentar
                          </button>
                          <button
                            onClick={() => setDeletingPredId(p.id)}
                            title="Eliminar pronóstico"
                            className="flex items-center gap-1 rounded-lg border border-red-400/20 bg-red-400/5 px-2.5 py-1.5 text-xs font-bold text-red-400 transition hover:bg-red-400/10 active:scale-95"
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                      <button onClick={() => setViewId(p.id)} className="rounded-lg border border-white/12 bg-white/5 px-3 py-1.5 text-xs font-bold text-zinc-300 transition hover:bg-white/10 active:scale-95">
                        Ver
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {paymentNote(myPreds) && (
                <p className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-amber-300/90">
                  <Info size={12} /> {paymentNote(myPreds)}
                </p>
              )}
            </div>
          )}

          {/* barra guardar */}
          {open && valid.length > 0 && (
            <div className="fixed inset-x-0 bottom-[76px] z-40 px-4">
              <div className="mx-auto flex max-w-3xl items-center gap-3 rounded-2xl border border-white/12 bg-pitch-900/95 p-3 shadow-2xl shadow-black/50 backdrop-blur-xl">
                <div className="min-w-0 flex-1 pl-1">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
                    {editingPredId ? "Modificando borrador" : "Tu pronóstico"}
                  </p>
                  <p className={`text-sm font-extrabold ${chosen === valid.length ? "text-emerald-300" : "text-zinc-200"}`}>
                    {chosen}/{valid.length} partidos
                  </p>
                </div>
                <button onClick={onSaveClick} disabled={chosen !== valid.length} className={`${btnPrimary} shrink-0`}>
                  <Receipt size={16} /> {editingPredId ? "Guardar cambios" : `Guardar · ${fmtMoney(db.settings.entryFee)}`}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {!round && (
        <EmptyState icon={<CalendarClock size={30} />} title="No hay fechas activas" desc="El administrador todavía no abrió ninguna fecha. Volvé más tarde." />
      )}

      {/* cómo funciona (solo visitantes) */}
      {!me && round && (
        <div className="mt-8 grid gap-3 sm:grid-cols-3 animate-fade-up">
          {[
            { i: <ListChecks size={20} />, t: "1 · Pronosticá", d: `Elegí Local, Empate o Visitante en los ${valid.length} partidos de la fecha.` },
            { i: <Wallet size={20} />, t: "2 · Pagá tu entrada", d: `Transferís ${fmtMoney(db.settings.entryFee)} y subís el comprobante.` },
            { i: <Sparkles size={20} />, t: "3 · Llevate el pozo", d: "El que más acierta se lleva el pozo de la fecha." },
          ].map((s) => (
            <div key={s.t} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
              <div className="mb-2 text-emerald-400">{s.i}</div>
              <p className="text-sm font-extrabold text-white">{s.t}</p>
              <p className="mt-1 text-xs text-zinc-400">{s.d}</p>
            </div>
          ))}
        </div>
      )}

      <AuthModal open={authOpen} onClose={() => { setAuthOpen(false); pendingSave.current = false; }}
        onSuccess={() => { if (pendingSave.current) { pendingSave.current = false; setTimeout(doSave, 60); } }} />
      <ClaimModal prize={claiming} onClose={() => setClaiming(null)} />
      <PredictionViewModal predictionId={viewId} onClose={() => setViewId(null)} />

      <Confirm
        open={!!deletingPredId}
        title="Eliminar pronóstico"
        desc="¿Seguro que querés eliminar este pronóstico sin pagar? Esta acción no se puede deshacer."
        yesLabel="Eliminar"
        danger
        onClose={() => setDeletingPredId(null)}
        onYes={() => {
          if (deletingPredId) {
            deletePrediction(deletingPredId);
            if (editingPredId === deletingPredId) {
              setEditingPredId(null);
              setSelections({});
            }
            toast.push("info", "Pronóstico eliminado", "El borrador fue eliminado correctamente.");
          }
          setDeletingPredId(null);
        }}
      />
    </div>
  );
}

/* ─────────────── Tarjeta de partido ─────────────── */

function MatchCard({ match, index, open, selection, onPick, myPick }: {
  match: Match; index: number; open: boolean; selection: Selection | null; onPick: (s: Selection) => void; myPick: Selection | null;
}) {
  const finished = match.status === "finished" && !!match.result;
  const won = (sel: Selection | null) => finished && sel === match.result;

  const seg = (s: Selection, label: string, team?: string) => {
    const active = selection === s;
    return (
      <button
        onClick={() => onPick(s)}
        disabled={!open}
        className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-3 transition active:scale-[0.96] ${
          active ? "bg-emerald-500 text-emerald-950 shadow-lg shadow-emerald-500/25" : "bg-white/[0.05] text-zinc-400 hover:bg-white/10 hover:text-zinc-200"
        }`}
      >
        <span className="text-[10px] font-extrabold uppercase tracking-widest opacity-80">{label}</span>
        {team && <span className="w-full truncate text-center text-xs font-bold">{team}</span>}
      </button>
    );
  };

  return (
    <div className={`card overflow-hidden transition ${open ? "hover:border-emerald-400/30" : ""}`}>
      <div className="flex items-center gap-3 px-4 pt-3.5">
        <span className="font-display text-sm text-zinc-600">{String(index + 1).padStart(2, "0")}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-extrabold text-white">
            {match.home} <span className="mx-1 font-display text-xs font-normal text-emerald-400/80">VS</span> {match.away}
          </p>
        </div>
        <span className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold capitalize text-zinc-400">
          {fmtDay(match.matchDate)} · {fmtTime(match.matchDate)}
        </span>
      </div>
      <div className="p-3">
        {open ? (
          <div className="flex gap-2">
            {seg("L", "Local", short(match.home))}
            {seg("E", "Empate")}
            {seg("V", "Visitante", short(match.away))}
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-xl bg-white/[0.04] px-4 py-2.5">
            {match.status === "live" ? (
              <span className="flex items-center gap-2 text-xs font-extrabold uppercase text-sky-300">
                <span className="h-2 w-2 animate-pulse rounded-full bg-sky-400" /> En juego
              </span>
            ) : finished ? (
              <span className="text-sm font-extrabold text-white">
                {match.result === "L" ? match.home : match.result === "V" ? match.away : "Empate"}
                <span className="ml-2 text-[11px] font-bold uppercase text-zinc-500">{match.result === "E" ? "Empate" : "Ganador"}</span>
              </span>
            ) : (
              <span className="text-xs font-bold uppercase text-zinc-500">Sin resultado</span>
            )}
            {myPick && (
              <span className={`text-[11px] font-extrabold uppercase ${won(myPick) ? "text-emerald-400" : finished ? "text-red-400" : "text-zinc-500"}`}>
                {finished ? (won(myPick) ? "✓ Acertaste" : "✗ Fallaste") : `Tu apuesta: ${myPick === "L" ? short(match.home) : myPick === "V" ? short(match.away) : "Empate"}`}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
