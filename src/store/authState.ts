import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import {
    PersistStorage,
    persist,
    subscribeWithSelector,
} from "zustand/middleware";

const secureStorage: PersistStorage<AuthState> = {
    getItem: async (name) => {
        const raw = await SecureStore.getItemAsync(name);
        if (!raw) return null;

        try {
            return JSON.parse(raw);
        } catch (e) {
            console.warn("SecureStore parse error:", e);
            return null;
        }
    },
    setItem: async (name, value) => {
        await SecureStore.setItemAsync(name, JSON.stringify(value));
    },
    removeItem: async (name) => {
        await SecureStore.deleteItemAsync(name);
    },
};

interface AuthState {
    accessToken: string | null;
    refreshToken: string | null;
    isLoggedIn: boolean;

    login: (accessToken: string, refreshToken: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    subscribeWithSelector(
        persist(
            (set) => ({
                accessToken: null,
                refreshToken: null,
                isLoggedIn: false,

                login: (access, refresh) => {
                    set({
                        accessToken: access,
                        refreshToken: refresh,
                        isLoggedIn: true,
                    });
                },

                logout: () => {
                    set({
                        accessToken: null,
                        refreshToken: null,
                        isLoggedIn: false,
                    });
                },
            }),
            {
                name: "auth",
                storage: secureStorage,
            }
        )
    )
);
