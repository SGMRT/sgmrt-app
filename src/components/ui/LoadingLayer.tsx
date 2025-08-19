import colors from "@/src/theme/colors";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export default function LoadingLayer() {
    return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
        </View>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        zIndex: 1000,
    },
});
