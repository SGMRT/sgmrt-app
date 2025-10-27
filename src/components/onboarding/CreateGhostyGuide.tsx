import { Onboarding, Step } from "./Onboarding";

const steps: Step[] = [
    {
        title: "나의 러닝메이트 고스티 생성으로\n맞춤 플랜을 제공받아보세요",
        image: require("@/assets/images/onboarding/onboarding_ghosty.png"),
    },
];

interface CreateGhostyGuideProps {
    show: boolean;
    handleClose: () => void;
}

export const CreateGhostyGuide = ({
    show,
    handleClose,
}: CreateGhostyGuideProps) => {
    return (
        <Onboarding
            steps={steps}
            show={show}
            handleClose={handleClose}
            endTitle="다음"
        />
    );
};
