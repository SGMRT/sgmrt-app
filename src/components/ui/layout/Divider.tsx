import { StyleSheet, View } from "react-native";

export const Divider = ({
    direction = "vertical",
    color = "#3f3f3f",
}: {
    direction?: "vertical" | "horizontal";
    color?: string;
}) => (
    <View
        style={[
            direction === "vertical" ? styles.vertical : styles.horizontal,
            { backgroundColor: color },
        ]}
    />
);

const styles = StyleSheet.create({
    vertical: {
        height: 10,
        width: 1,
        borderRadius: 4,
    },
    horizontal: {
        height: 1,
        width: "100%",
        opacity: 0.3,
        borderRadius: 4,
    },
});
