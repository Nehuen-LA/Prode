import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "./lib/supabase";
import type { DB, Match, MatchStatus, Prediction, PredictionItem, Prize, Profile, Round, Selection, Settings } from "./types";
import { computeHits, isPredictionOpen, nick, roundPhase, uid, validRoundMatches } from "./utils";
import type { User } from "@supabase/supabase-js";

const KEY = "prode-liga-db-v1";

// Estado local como fallback mientras carga Supabase
let localDb: DB | null = null;

function loadLocal(): DB {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const d = JSON.parse(raw);
      if (d && d.v === 1 && Array.isArray(d.profiles)) return d as DB;
    }
  } catch { /* datos corruptos → seed */ }
  return buildSeed();
}

async function fetchFromSupabase(currentUserId: string | null): Promise<DB | null> {
  try {
    // Fetch rounds
    const { data: roundsData, error: roundsError } = await supabase
      .from('prode_rounds')
      .select('*')
      .order('round_number', { ascending: true });
    
    if (roundsError) throw roundsError;

    // Fetch matches
    const { data: matchesData, error: matchesError } = await supabase
      .from('prode_matches')
      .select('*');
    
    if (matchesError) throw matchesError;

    // Fetch predictions
    const { data: predictionsData, error: predictionsError } = await supabase
      .from('prode_predictions')
      .select('*');
    
    if (predictionsError) throw predictionsError;

    // Fetch users/profiles
    const { data: usersData, error: usersError } = await supabase
      .from('prode_users')
      .select('*');
    
    if (usersError) throw usersError;

    // Fetch scores (usamos esto para prizes/ranking)
    const { data: scoresData, error: scoresError } = await supabase
      .from('prode_scores')
      .select('*');
    
    if (scoresError) throw scoresError;

    // Fetch settings
    const { data: settingsData, error: settingsError } = await supabase
      .from('prode_settings')
      .select('*')
      .limit(1);
    
    if (settingsError) throw settingsError;

    // Transformar a formato de la app
    const rounds: Round[] = (roundsData || []).map(r => ({
      id: r.id,
      name: r.name,
      status: r.status as RoundStatus || 'open',
      closeDate: r.close_date,
      isTest: r.is_test || false,
      createdAt: r.created_at,
    }));

    const matches: Match[] = (matchesData || []).map(m => ({
      id: m.id,
      roundId: m.round_id,
      home: m.home_team,
      away: m.away_team,
      matchDate: m.match_date,
      status: (m.is_completed ? 'finished' : 'scheduled') as MatchStatus,
      result: m.home_score !== null && m.away_score !== null 
        ? (m.home_score! > m.away_score! ? 'L' : m.home_score! < m.away_score! ? 'V' : 'E')
        : null,
    }));

    const predictions: Prediction[] = (predictionsData || []).map(p => ({
      id: p.id,
      userId: p.user_id,
      roundId: p.match_id ? '' : '', // Necesitamos ajustar esto según tu estructura real
      name: p.name || null,
      items: p.prediction_data as PredictionItem[] || [],
      totalHits: p.total_hits || 0,
      paymentStatus: p.payment_status as PaymentStatus || 'draft',
      receipt: p.receipt || null,
      receiptName: p.receipt_name || null,
      transferNotified: p.transfer_notified || false,
      createdAt: p.created_at,
    }));

    const profiles: Profile[] = (usersData || []).map(u => ({
      id: u.id,
      nickname: u.nickname || u.email?.split('@')[0] || 'Usuario',
      email: u.email,
      password: '', // No usamos password en Supabase Auth
      role: u.role as Role || 'user',
      createdAt: u.created_at,
    }));

    const settings: Settings = settingsData && settingsData.length > 0 ? {
      adminFullName: 'Administrador',
      adminAlias: 'admin',
      adminCbu: '',
      entryFee: settingsData[0].entry_fee || 1000,
      telegramChatId: '',
    } : {
      adminFullName: 'Administrador',
      adminAlias: 'admin',
      adminCbu: '',
      entryFee: 1000,
      telegramChatId: '',
    };

    return {
      v: 1,
      rounds,
      matches,
      predictions,
      profiles,
      prizes: [], // Lo manejamos desde scores o creamos tabla separada
      settings,
      notifications: [],
      currentUserId,
    };
  } catch (error) {
    console.error('Error fetching from Supabase:', error);
    return null;
  }
}

interface RegisterData { nickname: string; email: string; password: string; }

