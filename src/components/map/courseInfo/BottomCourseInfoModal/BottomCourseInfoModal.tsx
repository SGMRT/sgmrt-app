import { deletePacemaker, getPacemakerByCourseId } from "@/src/apis";
import { CourseResponse } from "@/src/apis/types/course";
import ButtonWithIcon from "@/src/components/ui/ButtonWithMap";
import { usePacemakerQueue } from "@/src/features/pacemaker/store/queueStore";
import { useAppPermissions } from "@/src/features/permission/useAppPermissions";
import { getFormattedPace, getRunTime } from "@/src/utils/runUtils";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
    const { findByCourseId, setStatus, removeJob, addJob } =
        usePacemakerQueue();

    const { data: pacemaker } = useQuery({
        queryKey: ["pacemaker", course?.id],
        queryFn: () => getPacemakerByCourseId(course?.id!),
        enabled: !!course?.id,
    });

    useEffect(() => {
        if (!course?.id) return;
        const job = findByCourseId(course.id);

        if (pacemaker) {
            if (!job) {
                addJob({
                    courseId: course.id,
                    pacemakerId: pacemaker.pacemakerSummaryResponse.id,
                    status: pacemaker.processingStatus,
                });
            }
        } else {
            if (job) {
                removeJob(job.jobId);
            }
        }
    }, [course?.id, pacemaker]);

    const { requestOrAlert, requestOptional } = useAppPermissions();

    useEffect(() => {
        if (course?.myGhostInfo) {
            setSelectedGhost("user");
        }
    }, [course]);

    const courseStats = [
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
    ];

    const ghostStats = [
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
    ];

    const onClickGuide = (guideType: GuideType) => {
        setGuideType(guideType);
        setRoute("guide");
    };

    const handleRun = async () => {
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
    };

    const handleGhostSelect = (ghost: "user" | "ai" | null) => {
        setSelectedGhost((prev) => (prev === ghost ? null : ghost));
    };

    if (!course) {
        return null;
    }

    return route === "guide" ? (
        <BottomGuide
            course={course}
            type={guideType}
            handleClose={() => setRoute("info")}
            handleRun={handleRun}
        />
    ) : (
        <View>
            <CourseInfoSection
                courseName={course?.name ?? ""}
                stats={courseStats}
                onPress={() => {
                    bottomSheetRef.current?.dismiss();
                    router.push(`/profile/${course?.id}/detail`);
                }}
            />
            <View style={{ height: course?.myGhostInfo ? 20 : 30 }} />

            <GhostSection
                courseId={course.id}
                userGhost={course?.myGhostInfo}
                aiGhost={pacemaker}
                onDeleteAiGhost={async () => {
                    await deletePacemaker(
                        pacemaker?.pacemakerSummaryResponse.id ?? 0
                    );
                    const pacemakerJob = findByCourseId(course?.id ?? 0);
                    if (pacemakerJob) {
                        removeJob(pacemakerJob.jobId);
                    }
                    await queryClient.invalidateQueries({
                        queryKey: ["pacemaker", course?.id],
                    });
                }}
                selectedGhost={selectedGhost}
                onSwitchChange={handleGhostSelect}
                ghostStats={ghostStats}
                onClickGuide={onClickGuide}
            />

            <ButtonWithIcon
                iconType="flag"
                style={{
                    marginHorizontal: 16.5,
                }}
                type="active"
                title={
                    selectedGhost === "user"
                        ? "고스트와 러닝"
                        : selectedGhost === "ai"
                        ? "고스티와 러닝"
                        : "이 코스로 러닝"
                }
                onPress={async () => {
                    const hk = await requestOptional("HEALTHKIT");

                    const ok = await requestOrAlert(
                        "SENSORS",
                        "러닝 중 측정을 위해 권한이 필요해요"
                    );

                    if (!ok) {
                        return;
                    }

                    handleRun();
                }}
                onPressIcon={() => {
                    bottomSheetRef.current?.dismiss();
                    router.push(`/profile/${course?.id}/preview`);
                }}
            />
        </View>
    );
}
