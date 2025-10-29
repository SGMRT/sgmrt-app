import { HeartIcon } from "@/assets/svgs/svgs";
import { getVDOTInfo, postVDOTInfo } from "@/src/apis";
import { CourseResponse } from "@/src/apis/types/course";
import { Condition, GhostyType, VDOTLevel } from "@/src/apis/types/ghosty";
import { Button } from "@/src/components/ui/Button";
import { LevelCheck } from "@/src/components/ui/LevelCheck";
import { ProgressLing } from "@/src/components/ui/ProgressLing";
import { TextWithSub } from "@/src/components/ui/TextWithSub";
import { showCompactToast } from "@/src/components/ui/toastConfig";
import { Typography } from "@/src/components/ui/Typography";
import { createGhostyWithRetries } from "@/src/features/pacemaker/createGhostyWithRetries";
import { usePacemakerQueue } from "@/src/features/pacemaker/store/queueStore";
import { useLocationInfoStore } from "@/src/store/locationInfo";
import { useQueryClient } from "@tanstack/react-query";
import { Dispatch, useEffect, useReducer, useState } from "react";
import { View } from "react-native";

const initialState: {
    experience: VDOTLevel | null;
    ghosty: GhostyType;
    condition: Condition;
} = {
    experience: null,
    ghosty: GhostyType.RECOVERY_JOGGING,
    condition: Condition.LEVEL_1,
};

const reducer = (
    state: typeof initialState,
    action: {
        type: "setExperience" | "setGhosty" | "setCondition";
        payload: VDOTLevel | GhostyType | Condition | null;
    }
): typeof initialState => {
    switch (action.type) {
        case "setExperience":
            return { ...state, experience: action.payload as VDOTLevel };
        case "setGhosty":
            return { ...state, ghosty: action.payload as GhostyType };
        case "setCondition":
            return { ...state, condition: action.payload as Condition };
        default:
            return state;
    }
};

export const CreateGhosty = ({
    course,
    handleClose,
}: {
    course: CourseResponse;
    handleClose: () => void;
}) => {
    const { addJob } = usePacemakerQueue();
    const queryClient = useQueryClient();
    const { temperature } = useLocationInfoStore();
    const [step, setStep] = useState<number | null>(null);
    const [state, dispatch] = useReducer(reducer, initialState);
    const [isCreating, setIsCreating] = useState(false);

    const handleNext = async () => {
        if (step === steps.length - 2) {
            await handleCreateGhosty();
        }
        setStep((prev) => Math.min((prev ?? 0) + 1, steps.length - 1));
    };

    const handleCreateGhosty = async () => {
        try {
            setIsCreating(true);
            if (state.experience) {
                await postVDOTInfo(
                    Object.keys(VDOTLevel).find(
                        (key) =>
                            VDOTLevel[key as keyof typeof VDOTLevel] ===
                            state.experience
                    ) as VDOTLevel
                );
            }
            const pacemakerId = await createGhostyWithRetries({
                type: Object.keys(GhostyType).find(
                    (key) =>
                        GhostyType[key as keyof typeof GhostyType] ===
                        state.ghosty
                ) as GhostyType,
                targetDistance: Number((course.distance / 1000).toFixed(1)),
                condition: state.condition,
                temperature: temperature ?? 18,
                courseId: course.id,
            });
            const job = addJob({
                pacemakerId,
                courseId: course.id,
                status: "PROCEEDING",
            });
            await queryClient.invalidateQueries({
                queryKey: ["pacemaker", course.id],
            });
            return job.jobId;
        } catch (error) {
            showCompactToast("고스티 생성에 실패했습니다. 다시 시도해주세요.");
            handleClose();
        } finally {
            setIsCreating(false);
        }
    };

    const steps = [
        <StepCheckExperience
            key="check-experience"
            state={state}
            dispatch={dispatch}
        />,
        <StepSelectGhosty
            key="select-ghosty"
            courseName={course.name ?? "코스"}
            state={state}
            dispatch={dispatch}
        />,
        <StepConditionCheck
            key="condition-check"
            state={state}
            dispatch={dispatch}
            isCreating={isCreating}
        />,
        <StepCreating key="creating" />,
    ];

    useEffect(() => {
        (async () => {
            const { valid } = await getVDOTInfo();
            setStep(valid ? 1 : 0);
        })();
    }, []);

    if (step === null) return <View />;

    return (
        <View>
            {steps[step]}
            <Button
                type="active"
                title={step === steps.length - 1 ? "네, 좋아요" : "다음"}
                onPress={step === steps.length - 1 ? handleClose : handleNext}
            />
        </View>
    );
};

const StepCheckExperience = ({
    dispatch,
    state,
}: {
    state: typeof initialState;
    dispatch: Dispatch<{ type: "setExperience"; payload: VDOTLevel }>;
}) => {
    const handleExperience = (experience: VDOTLevel) => {
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
                {Object.values(VDOTLevel).map((experience) => (
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
    courseName,
    dispatch,
    state,
}: {
    courseName: string;
    state: typeof initialState;
    dispatch: Dispatch<{ type: "setGhosty"; payload: GhostyType }>;
}) => {
    const handleGhosty = (ghosty: GhostyType) => {
        dispatch({ type: "setGhosty", payload: ghosty });
    };

    return (
        <View>
            <TextWithSub
                title="고스티의 특성을 선택해 주세요"
                sub={`${courseName}을 함께할 고스티들이에요`}
                containerStyle={{ marginBottom: 30 }}
            />
            <View style={{ gap: 10, marginBottom: 30 }}>
                {Object.values(GhostyType).map((ghosty) => (
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
    isCreating,
}: {
    state: typeof initialState;
    dispatch: Dispatch<{ type: "setCondition"; payload: Condition }>;
    isCreating: boolean;
}) => {
    const handleCondition = (condition: Condition) => {
        dispatch({ type: "setCondition", payload: condition });
    };

    return (
        <View style={{ alignItems: "center", gap: 10, marginBottom: 32 }}>
            {isCreating ? (
                <ProgressLing containerSize={80} />
            ) : (
                <>
                    <TextWithSub
                        title={`오늘의 컨디션은 어떤가요?\n고스티가 참고할게요`}
                        sub="나쁨, 좋음을 기준으로 5단계 중 선택해 주세요"
                        containerStyle={{ marginBottom: 10 }}
                    />
                    <LevelCheck
                        maxLevel={5}
                        level={state.condition ?? 0}
                        setLevel={(level) =>
                            handleCondition(level as Condition)
                        }
                        label={{ left: "나쁨", right: "좋음", gap: 23 }}
                        icon={{ icon: <HeartIcon />, gap: 14 }}
                        style={{ marginVertical: 19 }}
                    />
                </>
            )}
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
