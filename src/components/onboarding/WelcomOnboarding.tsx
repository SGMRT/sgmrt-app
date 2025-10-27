import { ConfettiMethods } from "react-native-fast-confetti";
import { Onboarding, Step } from "./Onboarding";

const steps: Step[] = [
    {
        title: `내 주변 코스를 탐색하고\n러닝 후 나만의 코스도 등록해 보세요`,
        image: require("@/assets/images/onboarding/onboarding_1.png"),
    },
    {
        title: `어떤 코스가 제일 인기 있을까?\n목록을 열어 확인해 보세요`,
        image: require("@/assets/images/onboarding/onboarding_2.png"),
    },
    {
        title: "코스별 내 최고 기록이 고스트로 남아요\n고스트와 달려 나를 넘어보세요",
        image: require("@/assets/images/onboarding/onboarding_3.png"),
    },
    {
        title: "고스트와 나는 색으로 구분돼요\n작은 숫자는 내 과거 기록과의 차이에요",
        image: require("@/assets/images/onboarding/onboarding_4.png"),
    },
    {
        title: "나의 러닝메이트 고스티 생성으로\n맞춤 플랜을 제공받아보세요",
        image: require("@/assets/images/onboarding/onboarding_ghosty.png"),
    },
    {
        title: "모든 준비가 끝났어요\n어제의 나를 뛰어넘을 준비가 되셨나요?",
        subTitle: "내 정보는 마이페이지의 회원 정보에서 변경 가능해요",
        image: require("@/assets/images/onboarding/onboarding_5.png"),
    },
];

interface WelcomeOnboardingProps {
    show: boolean;
    handleClose: () => void;
    confettiRef: React.RefObject<ConfettiMethods | null>;
}

export const WelcomeOnboarding = ({
    show,
    handleClose,
    confettiRef,
}: WelcomeOnboardingProps) => {
    return (
        <Onboarding
            steps={steps}
            show={show}
            handleClose={handleClose}
            confettiRef={confettiRef}
        />
    );
};