interface StoreApi {
  db: DB;
  me: Profile | null;
  isAdmin: boolean;
  register: (d: RegisterData) => string | null;
  login: (identifier: string, password: string) => string | null;
  logout: () => void;
  savePrediction: (roundId: string, items: PredictionItem[], name?: string | null) => { id?: string; error?: string };
  updatePredictionItems: (predictionId: string, items: PredictionItem[]) => { ok: boolean; error?: string };
  updatePredictionName: (predictionId: string, name: string | null) => void;
  deletePrediction: (predictionId: string) => { ok: boolean; error?: string };
  setReceipt: (predictionId: string, dataUrl: string, name: string) => void;
  notifyTransfer: (predictionId: string) => void;
  approvePayment: (predictionId: string) => void;
  rejectPayment: (predictionId: string) => void;
  createRound: (name: string, closeDate: string | null, isTest: boolean) => void;
  updateRound: (roundId: string, patch: Partial<Round>) => void;
  deleteRound: (roundId: string) => void;
  addMatch: (roundId: string, home: string, away: string, dateISO: string) => void;
  addMatches: (roundId: string, rows: { home: string; away: string; dateISO: string }[]) => void;
  updateMatch: (matchId: string, patch: Partial<Match>) => void;
  deleteMatch: (matchId: string) => void;
  setMatchStatus: (matchId: string, status: MatchStatus) => void;
  setResult: (matchId: string, result: Selection | null) => void;
  settleRound: (roundId: string) => { ok: boolean; error?: string };
  cancelRound: (roundId: string) => void;
  reopenRound: (roundId: string) => void;
  claimPrize: (prizeId: string, cbuAlias: string, fullName?: string, phone?: string) => void;
  markPaid: (prizeId: string) => void;
  saveSettings: (patch: Partial<Settings>) => void;
  approveAllPending: () => number;
}

const Ctx = createContext<StoreApi>(null!);
export const useStore = () => useContext(Ctx);

const notify = (d: DB, text: string): DB => ({
  ...d,
  notifications: [{ id: uid(), text, createdAt: new Date().toISOString() }, ...d.notifications].slice(0, 25),
});

