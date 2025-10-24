import { HeartIcon } from "@/assets/svgs/svgs";
import { Button } from "@/src/components/ui/Button";
import { LevelCheck } from "@/src/components/ui/LevelCheck";
import { ProgressLing } from "@/src/components/ui/ProgressLing";
import { TextWithSub } from "@/src/components/ui/TextWithSub";
import { Typography } from "@/src/components/ui/Typography";
import { Dispatch, useEffect, useReducer, useState } from "react";
import { View } from "react-native";

enum RunExperience {
    ADVANCED = "상급자",
    INTERMEDIATE = "중급자",
    BEGINNER = "입문자",
}

enum RunPurpose {
    RECOVERY_JOGGING = "감각을 찾는 회복 러닝",
    STAMINA = "꾸준히 달리며 체력 증진",
    SPEED = "속도를 높이고 한계에 도전",
    MARATHON = "긴 여정을 달리는 마라톤",
    FREE = "기분 가는 대로 달리기",
}

enum Condition {
    LEVEL_1 = 1,
    LEVEL_2 = 2,
    LEVEL_3 = 3,
    LEVEL_4 = 4,
    LEVEL_5 = 5,
}

const initialState: {
    experience: RunExperience | null;
    ghosty: RunPurpose | null;
    condition: Condition | null;
} = {
    experience: RunExperience.ADVANCED,
    ghosty: RunPurpose.RECOVERY_JOGGING,
    condition: Condition.LEVEL_1,
};

const reducer = (
    state: typeof initialState,
    action: {
        type: "setExperience" | "setGhosty" | "setCondition";
        payload: RunExperience | RunPurpose | Condition | null;
    }
): typeof initialState => {
    switch (action.type) {
        case "setExperience":
            return { ...state, experience: action.payload as RunExperience };
        case "setGhosty":
            return { ...state, ghosty: action.payload as RunPurpose };
        case "setCondition":
            return { ...state, condition: action.payload as Condition };
        default:
            return state;
    }
};

export const CreateGhosty = ({ handleClose }: { handleClose: () => void }) => {
    const [step, setStep] = useState<number | null>(null);

    const [state, dispatch] = useReducer(reducer, initialState);

    const next = () =>
        setStep((prev) => Math.min((prev ?? 0) + 1, steps.length - 1));

    const steps = [
        <StepCheckExperience
            key="check-experience"
            state={state}
            dispatch={dispatch}
        />,
        <StepSelectGhosty
            key="select-ghosty"
            state={state}
            dispatch={dispatch}
        />,
        <StepConditionCheck
            key="condition-check"
            state={state}
            dispatch={dispatch}
        />,
        <StepCreating key="creating" />,
    ];

    useEffect(() => {
        (async () => {
            const hasRunHistory = false;
            setStep(hasRunHistory ? 1 : 0);
        })();
    }, []);

    if (step === null) return <View />;

    return (
        <View>
            {steps[step]}
            <Button
                type="active"
                title={step === steps.length - 1 ? "네, 좋아요" : "다음"}
                onPress={step === steps.length - 1 ? handleClose : next}
            />
        </View>
    );
};

const StepCheckExperience = ({
    dispatch,
    state,
}: {
    state: typeof initialState;
    dispatch: Dispatch<{ type: "setExperience"; payload: RunExperience }>;
}) => {
    const handleExperience = (experience: RunExperience) => {
        dispatch({ type: "setExperience", payload: experience });
    };

    return (
        <View>
            <TextWithSub
                title="러닝 경험이 있으신가요?"
                sub="첫 러닝 이후엔 고스티가 이전 기록을 참고할게요"
                containerStyle={{ marginBottom: 30 }}
            />
            <View style={{ gap: 10, marginBottom: 30 }}>
                {Object.values(RunExperience).map((experience) => (
                    <Button
                        key={experience}
                        title={experience}
                        onPress={() => handleExperience(experience)}
                        containerStyle={{
                            height: 58,
                            paddingTop: 0,
                        }}
                        type={
                            state.experience === experience
                                ? "dark-active"
                                : "dark-inactive"
                        }
                    />
                ))}
            </View>
        </View>
    );
};

const StepSelectGhosty = ({
    dispatch,
    state,
}: {
    state: typeof initialState;
    dispatch: Dispatch<{ type: "setGhosty"; payload: RunPurpose }>;
}) => {
    const handleGhosty = (ghosty: RunPurpose) => {
        dispatch({ type: "setGhosty", payload: ghosty });
    };

    return (
        <View>
            <TextWithSub
                title="고스티의 특성을 선택해 주세요"
                sub="소고기마라탕을 함께할 고스티들이에요"
                containerStyle={{ marginBottom: 30 }}
            />
            <View style={{ gap: 10, marginBottom: 30 }}>
                {Object.values(RunPurpose).map((ghosty) => (
                    <Button
                        key={ghosty}
                        title={ghosty}
                        onPress={() => handleGhosty(ghosty)}
                        containerStyle={{
                            height: 58,
                            paddingTop: 0,
                        }}
                        type={
                            state.ghosty === ghosty
                                ? "dark-active"
                                : "dark-inactive"
                        }
                    />
                ))}
            </View>
        </View>
    );
};

const StepConditionCheck = ({
    state,
    dispatch,
}: {
    state: typeof initialState;
    dispatch: Dispatch<{ type: "setCondition"; payload: Condition }>;
}) => {
    const handleCondition = (condition: Condition) => {
        dispatch({ type: "setCondition", payload: condition });
    };

    return (
        <View style={{ alignItems: "center", gap: 10, marginBottom: 32 }}>
            <TextWithSub
                title={`오늘의 컨디션은 어떤가요?\n고스티가 참고할게요`}
                sub="나쁨, 좋음을 기준으로 5단계 중 선택해 주세요"
                containerStyle={{ marginBottom: 10 }}
            />
            <LevelCheck
                maxLevel={5}
                level={state.condition ?? 0}
                setLevel={(level) => handleCondition(level as Condition)}
                label={{ left: "나쁨", right: "좋음", gap: 23 }}
                icon={{ icon: <HeartIcon />, gap: 14 }}
                style={{ marginVertical: 19 }}
            />
        </View>
    );
};

const StepCreating = () => {
    return (
        <View style={{ marginBottom: 45, alignItems: "center" }}>
            <Typography
                variant="sectionhead"
                color="white"
                style={{ textAlign: "center", marginBottom: 30 }}
            >
                어떤 고스티가 함께할까요?{"\n"}고스티가 준비되면 알려드릴게요
            </Typography>
            <View style={{ alignItems: "center" }}>
                <ProgressLing containerSize={80} />
            </View>
        </View>
    );
};
