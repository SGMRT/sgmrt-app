import { BackIcon, TrashIcon } from "@/assets/svgs/svgs";
import { useRouter } from "expo-router";
import { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Typography } from "../display/Typography";

interface HeaderProps {
    titleText: string;
    titleComponent?: React.ReactNode;
    hasBackButton?: boolean;
    onDelete?: () => void;
    onBack?: () => void;
    deleteColor?: string;
    rightComponent?: React.ReactNode;
}

export default memo(function Header({
    titleText,
    titleComponent,
    hasBackButton = true,
    onDelete,
    onBack,
    deleteColor = "gray40",
    rightComponent,
}: HeaderProps) {
    const router = useRouter();
    return (
        <View style={styles.header}>
            <View style={styles.sideContainer}>
                {hasBackButton && (
                    <Pressable
                        onPress={() => (onBack ? onBack() : router.back())}
                        style={styles.iconButton}
                    >
                        <BackIcon />
                    </Pressable>
                )}
            </View>
            {titleComponent ? (
                titleComponent
            ) : (
                <Typography variant="subhead2" color="gray20">
                    {titleText}
                </Typography>
            )}
            <View style={[styles.sideContainer, styles.rightContainer]}>
                {onDelete && (
                    <Pressable onPress={onDelete} style={styles.iconButton}>
                        <TrashIcon color={deleteColor} />
                    </Pressable>
                )}
                {rightComponent}
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16.5,
        height: 50,
        justifyContent: "space-between",
    },
    sideContainer: {
        width: 40,
        alignItems: "flex-start",
    },
    rightContainer: {
        alignItems: "flex-end",
    },
    iconButton: {
        width: 24,
        height: 24,
        justifyContent: "center",
        alignItems: "center",
    },
});
