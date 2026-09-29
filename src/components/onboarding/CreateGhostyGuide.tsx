import { Onboarding, Step } from "./Onboarding";

const steps: Step[] = [
    {
        title: "나만의 러닝메이트 고스티를 만들고\n맞춤 플랜을 받아 보세요",
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
