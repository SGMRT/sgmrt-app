import { InfoIcon } from "@/assets/svgs/svgs";
import { darkTheme } from "@/src/design-system/themes/dark";
import { radius } from "@/src/design-system/tokens/radius";
import { spacing } from "@/src/design-system/tokens/spacing";
import colors from "@/src/theme/colors";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Typography, TypographyColor } from "../display/Typography";

const ListSectionContainer = ({ children }: { children: React.ReactNode }) => {
    return <View style={styles.container}>{children}</View>;
};

interface ListSectionItemProps {
    title: string;
    titleColor?: TypographyColor;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    borderBottom?: boolean;
    onHintPress?: () => void;
}

const ListSectionItem = ({
    title,
    titleColor = "white",
    onPress,
    rightElement,
    borderBottom = false,
    onHintPress,
}: ListSectionItemProps) => {
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.5 : 1}>
            <View
                style={[
                    styles.listSectionItem,
                    { borderBottomWidth: borderBottom ? 1 : 0 },
                ]}
            >
                <View style={styles.listSectionItemTitle}>
                    <Typography variant="subhead2" color={titleColor}>
                        {title}
                    </Typography>
                    {onHintPress && (
                        <TouchableOpacity onPress={onHintPress}>
                            <InfoIcon color={colors.gray[40]} />
                        </TouchableOpacity>
                    )}
                </View>
                {rightElement}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: darkTheme.ui01,
        borderRadius: radius.md,
    },
    listSectionItem: {
        height: 62,
        paddingHorizontal: spacing[16],
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottomColor: darkTheme.divider,
    },
    listSectionItemTitle: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing[6],
    },
});

export { ListSectionContainer, ListSectionItem };
