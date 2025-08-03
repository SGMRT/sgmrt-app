import { useAuthStore } from "../store/authState";
import { SignupAgreement } from "../types/signup";
import server from "./instance";
import {
    GetUserInfoResponse,
    PatchUserInfoRequest,
    PatchUserSettingsRequest,
    SignInRequest,
    SignResponse,
    SignUpRequest,
} from "./types/user";

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
                withAuth: false,
            }
        );
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function signUp(data: SignUpRequest): Promise<SignResponse> {
    try {
        const response = await server.post(`auth/firebase-signup`, data, {
            headers: {
                Authorization: `Bearer ${data.idToken}`,
            },
            withAuth: false,
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
                withAuth: false,
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

export async function postTermsAgreement(termsAgreement: SignupAgreement) {
    try {
        const { uuid } = useAuthStore.getState();
        const response = await server.post(
            `members/${uuid}/terms-agreement`,
            termsAgreement
        );
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function getUserInfo(): Promise<GetUserInfoResponse> {
    try {
        const { uuid } = useAuthStore.getState();
        const response = await server.get(`members/${uuid}`);
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function deleteUser() {
    try {
        const { uuid } = useAuthStore.getState();
        const response = await server.delete(`members/${uuid}`);
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function patchUserInfo(data: PatchUserInfoRequest) {
    const updateAttrs = Object.keys(data).map((key) => key.toUpperCase());
    try {
        const { uuid } = useAuthStore.getState();
        const response = await server.patch(`members/${uuid}`, {
            updateAttrs,
            ...data,
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export async function patchUserSettings(data: PatchUserSettingsRequest) {
    try {
        const { uuid } = useAuthStore.getState();
        const response = await server.patch(`members/${uuid}/settings`, data);
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}
