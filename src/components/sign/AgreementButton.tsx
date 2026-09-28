import { CheckRow } from "@/src/design-system/molecules/CheckRow";
import { StyleSheet, View } from "react-native";

interface AgreementButtonProps {
    title: string;
    isAgreed: boolean;
    onPress: () => void;
}

/**
 * 전체 동의 줄.
 *
 * 묶음의 대표라서 카드 면을 깔고 라벨을 한 단계 키운다.
 * 제어는 원형(radio)인데, 피그마 정의를 그대로 따른 것이다.
 */
export default function AgreementButton({
    title,
    isAgreed,
    onPress,
}: AgreementButtonProps) {
    return (
        <View style={styles.container}>
            <CheckRow
                control="radio"
                label={title}
                checked={isAgreed}
                onToggle={onPress}
                surface
                emphasis
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16,
    },
});
