import { ChevronIcon } from "@/assets/svgs/svgs";
import colors from "@/src/theme/colors";
import { formatDate } from "@/src/utils/formatDate";
import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Typography } from "../../ui/Typography";

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
                {content}
            </Typography>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    noticePreviewContainer: {
        gap: 4,
        padding: 20,
        backgroundColor: "#171717",
        borderRadius: 20,
    },
    noticePreviewHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    noticePreviewTitle: {
        paddingRight: 8,
    },
    noticePreviewContent: {
        paddingRight: 8,
    },
    noticePreviewChevron: {
        marginRight: -8,
    },
});
