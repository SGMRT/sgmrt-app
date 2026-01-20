import { useGlobalStyles } from "@/src/theme/useGlobalStyles";
import { useEffect, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import Animated, {
    FadeInLeft,
    FadeOutLeft,
    LinearTransition,
} from "react-native-reanimated";
import { ActionButton } from "./ActionButton";

type GroupState = "single" | "dual";

export function ActionButtonGroup({
    initialState,
    action = true,
    onPrimaryPress,
    onSecondaryPress,
    secondaryButtonText,
}: {
    action?: boolean;
    initialState: GroupState;
    onPrimaryPress?: () => void;
    onSecondaryPress: () => void;
    secondaryButtonText: string;
}) {
    const [state, setState] = useState<GroupState>(initialState);
    const globalStyles = useGlobalStyles();
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearTimer = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    };

    useEffect(() => {
        clearTimer();
        if (state === "dual") {
            timerRef.current = setTimeout(() => {
                setState("single");
            }, 3000);
        }
        return clearTimer;
    }, [state]);

    const handlePrimaryPress = () => {
        if (state === "single" && action) {
            setState("dual");
        } else {
            if (onPrimaryPress) {
                onPrimaryPress();
            } else {
                setState("single");
            }
        }
    };

    return (
        <Animated.View
            style={[globalStyles.bottomLeft, styles.container]}
            layout={LinearTransition.duration(200)}
        >
            <ActionButton
                type={state === "single" ? "active" : "inactive"}
                onPress={handlePrimaryPress}
            />
            {state === "dual" && (
                <Animated.View
                    entering={FadeInLeft.duration(180)}
                    exiting={FadeOutLeft.duration(180)}
                >
                    <ActionButton
                        text={secondaryButtonText}
                        type="text"
                        onPress={onSecondaryPress}
                    />
                </Animated.View>
            )}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        gap: 6,
        alignItems: "center",
        justifyContent: "flex-start",
    },
});
