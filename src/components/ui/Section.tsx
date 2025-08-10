import { ChevronIcon } from "@/assets/svgs/svgs";
import colors from "@/src/theme/colors";
import {
    StyleProp,
    StyleSheet,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";
import { Divider } from "./Divider";
import { Typography, TypographyColor } from "./Typography";

interface SectionProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    title?: string;
    titleColor?: TypographyColor;
    titleRightChildren?: React.ReactNode;
    shortcutTitle?: string;
    onPress?: () => void;
}

export default function Section({
    children,
    style,
    title,
    titleColor = "gray40",
    titleRightChildren,
    shortcutTitle,
    onPress,
}: SectionProps) {
    return (
        <View style={styles.container}>
            {title && (
                <View style={styles.titleContainer}>
                    <View style={styles.title}>
                        <Typography variant="subhead1" color={titleColor}>
                            {title}
                        </Typography>
                        {titleRightChildren}
                        {shortcutTitle && (
                            <TouchableOpacity
                                onPress={onPress}
                                style={styles.shortcutTitle}
                            >
                                <Typography variant="caption1" color="gray40">
                                    {shortcutTitle}
                                </Typography>
                                <ChevronIcon color={colors.gray[40]} />
                            </TouchableOpacity>
                        )}
                    </View>
                    <Divider direction="horizontal" />
                </View>
            )}
            <View style={[style]}>{children}</View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#171717",
        paddingHorizontal: 20,
        paddingVertical: 20,
        borderRadius: 20,
    },
    titleContainer: {
        marginBottom: 20,
        gap: 10,
    },
    title: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    shortcutTitle: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
});
