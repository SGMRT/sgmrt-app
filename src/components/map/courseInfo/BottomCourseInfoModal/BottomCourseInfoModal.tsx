import { deletePacemaker, getPacemakerByCourseId } from "@/src/apis";
import { CourseResponse } from "@/src/apis/types/course";
import { ButtonWithMap } from "@/src/components/ui";
import { usePacemakerQueue } from "@/src/features/pacemaker/store/queueStore";
import { useAppPermissions } from "@/src/features/permission/useAppPermissions";
import { getFormattedPace, getRunTime } from "@/src/utils/runUtils";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { BottomGuide } from "./BottomGuide";
import { CourseInfoSection } from "./CourseInfoSection";
import { GhostSection } from "./GhostSection";

type SheetRoute = "info" | "guide";
export type GuideType = "run" | "ghost" | "ghosty" | "create";

interface BottomCourseInfoModalProps {
    bottomSheetRef: React.RefObject<BottomSheetModal | null>;
    course: CourseResponse | null;
}

export default function BottomCourseInfoModal({
    bottomSheetRef,
    course,
}: BottomCourseInfoModalProps) {
    const queryClient = useQueryClient();
    const router = useRouter();
    const [route, setRoute] = useState<SheetRoute>("info");
    const [guideType, setGuideType] = useState<GuideType>("run");
    const [selectedGhost, setSelectedGhost] = useState<"user" | "ai" | null>(
        null
    );
    const { findByCourseId, removeJob } = usePacemakerQueue();

    const { data: pacemaker } = useQuery({
        queryKey: ["pacemaker", course?.id],
        queryFn: () => getPacemakerByCourseId(course?.id!),
        enabled: !!course?.id,
    });

    const { requestOrAlert, requestOptional } = useAppPermissions();

    useEffect(() => {
        if (course?.myGhostInfo) {
            setSelectedGhost("user");
        }
    }, [course]);

    const courseStats = useMemo(
        () => [
            {
                description: "전체 거리",
                value: ((course?.distance ?? 0) / 1000).toFixed(2),
                unit: "km",
            },
            {
                description: "상승 고도",
                value: course?.elevationGain.toString() ?? "--",
                unit: "m",
            },
            {
                description: "하강 고도",
                value: course?.elevationLoss
                    ? Math.abs(course?.elevationLoss)
                    : "0",
                unit: "m",
            },
        ],
        [course?.distance, course?.elevationGain, course?.elevationLoss]
    );

    const ghostStats = useMemo(
        () => [
            {
                description: "시간",
                value: getRunTime(
                    course?.myGhostInfo?.duration ?? 0,
                    "HH:MM:SS_IF_HH_EXISTS"
                ),
            },
            {
                description: "페이스",
                value: getFormattedPace(course?.myGhostInfo?.averagePace ?? 0),
            },
            {
                description: "케이던스",
                value: course?.myGhostInfo?.cadence ?? 0,
                unit: "spm",
            },
        ],
        [
            course?.myGhostInfo?.duration,
            course?.myGhostInfo?.averagePace,
            course?.myGhostInfo?.cadence,
        ]
    );

    const onClickGuide = useCallback((guideType: GuideType) => {
        setGuideType(guideType);
        setRoute("guide");
    }, []);

    const handleRun = useCallback(async () => {
        const hasRunCourse = await AsyncStorage.getItem(
            "sgmrt.hasRunCourse.v1"
        );

        if (
            selectedGhost === "ai" &&
            pacemaker &&
            pacemaker.pacemakerSummaryResponse.id
        ) {
            bottomSheetRef.current?.dismiss();
            router.push(`/profile/${course?.id}/ghosty`);
            return;
        }

        if (hasRunCourse !== "true") {
            onClickGuide("run");
        } else {
            bottomSheetRef.current?.dismiss();
            if (
                selectedGhost === "user" &&
                course?.myGhostInfo &&
                course?.myGhostInfo.runningId !== -1
            ) {
                router.push(
                    `/run/${course?.id}/${course?.myGhostInfo.runningId}`
                );
            } else {
                router.push(`/run/${course?.id}/-1`);
            }
        }
    }, [selectedGhost, pacemaker, course?.id, course?.myGhostInfo, bottomSheetRef, router, onClickGuide]);

    const handleGhostSelect = useCallback((ghost: "user" | "ai" | null) => {
        setSelectedGhost((prev) => (prev === ghost ? null : ghost));
    }, []);

    const handleCloseGuide = useCallback(() => {
        setRoute("info");
    }, []);

    const handleCourseInfoPress = useCallback(() => {
        bottomSheetRef.current?.dismiss();
        router.push(`/profile/${course?.id}/detail`);
    }, [bottomSheetRef, router, course?.id]);

    const handleDeleteAiGhost = useCallback(async () => {
        await deletePacemaker(pacemaker?.pacemakerSummaryResponse.id ?? 0);
        const pacemakerJob = findByCourseId(course?.id ?? 0);
        if (pacemakerJob) {
            removeJob(pacemakerJob.jobId);
        }
        await queryClient.invalidateQueries({
            queryKey: ["pacemaker", course?.id],
        });
    }, [pacemaker?.pacemakerSummaryResponse.id, course?.id, findByCourseId, removeJob, queryClient]);

    const handleRunButtonPress = useCallback(async () => {
        await requestOptional("HEALTHKIT");

        const ok = await requestOrAlert(
            "SENSORS",
            "러닝 중 측정을 위해 권한이 필요해요"
        );

        if (!ok) {
            return;
        }

        handleRun();
    }, [requestOptional, requestOrAlert, handleRun]);

    const handlePreviewPress = useCallback(() => {
        bottomSheetRef.current?.dismiss();
        router.push(`/profile/${course?.id}/preview`);
    }, [bottomSheetRef, router, course?.id]);

    if (!course) {
        return null;
    }

    const spacerHeight = course?.myGhostInfo ? 20 : 30;

    const buttonTitle =
        selectedGhost === "user"
            ? "고스트와 러닝"
            : selectedGhost === "ai"
            ? "고스티와 러닝"
            : "이 코스로 러닝";

    return route === "guide" ? (
        <BottomGuide
            course={course}
            type={guideType}
            handleClose={handleCloseGuide}
            handleRun={handleRun}
        />
    ) : (
        <View>
            <CourseInfoSection
                courseName={course?.name ?? ""}
                stats={courseStats}
                onPress={handleCourseInfoPress}
            />
            <View style={{ height: spacerHeight }} />

            <GhostSection
                courseId={course.id}
                userGhost={course?.myGhostInfo}
                aiGhost={pacemaker}
                onDeleteAiGhost={handleDeleteAiGhost}
                selectedGhost={selectedGhost}
                onSwitchChange={handleGhostSelect}
                ghostStats={ghostStats}
                onClickGuide={onClickGuide}
            />

            <ButtonWithMap
                iconType="flag"
                style={{
                    marginHorizontal: 16.5,
                }}
                type="active"
                title={buttonTitle}
                onPress={handleRunButtonPress}
                onPressIcon={handlePreviewPress}
            />
        </View>
    );
}
