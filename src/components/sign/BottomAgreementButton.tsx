import { StyleSheet, View } from "react-native";
import { Button } from "../ui/Button";

interface BottomAgreementButtonProps {
    isActive: boolean;
    canPress?: boolean;
    title?: string;
    onPress: () => void;
    topStroke?: boolean;
}

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