const recalc = (d: DB, roundId: string): DB => ({
  ...d,
  predictions: d.predictions.map((p) =>
    p.roundId === roundId && p.paymentStatus === "approved" ? { ...p, totalHits: computeHits(p.items, d.matches) } : p
  ),
});

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<DB>(load);

  // ref siempre actualizada: las acciones leen el último estado aunque se llamen justo después de otra acción
  const live = useRef(db);
  useEffect(() => { live.current = db; }, [db]);
  const liveMe = () => live.current.profiles.find((x) => x.id === live.current.currentUserId) ?? null;

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(db));
    } catch {
      window.dispatchEvent(new CustomEvent("storage-full", { detail: "Almacenamiento lleno. Contactá al administrador." }));
    }
  }, [db]);

  const me = useMemo(() => db.profiles.find((p) => p.id === db.currentUserId) ?? null, [db]);
  const isAdminNow = () => liveMe()?.role === "admin";

  const api: StoreApi = {
    db, me, isAdmin: me?.role === "admin",

    register(data) {
      const email = data.email.trim().toLowerCase();
      const nickname = data.nickname.trim();
      if (db.profiles.some((p) => p.email.toLowerCase() === email)) return "Ya existe una cuenta con ese email.";
      if (db.profiles.some((p) => p.nickname.toLowerCase() === nickname.toLowerCase())) return "Ese apodo ya está en uso. Elegí otro.";
      const profile: Profile = {
        id: uid(),
        nickname,
        email,
        password: data.password,
        role: "user",
        createdAt: new Date().toISOString()
      };
      setDb((d) => notify({ ...d, profiles: [...d.profiles, profile], currentUserId: profile.id }, `Nuevo jugador registrado · ${nickname}`));
      return null;
    },

    login(identifier, password) {
      const idClean = identifier.trim().toLowerCase();
      const p = db.profiles.find((x) => x.email.toLowerCase() === idClean || x.nickname.toLowerCase() === idClean);
      if (!p) return "No encontramos ninguna cuenta con ese apodo o email.";
      if (p.password !== password) return "La contraseña es incorrecta.";
      setDb((d) => ({ ...d, currentUserId: p.id }));
      return null;
    },

    logout: () => setDb((d) => ({ ...d, currentUserId: null })),

    savePrediction(roundId, items, name) {
      const cur = live.current;
      const meNow = liveMe();
      if (!meNow) return { error: "Necesitás iniciar sesión." };
      const round = cur.rounds.find((r) => r.id === roundId);
      if (!round) return { error: "La fecha no existe." };
      if (!isPredictionOpen(round, cur.matches)) return { error: "La fecha ya está cerrada." };
      const valid = validRoundMatches(cur.matches, roundId);
      if (valid.length === 0) return { error: "Esta fecha todavía no tiene partidos cargados." };
      if (items.length !== valid.length) return { error: "Tenés que pronosticar todos los partidos." };
      const pred: Prediction = {
        id: uid(),
        userId: meNow.id,
        roundId,
        name: name ? name.trim() : null,
        items,
        totalHits: 0,
        paymentStatus: "draft",
        receipt: null,
        receiptName: null,
        transferNotified: false,
        createdAt: new Date().toISOString(),
      };
      setDb((d) => ({ ...d, predictions: [...d.predictions, pred] }));
      return { id: pred.id };
    },

    updatePredictionItems(predictionId, items) {
      const cur = live.current;
      const meNow = liveMe();
      if (!meNow) return { ok: false, error: "Necesitás iniciar sesión." };
      const pred = cur.predictions.find((p) => p.id === predictionId);
      if (!pred) return { ok: false, error: "El pronóstico no existe." };
      if (pred.userId !== meNow.id && meNow.role !== "admin") return { ok: false, error: "No tenés permiso para editar este pronóstico." };
      if (pred.paymentStatus !== "draft" && pred.paymentStatus !== "rejected") {
        return { ok: false, error: "Solo podés editar pronósticos sin pagar o rechazados." };
      }
      const round = cur.rounds.find((r) => r.id === pred.roundId);
      if (!round || !isPredictionOpen(round, cur.matches)) return { ok: false, error: "La fecha ya está cerrada." };
      const valid = validRoundMatches(cur.matches, round.id);
      if (items.length !== valid.length) return { ok: false, error: "Tenés que pronosticar todos los partidos." };
      setDb((d) => ({
        ...d,
        predictions: d.predictions.map((p) =>
          p.id === predictionId ? { ...p, items, paymentStatus: "draft" as const } : p
        ),
      }));
      return { ok: true };
    },

    updatePredictionName(predictionId, name) {
      setDb((d) => ({
        ...d,
        predictions: d.predictions.map((p) =>
          p.id === predictionId ? { ...p, name: name ? name.trim() : null } : p
        ),
      }));
    },

    deletePrediction(predictionId) {
      const cur = live.current;
      const meNow = liveMe();
      if (!meNow) return { ok: false, error: "Necesitás iniciar sesión." };
      const pred = cur.predictions.find((p) => p.id === predictionId);
      if (!pred) return { ok: false, error: "El pronóstico no existe." };
      if (pred.userId !== meNow.id && meNow.role !== "admin") return { ok: false, error: "No tenés permiso." };
      if (pred.paymentStatus !== "draft") return { ok: false, error: "Solo podés eliminar pronósticos en borrador." };
      setDb((d) => ({
        ...d,
        predictions: d.predictions.filter((p) => p.id !== predictionId),
      }));
      return { ok: true };
    },

    setReceipt(predictionId, dataUrl, name) {
      setDb((d) => ({
        ...d,
        predictions: d.predictions.map((p) => (p.id === predictionId ? { ...p, receipt: dataUrl, receiptName: name } : p)),
      }));
    },

    notifyTransfer(predictionId) {
      const cur = live.current;
      const meNow = liveMe();
      const pred = cur.predictions.find((p) => p.id === predictionId);
      if (!pred) return;
      const round = cur.rounds.find((r) => r.id === pred.roundId);
      setDb((d) =>
        notify(
          {
            ...d,
            predictions: d.predictions.map((p) =>
              p.id === predictionId ? { ...p, transferNotified: true, paymentStatus: "pending_review" } : p
            ),
          },
          `Nuevo pago pendiente · ${meNow?.nickname ?? "?"} · ${round?.name ?? "?"} · $ ${d.settings.entryFee.toLocaleString("es-AR")}`
        )
      );
    },

    approvePayment(predictionId) {
      if (!isAdminNow()) return;
      setDb((d) => {
        const pred = d.predictions.find((p) => p.id === predictionId);
        if (!pred || pred.paymentStatus === "approved") return d;
        const next = {
          ...d,
          predictions: d.predictions.map((p) =>
            p.id === predictionId ? { ...p, paymentStatus: "approved" as const, totalHits: computeHits(p.items, d.matches) } : p
          ),
        };
        return notify(next, `Pago aprobado · ${nick(d, pred.userId)} · ya está en la tabla`);
      });
    },

    rejectPayment(predictionId) {
      if (!isAdminNow()) return;
      setDb((d) => {
        const pred = d.predictions.find((p) => p.id === predictionId);
        if (!pred) return d;
        return notify(
          { ...d, predictions: d.predictions.map((p) => (p.id === predictionId ? { ...p, paymentStatus: "rejected" as const } : p)) },
          `Pago rechazado · ${nick(d, pred.userId)}`
        );
      });
    },

    createRound(name, closeDate, isTest) {
      if (!isAdminNow()) return;
      const round: Round = { id: uid(), name: name.trim(), status: "open", closeDate, isTest, createdAt: new Date().toISOString() };
      setDb((d) => ({ ...d, rounds: [...d.rounds, round] }));
    },

    updateRound(roundId, patch) {
      if (!isAdminNow()) return;
      setDb((d) => ({ ...d, rounds: d.rounds.map((r) => (r.id === roundId ? { ...r, ...patch } : r)) }));
    },

    deleteRound(roundId) {
      if (!isAdminNow()) return;
      setDb((d) => ({
        ...d,
        rounds: d.rounds.filter((r) => r.id !== roundId),
        matches: d.matches.filter((m) => m.roundId !== roundId),
        predictions: d.predictions.filter((p) => p.roundId !== roundId),
        prizes: d.prizes.filter((z) => z.roundId !== roundId),
      }));
    },

    addMatch(roundId, home, away, dateISO) {
      if (!isAdminNow()) return;
      const m: Match = { id: uid(), roundId, home: home.trim(), away: away.trim(), matchDate: dateISO, status: "scheduled", result: null };
      setDb((d) => ({ ...d, matches: [...d.matches, m] }));
    },

    addMatches(roundId, rows) {
      if (!isAdminNow()) return;
      const ms: Match[] = rows.map((r) => ({ id: uid(), roundId, home: r.home, away: r.away, matchDate: r.dateISO, status: "scheduled", result: null }));
      setDb((d) => ({ ...d, matches: [...d.matches, ...ms] }));
    },

    updateMatch(matchId, patch) {
      if (!isAdminNow()) return;
      setDb((d) => {
        const next = { ...d, matches: d.matches.map((m) => (m.id === matchId ? { ...m, ...patch } : m)) };
        const m = next.matches.find((x) => x.id === matchId);
        return m ? recalc(next, m.roundId) : next;
      });
    },

    deleteMatch(matchId) {
      if (!isAdminNow()) return;
      setDb((d) => {
        const m = d.matches.find((x) => x.id === matchId);
        const next = {
          ...d,
          matches: d.matches.filter((x) => x.id !== matchId),
          predictions: d.predictions.map((p) => ({ ...p, items: p.items.filter((i) => i.matchId !== matchId) })),
        };
        return m ? recalc(next, m.roundId) : next;
      });
    },

    setMatchStatus(matchId, status) {
      if (!isAdminNow()) return;
      setDb((d) => {
        const next = {
          ...d,
          matches: d.matches.map((m) =>
            m.id === matchId ? { ...m, status, result: status === "finished" ? m.result : null } : m
          ),
        };
        const m = next.matches.find((x) => x.id === matchId);
        return m ? recalc(next, m.roundId) : next;
      });
    },

    setResult(matchId, result) {
      if (!isAdminNow()) return;
      setDb((d) => {
        const next = {
          ...d,
          matches: d.matches.map((m) =>
            m.id === matchId ? { ...m, result, status: result ? ("finished" as const) : ("scheduled" as const) } : m
          ),
        };
        const m = next.matches.find((x) => x.id === matchId)!;
        let withStatus = next;
        if (result) {
          withStatus = {
            ...next,
            rounds: next.rounds.map((r) => (r.id === m.roundId && r.status === "open" ? { ...r, status: "in_play" as const } : r)),
          };
        }
        return recalc(withStatus, m.roundId);
      });
    },

    settleRound(roundId) {
      if (!isAdminNow()) return { ok: false, error: "Acceso denegado." };
      const cur = live.current;
      const round = cur.rounds.find((r) => r.id === roundId);
      if (!round) return { ok: false, error: "La fecha no existe." };
      if (round.status === "settled") return { ok: false, error: "La fecha ya fue liquidada." };
      const phase = roundPhase(round, cur.matches);
      if (phase !== "completa") return { ok: false, error: "Faltan cargar resultados de partidos válidos." };
      const approved = cur.predictions.filter((p) => p.roundId === roundId && p.paymentStatus === "approved");
      if (approved.length === 0) return { ok: false, error: "No hay pronósticos aprobados para liquidar." };
      if (cur.prizes.some((z) => z.roundId === roundId)) return { ok: false, error: "Esta fecha ya tiene premios creados." };

      const maxHits = Math.max(...approved.map((p) => p.totalHits));
      const winners = [...new Set(approved.filter((p) => p.totalHits === maxHits).map((p) => p.userId))];
      const pozo = Math.floor(approved.length * cur.settings.entryFee * 0.8);
      const amount = Math.floor(pozo / winners.length);
      const now = new Date().toISOString();
      const prizes: Prize[] = winners.map((userId) => ({
        id: uid(), userId, roundId,
        winningPredictionId: approved.find((p) => p.userId === userId && p.totalHits === maxHits)?.id ?? null,
        amount, status: "unclaimed", cbuAlias: null, claimedAt: null, paidAt: null, createdAt: now,
      }));
      const names = winners.map((w) => nick(cur, w)).join(", ");
      setDb((d) =>
        notify(
          { ...d, prizes: [...d.prizes, ...prizes], rounds: d.rounds.map((r) => (r.id === roundId ? { ...r, status: "settled" as const } : r)) },
          `Tenemos ganador/es · ${round.name} · ${names} · $ ${amount.toLocaleString("es-AR")} c/u`
        )
      );
      return { ok: true };
    },

    cancelRound: (roundId) => {
      if (!isAdminNow()) return;
      setDb((d) => ({ ...d, rounds: d.rounds.map((r) => (r.id === roundId ? { ...r, status: "cancelled" as const } : r)) }));
    },

    reopenRound: (roundId) => {
      if (!isAdminNow()) return;
      setDb((d) => ({ ...d, rounds: d.rounds.map((r) => (r.id === roundId ? { ...r, status: "open" as const } : r)) }));
    },

    claimPrize(prizeId, cbuAlias, fullName, phone) {
      const meNow = liveMe();
      setDb((d) => {
        const nextProfiles = (fullName || phone) && meNow
          ? d.profiles.map((p) => p.id === meNow.id ? { ...p, fullName: fullName?.trim() || p.fullName, phone: phone?.trim() || p.phone } : p)
          : d.profiles;
        return notify(
          {
            ...d,
            profiles: nextProfiles,
            prizes: d.prizes.map((z) =>
              z.id === prizeId ? { ...z, cbuAlias: cbuAlias.trim(), status: "pending_payment" as const, claimedAt: new Date().toISOString() } : z
            ),
          },
          `Reclamo de premio · ${meNow?.nickname ?? "?"} cargó su CBU/Alias · pendiente de pago`
        );
      });
    },

    markPaid(prizeId) {
      if (!isAdminNow()) return;
      setDb((d) => {
        const z = d.prizes.find((x) => x.id === prizeId);
        if (!z) return d;
        return notify(
          { ...d, prizes: d.prizes.map((x) => (x.id === prizeId ? { ...x, status: "paid" as const, paidAt: new Date().toISOString() } : x)) },
          `Premio pagado · ${nick(d, z.userId)} · $ ${z.amount.toLocaleString("es-AR")}`
        );
      });
    },

    saveSettings(patch) {
      if (!isAdminNow()) return;
      setDb((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
    },

    approveAllPending() {
      if (!isAdminNow()) return 0;
      const pending = live.current.predictions.filter((p) => p.paymentStatus === "pending_review");
      setDb((d) => {
        let next: DB = {
          ...d,
          predictions: d.predictions.map((p) =>
            p.paymentStatus === "pending_review" ? { ...p, paymentStatus: "approved" as const, totalHits: computeHits(p.items, d.matches) } : p
          ),
        };
        const roundIds = [...new Set(pending.map((p) => p.roundId))];
        roundIds.forEach((rid) => { next = recalc(next, rid); });
        return notify(next, `Pagos aprobados en lote · ${pending.length} pronósticos`);
      });
      return pending.length;
    },
  };

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}
