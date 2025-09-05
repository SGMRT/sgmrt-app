import { ScrollTopIcon } from "@/assets/svgs/svgs";
import { useGlobalStyles } from "@/src/theme/useGlobalStyles";
import { StyleSheet, TouchableOpacity } from "react-native";

interface ScrollButtonProps {
    onPress: () => void;
    position?: "bottom-left" | "bottom-right";
}

export default function ScrollButton({
    onPress,
    position = "bottom-right",
}: ScrollButtonProps) {
    const globalStyles = useGlobalStyles();
    return (
        <TouchableOpacity
            onPress={onPress}
            style={[
                styles.container,
                position === "bottom-left" && globalStyles.bottomLeft,
                position === "bottom-right" && globalStyles.bottomRight,
            ]}
        >
            <ScrollTopIcon />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        width: 48,
        height: 48,
        backgroundColor: "#111111",
        borderWidth: 1,
        borderColor: "#3F3F3F",
        position: "absolute",
        zIndex: 10,
        right: 16.5,
        borderRadius: 100,
        alignItems: "center",
        justifyContent: "center",
    },
});
