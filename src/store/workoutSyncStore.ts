import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface LocalWorkoutSyncState {
    importedWorkoutIds: string[];
    addImportedId: (id: string) => void;
    removeImportedId: (id: string) => void;
    reset: () => void;
}

export const localWorkoutSyncStore = create<LocalWorkoutSyncState>()(
    persist(
        (set) => ({
            importedWorkoutIds: [],
            addImportedId: (id: string) =>
                set((state) =>
                    state.importedWorkoutIds.includes(id)
                        ? state
                        : {
                              importedWorkoutIds: [
                                  ...state.importedWorkoutIds,
                                  id,
                              ],
                          }
                ),
            removeImportedId: (id: string) =>
                set((state) => ({
                    importedWorkoutIds: state.importedWorkoutIds.filter(
                        (x) => x !== id
                    ),
                })),
            reset: () => set({ importedWorkoutIds: [] }),
        }),
        {
            name: "workout-sync.v1",
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
