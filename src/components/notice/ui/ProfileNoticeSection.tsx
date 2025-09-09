import { ChevronIcon, SpeakerIcon } from "@/assets/svgs/svgs";
import colors from "@/src/theme/colors";
import { Pressable, StyleSheet } from "react-native";
import { Typography } from "../../ui/Typography";

export const ProfileNoticeSection = ({ onPress }: { onPress: () => void }) => {
    return (
        <Pressable style={styles.container} onPress={onPress}>
            <SpeakerIcon />
            <Typography variant="subhead2" color="white">
                공지사항 및 이벤트
            </Typography>
            <ChevronIcon color={colors.gray[40]} style={styles.chevron} />
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 15,
        paddingHorizontal: 17,
        gap: 8,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-start",
        backgroundColor: "#171717",
    },
    chevron: {
        marginLeft: "auto",
    },
});
