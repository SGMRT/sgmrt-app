import { getCourse } from "@/src/apis";
import { Button } from "@/src/components/ui/Button";
import Header from "@/src/components/ui/Header";
import Section from "@/src/components/ui/Section";
import StatRow from "@/src/components/ui/StatRow";
import { interpolateTelemetries } from "@/src/utils/interpolateTelemetries";
import { normalizeTimestamps } from "@/src/utils/normalizeTimestamps";
import { Camera } from "@rnmapbox/maps";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useMemo, useRef } from "react";
import { Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useReplay } from "./hooks/useReplay";
import PreviewMap from "./PreviewMap";

const PreviewScreen = ({ courseId }: { courseId: number }) => {
    const cameraRef = useRef<Camera | null>(null);

    const { data: course } = useQuery({
        queryKey: ["course", courseId],
        queryFn: () => getCourse(Number(courseId)),
        enabled: !!courseId,
    });

    const interpolatedTelemetries = useMemo(() => {
        return interpolateTelemetries(
            normalizeTimestamps(course?.telemetries ?? []),
            1000,
            1
        );
    }, [course]);

    const samples = useMemo(() => {
        return (
            interpolatedTelemetries?.map((telemetry) => ({
                x: telemetry.lng,
                y: telemetry.lat,
                d: telemetry.dist,
                e: telemetry.alt,
                p: telemetry.pace,
                c: telemetry.cadence,
                t: telemetry.timeStamp,
            })) ?? []
        );
    }, [interpolatedTelemetries]);

    const {
        state,
        progress,
        position,
        play,
        pause,
        reset,
        stats,
        seekToProgress,
    } = useReplay(course?.distance ?? 0, samples, {});

    return (
        <SafeAreaView style={{ flex: 1, gap: 20 }}>
            <Header titleText={course?.name ?? "Course Preview"} />
            <Pressable
                style={{
                    flex: 1,
                    marginHorizontal: 16.5,
                    borderRadius: 20,
                    overflow: "hidden",
                }}
                onPress={() => {
                    if (state === "playing") {
                        pause();
                    } else if (state === "finished") {
                        reset();
                    } else {
                        play();
                    }
                }}
            >
                <PreviewMap
                    cameraRef={cameraRef}
                    route={samples}
                    lng={position.x}
                    lat={position.y}
                    heading={position.heading}
                    progress={progress}
                    pause={pause}
                    play={play}
                    seekToProgress={seekToProgress}
                />
            </Pressable>
            <Section
                containerStyle={{ marginHorizontal: 16.5, marginBottom: 6 }}
            >
                <StatRow
                    color="gray20"
                    style={{
                        justifyContent: "space-between",
                    }}
                    stats={[
                        {
                            value: ((course?.distance ?? 0) / 1000).toFixed(2),
                            unit: "km",
                            description: "전체 거리",
                        },
                        {
                            value: stats.elevation.toFixed(0),
                            unit: "m",
                            description: "고도",
                        },
                        {
                            value: course?.elevationGain
                                ? "+" + (course?.elevationGain ?? 1).toString()
                                : "0",
                            unit: "m",
                            description: "상승",
                        },
                        {
                            value: course?.elevationLoss?.toString() ?? "0",
                            unit: "m",
                            description: "하강",
                        },
                    ]}
                />
            </Section>
            <Button
                title="이 코스로 러닝"
                onPress={() => {
                    router.push(`/run/${courseId}/-1`);
                }}
            />
        </SafeAreaView>
    );
};

export default PreviewScreen;
