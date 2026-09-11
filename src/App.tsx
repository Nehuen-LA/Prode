import React from "react";
import { HashRouter, NavLink, Route, Routes } from "react-router-dom";
import { BookOpen, LogOut, ShieldCheck, Table2, PlayCircle, User } from "lucide-react";
import { StoreProvider, useStore } from "./store";
import { Chip, ToastProvider } from "./components/ui";
import Home from "./pages/Home";
import Ranking from "./pages/Ranking";
import Guide from "./pages/Guide";
import AdminPage from "./pages/admin/AdminPage";
import PaymentScreen from "./pages/PaymentScreen";
import Profile from "./pages/Profile";

function Ball({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 7.2l4.4 3.2-1.7 5.1H9.3L7.6 10.4 12 7.2z" fill="currentColor" />
      <path d="M12 2.2v5M16.4 10.4l4.8-1.6M14.7 15.5l2.9 4.3M9.3 15.5l-2.9 4.3M7.6 10.4L2.8 8.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function Shell() {
  const { me, isAdmin, logout } = useStore();

  const desktopLink = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-3.5 py-2 text-[13px] font-extrabold uppercase tracking-wide transition ${
      isActive ? "bg-emerald-400/12 text-emerald-300" : "text-zinc-400 hover:bg-white/6 hover:text-zinc-100"}`;

  return (
    <div className="min-h-dvh">
      {/* Skip to content link for accessibility */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-emerald-500 focus:px-4 focus:py-2 focus:font-extrabold focus:text-pitch-950 focus:shadow-xl focus:outline-none"
      >
        Saltar al contenido principal
      </a>

      {/* header */}
      <header className="sticky top-0 z-50 border-b border-white/8 bg-pitch-950/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center gap-3 px-4">
          <NavLink to="/" className="flex items-center gap-2.5" aria-label="Ir al inicio de Prode Liga">
            <span className="text-emerald-400"><Ball /></span>
            <span className="font-display text-[22px] uppercase leading-none tracking-wide">
              <span className="text-white">Prode</span>{" "}
              <span className="text-emerald-400">Liga</span>
            </span>
            <span className="hidden rounded-full border border-gold-400/30 bg-gold-400/10 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-gold-300 sm:inline">
              Apertura 26
            </span>
          </NavLink>

          <nav className="ml-6 hidden items-center gap-1 md:flex" aria-label="Navegación principal">
            <NavLink to="/" end className={desktopLink}>Jugar</NavLink>
            <NavLink to="/tabla" className={desktopLink}>Tabla</NavLink>
            {me && <NavLink to="/perfil" className={desktopLink}>Mi Perfil</NavLink>}
            {isAdmin && <NavLink to="/admin" className={desktopLink}>Admin</NavLink>}
            <NavLink to="/guia" className={desktopLink}>Guía</NavLink>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {me ? (
              <>
                <NavLink
                  to="/perfil"
                  title="Ver mi perfil"
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 transition hover:border-emerald-400/40 hover:bg-white/[0.08]"
                >
                  <User size={15} className="text-emerald-400" />
                  <span className="text-[13px] font-extrabold text-white">{me.nickname}</span>
                  {isAdmin && <Chip tone="gold"><ShieldCheck size={11} /> Admin</Chip>}
                </NavLink>
                <button onClick={logout} title="Cerrar sesión" aria-label="Cerrar sesión"
                  className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-zinc-400 transition hover:border-red-400/30 hover:text-red-300 active:scale-95">
                  <LogOut size={14} /> <span className="hidden sm:inline">Salir</span>
                </button>
              </>
            ) : (
              <span className="rounded-xl border border-dashed border-white/12 px-3 py-1.5 text-[11px] font-bold text-zinc-500">
                Modo demo · datos de ejemplo
              </span>
            )}
          </div>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="focus:outline-none">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/pago/:predictionId" element={<PaymentScreen />} />
          <Route path="/perfil" element={<Profile />} />
          <Route path="/tabla" element={<Ranking />} />
          <Route path="/guia" element={<Guide />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>

      {/* bottom nav mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-pitch-950/92 backdrop-blur-xl md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }} aria-label="Navegación móvil">
        <div className={`mx-auto grid max-w-md ${isAdmin ? "grid-cols-5" : me ? "grid-cols-4" : "grid-cols-3"}`}>
          {[
            { to: "/", label: "Jugar", icon: <PlayCircle size={20} />, end: true },
            { to: "/tabla", label: "Tabla", icon: <Table2 size={20} /> },
            ...(me ? [{ to: "/perfil", label: "Perfil", icon: <User size={20} /> }] : []),
            ...(isAdmin ? [{ to: "/admin", label: "Admin", icon: <ShieldCheck size={20} /> }] : []),
            ...(!isAdmin && !me ? [{ to: "/guia", label: "Guía", icon: <BookOpen size={20} /> }] : []),
          ].map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end as boolean | undefined}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-extrabold uppercase tracking-wide transition ${
                  isActive ? "text-emerald-300" : "text-zinc-400 hover:text-zinc-200"}`}>
              <span className="relative">
                {item.icon}
                {item.to === "/admin" && isAdmin && (
                  <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-amber-400" />
                )}
              </span>
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <ToastProvider>
        <HashRouter>
          <Shell />
        </HashRouter>
      </ToastProvider>
    </StoreProvider>
  );
}
