import { ScrollTopIcon } from "@/assets/svgs/svgs";
import { useGlobalStyles } from "@/src/theme/useGlobalStyles";
import { StyleSheet, TouchableOpacity } from "react-native";
import { radius } from "@/src/design-system/tokens/radius";
import { screenGutter } from "@/src/design-system/tokens/layout";
import { darkTheme } from "@/src/design-system/themes/dark";

interface ScrollButtonProps {
    onPress: () => void;
    position?: "bottom-left" | "bottom-right";
    bottomInset?: number;
}

export default function ScrollButton({
    onPress,
    position = "bottom-right",
    bottomInset,
}: ScrollButtonProps) {
    const globalStyles = useGlobalStyles();
    return (
        <TouchableOpacity
            onPress={onPress}
            style={[
                styles.container,
                position === "bottom-left" && [
                    globalStyles.bottomLeft,
                    {
                        bottom:
                            globalStyles.bottomLeft.bottom + (bottomInset ?? 0),
                    },
                ],
                position === "bottom-right" && [
                    globalStyles.bottomRight,
                    {
                        bottom:
                            globalStyles.bottomRight.bottom +
                            (bottomInset ?? 0),
                    },
                ],
            ]}
        >
            <ScrollTopIcon color={darkTheme.ui07} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        width: 48,
        height: 48,
        backgroundColor: "rgba(17,17,17,0.8)",
        borderWidth: 1,
        borderColor: darkTheme.ui02,
        position: "absolute",
        zIndex: 10,
        right: screenGutter,
        borderRadius: radius.full,
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0px 2px 6px 0px rgba(0, 0, 0, 0.15)",
    },
});
