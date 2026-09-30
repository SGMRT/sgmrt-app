// NoticeItem.tsx
import { CloseIcon, SpeakerIcon } from "@/assets/svgs/svgs";
import { darkTheme } from "@/src/design-system/themes/dark";
import { BlurView } from "expo-blur";
import { Pressable, StyleSheet } from "react-native";
import { Typography } from "@/src/components/ui";
import { radius } from "@/src/design-system/tokens/radius";
import { screenGutter } from "@/src/design-system/tokens/layout";
import { spacing } from "@/src/design-system/tokens/spacing";

interface NoticeProps {
    content: string;
    onPress: () => void;
    onClose: () => void;
}

export const NoticeItem = ({ content, onPress, onClose }: NoticeProps) => {
    return (
        <BlurView intensity={1} style={styles.container}>
            <Pressable style={styles.content} onPress={onPress}>
                <SpeakerIcon color={darkTheme.ui07} />
                <Typography
                    variant="caption1"
                    color="gray40"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                >
                    {content}
                </Typography>
            </Pressable>
            <Pressable onPress={onClose} hitSlop={8} style={styles.closeButton}>
                <CloseIcon color={darkTheme.ui07} />
            </Pressable>
        </BlurView>
    );
};

const styles = StyleSheet.create({
    container: {
        alignSelf: "stretch",
        backgroundColor: "rgba(17, 17, 17, 0.8)",
        paddingVertical: spacing[8],
        paddingHorizontal: spacing[16],
        alignItems: "center",
        justifyContent: "space-between",
        borderRadius: radius.full,
        flexDirection: "row",
        marginHorizontal: screenGutter,
        boxShadow: "0px 2px 6px 0px rgba(0, 0, 0, 0.15)",
    },
    content: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingRight: spacing[28],
        flexShrink: 1,
    },
    closeButton: {
        flexShrink: 0,
    },
});
