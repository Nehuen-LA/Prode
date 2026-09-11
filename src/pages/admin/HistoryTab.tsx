import React from "react";
import { TrendingUp, Wallet, Trophy, Percent, Calendar } from "lucide-react";
import { useStore } from "../../store";
import { fmtMoney, getAdminStats } from "../../utils";
import { Chip, EmptyState } from "../../components/ui";

export default function HistoryTab() {
  const { db } = useStore();
  const stats = getAdminStats(db);

  return (
    <div className="space-y-6">
      {/* Tarjetas de métricas históricas */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card p-4">
          <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">
            <Wallet size={14} className="text-emerald-400" /> Recaudación total
          </p>
          <p className="mt-1 font-display text-2xl text-white sm:text-3xl">
            {fmtMoney(stats.totalRevenue)}
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-500">De fechas finalizadas</p>
        </div>

        <div className="card p-4">
          <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">
            <Trophy size={14} className="text-gold-400" /> Premios repartidos
          </p>
          <p className="mt-1 font-display text-2xl text-gold-300 sm:text-3xl">
            {fmtMoney(stats.totalPrizes)}
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-500">80% entregado a ganadores</p>
        </div>

        <div className="card p-4">
          <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">
            <Percent size={14} className="text-emerald-400" /> Tu comisión (20%)
          </p>
          <p className="mt-1 font-display text-2xl text-emerald-300 sm:text-3xl">
            {fmtMoney(stats.totalCommission)}
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-500">Ganancia neta acumulada</p>
        </div>

        <div className="card p-4">
          <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">
            <Calendar size={14} className="text-sky-400" /> Promedio / fecha
          </p>
          <p className="mt-1 font-display text-2xl text-white sm:text-3xl">
            {fmtMoney(stats.avgRevenuePerRound)}
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-500">{stats.totalRounds} fecha{stats.totalRounds === 1 ? "" : "s"} liquidadas</p>
        </div>
      </div>

      {/* Detalle por fecha */}
      <div className="card overflow-hidden">
        <div className="border-b border-white/8 bg-pitch-900/60 px-5 py-4">
          <h2 className="flex items-center gap-2 font-display text-lg uppercase tracking-wide text-white">
            <TrendingUp size={18} className="text-emerald-400" /> Recaudación por fecha
          </h2>
        </div>

        {stats.roundsDetail.length === 0 ? (
          <div className="p-6">
            <EmptyState
              illustration="table"
              title="No hay fechas registradas"
              desc="A medida que crees y liquides fechas, el desglose contable aparecerá acá."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/8 text-[11px] font-extrabold uppercase tracking-widest text-zinc-400">
                  <th className="px-5 py-3">Fecha</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-center">Pronósticos</th>
                  <th className="px-4 py-3 text-right">Recaudado</th>
                  <th className="px-4 py-3 text-right">Premios (80%)</th>
                  <th className="px-5 py-3 text-right text-emerald-300">Comisión (20%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stats.roundsDetail.map((r) => (
                  <tr key={r.roundId} className="transition hover:bg-white/[0.02]">
                    <td className="px-5 py-3.5 font-bold text-white">
                      {r.roundName}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <Chip tone={r.status === "settled" ? "gold" : r.status === "open" ? "emerald" : r.status === "in_play" ? "sky" : "zinc"}>
                        {r.status === "settled" ? "Finalizada" : r.status === "open" ? "Abierta" : r.status === "in_play" ? "En juego" : r.status}
                      </Chip>
                    </td>
                    <td className="px-4 py-3.5 text-center text-zinc-300 font-semibold">
                      {r.approvedCount}
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold text-zinc-200">
                      {fmtMoney(r.revenue)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold text-gold-300">
                      {fmtMoney(r.prizes)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-display text-base text-emerald-300">
                      {fmtMoney(r.commission)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
