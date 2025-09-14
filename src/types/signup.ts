export interface SignupAgreement {
    serviceTermsAgreed: boolean;
    privacyPolicyAgreed: boolean;
    personalInformationUsageConsentAgreed: boolean;
    agreedAt: string | null;
}

export interface SignupState {
    nickname: string;
    profileImageUrl: string | null;
    gender: "MALE" | "FEMALE" | "";
    age: number | null;
    height: number | null;
    weight: number | null;
    agreement: SignupAgreement;
}
