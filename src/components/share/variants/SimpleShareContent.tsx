import { View } from "react-native";
import { Stat, Typography } from "@/src/components/ui";
import Track from "../Track";
import { CommonShareProps } from "../types";

function SimpleShareContent({
    telemetries,
    stats = [] as Stat[],
    distance,
}: CommonShareProps) {
    return (
        <View
            style={{
                backgroundColor: "transparent",
                gap: 7,
                alignItems: "center",
                paddingVertical: 45,
                paddingHorizontal: 16,
            }}
        >
            <Track
                width={361}
                height={361}
                padding={30}
                data={telemetries}
                stroke="#ffffff"
            />
            <View style={{ alignItems: "center", gap: 20 }}>
                <View style={{ flexDirection: "row", gap: 20 }}>
                    <View style={{ alignItems: "center", width: 100 }}>
                        <Typography
                            variant="share_stat_description"
                            color="white"
                        >
                            {stats[0]?.description}
                        </Typography>
                        <Typography variant="share_stat" color="white">
                            {stats[0]?.value}
                        </Typography>
                    </View>
                    <View style={{ alignItems: "center", width: 100 }}>
                        <Typography
                            variant="share_stat_description"
                            color="white"
                        >
                            거리
                        </Typography>
                        <Typography variant="share_stat" color="white">
                            {distance ? Number(distance).toFixed(1) : "0.0"} km
                        </Typography>
                    </View>
                </View>
                <View style={{ flexDirection: "row", gap: 20 }}>
                    <View style={{ alignItems: "center", width: 100 }}>
                        <Typography
                            variant="share_stat_description"
                            color="white"
                        >
                            {stats[1]?.description}
                        </Typography>
                        <Typography variant="share_stat" color="white">
                            {stats[1]?.value}
                        </Typography>
                    </View>
                    <View style={{ alignItems: "center", width: 100 }}>
                        <Typography
                            variant="share_stat_description"
                            color="white"
                        >
                            {stats[2]?.description?.slice(0, 4)}
                        </Typography>
                        <Typography variant="share_stat" color="white">
                            {stats[2]?.value}
                        </Typography>
                    </View>
                </View>
            </View>
        </View>
    );
}

export default SimpleShareContent;
