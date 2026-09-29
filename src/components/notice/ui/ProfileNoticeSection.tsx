import { ChevronIcon } from "@/assets/svgs/svgs";
import { darkTheme } from "@/src/design-system/themes/dark";
import { radius } from "@/src/design-system/tokens/radius";
import { spacing } from "@/src/design-system/tokens/spacing";
import colors from "@/src/theme/colors";
import { Pressable, StyleSheet } from "react-native";
import { Typography } from "@/src/components/ui";

export const ProfileNoticeSection = ({ onPress }: { onPress: () => void }) => {
    return (
        <Pressable style={styles.container} onPress={onPress}>
            <Typography variant="subhead2" color="white">
                공지사항 및 이벤트
            </Typography>
            <ChevronIcon color={colors.gray[40]} style={styles.chevron} />
        </Pressable>
    );
};

const styles = StyleSheet.create({
    // 여백은 다른 섹션과 같은 사방 20 이다.
    container: {
        padding: spacing[20],
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-start",
        backgroundColor: darkTheme.ui01,
        borderRadius: radius.base,
    },
    chevron: {
        marginLeft: "auto",
    },
});
