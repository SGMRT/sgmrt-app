import { Stat, StatRow, Typography } from "@/src/components/ui";
import { View } from "react-native";
import { CommonShareProps } from "../types";

export default function RecordShareContent({
    stats = [] as Stat[],
    title,
    distance,
}: CommonShareProps) {
    return (
        <View
            style={{
                backgroundColor: "transparent",
                paddingVertical: 120,
                paddingHorizontal: 16,
                gap: 60,
            }}
        >
            <View>
                <Typography variant="share_big_title" color="white">
                    {distance}km
                </Typography>
                <Typography variant="share_big_title_sub" color="white">
                    {title}
                </Typography>
            </View>
            <View
                style={{
                    gap: 40,
                }}
            >
                <StatRow
                    stats={[stats[1], stats[0], stats[3]]}
                    style={{
                        gap: 40,
                    }}
                    options={{
                        style: { minWidth: 78 },
                    }}
                    color="white"
                    descriptionColor="white"
                    variant="share_big_stats"
                    descriptionVariant="share_stat_description_medium"
                    divider={false}
                />
                <StatRow
                    stats={[stats[5], stats[4], stats[2]]}
                    style={{
                        gap: 40,
                    }}
                    options={{
                        style: { minWidth: 78 },
                    }}
                    color="white"
                    descriptionColor="white"
                    variant="share_stat"
                    descriptionVariant="share_stat_description_medium"
                    divider={false}
                />
            </View>
        </View>
    );
}
