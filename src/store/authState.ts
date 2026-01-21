import * as amplitude from "@amplitude/analytics-react-native";
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import {
    PersistStorage,
    persist,
    subscribeWithSelector,
} from "zustand/middleware";
import { errorLog } from "../utils/devLog";

const secureStorage: PersistStorage<AuthState> = {
    getItem: async (name) => {
        const raw = await SecureStore.getItemAsync(name);
        if (!raw) return null;

        try {
            return JSON.parse(raw);
        } catch (e) {
            errorLog("SecureStore parse error:", e);
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

/**
 * 인증 상태 관리
 *
 * 토큰과 로그인 상태만 관리합니다.
 * 사용자 정보(userInfo, userSettings)는 React Query로 관리합니다.
 *
 * @see src/features/user/hooks/useUserInfo.ts
 */
interface AuthState {
    accessToken: string | null;
    refreshToken: string | null;
    uuid: string | null;
    isLoggedIn: boolean;
    login: (accessToken: string, refreshToken: string, uuid: string) => void;
    refresh: (accessToken: string, refreshToken: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    subscribeWithSelector(
        persist(
            (set) => ({
                accessToken: null,
                refreshToken: null,
                uuid: null,
                isLoggedIn: false,

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

                logout: () => {
                    set({
                        accessToken: null,
                        refreshToken: null,
                        uuid: null,
                        isLoggedIn: false,
                    });
                    amplitude.reset();
                },
            }),
            {
                name: "auth",
                storage: secureStorage,
            }
        )
    )
);
