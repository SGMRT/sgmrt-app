import colors from "@/src/theme/colors";
import { devLog } from "@/src/utils/devLog";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Typography } from "../display/Typography";

interface LoadingLayerProps {
    limitDelay?: number;
    onDelayed?: () => void;
    progress?: number;
    children?: React.ReactNode;
}

export default function LoadingLayer({
    limitDelay,
    onDelayed,
    progress,
    children,
}: LoadingLayerProps) {
    useEffect(() => {
        if (limitDelay) {
            setTimeout(() => {
                devLog("[Delayed] LoadingLayer");
                onDelayed?.();
            }, limitDelay);
        }
    }, [limitDelay, onDelayed]);
    return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            {progress !== undefined && (
                <Typography variant="body3" color="gray40">
                    {`${Math.round(progress * 100)}%`}
                </Typography>
            )}
            {children}
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
        gap: 16,
    },
});
