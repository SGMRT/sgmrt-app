import { BackIcon, TrashIcon } from "@/assets/svgs/svgs";
import { useRouter } from "expo-router";
import { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Typography } from "./Typography";

interface HeaderProps {
    titleText: string;
    titleComponent?: React.ReactNode;
    hasBackButton?: boolean;
    onDelete?: () => void;
    deleteColor?: string;
    rightComponent?: React.ReactNode;
}

export default memo(function Header({
    titleText,
    titleComponent,
    hasBackButton = true,
    onDelete,
    deleteColor = "gray40",
    rightComponent,
}: HeaderProps) {
    const router = useRouter();
    return (
        <View>
            <View style={[styles.header]}>
                {hasBackButton && (
                    <Pressable
                        onPress={() => router.back()}
                        style={{ width: 20, height: 20 }}
                    >
                        <BackIcon />
                    </Pressable>
                )}
                {!hasBackButton && <View style={{ width: 20, height: 20 }} />}
                {titleComponent ? (
                    titleComponent
                ) : (
                    <Typography variant="subhead2" color="gray20">
                        {titleText}
                    </Typography>
                )}
                {!onDelete && !rightComponent && (
                    <View style={{ width: 20, height: 20 }} />
                )}
                {onDelete && (
                    <Pressable onPress={onDelete}>
                        <TrashIcon
                            color={deleteColor}
                            style={{ marginRight: 10 }}
                        />
                    </Pressable>
                )}
                {rightComponent && rightComponent}
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 17,
        height: 50,
        justifyContent: "space-between",
    },
});
