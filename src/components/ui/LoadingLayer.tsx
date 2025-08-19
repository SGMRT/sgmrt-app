import colors from "@/src/theme/colors";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

interface LoadingLayerProps {
    limitDelay?: number;
    onDelayed?: () => void;
}

export default function LoadingLayer({
    limitDelay,
    onDelayed,
}: LoadingLayerProps) {
    useEffect(() => {
        if (limitDelay) {
            setTimeout(() => {
                console.log("[Delayed] LoadingLayer");
                onDelayed?.();
            }, limitDelay);
        }
    }, [limitDelay, onDelayed]);
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
