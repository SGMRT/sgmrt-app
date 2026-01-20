import { RunComperisonResponse } from "@/src/apis";
import { RunningRecord } from "@/src/components/map/courseInfo/RunningRecord";
import Section from "@/src/components/ui/Section";
import { getFormattedPace, getRunTime } from "@/src/utils/runUtils";

interface Props {
    comparison: RunComperisonResponse;
}

export default function GhostComparisonSection({ comparison }: Props) {
    return (
        <Section
            title="기록 비교"
            titleVariant="sectionhead"
            titleColor="white"
            style={{ gap: 20, marginBottom: 20 }}
        >
            <RunningRecord
                user={{
                    nickname: comparison.ghostRunInfo.nickname,
                    profileUrl: comparison.ghostRunInfo.profileUrl,
                }}
                isMine={false}
                stats={[
                    {
                        description: "시간",
                        value: getRunTime(
                            comparison.ghostRunInfo.recordInfo.duration ?? 0,
                            "HH:MM:SS_IF_HH_EXISTS"
                        ),
                    },
                    {
                        description: "페이스",
                        value: getFormattedPace(
                            comparison.ghostRunInfo.recordInfo.averagePace ?? 0
                        ),
                    },
                    {
                        description: "케이던스",
                        value: comparison.ghostRunInfo.recordInfo.cadence ?? 0,
                        unit: "spm",
                    },
                ]}
            />
            <RunningRecord
                user={{
                    nickname: comparison.myRunInfo.nickname,
                    profileUrl: comparison.myRunInfo.profileUrl,
                }}
                isMine={true}
                stats={[
                    {
                        description: "시간",
                        value: getRunTime(
                            comparison.myRunInfo.recordInfo.duration ?? 0,
                            "HH:MM:SS_IF_HH_EXISTS"
                        ),
                    },
                    {
                        description: "페이스",
                        value: getFormattedPace(
                            comparison.myRunInfo.recordInfo.averagePace ?? 0
                        ),
                    },
                    {
                        description: "케이던스",
                        value: comparison.myRunInfo.recordInfo.cadence ?? 0,
                        unit: "spm",
                    },
                ]}
            />
        </Section>
    );
}
