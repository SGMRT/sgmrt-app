import { SignupState } from "@/src/types/signup";

interface SignInRequest {
    idToken: string;
}

interface SignResponse {
    uuid: string;
    accessToken: string;
    refreshToken: string;
}

type SignUpRequest = SignupState & {
    idToken: string;
};

type PatchUserInfoRequest = {
    nickname?: string;
    gender?: "MALE" | "FEMALE";
    height?: number | null;
    weight?: number | null;
};

type PatchUserSettingsRequest = {
    pushAlarmEnabled?: boolean;
    vibrationEnabled?: boolean;
};

type GetUserInfoResponse = {
    uuid: string;
    nickname: string;
    profilePictureUrl: string;
    gender: "MALE" | "FEMALE";
    weight: number | null;
    height: number | null;
    pushAlarmEnabled: boolean;
    vibrationEnabled: boolean;
};

export type {
    PatchUserInfoRequest,
    PatchUserSettingsRequest,
    SignInRequest,
    SignResponse,
    SignUpRequest,
    GetUserInfoResponse,
};
