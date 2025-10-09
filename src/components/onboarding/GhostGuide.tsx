import { Onboarding, Step } from "./Onboarding";

const steps: Step[] = [
    {
        title: "코스별 내 최고 기록이 고스트로 남아요\n고스트와 달려 나를 넘어보세요",
        image: require("@/assets/images/onboarding/onboarding_3.png"),
    },
    {
        title: "고스트와 나는 색으로 구분돼요\n작은 숫자는 내 과거 기록과의 차이에요",
        image: require("@/assets/images/onboarding/onboarding_4.png"),
    },
];

interface GhostGuideProps {
    show: boolean;
    handleClose: () => void;
}

export const GhostGuide = ({ show, handleClose }: GhostGuideProps) => {
    return (
        <Onboarding
            steps={steps}
            show={show}
            handleClose={handleClose}
            endTitle="다음"
        />
    );
};
