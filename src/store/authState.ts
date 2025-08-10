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

export interface UserInfo {
    username: string;
    height: number | null;
    weight: number | null;
    age: number | null;
    gender: "MALE" | "FEMALE" | "";
}

export interface UserSettings {
    pushAlarmEnabled: boolean;
    vibrationEnabled: boolean;
}

interface AuthState {
    accessToken: string | null;
    refreshToken: string | null;
    uuid: string | null;
    isLoggedIn: boolean;

    userInfo: UserInfo | null;
    userSettings: UserSettings | null;
    login: (accessToken: string, refreshToken: string, uuid: string) => void;
    refresh: (accessToken: string, refreshToken: string) => void;
    logout: () => void;
    setUserInfo: (userInfo: UserInfo) => void;
    setUserSettings: (userSettings: UserSettings) => void;
}

export const useAuthStore = create<AuthState>()(
    subscribeWithSelector(
        persist(
            (set) => ({
                accessToken: null,
                refreshToken: null,
                uuid: null,
                isLoggedIn: false,
                userInfo: null,
                userSettings: null,
                login: (access, refresh, uuid) => {
                    set({
                        accessToken: access,
                        refreshToken: refresh,
                        uuid: uuid,
                        isLoggedIn: true,
                    });
                },

                refresh: (access, refresh) => {
                    set({
                        accessToken: access,
                        refreshToken: refresh,
                    });
                },

                setUserInfo: (userInfo: UserInfo) => {
                    set({ userInfo });
                },

                setUserSettings: (userSettings: UserSettings) => {
                    set({ userSettings });
                },

                logout: () => {
                    set({
                        accessToken: null,
                        refreshToken: null,
                        uuid: null,
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
