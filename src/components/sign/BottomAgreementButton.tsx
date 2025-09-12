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
        <Button
            title={title}
            type={isActive ? "active" : "inactive"}
            onPress={onPress}
            disabled={!canPress}
            topStroke={topStroke}
        />
    );
}
