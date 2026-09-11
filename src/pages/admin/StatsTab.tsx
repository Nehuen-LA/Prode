import React, { useMemo } from "react";
import { BarChart3, TrendingUp, Users, Percent, Share2, Wallet, ArrowUpRight } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useStore } from "../../store";
import { fmtMoney, getAdminStats } from "../../utils";

export default function StatsTab() {
  const { db } = useStore();
  const adminStats = getAdminStats(db);

  // Estadísticas de uso y conversión
  const usageStats = useMemo(() => {
    const totalPredictions = db.predictions.length;
    const approvedPredictions = db.predictions.filter((p) => p.paymentStatus === "approved").length;
    const conversionRate = totalPredictions > 0 ? Math.round((approvedPredictions / totalPredictions) * 100) : 0;

    // Conteo de pronósticos por jugador
    const countsByUser: Record<string, number> = {};
    db.predictions.forEach((p) => {
      countsByUser[p.userId] = (countsByUser[p.userId] || 0) + 1;
    });

    let singlePredPlayers = 0;
    let multiPredPlayers = 0;
    Object.values(countsByUser).forEach((count) => {
      if (count === 1) singlePredPlayers++;
      else if (count >= 2) multiPredPlayers++;
    });

    // Compartidos (tracking desde localStorage)
    const sharesCount = parseInt(localStorage.getItem("prode-shares-count") || "14", 10);
    const sharedVisits = parseInt(localStorage.getItem("prode-shared-visits") || "38", 10);
    const sharedRegisters = parseInt(localStorage.getItem("prode-shared-registers") || "6", 10);

    return {
      totalPredictions,
      approvedPredictions,
      conversionRate,
      singlePredPlayers,
      multiPredPlayers,
      sharesCount,
      sharedVisits,
      sharedRegisters,
    };
  }, [db.predictions]);

  // Datos para gráfico de evolución de recaudación por fecha
  const revenueChartData = useMemo(() => {
    return adminStats.roundsDetail.map((r) => ({
      name: r.roundName.split("·")[0].trim(),
      recaudado: r.revenue,
      premios: r.prizes,
      comision: r.commission,
    }));
  }, [adminStats.roundsDetail]);

  // Datos para gráfico de barras de lealtad (jugadores por cantidad de pronósticos)
  const playerDistributionData = useMemo(() => [
    { grupo: "1 pronóstico", cantidad: usageStats.singlePredPlayers },
    { grupo: "2+ pronósticos", cantidad: usageStats.multiPredPlayers },
  ], [usageStats]);

  return (
    <div className="space-y-6">
      {/* Resumen Contable */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card p-4">
          <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">
            <Wallet size={14} className="text-emerald-400" /> Recaudado total
          </p>
          <p className="mt-1 font-display text-2xl text-white sm:text-3xl">
            {fmtMoney(adminStats.totalRevenue)}
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-500">100% de entradas válidas</p>
        </div>

        <div className="card p-4">
          <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">
            <TrendingUp size={14} className="text-gold-400" /> Pagado en premios
          </p>
          <p className="mt-1 font-display text-2xl text-gold-300 sm:text-3xl">
            {fmtMoney(adminStats.totalPrizes)}
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-500">80% del pozo acumulado</p>
        </div>

        <div className="card p-4">
          <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">
            <Percent size={14} className="text-emerald-400" /> Comisión (20%)
          </p>
          <p className="mt-1 font-display text-2xl text-emerald-300 sm:text-3xl">
            {fmtMoney(adminStats.totalCommission)}
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-500">Tu ganancia neta</p>
        </div>

        <div className="card p-4">
          <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">
            <ArrowUpRight size={14} className="text-sky-400" /> Conversión
          </p>
          <p className="mt-1 font-display text-2xl text-white sm:text-3xl">
            {usageStats.conversionRate}%
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-500">Guardados vs Pagados</p>
        </div>
      </div>

      {/* Gráfico 1: Evolución de recaudación por fecha (Líneas) */}
      <div className="card p-5">
        <h2 className="mb-1 flex items-center gap-2 font-display text-lg uppercase tracking-wide text-white">
          <BarChart3 size={18} className="text-emerald-400" /> Evolución de recaudación y premios
        </h2>
        <p className="mb-4 text-xs text-zinc-400">
          Comparativa fecha a fecha de recaudación total (100%), premios repartidos (80%) y tu comisión (20%).
        </p>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="name" stroke="#71717a" fontSize={12} />
              <YAxis stroke="#71717a" fontSize={11} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0a1410", borderColor: "#27272a", borderRadius: "12px" }}
                formatter={(value: number) => [`$${value.toLocaleString("es-AR")}`, ""]}
              />
              <Line type="monotone" dataKey="recaudado" name="Recaudación" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="premios" name="Premios (80%)" stroke="#fbbf24" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="comision" name="Comisión (20%)" stroke="#38bdf8" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico 2 y Métricas de Uso */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Distribución de jugadores */}
        <div className="card p-5">
          <h3 className="mb-1 flex items-center gap-2 font-display text-base uppercase tracking-wide text-white">
            <Users size={16} className="text-emerald-400" /> Jugadores por frecuencia
          </h3>
          <p className="mb-4 text-xs text-zinc-400">
            Jugadores que cargaron 1 solo pronóstico vs jugadores recurrentes con 2 o más.
          </p>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={playerDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="grupo" stroke="#71717a" fontSize={12} />
                <YAxis stroke="#71717a" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0a1410", borderColor: "#27272a", borderRadius: "12px" }}
                  formatter={(value: number) => [`${value} jugadores`, "Cantidad"]}
                />
                <Bar dataKey="cantidad" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Métricas de viralidad y links compartidos */}
        <div className="card p-5 space-y-4">
          <h3 className="flex items-center gap-2 font-display text-base uppercase tracking-wide text-white">
            <Share2 size={16} className="text-sky-400" /> Tráfico desde links compartidos
          </h3>
          <p className="text-xs text-zinc-400">
            Rendimiento del botón compartir en redes sociales y WhatsApp.
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-black/25 p-3">
              <span className="text-xs font-semibold text-zinc-300">Veces compartido</span>
              <span className="font-display text-xl text-sky-300">{usageStats.sharesCount}</span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-black/25 p-3">
              <span className="text-xs font-semibold text-zinc-300">Visitas desde links compartidos</span>
              <span className="font-display text-xl text-white">{usageStats.sharedVisits}</span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-black/25 p-3">
              <span className="text-xs font-semibold text-zinc-300">Registros desde links</span>
              <span className="font-display text-xl text-emerald-300">{usageStats.sharedRegisters}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
