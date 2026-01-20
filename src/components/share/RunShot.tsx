import { Telemetry } from "@/src/apis/types/run";
import ResultCourseMap from "@/src/components/result/ResultCourseMap";
import { devLog } from "@/src/utils/devLog";
import { forwardRef, memo, useImperativeHandle, useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";
import ViewShot from "react-native-view-shot";
import { Stat } from "@/src/components/ui";
import { SHARE_REGISTRY } from "./registry";
import { ShareVariant } from "./types";
import DefaultShareContent from "./variants/DefaultShareContent";

type RunShotProps = {
    fileName?: string;
    telemetries: Telemetry[];
    type: "share" | "thumbnail";
    variant?: ShareVariant;
    onMapReady?: () => void;

    title: string;
    distance?: string | number;
    stats?: Stat[];

    width?: number;
    height?: number;
};

export type RunShotHandle = {
    capture: () => Promise<string | null>;
};

const DEFAULT_WIDTH = 360;
const DEFAULT_HEIGHT = 350;

const RunShot = forwardRef<RunShotHandle, RunShotProps>(
    (
        {
            fileName,
            telemetries,
            type,
            variant = "default",
            title,
            distance = "0.00",
            stats = [] as Stat[],
            onMapReady,
            width = DEFAULT_WIDTH,
            height = DEFAULT_HEIGHT,
        },
        ref
    ) => {
        const viewShotRef = useRef<ViewShot>(null);

        useImperativeHandle(ref, () => ({
            async capture() {
                try {
                    const uri = await viewShotRef.current?.capture?.();
                    if (!uri) return null;
                    return uri.startsWith("file://") ? uri : "file://" + uri;
                } catch (e) {
                    devLog("RunShot.capture error:", e);
                    return null;
                }
            },
        }));

        const ShareContent = useMemo(() => {
            return SHARE_REGISTRY[variant] ?? DefaultShareContent;
        }, [variant]);

        return (
            <View pointerEvents="none" style={styles.container} collapsable>
                <ViewShot
                    ref={viewShotRef}
                    options={{
                        fileName: fileName,
                        format: "png",
                        quality: 0.9,
                    }}
                >
                    {type === "thumbnail" ? (
                        <ThumbnailContent
                            telemetries={telemetries}
                            onMapReady={onMapReady}
                            width={width}
                            height={height}
                        />
                    ) : (
                        <ShareContent
                            telemetries={telemetries}
                            onMapReady={onMapReady}
                            stats={stats}
                            title={title}
                            distance={distance}
                            width={width}
                            height={height}
                        />
                    )}
                </ViewShot>
            </View>
        );
    }
);

const ThumbnailContent = memo(function ThumbnailContent({
    telemetries,
    onMapReady,
    width = 360,
    height = 360,
}: {
    telemetries: Telemetry[];
    onMapReady?: () => void;
    width?: number;
    height?: number;
}) {
    return (
        <ResultCourseMap
            telemetries={telemetries}
            onReady={onMapReady}
            borderRadius={0}
            width={width}
            height={height}
            logoPosition={{ bottom: 10, left: 10 }}
            attributionPosition={{ bottom: 10, left: 100 }}
        />
    );
});

RunShot.displayName = "RunShot";

export default RunShot;

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        top: 200,
        left: 0,
        zIndex: -1000,
    },
});
