import { ChevronIcon, InfoIcon } from "@/assets/svgs/svgs";
import { darkTheme } from "@/src/design-system/themes/dark";
import { radius } from "@/src/design-system/tokens/radius";
import { spacing } from "@/src/design-system/tokens/spacing";
import colors from "@/src/theme/colors";
import { Pressable, StyleSheet, View } from "react-native";
import { Typography, TypographyColor } from "../display/Typography";
import { sectionPadding } from "@/src/design-system/tokens/layout";

const ListSectionContainer = ({ children }: { children: React.ReactNode }) => {
    return <View style={styles.container}>{children}</View>;
};

interface ListSectionItemProps {
    title: string;
    titleColor?: TypographyColor;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    /**
     * 줄 끝에 들어가는 화살표.
     *
     * 호출부가 아이콘을 직접 만들어 넘기면 색을 빠뜨린 화면이 생긴다.
     * 실제로 마이페이지만 시인성을 낮추고 설정 화면은 그대로 남았다.
     * 어떤 모양에 어떤 색인지는 이 컴포넌트가 정한다.
     */
    chevron?: boolean;
    onHintPress?: () => void;
}

const ListSectionItem = ({
    title,
    titleColor = "white",
    onPress,
    rightElement,
    chevron = false,
    onHintPress,
}: ListSectionItemProps) => {
    return (
        <Pressable
            onPress={onPress}
            // 누르는 동안 면이 한 단계 밝아진다.
            // 투명도를 낮추면 어두운 배경 위에서 오히려 어두워 보인다.
            style={({ pressed }) =>
                pressed && onPress ? styles.pressed : undefined
            }
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
                        <Pressable
                            onPress={onHintPress}
                            hitSlop={spacing[8]}
                        >
                            <InfoIcon color={darkTheme.ui03} />
                        </Pressable>
                    )}
                </View>
                {rightElement}
                {chevron && <ChevronIcon color={darkTheme.ui03} />}
            </View>
        </Pressable>
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
        padding: sectionPadding,
        gap: sectionPadding,
    },
    // 높이를 적지 않고 패딩으로 잡는다.
    // 높이로 적으면 눈에 보이는 여백이 "높이 빼기 내용" 의 나머지가 되어
    // 스케일 밖 값으로 떨어진다. 62 일 때 가장자리 19, 줄 사이 38 이 그랬다.
    //
    // 줄 자체도 제 여백을 조금 갖는다.
    // 글자 높이(24)만으로 두면 누르는 자리와 읽는 자리가 정확히 겹쳐
    // 줄이 면이 아니라 글자 한 줄로만 읽힌다.
    pressed: {
        backgroundColor: darkTheme.ui01Pressed,
        borderRadius: radius.md,
    },
    listSectionItem: {
        padding: spacing[4],
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
