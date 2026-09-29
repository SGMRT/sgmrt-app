import { ChevronIcon } from "@/assets/svgs/svgs";
import colors from "@/src/theme/colors";
import { formatDate } from "@/src/utils/formatDate";
import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Typography } from "@/src/components/ui";
import { radius } from "@/src/design-system/tokens/radius";
import { sectionPadding } from "@/src/design-system/tokens/layout";
import { spacing } from "@/src/design-system/tokens/spacing";
import { darkTheme } from "@/src/design-system/themes/dark";

interface NoticePreviewItemProps {
    title: string;
    content: string;
    date: Date;
    onPress: () => void;
}

export const NoticePreviewItem = ({
    title,
    content,
    date,
    onPress,
}: NoticePreviewItemProps) => {
    const formattedDate = useMemo(() => {
        return formatDate(date);
    }, [date]);

    const parsedContent = useMemo(() => {
        let parsedContent = content.replace(/\\n/g, "  ");
        if (parsedContent.startsWith('"') && parsedContent.endsWith('"')) {
            parsedContent = parsedContent.slice(1, -1);
        }
        return parsedContent;
    }, [content]);

    return (
        <Pressable style={styles.noticePreviewContainer} onPress={onPress}>
            <View style={styles.noticePreviewHeader}>
                <Typography variant="caption1" color="gray40">
                    {formattedDate}
                </Typography>
                <ChevronIcon
                    color={colors.gray[40]}
                    style={styles.noticePreviewChevron}
                />
            </View>
            <Typography
                variant="subhead1"
                color="gray20"
                numberOfLines={1}
                ellipsizeMode="tail"
                style={styles.noticePreviewTitle}
            >
                {title}
            </Typography>
            <Typography
                variant="caption1"
                color="gray40"
                numberOfLines={1}
                ellipsizeMode="tail"
                style={styles.noticePreviewContent}
            >
                {parsedContent}
            </Typography>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    // 배경 위에 놓이는 카드다. 다른 섹션과 같은 면과 같은 사방 여백을 쓴다.
    noticePreviewContainer: {
        gap: spacing[4],
        padding: sectionPadding,
        backgroundColor: darkTheme.ui01,
        borderRadius: radius.base,
    },
    noticePreviewHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    noticePreviewTitle: {
        paddingRight: spacing[8],
    },
    noticePreviewContent: {
        paddingRight: spacing[8],
    },
    noticePreviewChevron: {
        marginRight: -spacing[8],
    },
});
