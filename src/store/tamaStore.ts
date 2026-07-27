import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SCENE } from "../config/experience";

export type PetAction = "idle" | "call" | "play" | "feel";
export type CareAction = "feed" | "play" | "clean" | "sleep";
export type Charm = "lucky-star" | "glow-cube" | "rainy-day";

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
  wake: () => void;
  trigger: (action: PetAction) => void;
  care: (action: CareAction) => void;
  equipCharm: (charm: Charm) => void;
  finishGame: (score: number) => void;
  claimDaily: () => void;
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
      wake: () => set({ awake: true }),
      trigger: (action) => {
        if (action === "idle" || get().action !== "idle") return;
        set({ awake: true, action });
        clearTimeout(actionTimer);
        actionTimer = setTimeout(() => set({ action: "idle" }), SCENE.actionMs);
      },
      care: (careAction) => {
        const current = get();
        if (current.action !== "idle") return;
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
          bond: Math.min(100, current.bond + 3),
          stardust: current.stardust + 25,
          careCount: current.careCount + 1,
        });
        clearTimeout(actionTimer);
        actionTimer = setTimeout(() => set({ action: "idle" }), SCENE.actionMs);
      },
      equipCharm: (equippedCharm) => {
        if (equippedCharm === "rainy-day" && get().gameBest < 8) return;
        set({ equippedCharm });
      },
      finishGame: (score) => {
        const current = get();
        set({
          action: "play",
          lastCare: "play",
          gameBest: Math.max(current.gameBest, score),
          stardust: current.stardust + score * 12,
          bond: Math.min(100, current.bond + Math.max(1, Math.floor(score / 2))),
          stats: { ...current.stats, fun: Math.min(100, current.stats.fun + score * 2) },
        });
        clearTimeout(actionTimer);
        actionTimer = setTimeout(() => set({ action: "idle" }), SCENE.actionMs);
      },
      claimDaily: () => {
        const current = get();
        if (current.dailyClaimed || current.careCount < 3 || current.gameBest < 5) return;
        set({ dailyClaimed: true, stardust: current.stardust + 250, bond: Math.min(100, current.bond + 5) });
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
        }),
    }),
    { name: "tama-link-phase-two" },
  ),
);
