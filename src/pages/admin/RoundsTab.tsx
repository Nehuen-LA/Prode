import React, { useState } from "react";
import { Ban, CalendarPlus, ClipboardList, Plus, RotateCcw, Trash2, Wand2 } from "lucide-react";
import { useStore } from "../../store";
import type { ParsedRow } from "../../utils";
import { effectiveClose, fmtDay, fmtMoney, fmtTime, parseFixture, roundPhase, roundStats } from "../../utils";
import { btnPrimary, Chip, Confirm, EmptyState, Field, inputCls, Modal, PhaseChip, useToast } from "../../components/ui";

const SAMPLE = `Viernes 20 de marzo
19:00 Defensa y Justicia vs Sarmiento
21:15 Lanús - Banfield

Sábado 21 de marzo
14.30 Belgrano vs Instituto
17:00 Godoy Cruz - Barracas Central
19:15 Huracán vs Tigre`;

export default function RoundsTab() {
  const { db, createRound, deleteRound, addMatch, cancelRound, reopenRound } = useStore();
  const toast = useToast();
  const now = Date.now();

  const [name, setName] = useState("");
  const [closeDate, setCloseDate] = useState("");
  const [isTest, setIsTest] = useState(false);
  const [parserFor, setParserFor] = useState<string | null>(null);
  const [addingFor, setAddingFor] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<string | null>(null);

  const rounds = [...db.rounds].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const create = () => {
    if (name.trim().length < 3) return toast.push("err", "Ponele un nombre a la fecha");
    createRound(name, closeDate ? new Date(closeDate).toISOString() : null, isTest);
    toast.push("ok", "Fecha creada", name);
    setName(""); setCloseDate(""); setIsTest(false);
  };

  return (
    <div>
      {/* crear fecha */}
      <div className="card mb-6 p-5">
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg uppercase tracking-wide text-white">
          <CalendarPlus size={17} className="text-emerald-400" /> Nueva fecha
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nombre">
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej.: Fecha 9" />
          </Field>
          <Field label="Cierre manual (opcional)" hint="Si lo dejás vacío, cierra sola 1 hora antes del primer partido.">
            <input className={inputCls} type="datetime-local" value={closeDate} onChange={(e) => setCloseDate(e.target.value)} />
          </Field>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-zinc-300">
            <input type="checkbox" checked={isTest} onChange={(e) => setIsTest(e.target.checked)} className="h-4 w-4 accent-emerald-500" />
            Modo prueba <span className="text-[11px] font-semibold text-zinc-500">(oculta la fecha a los jugadores)</span>
          </label>
          <button onClick={create} className={btnPrimary}>
            <Plus size={16} /> Crear fecha
          </button>
        </div>
      </div>

      {/* lista de fechas */}
      {rounds.length === 0 ? (
        <EmptyState icon={<CalendarPlus size={28} />} title="No hay fechas" desc="Creá tu primera fecha arriba." />
      ) : (
        <div className="stagger space-y-3">
          {rounds.map((r) => {
            const phase = roundPhase(r, db.matches, now);
            const stats = roundStats(db, r.id);
            const close = effectiveClose(r, db.matches);
            const matchCount = db.matches.filter((m) => m.roundId === r.id).length;
            const hasApproved = stats.approvedCount > 0;
            return (
              <div key={r.id} className="card p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-display text-lg uppercase tracking-wide text-white">{r.name}</p>
                  <PhaseChip phase={phase} />
                  {r.isTest && <Chip tone="sky">Prueba</Chip>}
                  <span className="ml-auto text-xs font-semibold text-zinc-500">
                    {matchCount} partidos · {stats.approvedCount} pagos · pozo {fmtMoney(stats.pozo)}
                  </span>
                </div>
                <p className="mt-1 text-[11px] font-semibold text-zinc-500">
                  {close ? `Cierre: ${fmtDay(close.toISOString())} ${fmtTime(close.toISOString())}${r.closeDate ? " (manual)" : " (automático)"}` : "Sin cierre definido: cargá partidos o un cierre manual"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => setAddingFor(addingFor === r.id ? null : r.id)}
                    className="flex items-center gap-1.5 rounded-lg border border-white/12 bg-white/5 px-3 py-2 text-xs font-bold text-zinc-300 transition hover:bg-white/10 active:scale-95">
                    <Plus size={13} /> Agregar partido
                  </button>
                  <button onClick={() => setParserFor(r.id)}
                    className="flex items-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-300 transition hover:bg-emerald-400/20 active:scale-95">
                    <ClipboardList size={13} /> Pegar fixture
                  </button>
                  {r.status !== "cancelled" && phase !== "liquidada" && (
                    <button onClick={() => { cancelRound(r.id); toast.push("info", "Fecha cancelada", "Podés reabrirla cuando quieras."); }}
                      className="flex items-center gap-1.5 rounded-lg border border-red-400/25 bg-red-400/8 px-3 py-2 text-xs font-bold text-red-300 transition hover:bg-red-400/15 active:scale-95">
                      <Ban size={13} /> Cancelar
                    </button>
                  )}
                  {r.status === "cancelled" && (
                    <button onClick={() => { reopenRound(r.id); toast.push("ok", "Fecha reabierta"); }}
                      className="flex items-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-300 transition hover:bg-emerald-400/20 active:scale-95">
                      <RotateCcw size={13} /> Reabrir
                    </button>
                  )}
                  <button onClick={() => setToDelete(r.id)} disabled={hasApproved}
                    className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-bold text-zinc-500 transition hover:text-red-300 active:scale-95 disabled:opacity-35"
                    title={hasApproved ? "No se puede borrar: tiene pagos aprobados" : "Borrar fecha"}>
                    <Trash2 size={13} /> Borrar
                  </button>
                </div>
                {addingFor === r.id && <AddMatchForm roundId={r.id} onAdd={(h, a, d) => { addMatch(r.id, h, a, d); toast.push("ok", "Partido agregado", `${h} vs ${a}`); }} />}
              </div>
            );
          })}
        </div>
      )}

      <ParserModal roundId={parserFor} roundName={db.rounds.find((r) => r.id === parserFor)?.name ?? ""} onClose={() => setParserFor(null)} />
      <Confirm open={!!toDelete} onClose={() => setToDelete(null)}
        onYes={() => { if (toDelete) { deleteRound(toDelete); toast.push("info", "Fecha borrada"); } }}
        title="Borrar fecha" desc="Se borran la fecha, sus partidos, pronósticos y premios. Esta acción no se puede deshacer." yesLabel="Borrar" danger />
    </div>
  );
}

