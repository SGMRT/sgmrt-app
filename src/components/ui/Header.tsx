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
}

export default memo(function Header({
    titleText,
    titleComponent,
    hasBackButton = true,
    onDelete,
}: HeaderProps) {
    const router = useRouter();
    return (
        <View>
            <View
                style={[
                    styles.header,
                    {
                        justifyContent: hasBackButton
                            ? "space-between"
                            : "center",
                    },
                ]}
            >
                {hasBackButton && (
                    <Pressable onPress={() => router.back()}>
                        <BackIcon />
                    </Pressable>
                )}
                {titleComponent ? (
                    titleComponent
                ) : (
                    <Typography variant="subhead2" color="gray20">
                        {titleText}
                    </Typography>
                )}
                {hasBackButton && !onDelete && (
                    <View style={{ width: 11, height: 18 }} />
                )}
                {onDelete && (
                    <Pressable onPress={onDelete}>
                        <TrashIcon />
                    </Pressable>
                )}
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
    },
});
