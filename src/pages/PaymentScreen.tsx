import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Copy, FileText, Send, UploadCloud, Wallet, Edit3, Tag } from "lucide-react";
import { useStore } from "../store";
import { fileToDataUrl, fmtMoney, sortedRoundMatches } from "../utils";
import { btnPrimary, Field, inputCls, useToast } from "../components/ui";

export default function PaymentScreen() {
  const { predictionId } = useParams<{ predictionId: string }>();
  const navigate = useNavigate();
  const { db, setReceipt, notifyTransfer, updatePredictionName } = useStore();
  const toast = useToast();

  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [name, setName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const pred = db.predictions.find((p) => p.id === predictionId) ?? null;
  const round = pred ? db.rounds.find((r) => r.id === pred.roundId) : null;
  const s = db.settings;
  const matches = pred ? sortedRoundMatches(db.matches, pred.roundId) : [];

  useEffect(() => {
    if (pred) {
      setName(pred.name ?? "");
      setSent(pred.transferNotified && pred.paymentStatus !== "rejected");
    }
  }, [pred?.id]);

  if (!pred || !round) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-sm text-zinc-400">No encontramos este pronóstico.</p>
        <Link to="/" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-emerald-400">
          <ArrowLeft size={16} /> Volver a la cancha
        </Link>
      </div>
    );
  }

  const upload = async (file: File) => {
    setBusy(true);
    try {
      const url = await fileToDataUrl(file);
      setReceipt(pred.id, url, file.name);
      toast.push("ok", "Comprobante cargado", "Ahora tocá “Ya transferí” para avisar al administrador.");
    } catch (e) {
      toast.push("err", "No se pudo subir el comprobante", (e as Error).message);
    }
    setBusy(false);
  };

  const copyAlias = async () => {
    try {
      await navigator.clipboard.writeText(s.adminAlias);
      toast.push("ok", "Alias copiado", s.adminAlias);
    } catch {
      toast.push("info", "Copialo manualmente", s.adminAlias);
    }
  };

  const notify = () => {
    if (name.trim() !== (pred.name ?? "")) {
      updatePredictionName(pred.id, name.trim() || null);
    }
    notifyTransfer(pred.id);
    setSent(true);
  };

  const handleBackToEdit = () => {
    // Guardar selección para editar en Home
    sessionStorage.setItem(
      "edit-prediction",
      JSON.stringify({
        predictionId: pred.id,
        roundId: pred.roundId,
        items: pred.items,
        name: pred.name,
      })
    );
    navigate("/");
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-32 pt-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <button
          onClick={handleBackToEdit}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-zinc-300 transition hover:bg-white/10"
        >
          <Edit3 size={14} /> Volver a editar
        </button>
        <span className="text-xs font-bold text-zinc-400">{round.name}</span>
      </div>

      {sent ? (
        <div className="card py-10 px-6 text-center animate-pop">
          <CheckCircle2 size={56} className="mx-auto text-emerald-400" />
          <h1 className="mt-4 font-display text-2xl uppercase tracking-wide text-white">¡Aviso de pago enviado!</h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-zinc-400">
            En breve el administrador verificará tu comprobante y vas a estar participando en la tabla.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/" className={btnPrimary}>Volver a la cancha</Link>
            <Link to="/tabla" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/5 px-5 py-3.5 text-sm font-bold text-zinc-200 transition hover:bg-white/10">
              Ver tabla en vivo
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-5 animate-fade-up">
          <div className="card p-5">
            <h1 className="font-display text-2xl uppercase tracking-wide text-white">Completá tu jugada</h1>
            <p className="mt-1 text-xs text-zinc-400">
              Transferí <b className="text-emerald-300 font-bold">{fmtMoney(db.settings.entryFee)}</b> para confirmar tu pronóstico en <b className="text-white">{round.name}</b>.
            </p>

            {/* Resumen visual de pronóstico con chips */}
            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="mb-2.5 text-[11px] font-extrabold uppercase tracking-widest text-zinc-400">
                Resumen de tu jugada ({pred.items.length} partidos)
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {matches.map((m) => {
                  const it = pred.items.find((x) => x.matchId === m.id);
                  return (
                    <div key={m.id} className="flex items-center justify-between rounded-lg bg-black/25 px-3 py-2 text-xs">
                      <span className="truncate pr-2 font-medium text-zinc-300">
                        {m.home} <span className="text-zinc-500">vs</span> {m.away}
                      </span>
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-emerald-500/20 font-display text-xs font-bold text-emerald-300 border border-emerald-500/30">
                        {it?.selection ?? "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Nombre opcional del pronóstico (Punto 17) */}
            <div className="mt-4">
              <Field label="Nombre del pronóstico (opcional)" hint="Ej.: El racional, La cábala de Bruno. Se verá en la tabla.">
                <div className="relative">
                  <input
                    className={`${inputCls} pl-10`}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Elegí un apodo para este pronóstico"
                    maxLength={30}
                  />
                  <Tag size={16} className="absolute left-3 top-3.5 text-zinc-500" />
                </div>
              </Field>
            </div>
          </div>

          {/* Datos de transferencia */}
          <div className="card space-y-3 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Titular de la cuenta</p>
                <p className="text-base font-bold text-white">{s.adminFullName}</p>
              </div>
              <Wallet size={24} className="text-emerald-400" />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl bg-black/30 p-3.5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Alias CBU/CVU</p>
                <p className="font-display text-xl tracking-wide text-emerald-300">{s.adminAlias}</p>
              </div>
              <button
                onClick={copyAlias}
                aria-label="Copiar alias"
                className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-2 text-xs font-extrabold uppercase text-emerald-950 transition hover:bg-emerald-400 active:scale-95"
              >
                <Copy size={14} /> Copiar
              </button>
            </div>

            {s.adminCbu && (
              <p className="text-xs text-zinc-400">
                CBU: <span className="font-mono text-zinc-200">{s.adminCbu}</span>
              </p>
            )}
          </div>

          {pred.paymentStatus === "rejected" && (
            <div className="rounded-xl border border-red-400/25 bg-red-400/10 p-3.5 text-xs font-semibold text-red-300">
              Tu comprobante anterior fue rechazado por el administrador. Subí uno nuevo para volver a avisar.
            </div>
          )}

          {/* Subida de comprobante */}
          <div className="card p-5">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-zinc-400">
              Comprobante de la transferencia
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) upload(file);
                e.target.value = "";
              }}
            />

            {pred.receipt ? (
              <div className="flex items-center gap-3 rounded-xl border border-emerald-400/25 bg-emerald-400/8 p-3.5">
                {pred.receipt.startsWith("data:image") ? (
                  <img src={pred.receipt} alt="Comprobante" className="h-16 w-16 rounded-lg object-cover" />
                ) : (
                  <FileText size={36} className="text-emerald-300" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-emerald-200">{pred.receiptName}</p>
                  <p className="text-xs text-zinc-400">Comprobante cargado correctamente ✓</p>
                </div>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="rounded-lg border border-white/12 bg-white/5 px-3 py-2 text-xs font-bold text-zinc-300 transition hover:bg-white/10 active:scale-95"
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                disabled={busy}
                className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-white/15 bg-white/[0.03] p-8 text-center transition hover:border-emerald-400/40 hover:bg-emerald-400/5 active:scale-[0.99]"
              >
                <UploadCloud size={32} className={busy ? "animate-pulse text-emerald-400" : "text-zinc-500"} />
                <span className="text-sm font-bold text-zinc-200">
                  {busy ? "Subiendo y optimizando comprobante…" : "Subir comprobante de pago"}
                </span>
                <span className="text-xs text-zinc-500">JPG, PNG, WEBP o PDF · hasta 5 MB</span>
              </button>
            )}

            <button
              onClick={notify}
              disabled={!pred.receipt || busy}
              className={`${btnPrimary} mt-5 w-full`}
            >
              <Send size={16} /> Ya transferí
            </button>
            {!pred.receipt && (
              <p className="mt-2 text-center text-xs text-zinc-500">
                Subí tu comprobante para habilitar el botón de aviso.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
