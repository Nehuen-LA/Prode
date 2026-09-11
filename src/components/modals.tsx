import React, { useEffect, useRef, useState } from "react";
import { CheckCircle2, Copy, FileText, LogIn, Send, Trophy, UploadCloud, UserPlus, Wallet } from "lucide-react";
import { useStore } from "../store";
import type { Prize } from "../types";
import { fileToDataUrl, fmtDay, fmtMoney, fmtTime, short, sortedRoundMatches, winnersInfo } from "../utils";
import { btnGold, btnPrimary, Chip, Field, inputCls, Modal, PAYMENT_LABEL, PAYMENT_TONE, useToast } from "./ui";

/* ─────────────── Login / Registro ─────────────── */

export function AuthModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess?: () => void }) {
  const { login, register } = useStore();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [err, setErr] = useState<string | null>(null);
  const [identifier, setIdentifier] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => { if (open) setErr(null); }, [open, mode]);

  const submit = () => {
    if (mode === "login") {
      if (!identifier.trim() || !password) return setErr("Completá tu apodo o email y contraseña.");
      const e = login(identifier, password);
      if (e) return setErr(e);
    } else {
      if (!nickname.trim()) return setErr("Elegí un apodo para la tabla.");
      if (nickname.trim().length < 2) return setErr("El apodo debe tener al menos 2 caracteres.");
      if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setErr("Ingresá un email válido.");
      if (password.length < 6) return setErr("La contraseña debe tener al menos 6 caracteres.");
      const e = register({ nickname: nickname.trim(), email: email.trim(), password });
      if (e) return setErr(e);
    }
    onSuccess?.();
    onClose();
  };

  const quick = (idOrEmail: string, pass: string) => {
    const e = login(idOrEmail, pass);
    if (e) return setErr(e);
    onSuccess?.();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={mode === "login" ? "Iniciar sesión" : "Crear cuenta"}>
      <div className="mb-4 grid grid-cols-2 rounded-xl border border-white/10 bg-white/[0.04] p-1">
        {(["login", "register"] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-extrabold uppercase tracking-wide transition ${
              mode === m ? "bg-emerald-500 text-emerald-950" : "text-zinc-400 hover:text-zinc-200"}`}>
            {m === "login" ? <LogIn size={14} /> : <UserPlus size={14} />} {m === "login" ? "Entrar" : "Registrarme"}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {mode === "login" ? (
          <Field label="Apodo o Email">
            <input className={inputCls} value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="Tu apodo o email" autoFocus />
          </Field>
        ) : (
          <>
            <Field label="Apodo" hint="Tu nombre visible en la tabla de clasificación.">
              <input className={inputCls} value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Ej.: ElCaudillo" autoFocus />
            </Field>
            <div>
              <Field label="Email">
                <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" />
              </Field>
              <p className="mt-1.5 rounded-lg border border-white/8 bg-white/[0.03] p-2 text-[11px] leading-relaxed text-zinc-400">
                El correo sirve para recuperar tu cuenta si olvidás la contraseña. Usá un correo al que tengas acceso: si ponés uno que no es tuyo, no vas a poder recuperar la cuenta.
              </p>
            </div>
          </>
        )}

        <Field label="Contraseña">
          <input className={inputCls} type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="••••••••" />
        </Field>

        {err && <p className="rounded-lg border border-red-400/25 bg-red-400/10 px-3 py-2 text-xs font-semibold text-red-300">{err}</p>}

        <button onClick={submit} className={`${btnPrimary} w-full`}>
          {mode === "login" ? "Entrar a jugar" : "Crear cuenta y jugar"}
        </button>

        <div className="rounded-xl border border-dashed border-white/12 bg-white/[0.02] p-3">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-zinc-500">Cuentas de demostración</p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => quick("admin@prode.ar", "admin123")} className="rounded-lg border border-white/12 bg-white/5 px-3 py-2.5 text-xs font-bold text-zinc-300 transition hover:bg-white/10 active:scale-95">
              Entrar como Admin
            </button>
            <button onClick={() => quick("LaBruja", "demo1234")} className="rounded-lg border border-white/12 bg-white/5 px-3 py-2.5 text-xs font-bold text-zinc-300 transition hover:bg-white/10 active:scale-95">
              Entrar como LaBruja
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ─────────────── Pantalla de pago ─────────────── */

export function PaymentModal({ predictionId, onClose }: { predictionId: string | null; onClose: () => void }) {
  const { db, setReceipt, notifyTransfer } = useStore();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setSent(false); setBusy(false); }, [predictionId]);

  const pred = db.predictions.find((p) => p.id === predictionId) ?? null;
  if (!pred) return null;
  const round = db.rounds.find((r) => r.id === pred.roundId);
  const s = db.settings;

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
    notifyTransfer(pred.id);
    setSent(true);
  };

  return (
    <Modal open={!!predictionId} onClose={onClose} title={sent ? "Pago notificado" : "Pagá tu pronóstico"}>
      {sent ? (
        <div className="py-4 text-center animate-pop">
          <CheckCircle2 size={52} className="mx-auto text-emerald-400" />
          <p className="mt-3 font-display text-xl uppercase text-white">¡Aviso enviado!</p>
          <p className="mx-auto mt-2 max-w-xs text-sm text-zinc-400">
            En breve el administrador verificará tu pago y ya vas a estar participando del pozo.
          </p>
          <button onClick={onClose} className={`${btnPrimary} mt-5 w-full`}>Volver a la cancha</button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/6 px-4 py-3 text-sm">
            <p className="font-bold text-emerald-300">Pronóstico guardado · {round?.name}</p>
            <p className="text-xs text-zinc-400">Para participar, transferí <b className="text-white">{fmtMoney(db.settings.entryFee)}</b> a:</p>
          </div>

          <div className="space-y-2.5 rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Titular</p>
                <p className="text-sm font-bold text-white">{s.adminFullName}</p>
              </div>
              <Wallet size={20} className="text-emerald-400" />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-black/25 px-3 py-2.5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Alias</p>
                <p className="font-display text-lg tracking-wide text-emerald-300">{s.adminAlias}</p>
              </div>
              <button onClick={copyAlias} className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-extrabold uppercase text-emerald-950 transition hover:bg-emerald-400 active:scale-95">
                <Copy size={13} /> Copiar
              </button>
            </div>
            {s.adminCbu && (
              <p className="text-[11px] text-zinc-500">CBU: <span className="font-mono text-zinc-300">{s.adminCbu}</span></p>
            )}
          </div>

          {pred.paymentStatus === "rejected" && (
            <p className="rounded-lg border border-red-400/25 bg-red-400/10 px-3 py-2 text-xs font-semibold text-red-300">
              Tu comprobante anterior fue rechazado. Subí uno nuevo y volvé a avisar.
            </p>
          )}

          <div>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-widest text-zinc-400">Comprobante de la transferencia</p>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden"
              onChange={(e) => { const file = e.target.files?.[0]; if (file) upload(file); e.target.value = ""; }} />
            {pred.receipt ? (
              <div className="flex items-center gap-3 rounded-xl border border-emerald-400/25 bg-emerald-400/8 px-4 py-3">
                {pred.receipt.startsWith("data:image") ? (
                  <img src={pred.receipt} alt="Comprobante" className="h-14 w-14 rounded-lg object-cover" />
                ) : (
                  <FileText size={30} className="text-emerald-300" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-emerald-200">{pred.receiptName}</p>
                  <p className="text-[11px] text-zinc-400">Comprobante cargado ✓</p>
                </div>
                <button onClick={() => fileRef.current?.click()} className="rounded-lg border border-white/12 bg-white/5 px-3 py-2 text-xs font-bold text-zinc-300 transition hover:bg-white/10 active:scale-95">
                  Cambiar
                </button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()} disabled={busy}
                className="flex w-full flex-col items-center gap-1.5 rounded-xl border-2 border-dashed border-white/15 bg-white/[0.03] px-4 py-6 text-center transition hover:border-emerald-400/40 hover:bg-emerald-400/5 active:scale-[0.99]">
                <UploadCloud size={26} className={busy ? "animate-pulse text-emerald-400" : "text-zinc-500"} />
                <span className="text-sm font-bold text-zinc-200">{busy ? "Subiendo comprobante…" : "Subir comprobante"}</span>
                <span className="text-[11px] text-zinc-500">JPG, PNG, WEBP o PDF · hasta 5 MB</span>
              </button>
            )}
          </div>

          <button onClick={notify} disabled={!pred.receipt || busy} className={`${btnPrimary} w-full`}>
            <Send size={16} /> Ya transferí
          </button>
          {!pred.receipt && <p className="-mt-2 text-center text-[11px] text-zinc-500">Subí el comprobante para habilitar el aviso.</p>}
        </div>
      )}
    </Modal>
  );
}

/* ─────────────── Ver comprobante ─────────────── */

export function ReceiptModal({ src, onClose }: { src: string | null; onClose: () => void }) {
  return (
    <Modal open={!!src} onClose={onClose} title="Comprobante de pago" wide>
      {src && (
        src.startsWith("data:image") ? (
          <img src={src} alt="Comprobante" className="mx-auto max-h-[65dvh] rounded-xl border border-white/10 object-contain" />
        ) : (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <FileText size={40} className="text-sky-300" />
            <p className="text-sm text-zinc-300">El comprobante es un PDF.</p>
            <a href={src} download="comprobante.pdf" className={btnPrimary}>Descargar PDF</a>
          </div>
        )
      )}
    </Modal>
  );
}

/* ─────────────── Reclamar premio ─────────────── */

export function ClaimModal({ prize, onClose }: { prize: Prize | null; onClose: () => void }) {
  const { db, me, claimPrize } = useStore();
  const toast = useToast();
  const [cbu, setCbu] = useState("");
  const [fullName, setFullName] = useState(me?.fullName ?? "");
  const [phone, setPhone] = useState(me?.phone ?? "");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setCbu("");
    setFullName(me?.fullName ?? "");
    setPhone(me?.phone ?? "");
    setErr(null);
  }, [prize?.id, me]);

  if (!prize) return null;
  const round = db.rounds.find((r) => r.id === prize.roundId);
  const winInfo = round ? winnersInfo(db, round.id) : null;
  const totalPozo = winInfo?.pozo ?? prize.amount;
  const totalWinners = winInfo?.winnerIds.length ?? 1;
  const sent = prize.status !== "unclaimed";

  return (
    <Modal open onClose={onClose} title="Reclamar premio">
      {sent ? (
        <div className="py-4 text-center animate-pop">
          <CheckCircle2 size={52} className="mx-auto text-emerald-400" />
          <p className="mt-3 font-display text-xl uppercase text-white">Reclamo enviado</p>
          <p className="mx-auto mt-2 max-w-xs text-sm text-zinc-400">
            En breve el administrador te transferirá <b className="text-gold-300">{fmtMoney(prize.amount)}</b> a <b className="text-zinc-200">{prize.cbuAlias}</b>.
          </p>
          <button onClick={onClose} className={`${btnPrimary} mt-5 w-full`}>¡Gracias!</button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-gold-400/30 bg-gold-400/8 p-4">
            <div className="flex items-center gap-4">
              <Trophy size={32} className="shrink-0 text-gold-400" />
              <div>
                <p className="text-sm font-bold text-white">{round?.name}</p>
                <p className="font-display text-2xl text-gold-300">{fmtMoney(prize.amount)}</p>
              </div>
            </div>
            <p className="mt-2 text-xs font-semibold text-gold-300/90">
              Tu premio: {fmtMoney(prize.amount)} (pozo de {fmtMoney(totalPozo)} dividido entre {totalWinners} ganador{totalWinners > 1 ? "es" : ""})
            </p>
          </div>

          <div className="space-y-3">
            <Field label="Nombre y apellido completos" hint="Para comprobar la titularidad al transferirte.">
              <input className={inputCls} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ej.: Juan Pérez" />
            </Field>
            <Field label="Teléfono de contacto">
              <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="11 5555-5555" />
            </Field>
            <Field label="CBU / CVU / Alias" hint="A esta cuenta te transferimos el premio.">
              <input className={inputCls} value={cbu} onChange={(e) => setCbu(e.target.value)} placeholder="Ej.: juan.perez.mp o 00000031…" />
            </Field>
          </div>

          {err && <p className="rounded-lg border border-red-400/25 bg-red-400/10 px-3 py-2 text-xs font-semibold text-red-300">{err}</p>}
          <button
            onClick={() => {
              if (!fullName.trim()) return setErr("Ingresá tu nombre y apellido.");
              if (!phone.trim()) return setErr("Ingresá un teléfono de contacto.");
              if (cbu.trim().length < 6) return setErr("Ingresá un CBU/CVU/Alias válido.");
              claimPrize(prize.id, cbu, fullName, phone);
              toast.push("ok", "Reclamo enviado", "El administrador ya fue avisado.");
            }}
            className={`${btnGold} w-full`}
          >
            <Trophy size={16} /> Enviar reclamo
          </button>
        </div>
      )}
    </Modal>
  );
}

/* ─────────────── Detalle de pronóstico ─────────────── */

export function PredictionViewModal({ predictionId, onClose }: { predictionId: string | null; onClose: () => void }) {
  const { db } = useStore();
  const pred = db.predictions.find((p) => p.id === predictionId) ?? null;
  if (!pred) return null;
  const round = db.rounds.find((r) => r.id === pred.roundId);
  const user = db.profiles.find((u) => u.id === pred.userId);
  const matches = sortedRoundMatches(db.matches, pred.roundId);

  return (
    <Modal open onClose={onClose} title="Pronóstico" wide>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Chip tone="emerald">{user?.nickname}</Chip>
        <Chip tone={PAYMENT_TONE[pred.paymentStatus]}>{PAYMENT_LABEL[pred.paymentStatus]}</Chip>
        <span className="text-xs font-bold text-zinc-400">{round?.name}</span>
        <span className="ml-auto text-[11px] text-zinc-500">{fmtDay(pred.createdAt)} · {fmtTime(pred.createdAt)}</span>
      </div>
      <div className="overflow-hidden rounded-xl border border-white/10">
        {matches.map((m, i) => {
          const it = pred.items.find((x) => x.matchId === m.id);
          const done = m.status === "finished" && !!m.result;
          const hit = done && it?.selection === m.result;
          const invalid = m.status === "suspended" || m.status === "cancelled";
          return (
            <div key={m.id} className={`flex items-center gap-3 px-4 py-2.5 ${i % 2 ? "bg-white/[0.02]" : ""}`}>
              <span className="w-24 shrink-0 text-[11px] font-semibold capitalize text-zinc-500">{fmtDay(m.matchDate)}</span>
              <p className="min-w-0 flex-1 truncate text-sm font-bold text-zinc-200">{m.home} <span className="text-zinc-600">vs</span> {m.away}</p>
              {invalid ? (
                <Chip tone="red">Anulado</Chip>
              ) : it ? (
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold ${
                  !done ? "border border-white/12 bg-white/6 text-zinc-300"
                  : hit ? "bg-emerald-500 text-emerald-950" : "bg-red-500/80 text-white"
                }`}>
                  {it.selection}
                </span>
              ) : (
                <span className="text-xs text-zinc-600">—</span>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
        <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Aciertos</span>
        <span className="font-display text-2xl text-emerald-300">{pred.totalHits} <span className="text-sm text-zinc-500">/ {matches.length}</span></span>
      </div>
      <p className="mt-2 text-[11px] text-zinc-600">L = local · E = empate · V = visitante. Solo cuentan partidos finalizados.</p>
    </Modal>
  );
}
