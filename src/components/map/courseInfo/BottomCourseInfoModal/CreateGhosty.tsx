import { HeartIcon } from "@/assets/svgs/svgs";
import { Button } from "@/src/components/ui/Button";
import { LevelCheck } from "@/src/components/ui/LevelCheck";
import { ProgressLing } from "@/src/components/ui/ProgressLing";
import { Typography } from "@/src/components/ui/Typography";
import { useEffect, useState } from "react";
import { View } from "react-native";

export const CreateGhosty = () => {
    const [step, setStep] = useState(0);

    const next = () => setStep((prev) => prev + 1);
    const prev = () => setStep((prev) => Math.max(0, prev - 1));

    const steps = [
        <StepSelectGhosty />,
        <StepConditionCheck />,
        <StepCreating onComplete={next} />,
        <StepComplete />,
        <StepGhostySummary />,
    ];

    return (
        <View>
            {steps[step]}

            <Button type="active" title="다음" onPress={next} />
        </View>
    );
};

const StepSelectGhosty = () => {
    return (
        <View style={{ marginBottom: 30 }}>
            <Typography
                variant="sectionhead"
                color="white"
                style={{ textAlign: "center", marginBottom: 10 }}
            >
                소고기마라탕 코스를 함께할{"\n"}고스티를 선택해 주세요
            </Typography>
        </View>
    );
};

const StepConditionCheck = () => {
    const [level, setLevel] = useState(1);

    return (
        <View style={{ alignItems: "center", gap: 10, marginBottom: 32 }}>
            <View style={{ gap: 4, marginBottom: 10 }}>
                <Typography
                    variant="sectionhead"
                    color="white"
                    style={{ textAlign: "center" }}
                >
                    오늘의 컨디션은 어떤가요?{"\n"}고스티가 참고할게요
                </Typography>
                <Typography variant="body3" color="gray40">
                    나쁨, 좋음을 기준으로 5단계 중 선택해 주세요
                </Typography>
            </View>
            <LevelCheck
                maxLevel={5}
                level={level}
                setLevel={setLevel}
                label={{ left: "나쁨", right: "좋음", gap: 23 }}
                icon={{ icon: <HeartIcon />, gap: 14 }}
                style={{ marginVertical: 19 }}
            />
        </View>
    );
};

const messages = [
    `고스티를 부르고 있어요${"\n"}잠시만 기다려 주세요`,
    `고스티가 코스를 살피고 있어요${"\n"}준비운동은 하셨나요?`,
    `고스티가 신발 끈을 묶고 있어요${"\n"}곧 러닝이 시작돼요`,
];

const StepCreating = ({ onComplete }: { onComplete: () => void }) => {
    const [message, setMessage] = useState(messages[0]);

    const [progress, setProgress] = useState(0.4);

    // 프로그래스 시뮬레이션
    useEffect(() => {
        const interval = setInterval(() => {
            setProgress((prev) => prev + 0.01);
        }, 100);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (progress >= 1) {
            onComplete();
        }

        if (progress >= 0.4 && progress < 0.8) {
            setMessage(messages[1]);
        } else if (progress >= 0.8) {
            setMessage(messages[2]);
        }
    }, [progress]);

    return (
        <View style={{ gap: 5, marginBottom: 29, alignItems: "center" }}>
            <Typography
                variant="sectionhead"
                color="white"
                style={{ textAlign: "center", marginBottom: 20 }}
            >
                {message}
            </Typography>
            <View style={{ alignItems: "center" }}>
                <ProgressLing containerSize={80} />
                <Typography variant="body3" color="gray40">
                    {Math.round(progress * 100)}%
                </Typography>
            </View>
        </View>
    );
};

const StepComplete = () => {
    return (
        <View>
            <Typography variant="sectionhead" color="white">
                고스티를 만들었어요
            </Typography>
        </View>
    );
};

const StepGhostySummary = () => {
    return (
        <View>
            <Typography variant="sectionhead" color="white">
                고스티 요약
            </Typography>
        </View>
    );
};
