import type { DB, Match, PredictionItem, Round, Selection } from "./types";

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

export const fmtMoney = (n: number) => "$ " + Math.round(n).toLocaleString("es-AR");

export const fmtDay = (iso: string) =>
  new Date(iso).toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });

export const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

export const fmtFull = (iso: string) =>
  new Date(iso).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export function timeLeft(target: Date, now: number): string {
  const diff = target.getTime() - now;
  if (diff <= 0) return "cerrada";
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

/* ─────────────── Reglas de negocio ─────────────── */

export const sortedRoundMatches = (matches: Match[], roundId: string) =>
  matches.filter((m) => m.roundId === roundId).sort((a, b) => a.matchDate.localeCompare(b.matchDate));

export const validRoundMatches = (matches: Match[], roundId: string) =>
  sortedRoundMatches(matches, roundId).filter((m) => m.status !== "cancelled" && m.status !== "suspended");

/** Cierre efectivo: cierre manual o 1 hora antes del primer partido válido de la fecha. */
export function effectiveClose(round: Round, matches: Match[]): Date | null {
  if (round.closeDate) return new Date(round.closeDate);
  const dates = matches
    .filter((m) => m.roundId === round.id && m.status !== "cancelled" && m.status !== "suspended")
    .map((m) => new Date(m.matchDate).getTime())
    .sort((a, b) => a - b);
  if (!dates.length) return null;
  return new Date(dates[0] - 3600_000);
}

export function isPredictionOpen(round: Round, matches: Match[], now = Date.now()): boolean {
  if (round.status === "settled" || round.status === "cancelled") return false;
  const close = effectiveClose(round, matches);
  if (close && now >= close.getTime()) return false;
  return true;
}

export type RoundPhase = "abierta" | "en_juego" | "completa" | "liquidada" | "cancelada";

export function roundPhase(round: Round, matches: Match[], now = Date.now()): RoundPhase {
  if (round.status === "cancelled") return "cancelada";
  if (round.status === "settled") return "liquidada";
  if (isPredictionOpen(round, matches, now)) return "abierta";
  const valid = validRoundMatches(matches, round.id);
  if (valid.length > 0 && valid.every((m) => m.status === "finished" && m.result)) return "completa";
  return "en_juego";
}

export const PHASE_LABEL: Record<RoundPhase, string> = {
  abierta: "Abierta",
  en_juego: "En juego",
  completa: "Lista para liquidar",
  liquidada: "Finalizada",
  cancelada: "Cancelada",
};

export function computeHits(items: PredictionItem[], matches: Match[]): number {
  let h = 0;
  for (const it of items) {
    const m = matches.find((x) => x.id === it.matchId);
    if (m && m.status === "finished" && m.result && m.result === it.selection) h++;
  }
  return h;
}

export function roundStats(db: DB, roundId: string) {
  const approved = db.predictions.filter((p) => p.roundId === roundId && p.paymentStatus === "approved");
  const players = new Set(approved.map((p) => p.userId)).size;
  const recaudado = approved.length * db.settings.entryFee;
  const pozo = Math.floor(recaudado * 0.8);
  return { approvedCount: approved.length, players, recaudado, pozo, commission: recaudado - pozo };
}

export function winnersInfo(db: DB, roundId: string) {
  const approved = db.predictions.filter((p) => p.roundId === roundId && p.paymentStatus === "approved");
  if (!approved.length) return null;
  const maxHits = Math.max(...approved.map((p) => p.totalHits));
  const winningPreds = approved.filter((p) => p.totalHits === maxHits);
  const winnerIds = [...new Set(winningPreds.map((p) => p.userId))];
  const { pozo } = roundStats(db, roundId);
  const perWinner = Math.floor(pozo / winnerIds.length);
  const remainder = pozo - perWinner * winnerIds.length;
  return { maxHits, winnerIds, winningPreds, perWinner, pozo, remainder };
}

export const nick = (db: DB, userId: string) => db.profiles.find((p) => p.id === userId)?.nickname ?? "—";
export const userById = (db: DB, userId: string) => db.profiles.find((p) => p.id === userId);

export function short(name: string) {
  const clean = name.replace(/\b(club|atlético|atletico|deportes)\b\.?\s*/gi, "").trim();
  const words = clean.split(/\s+/);
  if (words[0].length >= 4) return words[0].slice(0, 3).toUpperCase();
  return words.map((w) => w[0]).join("").slice(0, 3).toUpperCase();
}

/* ─────────────── Estadísticas de usuario y admin ─────────────── */

export interface UserStats {
  roundsPlayed: number;
  totalHits: number;
  totalMatches: number;
  hitRate: number; // porcentaje (0-100)
  positions: number[];
  avgPosition: number;
  totalWon: number;
  currentStreak: number;
  history: {
    roundId: string;
    roundName: string;
    roundStatus: string;
    hits: number;
    totalMatches: number;
    position: number;
    totalPlayers: number;
    won: number;
  }[];
}

export function getUserStats(db: DB, userId: string): UserStats {
  const userApproved = db.predictions.filter((p) => p.userId === userId && p.paymentStatus === "approved");
  const roundIdsPlayed = [...new Set(userApproved.map((p) => p.roundId))];
  
  let totalHits = 0;
  let totalMatches = 0;
  const positions: number[] = [];
  const history: UserStats["history"] = [];

  for (const rid of roundIdsPlayed) {
    const round = db.rounds.find((r) => r.id === rid);
    if (!round) continue;
    const validMatches = validRoundMatches(db.matches, rid);
    const finishedMatches = validMatches.filter((m) => m.status === "finished");
    const roundPreds = db.predictions
      .filter((p) => p.roundId === rid && p.paymentStatus === "approved")
      .sort((a, b) => b.totalHits - a.totalHits || a.createdAt.localeCompare(b.createdAt));
    
    // Find best prediction for this user in this round
    const myPredsInRound = roundPreds.filter((p) => p.userId === userId);
    if (!myPredsInRound.length) continue;
    const bestPred = myPredsInRound[0];
    
    // Position with ties
    let rank = 1;
    for (let i = 0; i < roundPreds.length; i++) {
      if (roundPreds[i].id === bestPred.id) {
        // compute rank
        let pos = 1;
        for (let j = 0; j < i; j++) {
          if (roundPreds[j].totalHits > roundPreds[i].totalHits) pos = j + 2;
        }
        rank = pos;
        break;
      }
    }

    positions.push(rank);
    totalHits += bestPred.totalHits;
    totalMatches += finishedMatches.length;

    const prize = db.prizes.find((z) => z.roundId === rid && z.userId === userId);
    history.push({
      roundId: rid,
      roundName: round.name,
      roundStatus: round.status,
      hits: bestPred.totalHits,
      totalMatches: validMatches.length,
      position: rank,
      totalPlayers: new Set(roundPreds.map((p) => p.userId)).size,
      won: prize ? prize.amount : 0,
    });
  }

  const totalWon = db.prizes
    .filter((z) => z.userId === userId)
    .reduce((acc, z) => acc + z.amount, 0);

  const avgPosition = positions.length ? Math.round((positions.reduce((a, b) => a + b, 0) / positions.length) * 10) / 10 : 0;
  const hitRate = totalMatches > 0 ? Math.round((totalHits / totalMatches) * 100) : 0;

  // Racha de fechas consecutivas con aciertos (> 0)
  let currentStreak = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].hits > 0) currentStreak++;
    else break;
  }

  return {
    roundsPlayed: roundIdsPlayed.length,
    totalHits,
    totalMatches,
    hitRate,
    positions,
    avgPosition,
    totalWon,
    currentStreak,
    history: history.reverse(),
  };
}

