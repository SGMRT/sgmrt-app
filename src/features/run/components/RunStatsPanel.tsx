import { StatsIndicator, TextWithSub, Typography } from "@/src/components/ui";
import { Telemetry } from "@/src/apis/types/run";
import { RunStatus } from "@/src/features/run/context/context";
import { View } from "react-native";

export interface StatsDisplayItem {
    label: string;
    value: string | number;
    unit: string;
}

interface Props {
    status: RunStatus;
    runShotType: "thumbnail" | "share";
    isFirst: boolean;
    courseName: string;
    statsForUI: StatsDisplayItem[];
    isGhostRunning: boolean;
    isGhostyRunning: boolean;
    ghostPoint?: Telemetry | null;
    targetPace?: number;
}

export default function RunStatsPanel({
    status,
    runShotType,
    isFirst,
    courseName,
    statsForUI,
    isGhostRunning,
    isGhostyRunning,
    ghostPoint,
    targetPace,
}: Props) {
    // 첫 번째 상태이거나 이탈 상태일 때 안내 메시지 표시
    if (isFirst || status === "PAUSED_OFFCOURSE") {
        return (
            <View
                style={{
                    alignItems: "center",
                    marginTop: 30,
                    marginBottom: 65,
                }}
            >
                <Typography
                    variant="sectionhead"
                    color="white"
                    style={{ textAlign: "center" }}
                >
                    {status !== "PAUSED_OFFCOURSE"
                        ? `러닝 기록을 위해\n코스 시작 지점으로 이동해주세요`
                        : `10분 뒤 자동 종료돼요\n러닝을 이어서 진행하기 위해\n이탈 지점으로 돌아가 주세요`}
                </Typography>
            </View>
        );
    }

    // 일반 스탯 표시
    return (
        <View style={{ marginVertical: 30 }}>
            {runShotType === "share" && (
                <TextWithSub
                    title={courseName}
                    sub="완주한 기록은 내 기록에서 확인할 수 있어요."
                    containerStyle={{ marginBottom: 30 }}
                />
            )}
            <StatsIndicator
                stats={statsForUI}
                color="gray20"
                ghost={isGhostRunning || isGhostyRunning}
                ghostType={isGhostyRunning ? "ghosty" : "ghost"}
                ghostTelemetry={ghostPoint}
                targetPace={targetPace}
                end={runShotType === "share"}
            />
        </View>
    );
}
