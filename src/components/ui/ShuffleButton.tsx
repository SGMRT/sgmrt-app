import { RedoIcon } from "@/assets/svgs/svgs";
import { StyleSheet, TouchableOpacity } from "react-native";
import { Typography } from "./Typography";

export const ShuffleButton = ({ onPress }: { onPress: () => void }) => {
    return (
        <TouchableOpacity style={styles.container} onPress={onPress}>
            <RedoIcon />
            <Typography variant="subhead2" color="white">
                코스 셔플
            </Typography>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 10,
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: "rgba(92, 92, 92, 0.8)",
        borderRadius: 30,
        flexDirection: "row",
        gap: 8,
        alignSelf: "center",
        alignItems: "center",
        boxShadow: "0px 2px 6px 0px rgba(0, 0, 0, 0.15)",
    },
});