export interface AdminStats {
  totalRounds: number;
  totalRevenue: number;
  totalPrizes: number;
  totalCommission: number;
  avgRevenuePerRound: number;
  roundsDetail: {
    roundId: string;
    roundName: string;
    status: string;
    revenue: number;
    prizes: number;
    commission: number;
    approvedCount: number;
  }[];
}

export function getAdminStats(db: DB): AdminStats {
  const settled = db.rounds.filter((r) => r.status === "settled");
  let totalRevenue = 0;
  let totalPrizes = 0;

  const roundsDetail = db.rounds.map((r) => {
    const approved = db.predictions.filter((p) => p.roundId === r.id && p.paymentStatus === "approved");
    const revenue = approved.length * db.settings.entryFee;
    const prizes = db.prizes.filter((z) => z.roundId === r.id).reduce((acc, z) => acc + z.amount, 0);
    const commission = revenue - prizes;
    if (r.status === "settled") {
      totalRevenue += revenue;
      totalPrizes += prizes;
    }
    return {
      roundId: r.id,
      roundName: r.name,
      status: r.status,
      revenue,
      prizes,
      commission,
      approvedCount: approved.length,
    };
  });

  const totalCommission = totalRevenue - totalPrizes;
  const totalRounds = settled.length;
  const avgRevenuePerRound = totalRounds > 0 ? Math.round(totalRevenue / totalRounds) : 0;

  return {
    totalRounds,
    totalRevenue,
    totalPrizes,
    totalCommission,
    avgRevenuePerRound,
    roundsDetail,
  };
}

