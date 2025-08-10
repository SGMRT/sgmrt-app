import { StyleSheet, View } from "react-native";

export const Divider = ({
    direction = "vertical",
}: {
    direction?: "vertical" | "horizontal";
}) => (
    <View
        style={direction === "vertical" ? styles.vertical : styles.horizontal}
    />
);

const styles = StyleSheet.create({
    vertical: {
        height: 10,
        width: 1,
        borderRadius: 4,
        backgroundColor: "#3f3f3f",
    },
    horizontal: {
        height: 1,
        width: "100%",
        backgroundColor: "#3f3f3f",
        opacity: 0.3,
        borderRadius: 4,
    },
});