function AddMatchForm({ roundId, onAdd }: { roundId: string; onAdd: (home: string, away: string, dateISO: string) => void }) {
  const [home, setHome] = useState("");
  const [away, setAway] = useState("");
  const [when, setWhen] = useState(() => {
    const d = new Date(Date.now() + 2 * 86400_000);
    d.setHours(19, 0, 0, 0);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T19:00`;
  });
  return (
    <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3.5 animate-fade">
      <div className="grid gap-2.5 sm:grid-cols-[1fr_1fr_220px_auto]">
        <input className={inputCls} placeholder="Equipo local" value={home} onChange={(e) => setHome(e.target.value)} />
        <input className={inputCls} placeholder="Equipo visitante" value={away} onChange={(e) => setAway(e.target.value)} />
        <input className={inputCls} type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
        <button
          onClick={() => { if (home.trim() && away.trim() && when) { onAdd(home, away, new Date(when).toISOString()); setHome(""); setAway(""); } }}
          className="rounded-xl bg-emerald-500 px-4 py-3 text-xs font-extrabold uppercase text-emerald-950 transition hover:bg-emerald-400 active:scale-95">
          Agregar
        </button>
      </div>
    </div>
  );
}

function ParserModal({ roundId, roundName, onClose }: { roundId: string | null; roundName: string; onClose: () => void }) {
  const { addMatches } = useStore();
  const toast = useToast();
  const [text, setText] = useState("");
  const [rows, setRows] = useState<ParsedRow[] | null>(null);
  const [ignored, setIgnored] = useState(0);
  const [ignoredLines, setIgnoredLines] = useState<string[]>([]);
  const [ignoredPercentage, setIgnoredPercentage] = useState(0);

  const process = () => {
    const res = parseFixture(text);
    setRows(res.rows);
    setIgnored(res.ignored);
    setIgnoredLines(res.ignoredLines);
    setIgnoredPercentage(res.ignoredPercentage);
  };

  const validRows = (rows ?? []).filter((r) => !r.error && r.dateISO);

  const importRows = () => {
    if (!roundId) return;
    addMatches(roundId, validRows.map((r) => ({ home: r.home, away: r.away, dateISO: r.dateISO! })));
    toast.push("ok", `${validRows.length} partidos importados`, roundName);
    setText(""); setRows(null); setIgnoredLines([]);
    onClose();
  };

  return (
    <Modal open={!!roundId} onClose={() => { setText(""); setRows(null); setIgnoredLines([]); onClose(); }} title={`Pegar fixture · ${roundName}`} wide>
      {!rows ? (
        <div className="space-y-3">
          <p className="text-xs text-zinc-400">
            Copiá el fixture desde Promiedos (o cualquier página similar) y pegalo acá. El parser detecta líneas de fecha
            (<b className="text-zinc-200">14/3</b>, <b className="text-zinc-200">Viernes 14 de marzo</b>) y partidos con horario
            (<b className="text-zinc-200">19:00</b>, <b className="text-zinc-200">19.00</b>, <b className="text-zinc-200">19 hs</b>) separados por <b className="text-zinc-200">vs</b> o <b className="text-zinc-200">-</b>.
          </p>
          <textarea
            value={text} onChange={(e) => setText(e.target.value)} rows={8}
            className={`${inputCls} resize-y font-mono text-xs leading-relaxed`}
            placeholder={SAMPLE}
          />
          <div className="flex gap-2">
            <button onClick={() => setText(SAMPLE)} className="flex items-center gap-1.5 rounded-xl border border-white/12 bg-white/5 px-4 py-3 text-xs font-bold text-zinc-300 transition hover:bg-white/10 active:scale-95">
              <Wand2 size={14} /> Cargar ejemplo
            </button>
            <button onClick={process} disabled={!text.trim()} className={`${btnPrimary} flex-1`}>
              <ClipboardList size={16} /> Procesar texto
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-zinc-400">
            Se detectaron <b className="text-emerald-300">{rows.length} partidos</b>{ignored > 0 && <> · {ignored} líneas ignoradas (encabezados, avisos, etc.)</>}. Revisá y confirmá:
          </p>

          {ignoredPercentage > 0.3 && (
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-xs font-semibold text-amber-200">
              ⚠️ Atención: Se ignoró el {Math.round(ignoredPercentage * 100)}% de las líneas pegadas. Verificá que los nombres de los partidos y horarios estén en el formato correcto.
            </div>
          )}

          {ignoredLines.length > 0 && (
            <details className="rounded-xl border border-white/8 bg-black/20 p-3 text-xs">
              <summary className="cursor-pointer font-bold text-zinc-400 hover:text-zinc-200">
                Ver {ignoredLines.length} línea{ignoredLines.length > 1 ? "s" : ""} ignorada{ignoredLines.length > 1 ? "s" : ""}
              </summary>
              <ul className="mt-2 max-h-28 space-y-1 overflow-y-auto font-mono text-[11px] text-zinc-500">
                {ignoredLines.map((l, idx) => (
                  <li key={idx} className="truncate">• {l}</li>
                ))}
              </ul>
            </details>
          )}

          <div className="max-h-[45dvh] space-y-2 overflow-y-auto pr-1">
            {rows.map((r, i) => (
              <div key={i} className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 ${r.error ? "border-red-400/25 bg-red-400/6" : "border-white/10 bg-white/[0.03]"}`}>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-white">{r.home} <span className="text-zinc-600">vs</span> {r.away}</p>
                  {r.dateISO ? (
                    <p className="text-[11px] font-semibold capitalize text-emerald-300">{fmtDay(r.dateISO)} · {fmtTime(r.dateISO)}</p>
                  ) : (
                    <p className="text-[11px] font-semibold text-red-300">{r.error}</p>
                  )}
                </div>
                <button onClick={() => setRows(rows.filter((_, j) => j !== i))} className="rounded-lg border border-white/10 bg-white/5 p-2 text-zinc-500 transition hover:text-red-300 active:scale-95">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setRows(null)} className="rounded-xl border border-white/12 bg-white/5 px-4 py-3 text-sm font-bold text-zinc-300 transition hover:bg-white/10 active:scale-95">
              Volver
            </button>
            <button onClick={importRows} disabled={validRows.length === 0} className={`${btnPrimary} flex-1`}>
              Importar {validRows.length} partidos
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
