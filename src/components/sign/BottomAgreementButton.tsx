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
 * 조건을 채우기 전에는 못 누르는 상태이고, 채우고 나면 Primary 로 바뀌어
 * 화면에서 유일한 강조가 된다.
 *
 * 못 누르는 상태의 색은 Button 이 정한다.
 * 예전에는 여기서 ui03 을 골라 넘겼는데, 화면마다 고르는 값이 달라
 * 같은 비활성이 서로 다르게 보였다.
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
                theme="primary"
                disabled={!isActive || !canPress}
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
