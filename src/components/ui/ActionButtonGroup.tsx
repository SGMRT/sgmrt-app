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

/**
 * A two-state action button group that displays a primary action and, optionally, a temporary secondary action.
 *
 * When `state` is "single" the primary button appears as active; pressing it will switch the group to "dual" if `action` is true.
 * In "dual" state a secondary text button appears (with `secondaryButtonText`) and remains visible for 3 seconds before the group
 * automatically reverts to "single". Pressing the secondary button invokes `onSecondaryPress`.
 *
 * @param initialState - Initial group state, either `"single"` or `"dual"`.
 * @param action - If true (default), pressing the primary button in "single" state transitions to "dual"; otherwise the primary press falls back to `onPrimaryPress` if provided.
 * @param onPrimaryPress - Optional callback invoked when the primary button is pressed and the component is not transitioning to "dual".
 * @param onSecondaryPress - Callback invoked when the secondary button is pressed.
 * @param secondaryButtonText - Text label shown on the secondary button.
 *
 * @returns A React element rendering the animated action button group.
 */
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
