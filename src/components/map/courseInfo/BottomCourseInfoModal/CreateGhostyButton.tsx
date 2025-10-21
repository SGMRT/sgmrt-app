import { AddIcon, InfoIcon } from "@/assets/svgs/svgs";
import { Beta } from "@/src/components/ui/Beta";
import { Typography } from "@/src/components/ui/Typography";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface CreateGhostyButtonProps {
    onPress?: () => void;
    onClickGuide?: () => void;
}

export const CreateGhostyButton = ({
    onPress,
    onClickGuide,
}: CreateGhostyButtonProps) => {
    return (
        <View style={styles.createGhostButton}>
            <View style={styles.createGhostButtonText}>
                <Beta />
                <Typography variant="body2" color="gray40">
                    고스티 만들기
                </Typography>
                <TouchableOpacity onPress={onClickGuide}>
                    <InfoIcon />
                </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={onPress}>
                <AddIcon />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    createGhostButton: {
        backgroundColor: "#222222",
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 14,
        justifyContent: "space-between",
        flexDirection: "row",
    },
    createGhostButtonText: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
});
