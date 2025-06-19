import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, View } from "react-native";
import { Typography } from "../ui/Typography";

interface TopWeatherInfoProps {
    address: string | null;
    temperature: number | null;
}

/**
 * Displays a styled header with weather information and filter options.
 *
 * Shows the provided address and temperature at the top of the screen with a gradient background, along with selectable filter buttons below.
 *
 * @param address - The location to display, or null if unavailable.
 * @param temperature - The temperature to display, or null to show a placeholder.
 */
export default function TopWeatherInfo({
    address,
    temperature,
}: TopWeatherInfoProps) {
    return (
        <LinearGradient
            colors={["rgba(0, 0, 0, 1)", "rgba(31 31, 31, 0)"]}
            style={styles.headerContainer}
        >
            <View style={styles.weatherInfoContainer}>
                <Typography variant="subhead2" color="gray40">
                    {address}
                    {temperature ? `${Math.round(temperature)}°` : "--°"}
                </Typography>
            </View>
            <View style={styles.filterContainer}>
                <Pressable>
                    <Typography variant="subhead2" color="gray60">
                        필터
                    </Typography>
                </Pressable>
                <Pressable>
                    <Typography variant="subhead2" color="primary">
                        고스트 코스
                    </Typography>
                </Pressable>
                <Pressable>
                    <Typography variant="subhead2" color="gray60">
                        내 코스
                    </Typography>
                </Pressable>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        paddingTop: Constants.statusBarHeight,
        position: "absolute",
        backdropFilter: "blur(1px)",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
    },
    weatherInfoContainer: {
        height: 50,
        justifyContent: "center",
        alignItems: "center",
    },
    filterContainer: {
        paddingTop: 10,
        paddingHorizontal: 17,
        flexDirection: "row",
        gap: 20,
    },
});
