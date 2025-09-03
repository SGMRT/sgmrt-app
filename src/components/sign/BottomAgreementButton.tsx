import { StyleSheet, View } from "react-native";
import { Button } from "../ui/Button";

interface BottomAgreementButtonProps {
    isActive: boolean;
    canPress?: boolean;
    title?: string;
    onPress: () => void;
}

export default function BottomAgreementButton({
    isActive,
    canPress = true,
    title = "동의하기",
    onPress,
}: BottomAgreementButtonProps) {
    return (
        <View style={styles.container}>
            <Button
                title={title}
                type={isActive ? "active" : "inactive"}
                onPress={onPress}
                disabled={!canPress}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16.5,
    },
});
