import { InfoIcon } from "@/assets/svgs/svgs";
import { darkTheme } from "@/src/design-system/themes/dark";
import { radius } from "@/src/design-system/tokens/radius";
import { spacing } from "@/src/design-system/tokens/spacing";
import colors from "@/src/theme/colors";
import { Children, isValidElement } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Typography, TypographyColor } from "../display/Typography";

// 줄과 줄 사이에 선을 직접 넣는다.
// 호출부가 마지막 줄을 챙겨 넘기는 방식이면 항목을 더하고 뺄 때마다 어긋나므로
// 어느 자리에 선이 필요한지는 컨테이너가 판단한다.
const ListSectionContainer = ({ children }: { children: React.ReactNode }) => {
    const items = Children.toArray(children).filter(isValidElement);
    return (
        <View style={styles.container}>
            {items.map((child, index) => (
                <View key={child.key ?? index}>
                    {/* 첫 줄 앞에는 두지 않는다.
                        케이던스 조절기처럼 앞 줄에 딸린 요소는 제 줄의 일부라
                        `ListSectionItem` 이 아닌 자식 앞에서는 가르지 않는다. */}
                    {index > 0 && child.type === ListSectionItem && (
                        <View style={styles.divider} />
                    )}
                    {child}
                </View>
            ))}
        </View>
    );
};

interface ListSectionItemProps {
    title: string;
    titleColor?: TypographyColor;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    onHintPress?: () => void;
}

const ListSectionItem = ({
    title,
    titleColor = "white",
    onPress,
    rightElement,
    onHintPress,
}: ListSectionItemProps) => {
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.5 : 1}>
            <View style={styles.listSectionItem}>
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
        borderRadius: radius.base,
    },
    listSectionItem: {
        height: 62,
        paddingHorizontal: spacing[16],
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    // 줄의 글자가 시작하는 자리에 맞춰 들여쓴다.
    // 카드 끝까지 닿게 두면 12 모서리에 선 끝이 닿아 지저분해진다.
    divider: {
        height: 1,
        marginHorizontal: spacing[16],
        backgroundColor: darkTheme.divider,
    },
    listSectionItemTitle: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing[6],
    },
});

export { ListSectionContainer, ListSectionItem };
