import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Award, Flame, LogIn, Target, Trophy, User } from "lucide-react";
import { useStore } from "../store";
import { fmtMoney, getUserStats } from "../utils";
import { AuthModal } from "../components/modals";
import { btnPrimary, Chip, EmptyState } from "../components/ui";

export default function Profile() {
  const { db, me } = useStore();
  const [authOpen, setAuthOpen] = useState(false);

  if (!me) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center animate-fade-up">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-400">
          <User size={32} />
        </div>
        <h1 className="font-display text-2xl uppercase tracking-wide text-white">Mi perfil</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Iniciá sesión o registrate para ver tus estadísticas y tu historial de fechas jugadas.
        </p>
        <button onClick={() => setAuthOpen(true)} className={`${btnPrimary} mt-6`}>
          <LogIn size={16} /> Entrar o registrarme
        </button>
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      </div>
    );
  }

  const stats = getUserStats(db, me.id);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-32 pt-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-zinc-300 transition hover:bg-white/10"
        >
          <ArrowLeft size={14} /> Volver a jugar
        </Link>
        <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Mi perfil</span>
      </div>

      {/* Tarjeta de usuario */}
      <div className="card relative mb-6 overflow-hidden p-6 animate-fade-up">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-500/10 blur-2xl" />
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10 font-display text-2xl uppercase text-emerald-300">
            {me.nickname.slice(0, 2)}
          </div>
          <div>
            <h1 className="font-display text-2xl uppercase tracking-wide text-white">{me.nickname}</h1>
            <p className="text-xs text-zinc-400">{me.email}</p>
            {me.role === "admin" && (
              <Chip tone="gold" className="mt-1.5">Administrador</Chip>
            )}
          </div>
        </div>
      </div>

      {/* Estadísticas de rendimiento (sin total apostado ni balance) */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 animate-fade-up">
        <div className="card p-4 text-center">
          <p className="flex items-center justify-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">
            <Trophy size={13} className="text-emerald-400" /> Fechas jugadas
          </p>
          <p className="mt-1 font-display text-3xl text-white">{stats.roundsPlayed}</p>
        </div>

        <div className="card p-4 text-center">
          <p className="flex items-center justify-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">
            <Target size={13} className="text-emerald-400" /> Aciertos
          </p>
          <p className="mt-1 font-display text-3xl text-emerald-300">
            {stats.totalHits} <span className="text-sm font-sans font-bold text-zinc-400">({stats.hitRate}%)</span>
          </p>
        </div>

        <div className="card p-4 text-center">
          <p className="flex items-center justify-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">
            <Award size={13} className="text-gold-400" /> Posición prom.
          </p>
          <p className="mt-1 font-display text-3xl text-gold-300">
            {stats.avgPosition > 0 ? `#${stats.avgPosition}` : "—"}
          </p>
        </div>

        <div className="card p-4 text-center">
          <p className="flex items-center justify-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">
            <Flame size={13} className="text-amber-400" /> Racha actual
          </p>
          <p className="mt-1 font-display text-3xl text-amber-300">
            {stats.currentStreak} {stats.currentStreak === 1 ? "fecha" : "fechas"}
          </p>
        </div>
      </div>

      {stats.totalWon > 0 && (
        <div className="card mb-6 flex items-center justify-between border-gold-400/30 bg-gold-400/8 p-5 animate-fade-up">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-gold-300">Total ganado en premios</p>
            <p className="font-display text-3xl text-gold-300">{fmtMoney(stats.totalWon)}</p>
          </div>
          <Trophy size={36} className="text-gold-400 opacity-80" />
        </div>
      )}

      {/* Historial de fechas jugadas */}
      <div className="animate-fade-up">
        <h2 className="mb-3 font-display text-lg uppercase tracking-wide text-white">Historial de fechas</h2>
        {stats.history.length === 0 ? (
          <EmptyState
            illustration="ball"
            title="Todavía no jugaste ninguna fecha"
            desc="Cuando participes con un pronóstico aprobado, tus estadísticas y posiciones aparecerán acá."
            action={
              <Link to="/" className={btnPrimary}>
                Hacer mi primer pronóstico
              </Link>
            }
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
            <div className="divide-y divide-white/5">
              {stats.history.map((h) => (
                <div key={h.roundId} className="flex flex-wrap items-center justify-between gap-3 p-4 transition hover:bg-white/[0.02]">
                  <div>
                    <p className="text-sm font-bold text-white">{h.roundName}</p>
                    <p className="text-xs text-zinc-400">
                      {h.hits} de {h.totalMatches} aciertos · contra {h.totalPlayers} jugadores
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    {h.won > 0 && (
                      <span className="rounded-lg bg-gold-400/10 px-2.5 py-1 text-xs font-bold text-gold-300 border border-gold-400/20">
                        Ganaste {fmtMoney(h.won)}
                      </span>
                    )}
                    <span className="font-display text-xl text-emerald-300">
                      #{h.position}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
