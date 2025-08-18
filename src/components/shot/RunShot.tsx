// components/share/RunShareShot.tsx
import { GhostIcon } from "@/assets/svgs/svgs";
import ResultCourseMap from "@/src/components/result/ResultCourseMap";
import StatRow from "@/src/components/ui/StatRow";
import { forwardRef, useImperativeHandle, useRef } from "react";
import { View } from "react-native";
import ViewShot from "react-native-view-shot";

type RunShareShotProps = {
    fileName?: string;
    telemetries: any[]; // 타입 맞춰서 교체
    isChartActive: any; // Reanimated SharedValue
    chartPointIndex: any; // Reanimated SharedValue
    yKey: "pace" | "alt";
    stats: { description: string; value: any; unit?: string }[];
    onMapReady?: () => void;
    showLogo?: boolean;
};

export type RunShareShotHandle = {
    capture: (fileName?: string) => Promise<string | null>;
};

const RunShot = forwardRef<RunShareShotHandle, RunShareShotProps>(
    (
        {
            fileName,
            telemetries,
            isChartActive,
            chartPointIndex,
            yKey,
            stats,
            onMapReady,
            showLogo = true,
        },
        ref
    ) => {
        const viewShotRef = useRef<ViewShot>(null);

        useImperativeHandle(ref, () => ({
            async capture(customFileName?: string) {
                try {
                    const uri = await viewShotRef.current?.capture?.();
                    if (!uri) return null;
                    return uri.startsWith("file://") ? uri : "file://" + uri;
                } catch (e) {
                    console.log("RunShareShot.capture error:", e);
                    return null;
                }
            },
        }));

        return (
            <View
                pointerEvents="none"
                style={{
                    position: "absolute",
                    top: 100,
                    left: 100,
                    zIndex: -1,
                }}
            >
                <ViewShot
                    ref={viewShotRef}
                    options={{
                        fileName: fileName,
                        format: "jpg",
                        quality: 0.9,
                    }}
                >
                    <ResultCourseMap
                        telemetries={telemetries}
                        isChartActive={isChartActive}
                        chartPointIndex={chartPointIndex}
                        yKey={yKey}
                        onReady={onMapReady}
                        borderRadius={0}
                        width={360}
                        height={360}
                    />
                    {showLogo && (
                        <GhostIcon
                            width={20}
                            height={20}
                            style={{ position: "absolute", top: 15, left: 10 }}
                        />
                    )}
                    <StatRow
                        stats={stats}
                        style={{
                            position: "absolute",
                            top: 10,
                            right: 10,
                            gap: 10,
                        }}
                        variant="subhead2"
                        color="gray20"
                        descriptionColor="gray40"
                    />
                </ViewShot>
            </View>
        );
    }
);

RunShot.displayName = "RunShot";

export default RunShot;