/* ─────────────── Parser de fixture (Promiedos y similares) ─────────────── */

export interface ParsedRow {
  home: string;
  away: string;
  dateISO: string | null;
  error: string | null;
}

const MONTHS: Record<string, number> = {
  enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5, julio: 6,
  agosto: 7, septiembre: 8, setiembre: 8, octubre: 9, noviembre: 10, diciembre: 11,
};

function cleanTeam(s: string) {
  return s.replace(/\s+/g, " ").replace(/[|_]/g, "").trim();
}

/** Parser determinístico robusto: limpia canales (TNT, ESPN), soporta fechas en línea propia o combinadas. */
export function parseFixture(text: string): {
  rows: ParsedRow[];
  ignored: number;
  ignoredLines: string[];
  ignoredPercentage: number;
} {
  const lines = text.split(/\r?\n/).map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean);
  const year = new Date().getFullYear();
  let cur: { d: number; m: number; y: number } | null = null;
  const rows: ParsedRow[] = [];
  let ignored = 0;
  const ignoredLines: string[] = [];

  for (let rawLine of lines) {
    // Limpiar sufijos entre paréntesis (TNT, ESPN, FOX, etc.)
    let line = rawLine.replace(/\s*\([^)]+\)\s*/g, " ").replace(/\s+/g, " ").trim();
    const low = line.toLowerCase();

    // Detección de líneas combinadas fecha + horario: Ej: "14/03 - 19:00 River vs Boca" o "14-3 19.30 Lanús - Banfield"
    const combinedDate = line.match(/^(?:[a-zá-ú]+\s+)?(\d{1,2})\s*[/\-]\s*(\d{1,2})(?:\s*[/\-]\s*(\d{2,4}))?\s*[-–—:]\s*(\d{1,2})\s*[.:]\s*(\d{2})/i);
    if (combinedDate) {
      const y = combinedDate[3] ? (+combinedDate[3] < 100 ? 2000 + +combinedDate[3] : +combinedDate[3]) : year;
      cur = { d: +combinedDate[1], m: +combinedDate[2] - 1, y };
      // Remueve la parte de la fecha para dejar el resto
      line = line.replace(combinedDate[0], `${combinedDate[4]}:${combinedDate[5]}`).trim();
    }

    // línea de fecha pura: "14/3", "14/03/2026", "14-03"
    const slash = line.match(/^([a-zá-ú]+\.?\s+)?(\d{1,2})\s*[/\-]\s*(\d{1,2})(?:\s*[/\-]\s*(\d{2,4}))?$/i);
    if (slash && !low.includes(" vs ") && !/\d\s*[.:]\s*\d{2}/.test(line)) {
      const y = slash[4] ? (+slash[4] < 100 ? 2000 + +slash[4] : +slash[4]) : year;
      cur = { d: +slash[2], m: +slash[3] - 1, y };
      continue;
    }
    // línea de fecha pura: "Viernes 14 de marzo" / "14 de marzo"
    const named = line.match(/^(?:[a-zá-ú]+\s+)?(\d{1,2})\s+de\s+([a-zá-ú]+)(?:\s+(?:de\s+)?(\d{4}))?$/i);
    if (named && MONTHS[named[2].toLowerCase()] !== undefined && !low.includes(" vs ")) {
      cur = { d: +named[1], m: MONTHS[named[2].toLowerCase()], y: named[3] ? +named[3] : year };
      continue;
    }

    // línea de partido: debe tener horario y separador
    const timeM = line.match(/(\d{1,2})\s*[.:]\s*(\d{2})\s*(hs\.?)?/i);
    const hsM = !timeM ? line.match(/(\d{1,2})\s*hs\b/i) : null;
    const rest = line
      .replace(/(\d{1,2})\s*[.:]\s*(\d{2})\s*(hs\.?)?/gi, " ")
      .replace(/(\d{1,2})\s*hs\.?\b/gi, " ")
      .trim();
    const parts = rest.split(/\s+vs\.?\s+|\s+[–—]\s+|\s+-\s+/i).map(cleanTeam).filter(Boolean);

    if ((timeM || hsM) && parts.length === 2) {
      const hh = timeM ? Math.min(23, +timeM[1]) : hsM ? Math.min(23, +hsM[1]) : 0;
      const mm = timeM ? +timeM[2] : 0;
      let dateISO: string | null = null;
      let error: string | null = null;
      if (cur) dateISO = new Date(cur.y, cur.m, cur.d, hh, mm).toISOString();
      else error = "No hay fecha definida arriba de este partido";
      rows.push({ home: parts[0], away: parts[1], dateISO, error });
    } else {
      ignored++;
      ignoredLines.push(rawLine);
    }
  }

  const ignoredPercentage = lines.length > 0 ? ignored / lines.length : 0;
  return { rows, ignored, ignoredLines, ignoredPercentage };
}

