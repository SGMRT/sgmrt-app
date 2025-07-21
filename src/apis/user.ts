import { useAuthStore } from "../store/authState";
import { SignupState } from "../types/signup";
import server from "./instance";

interface SignInRequest {
    idToken: string;
}

interface SignResponse {
    uuid: string;
    accessToken: string;
    refreshToken: string;
}

export async function signIn(data: SignInRequest): Promise<SignResponse> {
    console.log("signIn", data);
    try {
        const response = await server.post(
            `auth/firebase-signin`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${data.idToken}`,
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

type SignUpRequest = SignupState & {
    idToken: string;
};

export async function signUp(data: SignUpRequest): Promise<SignResponse> {
    try {
        const response = await server.post(`auth/firebase-signup`, data, {
            headers: {
                Authorization: `Bearer ${data.idToken}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function reIssueToken() {
    try {
        const response = await server.post(
            `auth/reissue`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${
                        useAuthStore.getState().refreshToken
                    }`,
                },
                canRetry: false,
            }
        );
        const { uuid, accessToken, refreshToken } = response.data;
        useAuthStore.getState().login(uuid, accessToken, refreshToken);
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function invalidateToken() {
    try {
        const response = await server.post(
            `auth/logout`,
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
        );
        useAuthStore.getState().logout();
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}
