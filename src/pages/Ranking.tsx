import React, { useMemo, useRef, useState } from "react";
import { Crown, Info, Share2, Table2 } from "lucide-react";
import html2canvas from "html2canvas";
import { useStore } from "../store";
import { fmtDay, nick, roundPhase, short, validRoundMatches, winnersInfo } from "../utils";
import { Chip, EmptyState, PhaseChip, useNow, useToast } from "../components/ui";

export default function Ranking() {
  const { db, me, isAdmin } = useStore();
  const toast = useToast();
  const now = useNow(30_000);
  const cardRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);

  const rounds = useMemo(
    () => db.rounds.filter((r) => isAdmin || !r.isTest).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [db.rounds, isAdmin]
  );
  const [roundId, setRoundId] = useState<string | null>(null);
  const round =
    rounds.find((r) => r.id === roundId) ??
    rounds.find((r) => roundPhase(r, db.matches, now) === "abierta") ??
    rounds.find((r) => db.predictions.some((p) => p.roundId === r.id && p.paymentStatus === "approved")) ??
    rounds[0] ?? null;

  const valid = round ? validRoundMatches(db.matches, round.id) : [];
  const phase = round ? roundPhase(round, db.matches, now) : null;
  const win = round ? winnersInfo(db, round.id) : null;

  const ticker = useMemo(
    () =>
      db.predictions
        .filter((p) => p.paymentStatus === "approved" && (isAdmin || !db.rounds.find((r) => r.id === p.roundId)?.isTest))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 6),
    [db, isAdmin]
  );

  const rows = useMemo(() => {
    if (!round) return [];
    const approved = db.predictions.filter((p) => p.roundId === round.id && p.paymentStatus === "approved");
    const winner = winnersInfo(db, round.id);
    return approved
      .map((p) => ({ p, isWinner: !!winner && winner.winnerIds.includes(p.userId) && p.totalHits === winner.maxHits }))
      .sort((a, b) => b.p.totalHits - a.p.totalHits || a.p.createdAt.localeCompare(b.p.createdAt));
  }, [db, round]);

  const posOf = (i: number): number => {
    if (i === 0) return 1;
    return rows[i].p.totalHits === rows[i - 1].p.totalHits ? posOf(i - 1) : i + 1;
  };

  const myBestIndex = me ? rows.findIndex((r) => r.p.userId === me.id) : -1;
  const myBestRow = myBestIndex >= 0 ? rows[myBestIndex] : null;
  const myPos = myBestIndex >= 0 ? posOf(myBestIndex) : null;

  const handleSharePosition = async () => {
    if (!cardRef.current || !me || !myBestRow || !round) return;
    setSharing(true);
    try {
      // Record share in statistics
      const current = parseInt(localStorage.getItem("prode_shares_count") || "0", 10);
      localStorage.setItem("prode_shares_count", String(current + 1));

      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#070c0a",
        scale: 2,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) {
          setSharing(false);
          return;
        }
        const file = new File([blob], `prode-posicion-${me.nickname}.png`, { type: "image/png" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: `Mi posición en Prode Liga: #${myPos}`,
              text: `¡Estoy puesto #${myPos} con ${myBestRow.p.totalHits} aciertos en la ${round.name} de Prode Liga!`,
            });
            toast.push("ok", "Compartido", "¡Tarjeta compartida con éxito!");
            setSharing(false);
            return;
          } catch {
            // User cancelled share
          }
        }

        // Fallback: download card
        const link = document.createElement("a");
        link.download = `prode-posicion-${me.nickname}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
        toast.push("ok", "Imagen descargada", "Descargaste tu tarjeta de posición.");
        setSharing(false);
      });
    } catch {
      toast.push("err", "Error al compartir", "No se pudo generar la imagen.");
      setSharing(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-32 pt-5">
      <div className="mb-4 flex items-end justify-between gap-3 animate-fade-up">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300/80">En vivo · solo pronósticos pagos</p>
          <h1 className="font-display text-3xl uppercase leading-none text-white sm:text-4xl">Tabla de clasificación</h1>
        </div>
        {phase && <PhaseChip phase={phase} />}
      </div>

      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto pb-1 animate-fade-up">
        {rounds.map((r) => (
          <button key={r.id} onClick={() => setRoundId(r.id)}
            className={`flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition active:scale-[0.97] ${
              r.id === round?.id ? "border-emerald-400/50 bg-emerald-400/12 text-emerald-200" : "border-white/10 bg-white/[0.04] text-zinc-400 hover:bg-white/8 hover:text-zinc-200"
            }`}>
            {r.name}
            {r.isTest && <Chip tone="sky">test</Chip>}
          </button>
        ))}
      </div>

      {/* ticker de últimos en sumarse arriba de la tabla */}
      {ticker.length > 0 && (
        <div className="mb-4 overflow-hidden rounded-xl border border-white/8 bg-white/[0.03] py-2 animate-fade-up">
          <div className="flex w-max animate-ticker items-center gap-6 pl-4">
            {[...ticker, ...ticker].map((p, i) => (
              <span key={p.id + i} className="flex items-center gap-1.5 whitespace-nowrap text-xs text-zinc-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <b className="text-zinc-200">{nick(db, p.userId)}</b> {p.name ? `(${p.name}) ` : ""}ya está en la {db.rounds.find((r) => r.id === p.roundId)?.name.split("·")[0]?.trim() ?? "fecha"}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* banner para compartir mi posición */}
      {myBestRow && myPos && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-3.5 animate-fade-up">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 font-display text-lg font-black text-pitch-950">
              #{myPos}
            </div>
            <div>
              <p className="text-sm font-extrabold text-white">
                Estás en el puesto #{myPos} con {myBestRow.p.totalHits} aciertos
              </p>
              <p className="text-xs text-emerald-300/80">
                {myBestRow.p.name ? `Pronóstico: "${myBestRow.p.name}" · ` : ""}¡Mostrale a tus amigos cómo vas!
              </p>
            </div>
          </div>
          <button
            onClick={handleSharePosition}
            disabled={sharing}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-extrabold uppercase text-emerald-950 transition hover:bg-emerald-400 active:scale-95"
          >
            <Share2 size={14} /> {sharing ? "Generando..." : "Compartir mi posición"}
          </button>
        </div>
      )}

      {phase === "liquidada" && win && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-gold-400/30 bg-gold-400/8 px-4 py-3.5 animate-fade-up">
          <Crown size={26} className="shrink-0 text-gold-400" />
          <p className="text-sm font-bold text-gold-200">
            Ganador{win.winnerIds.length > 1 ? "es" : ""}: {win.winnerIds.map((w) => nick(db, w)).join(", ")}
            <span className="font-semibold text-gold-300"> · {win.maxHits} aciertos</span>
          </p>
        </div>
      )}

      {rows.length === 0 ? (
        <EmptyState icon={<Table2 size={30} />} title="Todavía no hay pronósticos aprobados"
          desc="Cuando el administrador apruebe los pagos de esta fecha, la tabla aparece acá." />
      ) : (
        <div className="card overflow-hidden animate-fade-up">
          <div className="overflow-x-auto">
            <table
              className="w-full border-collapse text-sm"
              style={{ minWidth: `${Math.max(valid.length * 54 + 180, 360)}px` }}
            >
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <th className="sticky left-0 z-20 min-w-[135px] sm:min-w-[170px] bg-pitch-900 px-3 py-3 text-[11px] font-extrabold uppercase tracking-widest text-zinc-400 border-r border-white/10 shadow-[3px_0_8px_rgba(0,0,0,0.5)]">
                    Jugador
                  </th>
                  {valid.map((m) => (
                    <th
                      key={m.id}
                      title={`${m.home} vs ${m.away} · ${fmtDay(m.matchDate)}`}
                      className="min-w-[48px] sm:min-w-[58px] px-1 py-2 text-center"
                    >
                      <p className="text-[10px] font-extrabold uppercase leading-tight text-zinc-300">{short(m.home)}</p>
                      <p className="text-[10px] font-extrabold uppercase leading-tight text-zinc-500">{short(m.away)}</p>
                      <p className="mt-0.5 text-[9px] font-semibold capitalize text-zinc-600">{fmtDay(m.matchDate)}</p>
                    </th>
                  ))}
                  <th className="min-w-[70px] px-3 py-3 text-right text-[11px] font-extrabold uppercase tracking-widest text-emerald-300">Aciertos</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const mine = me && row.p.userId === me.id;
                  const pos = posOf(i);
                  const rowBg = mine ? "bg-emerald-400/8" : i % 2 ? "bg-white/[0.015]" : "";
                  return (
                    <tr key={row.p.id} className={`border-b border-white/5 transition hover:bg-white/[0.04] ${rowBg}`}>
                      <td className={`sticky left-0 z-10 px-3 py-2 border-r border-white/10 shadow-[3px_0_8px_rgba(0,0,0,0.5)] ${mine ? "bg-pitch-800" : "bg-pitch-900"}`}>
                        <div className="flex items-center gap-2">
                          <span className={`w-5 shrink-0 text-center font-display text-base ${pos === 1 ? "text-gold-300" : pos === 2 ? "text-zinc-300" : pos === 3 ? "text-amber-600" : "text-zinc-500"}`}>{pos}</span>
                          <div className="min-w-0">
                            <p className={`truncate text-[13px] font-extrabold ${mine ? "text-emerald-200" : "text-zinc-100"}`}>
                              {nick(db, row.p.userId)}
                              {row.p.name && <span className="ml-1 text-[11px] font-normal text-zinc-400">({row.p.name})</span>}
                              {mine && <span className="ml-1 text-[10px] font-bold text-emerald-400">(vos)</span>}
                            </p>
                            {row.isWinner && phase === "liquidada" && <Crown size={12} className="text-gold-400 inline mt-0.5" />}
                          </div>
                        </div>
                      </td>
                      {valid.map((m) => {
                        const it = row.p.items.find((x) => x.matchId === m.id);
                        const done = m.status === "finished" && !!m.result;
                        const invalid = m.status === "suspended" || m.status === "cancelled";
                        const hit = done && it?.selection === m.result;
                        return (
                          <td key={m.id} className="px-1 py-1.5 text-center">
                            {invalid ? (
                              <span className="text-[11px] font-bold text-zinc-700" title="Partido suspendido">—</span>
                            ) : it ? (
                              <span
                                title={`${m.home} vs ${m.away} · Elección: ${it.selection}${done ? (hit ? " · Acertó" : " · Falló") : " · Pendiente"}`}
                                className={`inline-flex h-7 w-7 items-center justify-center rounded-md text-[11px] font-extrabold transition ${
                                  !done ? "border border-white/12 bg-white/6 text-zinc-300"
                                  : hit ? "bg-emerald-500 text-emerald-950 shadow shadow-emerald-500/30"
                                  : "bg-red-500/15 text-red-400"
                                }`}
                              >
                                {it.selection}
                              </span>
                            ) : (
                              <span className="text-zinc-700">·</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 text-right">
                        <span className="font-display text-lg text-white">{row.p.totalHits}</span>
                        <span className="text-xs text-zinc-500">/{valid.length}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 animate-fade-up">
        <Info size={12} /> Verde = acierto · Rojo = fallo · Gris = partido pendiente. Cada usuario puede jugar varios pronósticos por fecha.
      </p>

      {/* Hidden card to capture with html2canvas for Punto 18 */}
      <div
        ref={cardRef}
        style={{ position: "fixed", left: "-9999px", top: "0", width: "420px" }}
        className="rounded-3xl border border-emerald-400/40 bg-gradient-to-br from-pitch-900 via-pitch-950 to-emerald-950 p-7 text-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <span className="font-display text-2xl uppercase tracking-wide text-white">Prode <span className="text-emerald-400">Liga</span></span>
          </div>
          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-emerald-300">
            {round?.name}
          </span>
        </div>

        <div className="my-6 text-center">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-zinc-400">Posición en la tabla</p>
          <p className="my-2 font-display text-7xl font-black text-gold-300 drop-shadow-[0_0_24px_rgba(251,191,36,0.3)]">
            #{myPos}
          </p>
          <p className="font-display text-2xl uppercase text-white">
            {me?.nickname}
          </p>
          {myBestRow?.p.name && (
            <p className="text-xs text-zinc-400 font-semibold italic">"{myBestRow.p.name}"</p>
          )}
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-bold text-emerald-300">
            <span>{myBestRow?.p.totalHits} aciertos</span>
            <span>·</span>
            <span>{valid.length} partidos jugados</span>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-black/40 px-4 py-3 text-xs text-zinc-400">
          <span className="font-medium">Torneo Apertura 2026</span>
          <span className="font-mono font-bold text-emerald-400">prode.ar</span>
        </div>
      </div>
    </div>
  );
}
