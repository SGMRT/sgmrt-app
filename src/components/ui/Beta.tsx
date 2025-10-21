import { StyleSheet } from "react-native";
import { Typography } from "./Typography";

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
        borderRadius: 4,
        paddingHorizontal: 6,
        backgroundColor: "rgba(226, 255, 0, 0.2)",
    },
});
