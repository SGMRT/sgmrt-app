import * as Sentry from "@sentry/react-native";
import axios from "axios";
import { router } from "expo-router";
import { useAuthStore } from "../store/authState";

let refreshingPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
    if (!refreshingPromise) {
        const { refreshToken } = useAuthStore.getState();
        refreshingPromise = server
            .post(
                "auth/reissue",
                {},
                {
                    headers: { Authorization: `Bearer ${refreshToken}` },
                    canRetry: false,
                    withAuth: false,
                    timeout: 10000,
                }
            )
            .then((res) => {
                const {
                    uuid,
                    accessToken,
                    refreshToken: newRefresh,
                } = res.data;
                useAuthStore.getState().login(accessToken, newRefresh, uuid);
                return accessToken;
            })
            .catch((e) => {
                // refresh 실패 → 강제 로그아웃
                useAuthStore.getState().logout();
                router.dismissAll();
                router.replace("/(auth)/login");
                throw e;
            })
            .finally(() => {
                refreshingPromise = null;
            });
    }
    return refreshingPromise;
}

function withVersionPath(url: string | undefined, version: "v1" | "v2") {
    if (!url) return `/${version}/`;
    if (/^https?:\/\//.test(url)) return url;
    const trimmed = url.replace(/^\?(v1|v2)\//, "").replace(/^\/+/, "");
    return `/${version}/${trimmed}`;
}

declare module "axios" {
    interface AxiosRequestConfig {
        canRetry?: boolean;
        retryCount?: number;
        withAuth?: boolean;
        apiVersion?: "v1" | "v2";
    }
}

const apiUrl = __DEV__
    ? process.env.EXPO_PUBLIC_DEV_API_URL
    : process.env.EXPO_PUBLIC_API_URL;

const server = axios.create({
    baseURL: apiUrl,
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 30000,
    canRetry: true,
});

server.interceptors.request.use((config) => {
    if (config.canRetry === undefined) config.canRetry = true;
    if (config.retryCount === undefined) config.retryCount = 0;
    if (config.withAuth === undefined) config.withAuth = true;
    if (config.apiVersion === undefined) config.apiVersion = "v1";

    config.url = withVersionPath(config.url, config.apiVersion);

    const { accessToken } = useAuthStore.getState();
    if (accessToken && config.withAuth) {
        config.headers.Authorization = `Bearer ${accessToken}`;
    }
    // FormData 전송 시에는 Axios가 boundary를 포함한 헤더를 설정할 수 있도록 강제로 제거
    if (
        typeof FormData !== "undefined" &&
        config.data instanceof FormData &&
        config.headers["Content-Type"]
    ) {
        delete config.headers["Content-Type"];
    }
    // 그 외에는 기본값을 JSON으로 설정
    if (
        !(typeof FormData !== "undefined" && config.data instanceof FormData) &&
        config.headers["Content-Type"] === undefined
    ) {
        config.headers["Content-Type"] = "application/json";
    }
    return config;
});

server.interceptors.response.use(
    (response) => response,
    async (error) => {
        // 네트워크 에러나 CORS 등 response 없는 케이스 가드
        const status = error?.response?.status;
        const cfg = error?.config ?? {};
        cfg.retryCount = cfg.retryCount ?? 0;
        cfg.canRetry = cfg.canRetry ?? true;
        cfg.withAuth = cfg.withAuth ?? true;

        // 401 처리
        if (status === 401) {
            // refresh 자체 실패면 바로 로그아웃된 상태이므로 reject
            // (refresh 요청에는 canRetry:false 로 보냈으니 여기로 안 옴)
            if (cfg.canRetry && cfg.retryCount < 1) {
                try {
                    await refreshAccessToken();
                    cfg.retryCount += 1;
                    return server.request(cfg);
                } catch (e) {
                    return Promise.reject(e);
                }
            } else {
                useAuthStore.getState().logout();
                return Promise.reject(error);
            }
        }

        try {
            const redact = (v?: string) =>
                v
                    ? v.replace(
                          /Bearer\s+[A-Za-z0-9._-]+/g,
                          "Bearer [REDACTED]"
                      )
                    : "";

            // cfg는 error.config의 참조이므로 여기서 바꾸면 error.config에도 반영됨
            const setMasked = (headers?: any) => {
                if (!headers) return;
                const raw = headers.Authorization ?? headers.authorization;
                const masked = redact(raw);
                if (!masked) return;

                // axios v1에서 AxiosHeaders일 수도 있으니 set 지원도 처리
                if (typeof headers.set === "function") {
                    headers.set("Authorization", masked);
                } else {
                    headers.Authorization = masked;
                    if ("authorization" in headers)
                        headers.authorization = masked;
                }
            };

            setMasked(cfg?.headers);
            setMasked(error?.config?.headers); // 방어적 중복
            setMasked(error?.response?.config?.headers); // 방어적 중복

            Sentry.withScope((scope: Sentry.Scope) => {
                scope.setTags({
                    api: cfg?.url,
                    "api.request.method": cfg?.method?.toUpperCase?.(),
                    "api.request.url": cfg?.url,
                    "api.request.params": JSON.stringify(cfg?.params || {}),
                    "api.response.status": String(status || ""),
                });
                scope.setContext("request", {
                    headers: {
                        Authorization: cfg?.headers?.Authorization, // 이미 [REDACTED]
                        "Content-Type": cfg?.headers?.["Content-Type"],
                    },
                });
                scope.setContext("response", { data: error?.response?.data });

                if (error?.response?.data?.message) {
                    error.message = `[${error.response.data.code}] ${error.response.data.message}`;
                    Sentry.captureException(error, {
                        fingerprint: [error.response.data.message],
                    });
                } else {
                    Sentry.captureException(error);
                }
            });
        } catch {
            /* no-op */
        }

        return Promise.reject(error);
    }
);

export default server;

export function requestV1<T = any>(cfg: import("axios").AxiosRequestConfig) {
    return server.request<T>({ ...cfg, apiVersion: "v1" });
}
export function requestV2<T = any>(cfg: import("axios").AxiosRequestConfig) {
    return server.request<T>({ ...cfg, apiVersion: "v2" });
}
