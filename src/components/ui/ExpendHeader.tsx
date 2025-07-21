import { ChevronIcon } from "@/assets/svgs/svgs";
import colors from "@/src/theme/colors";
import { Pressable, StyleSheet, View } from "react-native";
import { Typography, TypographyColor } from "./Typography";

interface ExpendHeaderProps {
    title: string;
    titleColor: TypographyColor;
    marginHorizontal?: boolean;
    onPress?: () => void;
    rightChildren?: React.ReactNode;
}

export default function ExpendHeader({
    title,
    titleColor,
    marginHorizontal = true,
    onPress,
    rightChildren,
}: ExpendHeaderProps) {
    return (
        <View
            style={[
                styles.ghostListContainer,
                marginHorizontal && { paddingHorizontal: 17 },
            ]}
        >
            <Typography variant="body1" color={titleColor}>
                {title}
            </Typography>
            <View style={styles.ghostListContainerText}>
                {onPress && !rightChildren && (
                    <>
                        <Pressable
                            onPress={() => {
                                onPress();
                            }}
                        >
                            <Typography variant="body2" color="gray60">
                                전체 보기
                            </Typography>
                        </Pressable>
                        <ChevronIcon color={colors.gray[60]} />
                    </>
                )}
                <Pressable onPress={onPress}>{rightChildren}</Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    ghostListContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    ghostListContainerText: {
        flexDirection: "row",
        alignItems: "center",
    },
});
