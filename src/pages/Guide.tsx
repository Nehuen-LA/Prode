import React from "react";
import { ArrowRight, Award, CheckCircle2, DollarSign, HelpCircle, ShieldCheck, Trophy, Users, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { fmtMoney } from "../utils";
import { useStore } from "../store";

export default function Guide() {
  const { db } = useStore();

  const STEPS = [
    {
      num: "1",
      title: "Pronosticá los partidos",
      desc: "Elegí la fecha abierta y marcá tu pronóstico para cada encuentro: Local (L), Empate (E) o Visitante (V). Tenés tiempo hasta 1 hora antes del primer partido.",
      icon: <Zap size={22} className="text-emerald-400" />,
    },
    {
      num: "2",
      title: "Pagá tu entrada",
      desc: `Transferí ${fmtMoney(db.settings.entryFee)} al alias oficial, subí la captura del comprobante y tocá "Ya transferí". El administrador verificará tu pago rápidamente.`,
      icon: <DollarSign size={22} className="text-emerald-400" />,
    },
    {
      num: "3",
      title: "Seguí la tabla en vivo",
      desc: "Apenas comiencen los partidos, mirá cómo sumás aciertos en tiempo real. El jugador con más aciertos al finalizar la fecha se lleva el pozo.",
      icon: <Trophy size={22} className="text-gold-400" />,
    },
  ];

  const RULES = [
    {
      title: "Puntuación simple y transparente",
      desc: "Sumás 1 punto por cada resultado acertado (Local, Empate o Visitante). No importan los goles ni resultados exactos, solo el signo final.",
    },
    {
      title: "Partidos postergados o suspendidos",
      desc: "Si un partido se suspende o anula, queda fuera del cómputo. No suma ni resta puntos para nadie.",
    },
    {
      title: "El Pozo y Premios (Regla 80/20)",
      desc: "El 80% de todo lo recaudado en la fecha se acumula en el pozo para el ganador. El 20% restante cubre la organización y mantenimiento de la plataforma.",
    },
    {
      title: "Desempate en caso de empate",
      desc: "Si dos o más jugadores empatan con el mayor número de aciertos, el pozo se divide en partes iguales entre todos los ganadores.",
    },
  ];

  const FAQS = [
    {
      q: "¿Puedo cargar más de un pronóstico por fecha?",
      a: "Sí, podés enviar más de una jugada con diferentes combinaciones. Cada jugada abona su propia entrada y compite de forma independiente en la tabla.",
    },
    {
      q: "¿Puedo modificar mi pronóstico después de guardarlo?",
      a: "Podés editar o eliminar pronósticos que estén en estado borrador o rechazados, siempre que la fecha permanezca abierta. Una vez aprobado el pago, la jugada queda sellada.",
    },
    {
      q: "¿Cómo cobro si gano?",
      a: "Apenas termine el último partido y se liquide la fecha, si resultás ganador verás un banner dorado para cargar tu CBU, CVU o Alias y recibir la transferencia.",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-32 pt-6">
      <div className="mb-6 animate-fade-up">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300/80">Guía del jugador</p>
        <h1 className="font-display text-3xl uppercase leading-none text-white sm:text-4xl">Cómo jugar al Prode</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Todo lo que necesitás saber para armar tu pronóstico, competir y ganar el pozo de la fecha.
        </p>
      </div>

      {/* 3 Pasos */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3 animate-fade-up">
        {STEPS.map((s) => (
          <div key={s.num} className="card relative flex flex-col p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 font-display text-lg text-emerald-300 border border-white/10">
                {s.num}
              </span>
              {s.icon}
            </div>
            <h2 className="text-base font-extrabold text-white">{s.title}</h2>
            <p className="mt-1.5 flex-1 text-xs leading-relaxed text-zinc-400">{s.desc}</p>
          </div>
        ))}
      </div>

      {/* Reglas de Juego */}
      <div className="card mb-8 p-6 animate-fade-up">
        <h2 className="mb-4 flex items-center gap-2 font-display text-xl uppercase tracking-wide text-white">
          <ShieldCheck size={20} className="text-emerald-400" /> Reglas del torneo
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {RULES.map((r, i) => (
            <div key={i} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <h3 className="text-sm font-bold text-emerald-200">{r.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-zinc-400">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Preguntas frecuentes */}
      <div className="card mb-8 p-6 animate-fade-up">
        <h2 className="mb-4 flex items-center gap-2 font-display text-xl uppercase tracking-wide text-white">
          <HelpCircle size={20} className="text-sky-400" /> Preguntas frecuentes
        </h2>
        <div className="space-y-3">
          {FAQS.map((faq, idx) => (
            <div key={idx} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <h3 className="text-sm font-bold text-white">{faq.q}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Banner Call to Action */}
      <div className="card flex flex-wrap items-center justify-between gap-4 border-emerald-400/30 bg-emerald-400/8 p-6 animate-fade-up">
        <div>
          <h2 className="font-display text-xl uppercase tracking-wide text-white">¿Listo para demostrar cuánto sabés?</h2>
          <p className="mt-1 text-xs text-zinc-300">Sumate a la fecha actual y competí por el pozo.</p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-xs font-extrabold uppercase tracking-wide text-emerald-950 transition hover:bg-emerald-400 active:scale-95"
        >
          Ir a jugar <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}
