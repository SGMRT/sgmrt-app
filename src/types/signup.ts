export interface SignupAgreement {
    serviceTermsAgreed: boolean;
    privacyPolicyAgreed: boolean;
    dataConsignmentAgreed: boolean;
    thirdPartyDataSharingAgreed: boolean;
    marketingAgreed: boolean;
    agreedAt: string | null;
}

export interface SignupState {
    nickname: string;
    profileImageUrl: string;
    gender: "MALE" | "FEMALE" | "";
    height: number | null;
    weight: number | null;
    agreement: SignupAgreement;
}
