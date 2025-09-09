// NoticeItem.tsx
import { CloseIcon, SpeakerIcon } from "@/assets/svgs/svgs";
import { BlurView } from "expo-blur";
import { Pressable, StyleSheet } from "react-native";
import { Typography } from "../../ui/Typography";

interface NoticeProps {
    content: string;
    onPress: () => void;
    onClose: () => void;
}

export const NoticeItem = ({ content, onPress, onClose }: NoticeProps) => {
    return (
        <BlurView intensity={1} style={styles.container}>
            <Pressable style={styles.content} onPress={onPress}>
                <SpeakerIcon />
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
                <CloseIcon />
            </Pressable>
        </BlurView>
    );
};

const styles = StyleSheet.create({
    container: {
        alignSelf: "stretch",
        backgroundColor: "rgba(17, 17, 17, 0.8)",
        paddingVertical: 10,
        paddingHorizontal: 15,
        alignItems: "center",
        justifyContent: "space-between",
        borderRadius: 200,
        flexDirection: "row",
        marginHorizontal: 16.5,
        boxShadow: "0px 2px 6px 0px rgba(0, 0, 0, 0.15)",
    },
    content: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingRight: 30,
        flexShrink: 1,
    },
    closeButton: {
        flexShrink: 0,
    },
});
