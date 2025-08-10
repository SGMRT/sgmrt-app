import { ScrollTopIcon } from "@/assets/svgs/svgs";
import { StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ScrollButtonProps {
    onPress: () => void;
    bottomInset?: number;
}

export default function ScrollButton({
    onPress,
    bottomInset = 10,
}: ScrollButtonProps) {
    const { bottom } = useSafeAreaInsets();
    return (
        <TouchableOpacity
            onPress={onPress}
            style={[
                styles.container,
                {
                    bottom: bottom + bottomInset,
                },
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
        backgroundColor: "#212121",
        position: "absolute",
        zIndex: 10,
        right: 16.5,
        borderRadius: 100,
        alignItems: "center",
        justifyContent: "center",
    },
});
