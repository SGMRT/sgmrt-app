import { ChevronIcon, InfoIcon } from "@/assets/svgs/svgs";
import { darkTheme } from "@/src/design-system/themes/dark";
import {
    StyleProp,
    StyleSheet,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";
import { Divider } from "./Divider";
import { Typography, TypographyColor, TypographyVariant } from "../display/Typography";
import { radius } from "@/src/design-system/tokens/radius";
import { spacing } from "@/src/design-system/tokens/spacing";
import { sectionPadding } from "@/src/design-system/tokens/layout";

interface SectionProps {
    children: React.ReactNode;
    containerStyle?: StyleProp<ViewStyle>;
    style?: StyleProp<ViewStyle>;
    title?: string;
    titleColor?: TypographyColor;
    titleVariant?: TypographyVariant;
    titleRightChildren?: React.ReactNode;
    shortcutTitle?: string;
    onClickInfo?: () => void;
    onPress?: () => void;
    centerTitle?: boolean;
}

export default function Section({
    children,
    containerStyle,
    style,
    title,
    titleColor = "gray40",
    titleVariant = "subhead1",
    titleRightChildren,
    shortcutTitle,
    onClickInfo,
    onPress,
    centerTitle = false,
}: SectionProps) {
    return (
        <View style={[styles.container, containerStyle]}>
            {title && (
                <View style={styles.titleContainer}>
                    <View style={styles.title}>
                        <View style={styles.titleLeft}>
                            <Typography
                                variant={titleVariant}
                                color={titleColor}
                                style={centerTitle && styles.centerTitle}
                            >
                                {title}
                            </Typography>
                            {onClickInfo && (
                                <TouchableOpacity onPress={onClickInfo}>
                                    <InfoIcon color={darkTheme.ui07} />
                                </TouchableOpacity>
                            )}
                        </View>
                        {titleRightChildren}
                        {shortcutTitle && (
                            <TouchableOpacity
                                onPress={onPress}
                                style={styles.shortcutTitle}
                            >
                                <Typography variant="caption1" color="gray40">
                                    {shortcutTitle}
                                </Typography>
                                <ChevronIcon color={darkTheme.ui07} />
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
    // 여백은 다른 섹션과 같이 덩어리가 갖는다.
    // 제목과 내용 사이도 여기서 정해, 여백과 간격이 늘 같이 움직이게 한다.
    container: {
        backgroundColor: darkTheme.ui01,
        padding: sectionPadding,
        gap: sectionPadding,
        borderRadius: radius.base,
    },
    // 선은 제목에 딸린 밑줄이라 바짝 붙인다.
    // 10 은 4px 규칙 밖의 값이었다.
    titleContainer: {
        gap: spacing[8],
    },
    title: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    titleLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing[6],
    },
    shortcutTitle: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing[4],
    },
    centerTitle: {
        textAlign: "center",
        width: "100%",
    },
});
