import { LogoWhite } from "@/assets/icons/icons";
import { Image } from "expo-image";
import { View } from "react-native";
import { Stat } from "../../ui/StatRow";
import { Typography } from "../../ui/Typography";
import Track from "../Track";
import { CommonShareProps } from "../types";

function LogoShareContent({
    telemetries,
    stats = [] as Stat[],
    distance,
}: CommonShareProps) {
    return (
        <View style={{ alignItems: "center", gap: 7 }}>
            <View style={{ alignItems: "center", gap: 10 }}>
                <View style={{ alignItems: "center" }}>
                    <Typography
                        variant="share_logo_stat_description"
                        color="white"
                    >
                        {stats[0]?.description}
                    </Typography>
                    <Typography variant="share_headline" color="white">
                        {stats[0]?.value}
                    </Typography>
                </View>
                <View style={{ alignItems: "center" }}>
                    <Typography
                        variant="share_logo_stat_description"
                        color="white"
                    >
                        거리
                    </Typography>
                    <Typography variant="share_headline" color="white">
                        {Number(distance).toFixed(1)} km
                    </Typography>
                </View>
                <View style={{ alignItems: "center" }}>
                    <Typography
                        variant="share_logo_stat_description"
                        color="white"
                    >
                        {stats[1]?.description}
                    </Typography>
                    <Typography variant="share_headline" color="white">
                        {stats[1]?.value}
                    </Typography>
                </View>
            </View>
            <Track data={telemetries} width={170} height={170} />
            <Image
                source={LogoWhite}
                style={{ width: 127.84, height: 29.99 }}
                contentFit="contain"
            />
        </View>
    );
}
export default LogoShareContent;
