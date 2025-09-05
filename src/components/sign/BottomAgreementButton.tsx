import { StyleSheet, View } from "react-native";
import { Button } from "../ui/Button";

interface BottomAgreementButtonProps {
    isActive: boolean;
    canPress?: boolean;
    title?: string;
    onPress: () => void;
    topStroke?: boolean;
}

/**
 * Renders a bottom-aligned agreement button with an optional top divider.
 *
 * The button's visual state is controlled by `isActive`. `canPress` enables or disables interaction
 * (defaults to `true`). `title` provides the button label (defaults to `"동의하기"`). `onPress`
 * is called when the button is tapped. When `topStroke` is `true`, a thin divider is rendered above
 * the button.
 *
 * @param isActive - When true, the Button renders in its "active" visual style.
 * @param canPress - Whether the Button is enabled; defaults to `true`.
 * @param title - Button label text; defaults to `"동의하기"`.
 * @param onPress - Callback invoked when the Button is pressed.
 * @param topStroke - If true, renders a 1px top stroke above the button; defaults to `false`.
 */
export default function BottomAgreementButton({
    isActive,
    canPress = true,
    title = "동의하기",
    onPress,
    topStroke = false,
}: BottomAgreementButtonProps) {
    return (
        <>
            {topStroke && <View style={styles.topStroke} />}
            <View style={styles.container}>
                <Button
                    title={title}
                    type={isActive ? "active" : "inactive"}
                    onPress={onPress}
                    disabled={!canPress}
                />
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16.5,
        height: 58,
    },
    topStroke: {
        height: 1,
        backgroundColor: "#212121",
        marginBottom: 12,
    },
});
