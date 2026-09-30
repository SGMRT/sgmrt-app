import { FilterIcon } from "@/assets/svgs/svgs";
import colors from "@/src/theme/colors";
import { Pressable, StyleProp, StyleSheet, ViewStyle } from "react-native";
import { Typography, TypographyColor, TypographyVariant } from "../display/Typography";
import { radius } from "@/src/design-system/tokens/radius";
import { spacing } from "@/src/design-system/tokens/spacing";
import { darkTheme } from "@/src/design-system/themes/dark";

interface FilterButtonProps {
    onPress: () => void;
    variant?: TypographyVariant;
    color?: TypographyColor;
    style?: StyleProp<ViewStyle>;
    title?: string;
}

export const FilterButton = ({
    onPress,
    variant = "caption1",
    color = "gray40",
    style,
    title,
}: FilterButtonProps) => {
    return (
        <ButtonWithIcon
            icon={<FilterIcon color={darkTheme.ui07} />}
            title={title ?? "필터"}
            onPress={onPress}
            variant={variant}
            color={color}
            style={style}
        />
    );
};

interface ButtonWithIconProps {
    icon?: React.ReactNode;
    title: string;
    onPress: () => void;
    variant?: TypographyVariant;
    color?: TypographyColor;
    style?: StyleProp<ViewStyle>;
}

export const ButtonWithIcon = ({
    icon,
    title,
    onPress,
    variant = "caption1",
    color = "gray40",
    style,
}: ButtonWithIconProps) => {
    return (
        // 누르는 동안 면이 한 단계 밝아진다. 버튼과 같은 규칙이다.
        //
        // TouchableOpacity 의 투명도 감소는 어두운 배경 위에서
        // 면을 배경 쪽으로 끌어내려 오히려 어두워 보인다.
        // 눌린 자리는 밝아져야 손가락 아래에서도 읽힌다.
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                styles.container,
                pressed ? styles.pressed : null,
                style,
            ]}
        >
            {icon ? icon : null}
            <Typography variant={variant} color={color}>
                {title}
            </Typography>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    // 배경 위에 직접 놓이는 면이라 1뎁스를 따른다.
    // 면은 ui01, 모서리는 12 다.
    // 테두리로 두면 화면에 라인 요소가 늘어나고,
    // 같은 높이의 채워진 면보다 커 보인다.
    container: {
        padding: spacing[12],
        // 왼쪽에만 아이콘이 있어 사방을 같게 두면 오른쪽이 좁아 보인다.
        // 아이콘은 제 그림 안에 여백을 갖는데 글자는 끝이 딱 떨어지기 때문이다.
        // 눈에 같아 보이도록 오른쪽만 2 더 준다.
        // 스케일 밖 값이지만 시각 보정은 스케일이 아니라 눈이 정한다.
        paddingRight: spacing[12] + 2,
        borderRadius: radius.base,
        backgroundColor: darkTheme.ui01,
        gap: spacing[4],
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    pressed: {
        backgroundColor: darkTheme.ui01Pressed,
    },
});
