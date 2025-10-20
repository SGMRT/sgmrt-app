import { InfoIcon } from "@/assets/svgs/svgs";
import colors from "@/src/theme/colors";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Typography, TypographyColor } from "./Typography";

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
        backgroundColor: "#171717",
        borderRadius: 8,
    },
    listSectionItem: {
        height: 62,
        paddingHorizontal: 17,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottomColor: "#212121",
    },
    listSectionItemTitle: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
});

export { ListSectionContainer, ListSectionItem };
