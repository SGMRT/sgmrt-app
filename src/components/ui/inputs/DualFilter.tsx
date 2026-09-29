import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { Button } from "@/src/design-system/atoms/Button";
import { Divider } from "@/src/design-system/atoms/Divider";
import { spacing } from "@/src/design-system/tokens/spacing";
import { Typography } from "../display/Typography";

interface DualFilterProps {
    description?: string;
    firstLabel: string;
    secondLabel: string;
    onPressFirst: () => void;
    onPressSecond: () => void;
    selected: "first" | "second";
    style?: StyleProp<ViewStyle>;
}

/**
 * 둘 중 하나를 고르는 필터.
 *
 * 고른 쪽을 Primary 로 칠하고 있었는데, Primary 는 주된 행동 몫이다.
 * 여기서 같이 쓰면 화면에 강조가 둘이 되어 서로 힘을 깎는다.
 * 어느 쪽도 중립인 택일이므로 Button 의 고름 상태를 그대로 쓴다.
 * 고른 쪽은 테두리로 드러나고 고르지 않은 쪽은 글자가 한 단계 낮아진다.
 */
export const DualFilter = ({
    description,
    firstLabel,
    secondLabel,
    onPressFirst,
    onPressSecond,
    selected,
    style,
}: DualFilterProps) => {
    return (
        <View style={[style, styles.container]}>
            {description && (
                <View style={styles.description}>
                    <Typography variant="subhead1" color="white">
                        {description}
                    </Typography>
                    <Divider />
                </View>
            )}
            <Button
                title={firstLabel}
                onPress={onPressFirst}
                size="large"
                theme="ui01"
                selected={selected === "first"}
                block
            />
            <Button
                title={secondLabel}
                onPress={onPressSecond}
                size="large"
                theme="ui01"
                selected={selected === "second"}
                block
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        gap: spacing[12],
        marginHorizontal: spacing[16],
        marginBottom: spacing[20],
    },
    description: {
        gap: spacing[12],
        alignItems: "center",
        marginBottom: spacing[20],
    },
});
