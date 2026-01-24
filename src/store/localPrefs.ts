// src/store/localPrefs.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import {
    createJSONStorage,
    persist,
    subscribeWithSelector,
} from "zustand/middleware";

const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, v));

interface LocalPrefsState {
    cadenceAssistEnabled: boolean;
    cadenceTarget: number; // spm
    setCadenceAssistEnabled: (v: boolean) => void;
    setCadenceTarget: (spm: number) => void;
    incCadenceTarget: (delta?: number) => void;
    decCadenceTarget: (delta?: number) => void;
}

const MIN_SPM = 100;
const MAX_SPM = 300;

export const useLocalPrefs = create<LocalPrefsState>()(
    subscribeWithSelector(
        persist(
            (set, get) => ({
                cadenceAssistEnabled: false,
                cadenceTarget: 180, // 기본값
                setCadenceAssistEnabled: (v) =>
                    set({ cadenceAssistEnabled: v }),
                setCadenceTarget: (spm) => {
                    const rounded = Number.isFinite(spm)
                        ? Math.round(spm)
                        : get().cadenceTarget;
                    set({
                        cadenceTarget: clamp(rounded, MIN_SPM, MAX_SPM),
                    });
                },
                incCadenceTarget: (delta = 10) => {
                    const next = clamp(
                        get().cadenceTarget + delta,
                        MIN_SPM,
                        MAX_SPM
                    );
                    set({ cadenceTarget: next });
                },
                decCadenceTarget: (delta = 10) => {
                    const next = clamp(
                        get().cadenceTarget - delta,
                        MIN_SPM,
                        MAX_SPM
                    );
                    set({ cadenceTarget: next });
                },
            }),
            {
                name: "local-prefs",
                storage: createJSONStorage(() => AsyncStorage),
                version: 1,
                partialize: (s) => ({
                    cadenceAssistEnabled: s.cadenceAssistEnabled,
                    cadenceTarget: s.cadenceTarget,
                }),
                migrate: (persistedState, version) => {
                    return persistedState as LocalPrefsState;
                },
            }
        )
    )
);

export const CADENCE_LIMITS = { MIN_SPM, MAX_SPM };
