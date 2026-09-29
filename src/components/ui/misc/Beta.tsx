import { StyleSheet } from "react-native";
import { Typography } from "../display/Typography";
import { radius } from "@/src/design-system/tokens/radius";

export const Beta = () => {
    return (
        <Typography variant="caption1" color="primary" style={styles.beta}>
            BETA
        </Typography>
    );
};

const styles = StyleSheet.create({
    beta: {
        height: 20,
        borderRadius: radius.sm,
        paddingHorizontal: 6,
        backgroundColor: "rgba(226, 255, 0, 0.2)",
    },
});
