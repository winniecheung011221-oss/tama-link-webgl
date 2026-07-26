import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SCENE } from "../config/experience";

export type PetAction = "idle" | "call" | "play" | "feel";
type TamaState = {
  awake: boolean;
  action: PetAction;
  wake: () => void;
  trigger: (action: PetAction) => void;
  reset: () => void;
};

let actionTimer: ReturnType<typeof setTimeout> | undefined;

export const useTamaStore = create<TamaState>()(
  persist(
    (set, get) => ({
      awake: false,
      action: "idle",
      wake: () => set({ awake: true }),
      trigger: (action) => {
        if (action === "idle" || get().action !== "idle") return;
        set({ awake: true, action });
        clearTimeout(actionTimer);
        actionTimer = setTimeout(() => set({ action: "idle" }), SCENE.actionMs);
      },
      reset: () => set({ awake: false, action: "idle" }),
    }),
    { name: "tama-link-phase-one" },
  ),
);
