import { ListIcon } from "@/assets/svgs/svgs";
import { StyleSheet, TouchableOpacity } from "react-native";
import { Typography } from "../ui/Typography";

export default function ListViewButton({ onPress }: { onPress: () => void }) {
    return (
        <TouchableOpacity onPress={onPress} style={styles.container}>
            <ListIcon />
            <Typography variant="subhead3" color="gray40">
                목록 보기
            </Typography>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        gap: 4,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(17, 17, 17, 0.8)",
        bottom: 64 + 56 + 14,
        right: 16,
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 100,
    },
});
