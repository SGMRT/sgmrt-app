import { Button } from "@/src/design-system/atoms/Button";
import { darkTheme } from "@/src/design-system/themes/dark";
import { StyleSheet, View } from "react-native";

interface BottomAgreementButtonProps {
    isActive: boolean;
    canPress?: boolean;
    title?: string;
    onPress: () => void;
    topStroke?: boolean;
}

/**
 * 화면 맨 아래 붙는 주 행동 버튼.
 *
 * 조건을 채우기 전에는 ui03 로 두어 눌러야 할 것처럼 보이지 않게 하고,
 * 채우고 나면 Primary 로 바뀌어 화면에서 유일한 강조가 된다.
 */
export default function BottomAgreementButton({
    isActive,
    canPress = true,
    title = "동의하기",
    onPress,
    topStroke = false,
}: BottomAgreementButtonProps) {
    return (
        <View style={[styles.container, topStroke && styles.topStroke]}>
            <Button
                title={title}
                onPress={onPress}
                size="large"
                theme={isActive ? "primary" : "ui03"}
                disabled={!canPress}
                block
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingTop: 12,
        paddingBottom: 12,
        paddingHorizontal: 16,
    },
    topStroke: {
        borderTopWidth: 1,
        borderColor: darkTheme.ui01,
    },
});