/* ─────────────── Archivos ─────────────── */

const OK_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export async function fileToDataUrl(file: File): Promise<string> {
  if (!OK_TYPES.includes(file.type)) throw new Error("Formato no permitido. Usá JPG, PNG, WEBP o PDF.");
  if (file.size > 5 * 1024 * 1024) throw new Error("El archivo supera los 5 MB.");
  if (file.type === "application/pdf") {
    if (file.size > 1.5 * 1024 * 1024) throw new Error("El PDF es muy pesado (máx. 1,5 MB). Mandá una foto.");
    return await readAsDataUrl(file);
  }
  // comprimir imagen: max 700px y calidad 0.55
  return await new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, 700 / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(img.width * scale));
      c.height = Math.max(1, Math.round(img.height * scale));
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL("image/jpeg", 0.55));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("No pudimos leer la imagen. Probá con otra.")); };
    img.src = url;
  });
}

/** Preparado para futura migración a Supabase Storage */
export async function uploadReceipt(file: File): Promise<string> {
  return await fileToDataUrl(file);
}

const readAsDataUrl = (file: File) =>
  new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(new Error("No pudimos leer el archivo."));
    r.readAsDataURL(file);
  });

/** Comprobante ficticio para datos de demostración. */
export function demoReceipt(nickname: string, amount: number): string {
  const op = Math.floor(100000000 + Math.random() * 899999999);
  const fecha = new Date().toLocaleString("es-AR");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="560" viewBox="0 0 420 560"><rect width="420" height="560" fill="#f4f6f5"/><rect width="420" height="110" fill="#0f9d63"/><circle cx="210" cy="110" r="34" fill="#0f9d63"/><circle cx="210" cy="110" r="26" fill="#f4f6f5"/><path d="M198 110l9 9 16-18" stroke="#0f9d63" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><text x="210" y="52" font-family="Arial" font-size="22" font-weight="bold" fill="#ffffff" text-anchor="middle">Transferencia realizada</text><text x="210" y="80" font-family="Arial" font-size="13" fill="#d9f5e7" text-anchor="middle">Comprobante (datos de demostración)</text><text x="210" y="182" font-family="Arial" font-size="34" font-weight="bold" fill="#16241d" text-anchor="middle">$ ${amount.toLocaleString("es-AR")}</text><g font-family="Arial" font-size="14" fill="#3d4a43"><text x="42" y="240">Destinatario</text><text x="42" y="286">Concepto</text><text x="42" y="332">Fecha</text><text x="42" y="378">N° de operación</text></g><g font-family="Arial" font-size="15" font-weight="bold" fill="#16241d"><text x="378" y="240" text-anchor="end">Martín Herrera</text><text x="378" y="286" text-anchor="end">Prode — ${nickname}</text><text x="378" y="332" text-anchor="end">${fecha}</text><text x="378" y="378" text-anchor="end">${op}</text></g><rect x="42" y="430" width="336" height="70" rx="10" fill="#e3efe8"/><text x="210" y="472" font-family="Arial" font-size="12" fill="#5a6b61" text-anchor="middle">Documento generado automáticamente para probar el panel</text></svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}
