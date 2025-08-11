import * as Sentry from "@sentry/react-native";
import axios from "axios";
import { useAuthStore } from "../store/authState";

declare module "axios" {
    interface AxiosRequestConfig {
        canRetry?: boolean;
        retryCount?: number;
        withAuth?: boolean;
    }
}

const server = axios.create({
    baseURL: process.env.EXPO_PUBLIC_API_URL + "/v1/",
    headers: {
        "Content-Type": "application/json",
    },
    canRetry: true,
});

server.interceptors.request.use((config) => {
    if (config.canRetry === undefined) {
        config.canRetry = true;
    }
    if (config.retryCount === undefined) {
        config.retryCount = 0;
    }
    if (config.withAuth === undefined) {
        config.withAuth = true;
    }
    const { accessToken } = useAuthStore.getState();
    if (accessToken && config.withAuth) {
        config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
});

server.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        if (
            error.response.status === 401 &&
            error.config.canRetry &&
            error.config.retryCount < 3
        ) {
            if (error.config.retryCount === 0) {
                return await server
                    .post(
                        `auth/reissue`,
                        {},
                        {
                            headers: {
                                Authorization: `Bearer ${
                                    useAuthStore.getState().refreshToken
                                }`,
                            },
                            canRetry: false,
                            withAuth: false,
                        }
                    )
                    .then((res) => {
                        const { uuid, accessToken, refreshToken } = res.data;
                        useAuthStore
                            .getState()
                            .login(uuid, accessToken, refreshToken);
                        error.config.retryCount = error.config.retryCount + 1;
                        error.config.withAuth = false;
                        error.config.headers = {
                            Authorization: `Bearer ${accessToken}`,
                        };
                        return server.request(error.config);
                    });
            }
        } else if (error.response.status === 401) {
            useAuthStore.getState().logout();
            return Promise.reject(error);
        }

        console.log(error.response.data);

        Sentry.withScope((scope: Sentry.Scope) => {
            scope.setTags({
                api: error.response?.config.url,
                "api.request.method": error.config?.method?.toUpperCase(),
                "api.response.status": (
                    error.response?.status || ""
                ).toString(),
                "api.response.data": error.response?.data,
            });
            error.message = error.response?.data.message;
            Sentry.captureException(error, {
                fingerprint: [error.response?.data.message],
            });
        });

        return Promise.reject(error);
    }
);

export default server;
