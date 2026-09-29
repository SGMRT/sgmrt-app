import { ChevronIcon, SpeakerIcon } from "@/assets/svgs/svgs";
import { darkTheme } from "@/src/design-system/themes/dark";
import { radius } from "@/src/design-system/tokens/radius";
import { spacing } from "@/src/design-system/tokens/spacing";
import colors from "@/src/theme/colors";
import { Pressable, StyleSheet } from "react-native";
import { Typography } from "@/src/components/ui";

export const ProfileNoticeSection = ({ onPress }: { onPress: () => void }) => {
    return (
        <Pressable style={styles.container} onPress={onPress}>
            {/* 줄 이름에 딸린 장식이라 라벨보다 한 단계 낮춘다.
                강조색을 쓰면 아무 일도 하지 않는 아이콘이
                화면에서 가장 밝아진다. */}
            <SpeakerIcon color={darkTheme.ui07} />
            <Typography variant="subhead2" color="white">
                공지사항 및 이벤트
            </Typography>
            <ChevronIcon color={colors.gray[40]} style={styles.chevron} />
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: spacing[16],
        paddingHorizontal: spacing[16],
        gap: spacing[8],
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-start",
        backgroundColor: darkTheme.ui01,
        borderRadius: radius.md,
    },
    chevron: {
        marginLeft: "auto",
    },
});
