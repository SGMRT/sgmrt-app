import { GhostIcon } from "@/assets/svgs/svgs";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

interface GhostLabelProps {
    width?: number;
    height?: number;
    style?: StyleProp<ViewStyle>;
}

export default function GhostLabel({
    width = 20,
    height = 12.5,
    style,
}: GhostLabelProps) {
    return (
        <View style={[styles.logoContainer, style]}>
            <GhostIcon width={width} height={height} />
        </View>
    );
}

const styles = StyleSheet.create({
    logoContainer: {
        width: 34,
        height: 34,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(226, 255, 0, 0.2)",
        boxShadow: "0px 2px 6px 0px rgba(0, 0, 0, 0.15)",
    },
});
