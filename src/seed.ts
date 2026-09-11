import type { DB, Match, Prediction, PredictionItem, Profile, Round, Selection } from "./types";
import { computeHits, demoReceipt, uid } from "./utils";

const iso = (msOffset: number) => new Date(Date.now() + msOffset).toISOString();
const H = 3600_000;
const D = 24 * H;
const at = (dayOffset: number, hour: number) => {
  const d = new Date(Date.now() + dayOffset * D);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

export function buildSeed(): DB {
  const admin: Profile = { id: "admin", nickname: "ElAdmin", fullName: "Martín Herrera", phone: "11 5555-0001", email: "admin@prode.ar", password: "admin123", role: "admin", createdAt: iso(-90 * D) };
  const mkUser = (id: string, nickname: string, email: string, days: number): Profile =>
    ({ id, nickname, email, password: "demo1234", role: "user", createdAt: iso(-days * D) });

  const profiles: Profile[] = [
    admin,
    mkUser("u1", "LaBruja", "labruja@prode.ar", 60),
    mkUser("u2", "Gambeta77", "gambeta@prode.ar", 55),
    mkUser("u3", "ElPibe", "pibe@prode.ar", 40),
    mkUser("u4", "DoñaGol", "donagol@prode.ar", 38),
    mkUser("u5", "Cataclismo", "cata@prode.ar", 30),
    mkUser("u6", "ElMuro", "muro@prode.ar", 26),
    mkUser("u7", "PatoLoco", "pato@prode.ar", 21),
    mkUser("u8", "LaFiera", "fiera@prode.ar", 14),
    mkUser("u9", "Turco99", "turco@prode.ar", 6),
  ];

  const rounds: Round[] = [
    { id: "r6", name: "Fecha 6 · Copa de la Liga", status: "settled", closeDate: null, isTest: false, createdAt: iso(-12 * D) },
    { id: "r7", name: "Fecha 7", status: "in_play", closeDate: null, isTest: false, createdAt: iso(-6 * D) },
    { id: "r8", name: "Fecha 8", status: "open", closeDate: null, isTest: false, createdAt: iso(-1 * D) },
  ];

  const m = (roundId: string, home: string, away: string, date: string, status: Match["status"], result: Selection | null): Match =>
    ({ id: uid(), roundId, home, away, matchDate: date, status, result });

  const f6: [string, string, Selection][] = [
    ["River Plate", "Rosario Central", "L"],
    ["Boca Juniors", "San Lorenzo", "E"],
    ["Racing", "Independiente", "L"],
    ["Estudiantes", "Gimnasia", "V"],
    ["Vélez", "Huracán", "L"],
    ["Lanús", "Banfield", "E"],
    ["Talleres", "Belgrano", "L"],
    ["Newell's", "Central Córdoba", "V"],
    ["Argentinos", "Platense", "L"],
    ["Unión", "Colón", "E"],
  ];
  const m6 = f6.map(([h, a, r], i) => m("r6", h, a, at(-9 + Math.floor(i / 4), 17 + (i % 4) * 2), "finished", r));

  const m7 = [
    m("r7", "River Plate", "Tigre", at(-3, 19), "finished", "L"),
    m("r7", "Boca Juniors", "Estudiantes", at(-3, 21), "finished", "E"),
    m("r7", "Racing", "Lanús", at(-2, 17), "finished", "V"),
    m("r7", "Independiente", "Vélez", at(-2, 19), "finished", "L"),
    m("r7", "San Lorenzo", "Huracán", at(-1, 17), "finished", "E"),
    m("r7", "Gimnasia", "Platense", at(-1, 19), "finished", "L"),
    m("r7", "Talleres", "Newell's", at(2, 17), "scheduled", null),
    m("r7", "Rosario Central", "Argentinos", at(2, 19), "scheduled", null),
    m("r7", "Banfield", "Unión", at(3, 17), "scheduled", null),
    m("r7", "Central Córdoba", "Colón", at(3, 19), "scheduled", null),
  ];

  const m8 = [
    m("r8", "Boca Juniors", "River Plate", at(6, 19), "scheduled", null),
    m("r8", "Racing", "San Lorenzo", at(6, 17), "scheduled", null),
    m("r8", "Independiente", "Estudiantes", at(6, 21), "scheduled", null),
    m("r8", "Vélez", "Lanús", at(7, 17), "scheduled", null),
    m("r8", "Huracán", "Banfield", at(7, 19), "scheduled", null),
    m("r8", "Talleres", "Gimnasia", at(7, 21), "scheduled", null),
    m("r8", "Newell's", "Rosario Central", at(8, 17), "scheduled", null),
    m("r8", "Argentinos", "Unión", at(8, 19), "scheduled", null),
    m("r8", "Platense", "Central Córdoba", at(8, 19), "scheduled", null),
    m("r8", "Colón", "Tigre", at(8, 21), "scheduled", null),
  ];

  const matches = [...m6, ...m7, ...m8];

  const wrong = (s: Selection): Selection => (s === "L" ? "V" : s === "V" ? "L" : "E");
  const pickItems = (ms: Match[], flipIdx: number[]): PredictionItem[] =>
    ms.map((mm, i) => {
      const base = mm.result ?? (["L", "E", "V"] as Selection[])[i % 3];
      return { matchId: mm.id, selection: flipIdx.includes(i) ? wrong(base) : base };
    });
  const cycleItems = (ms: Match[], offset: number): PredictionItem[] =>
    ms.map((mm, i) => ({ matchId: mm.id, selection: (["L", "E", "V"] as Selection[])[(i + offset) % 3] }));

  const pred = (userId: string, roundId: string, items: PredictionItem[], status: Prediction["paymentStatus"], created: string, receipt: string | null): Prediction => ({
    id: uid(), userId, roundId, items, totalHits: computeHits(items, matches),
    paymentStatus: status, receipt, receiptName: receipt ? "comprobante.jpg" : null,
    transferNotified: status !== "draft", createdAt: created,
  });

  const predictions: Prediction[] = [
    // Fecha 6 — liquidada: 6 pagos aprobados, LaBruja gana con 8 aciertos
    pred("u1", "r6", pickItems(m6, [2, 5]), "approved", iso(-10 * D), demoReceipt("LaBruja", 1000)),
    pred("u2", "r6", pickItems(m6, [1, 4, 7]), "approved", iso(-10 * D), demoReceipt("Gambeta77", 1000)),
    pred("u4", "r6", pickItems(m6, [0, 3, 8]), "approved", iso(-10 * D), demoReceipt("DoñaGol", 1000)),
    pred("u5", "r6", pickItems(m6, [1, 2, 6, 9]), "approved", iso(-10 * D), demoReceipt("Cataclismo", 1000)),
    pred("u7", "r6", pickItems(m6, [0, 1, 3, 7, 8, 9]), "approved", iso(-10 * D), demoReceipt("PatoLoco", 1000)),
    pred("u9", "r6", pickItems(m6, [0, 1, 2, 4, 6, 7, 9]), "approved", iso(-10 * D), demoReceipt("Turco99", 1000)),
    // Fecha 7 — en juego
    pred("u1", "r7", cycleItems(m7, 0), "approved", iso(-4 * D), demoReceipt("LaBruja", 1000)),
    pred("u2", "r7", cycleItems(m7, 1), "approved", iso(-4 * D), demoReceipt("Gambeta77", 1000)),
    pred("u3", "r7", cycleItems(m7, 2), "approved", iso(-3 * D), demoReceipt("ElPibe", 1000)),
    pred("u5", "r7", cycleItems(m7, 1), "approved", iso(-2 * D), demoReceipt("Cataclismo", 1000)),
    pred("u6", "r7", cycleItems(m7, 0), "approved", iso(-2 * D), demoReceipt("ElMuro", 1000)),
    pred("u8", "r7", cycleItems(m7, 2), "pending_review", iso(-3 * H), demoReceipt("LaFiera", 1000)),
    pred("u7", "r7", cycleItems(m7, 0), "draft", iso(-5 * H), null),
    // Fecha 8 — abierta
    pred("u1", "r8", cycleItems(m8, 1), "approved", iso(-20 * H), demoReceipt("LaBruja", 1000)),
    pred("u3", "r8", cycleItems(m8, 0), "approved", iso(-16 * H), demoReceipt("ElPibe", 1000)),
    pred("u5", "r8", cycleItems(m8, 2), "approved", iso(-9 * H), demoReceipt("Cataclismo", 1000)),
    pred("u8", "r8", cycleItems(m8, 1), "approved", iso(-6 * H), demoReceipt("LaFiera", 1000)),
    pred("u2", "r8", cycleItems(m8, 0), "pending_review", iso(-40 * 60_000), demoReceipt("Gambeta77", 1000)),
    pred("u6", "r8", cycleItems(m8, 2), "draft", iso(-2 * H), null),
  ];

  const laBrujaF6 = predictions.find((p) => p.userId === "u1" && p.roundId === "r6")!;

  return {
    v: 1,
    profiles,
    rounds,
    matches,
    predictions,
    prizes: [
      {
        id: uid(), userId: "u1", roundId: "r6", winningPredictionId: laBrujaF6.id,
        amount: 4800, status: "unclaimed", cbuAlias: null, claimedAt: null, paidAt: null, createdAt: iso(-2 * D),
      },
    ],
    settings: {
      adminFullName: "Martín Herrera",
      adminAlias: "prode.liga",
      adminCbu: "0000003100012345678901",
      entryFee: 1000,
      telegramChatId: "",
    },
    notifications: [
      { id: uid(), text: "Nuevo pago pendiente · Gambeta77 (Julián Ríos) · Fecha 8 · $ 1.000", createdAt: iso(-40 * 60_000) },
      { id: uid(), text: "Nuevo pago pendiente · LaFiera (Carla Juárez) · Fecha 7 · $ 1.000", createdAt: iso(-3 * H) },
      { id: uid(), text: "Nuevo jugador registrado · Turco99", createdAt: iso(-6 * D) },
    ],
    currentUserId: null,
  };
}
