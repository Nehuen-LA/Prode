import React, { useState } from "react";
import { BarChart3, CalendarDays, ClipboardCheck, FlaskConical, Lock, Settings2, Table2, TrendingUp, Trophy } from "lucide-react";
import { useStore } from "../../store";
import PaymentsTab from "./PaymentsTab";
import RoundsTab from "./RoundsTab";
import ResultsTab from "./ResultsTab";
import HistoryTab from "./HistoryTab";
import StatsTab from "./StatsTab";
import { PrizesTab, SettingsTab, TestTab } from "./OpsTab";

type TabId = "pagos" | "fechas" | "resultados" | "premios" | "historial" | "estadisticas" | "ajustes" | "pruebas";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "pagos", label: "Pagos", icon: <ClipboardCheck size={15} /> },
  { id: "fechas", label: "Fechas", icon: <CalendarDays size={15} /> },
  { id: "resultados", label: "Resultados", icon: <Table2 size={15} /> },
  { id: "premios", label: "Premios", icon: <Trophy size={15} /> },
  { id: "historial", label: "Historial", icon: <TrendingUp size={15} /> },
  { id: "estadisticas", label: "Estadísticas", icon: <BarChart3 size={15} /> },
  { id: "ajustes", label: "Ajustes", icon: <Settings2 size={15} /> },
  { id: "pruebas", label: "Pruebas", icon: <FlaskConical size={15} /> },
];

export default function AdminPage() {
  const { db, isAdmin } = useStore();
  const [tab, setTab] = useState<TabId>("pagos");

  if (!isAdmin) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center px-4 pb-32 pt-24 text-center animate-fade-up">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/25 bg-red-500/10 text-red-400">
          <Lock size={32} />
        </div>
        <h1 className="font-display text-2xl uppercase tracking-wide text-white">Acceso denegado</h1>
        <p className="mt-2 text-sm text-zinc-400">
          No tenés permisos para acceder a esta sección.
        </p>
      </div>
    );
  }

  const pending = db.predictions.filter((p) => p.paymentStatus === "pending_review").length;
  const unclaimed = db.prizes.filter((z) => z.status !== "paid").length;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-32 pt-5">
      <div className="mb-4 animate-fade-up">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300/80">Panel de administración</p>
        <h1 className="font-display text-3xl uppercase leading-none text-white sm:text-4xl">Control del prode</h1>
      </div>

      <div className="no-scrollbar sticky top-[64px] z-30 -mx-4 mb-5 flex gap-2 overflow-x-auto border-b border-white/6 bg-pitch-950/85 px-4 py-2.5 backdrop-blur-xl animate-fade-up">
        {TABS.map((t) => {
          const active = tab === t.id;
          const badge = t.id === "pagos" ? pending : t.id === "premios" ? unclaimed : 0;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-[13px] font-extrabold uppercase tracking-wide transition active:scale-[0.97] ${
                active ? "border-emerald-400/50 bg-emerald-400/12 text-emerald-200" : "border-white/10 bg-white/[0.04] text-zinc-400 hover:bg-white/8 hover:text-zinc-200"
              }`}>
              {t.icon} {t.label}
              {badge > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${t.id === "pagos" ? "bg-amber-400 text-amber-950" : "bg-gold-400 text-amber-950"}`}>{badge}</span>
              )}
            </button>
          );
        })}
      </div>

      <div key={tab} className="animate-fade-up">
        {tab === "pagos" && <PaymentsTab />}
        {tab === "fechas" && <RoundsTab />}
        {tab === "resultados" && <ResultsTab />}
        {tab === "premios" && <PrizesTab />}
        {tab === "historial" && <HistoryTab />}
        {tab === "estadisticas" && <StatsTab />}
        {tab === "ajustes" && <SettingsTab />}
        {tab === "pruebas" && <TestTab />}
      </div>
    </div>
  );
}
