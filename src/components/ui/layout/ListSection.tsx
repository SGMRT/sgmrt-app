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
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={onPress ? 0.5 : 1}
            // 줄 자체는 글자 높이(24)뿐이라 그대로는 누르기에 좁다.
            // 줄 사이 간격의 절반까지만 넓힌다. 그 이상은 이웃한 줄과 겹쳐
            // 겹친 자리에서 나중에 그려진 줄이 탭을 가져간다.
            hitSlop={{ top: 10, bottom: 10 }}
        >
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
    // 여백은 섹션 하나가 갖는다. 줄은 제 여백을 갖지 않는다.
    // 줄마다 패딩을 두면 카드 가장자리 여백과 줄 사이 간격이 따로 놀아
    // 값을 하나 고쳐도 다른 하나가 따라오지 않는다.
    // 여기서 사방 20 과 줄 사이 20 을 함께 정하므로 둘이 늘 같이 움직인다.
    container: {
        backgroundColor: darkTheme.ui01,
        borderRadius: radius.base,
        padding: spacing[20],
        gap: spacing[20],
    },
    // 높이를 적지 않고 패딩으로 잡는다.
    // 높이로 적으면 눈에 보이는 여백이 "높이 빼기 내용" 의 나머지가 되어
    // 스케일 밖 값으로 떨어진다. 62 일 때 가장자리 19, 줄 사이 38 이 그랬다.
    //
    listSectionItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    listSectionItemTitle: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing[6],
    },
});

export { ListSectionContainer, ListSectionItem };
