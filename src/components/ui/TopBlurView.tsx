import { BlurView } from "expo-blur";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet } from "react-native";

export default function TopBlurView({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <BlurView intensity={4} style={styles.headerContainer}>
            <LinearGradient
                colors={["rgba(0, 0, 0, 1)", "rgba(31, 31, 31, 0)"]}
                style={{ flex: 1, paddingTop: Constants.statusBarHeight }}
            >
                {children}
            </LinearGradient>
        </BlurView>
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
    },
});
