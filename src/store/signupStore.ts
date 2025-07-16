// stores/signupStore.ts
import { create } from "zustand";
import { SignupAgreement, SignupState } from "../types/signup";

const initialAgreement: SignupAgreement = {
    serviceTermsAgreed: false,
    privacyPolicyAgreed: false,
    dataConsignmentAgreed: false,
    thirdPartyDataSharingAgreed: false,
    marketingAgreed: false,
    agreedAt: null,
};

const initialState: SignupState = {
    nickname: "",
    profileImageUrl: "",
    gender: "",
    height: null,
    weight: null,
    agreement: initialAgreement,
};

type SignupStore = SignupState & {
    agreementFullfilled: boolean;
    allAgreementFullfilled: boolean;
    setNickname: (nickname: string) => void;
    setProfileImageUrl: (url: string) => void;
    setGender: (gender: "MALE" | "FEMALE" | "") => void;
    setHeight: (height: number | null) => void;
    setWeight: (weight: number | null) => void;
    toggleAgreement: (key: keyof SignupAgreement) => void;
    toggleAllAgreement: (value: boolean) => void;
    reset: () => void;
};

export const useSignupStore = create<SignupStore>((set) => ({
    ...initialState,

    agreementFullfilled: false,
    allAgreementFullfilled: false,
    setNickname: (nickname) => set({ nickname }),
    setProfileImageUrl: (url) => set({ profileImageUrl: url }),
    setGender: (gender) => set({ gender }),
    setHeight: (height) => set({ height }),
    setWeight: (weight) => set({ weight }),
    toggleAgreement: (key) =>
        set((state) => {
            const updatedAgreement = {
                ...state.agreement,
                [key]: !state.agreement[key],
            };
            const agreementFullfilled =
                updatedAgreement.serviceTermsAgreed &&
                updatedAgreement.privacyPolicyAgreed &&
                updatedAgreement.dataConsignmentAgreed &&
                updatedAgreement.thirdPartyDataSharingAgreed;
            const allAgreementFullfilled =
                agreementFullfilled && updatedAgreement.marketingAgreed;

            return {
                agreement: updatedAgreement,
                agreementFullfilled,
                allAgreementFullfilled,
            };
        }),

    toggleAllAgreement: (value) =>
        set((state) => {
            const updatedAgreement = {
                ...state.agreement,
                serviceTermsAgreed: value,
                privacyPolicyAgreed: value,
                dataConsignmentAgreed: value,
                thirdPartyDataSharingAgreed: value,
                marketingAgreed: value,
            };
            const agreementFullfilled =
                updatedAgreement.serviceTermsAgreed &&
                updatedAgreement.privacyPolicyAgreed &&
                updatedAgreement.dataConsignmentAgreed &&
                updatedAgreement.thirdPartyDataSharingAgreed;
            const allAgreementFullfilled =
                agreementFullfilled && updatedAgreement.marketingAgreed;

            return {
                agreement: updatedAgreement,
                agreementFullfilled,
                allAgreementFullfilled,
            };
        }),
    reset: () => set({ ...initialState }),
}));
