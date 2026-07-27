import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SCENE } from "../config/experience";

export type PetAction = "idle" | "call" | "play" | "feel";
export type CareAction = "feed" | "play" | "clean" | "sleep";
export type Charm = "lucky-star" | "glow-cube" | "rainy-day";
export type RandomEvent = "gift" | "meteor" | "visitor";

export type PetStats = {
  hunger: number;
  fun: number;
  clean: number;
  sleep: number;
};

type TamaState = {
  awake: boolean;
  action: PetAction;
  lastCare: CareAction | null;
  stats: PetStats;
  bond: number;
  stardust: number;
  equippedCharm: Charm;
  careCount: number;
  gameBest: number;
  dailyClaimed: boolean;
  signalEnergy: number;
  careCombo: number;
  request: CareAction;
  memories: number;
  eventCount: number;
  lastEvent: RandomEvent | null;
  wake: () => void;
  trigger: (action: PetAction) => void;
  care: (action: CareAction, quality?: number) => void;
  triggerRandomEvent: (event: RandomEvent) => void;
  equipCharm: (charm: Charm) => void;
  finishGame: (score: number) => void;
  claimDaily: () => void;
  activateSignalBurst: () => void;
  reset: () => void;
};

const initialStats: PetStats = { hunger: 72, fun: 86, clean: 68, sleep: 44 };
let actionTimer: ReturnType<typeof setTimeout> | undefined;

export const useTamaStore = create<TamaState>()(
  persist(
    (set, get) => ({
      awake: false,
      action: "idle",
      lastCare: null,
      stats: initialStats,
      bond: 64,
      stardust: 1240,
      equippedCharm: "lucky-star",
      careCount: 0,
      gameBest: 0,
      dailyClaimed: false,
      signalEnergy: 0,
      careCombo: 0,
      request: "feed",
      memories: 0,
      eventCount: 0,
      lastEvent: null,
      wake: () => set({ awake: true }),
      trigger: (action) => {
        if (action === "idle" || get().action !== "idle") return;
        set({ awake: true, action });
        clearTimeout(actionTimer);
        actionTimer = setTimeout(() => set({ action: "idle" }), SCENE.actionMs);
      },
      care: (careAction, rawQuality = 1) => {
        const current = get();
        if (current.action !== "idle") return;
        const quality = Math.max(0.5, Math.min(1.5, rawQuality));
        const requestOrder: CareAction[] = ["feed", "play", "clean", "sleep"];
        const requestMatched = current.request === careAction;
        const combo = current.lastCare && current.lastCare !== careAction ? Math.min(4, current.careCombo + 1) : 1;
        const delta: Record<CareAction, Partial<PetStats>> = {
          feed: { hunger: 18 },
          play: { fun: 14, sleep: -4 },
          clean: { clean: 22 },
          sleep: { sleep: 24, hunger: -3 },
        };
        const nextStats = { ...current.stats };
        Object.entries(delta[careAction]).forEach(([key, value]) => {
          const stat = key as keyof PetStats;
          nextStats[stat] = Math.max(0, Math.min(100, nextStats[stat] + (value ?? 0)));
        });
        set({
          awake: true,
          action: careAction === "play" ? "play" : careAction === "feed" ? "call" : "feel",
          lastCare: careAction,
          stats: nextStats,
          bond: Math.min(100, current.bond + Math.round((requestMatched ? 5 : 3) * quality)),
          stardust: current.stardust + Math.round((25 + combo * 5) * quality),
          careCount: current.careCount + 1,
          careCombo: combo,
          signalEnergy: Math.min(100, current.signalEnergy + Math.round(((requestMatched ? 34 : 18) + combo * 3) * quality)),
          request: requestMatched ? requestOrder[(requestOrder.indexOf(careAction) + 1) % requestOrder.length] : current.request,
        });
        clearTimeout(actionTimer);
        actionTimer = setTimeout(() => set({ action: "idle" }), SCENE.actionMs);
      },
      triggerRandomEvent: (lastEvent) => {
        const current = get();
        const reward = lastEvent === "meteor" ? 90 : lastEvent === "gift" ? 65 : 50;
        set({
          lastEvent,
          eventCount: current.eventCount + 1,
          stardust: current.stardust + reward,
          signalEnergy: Math.min(100, current.signalEnergy + 12),
          bond: Math.min(100, current.bond + 2),
        });
      },
      equipCharm: (equippedCharm) => {
        if (equippedCharm === "rainy-day" && get().gameBest < 8) return;
        set({ equippedCharm });
      },
      finishGame: (score) => {
        const current = get();
        const requestMatched = current.request === "play";
        const combo = current.lastCare && current.lastCare !== "play" ? Math.min(4, current.careCombo + 1) : 1;
        set({
          action: "play",
          lastCare: "play",
          gameBest: Math.max(current.gameBest, score),
          stardust: current.stardust + score * 12,
          bond: Math.min(100, current.bond + Math.max(1, Math.floor(score / 2))),
          stats: { ...current.stats, fun: Math.min(100, current.stats.fun + score * 2) },
          careCount: current.careCount + 1,
          careCombo: combo,
          signalEnergy: Math.min(100, current.signalEnergy + (requestMatched ? 34 : 18) + combo * 3),
          request: requestMatched ? "clean" : current.request,
        });
        clearTimeout(actionTimer);
        actionTimer = setTimeout(() => set({ action: "idle" }), SCENE.actionMs);
      },
      claimDaily: () => {
        const current = get();
        if (current.dailyClaimed || current.careCount < 3 || current.gameBest < 5) return;
        set({ dailyClaimed: true, stardust: current.stardust + 250, bond: Math.min(100, current.bond + 5) });
      },
      activateSignalBurst: () => {
        const current = get();
        if (current.signalEnergy < 100 || current.action !== "idle") return;
        set({
          signalEnergy: 0,
          action: "feel",
          stardust: current.stardust + 180,
          bond: Math.min(100, current.bond + 6),
          memories: current.memories + 1,
        });
        clearTimeout(actionTimer);
        actionTimer = setTimeout(() => set({ action: "idle" }), SCENE.actionMs);
      },
      reset: () =>
        set({
          awake: false,
          action: "idle",
          lastCare: null,
          stats: initialStats,
          bond: 64,
          stardust: 1240,
          equippedCharm: "lucky-star",
          careCount: 0,
          gameBest: 0,
          dailyClaimed: false,
          signalEnergy: 0,
          careCombo: 0,
          request: "feed",
          memories: 0,
          eventCount: 0,
          lastEvent: null,
        }),
    }),
    { name: "tama-link-phase-two" },
  ),
);
