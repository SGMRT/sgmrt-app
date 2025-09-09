import { useState } from "react";
import { TouchableOpacity, View } from "react-native";
import SlideToAction from "./SlideToAction";
import { Typography } from "./Typography";

interface SlideToDualActionProps {
    onSlideLeft: () => void;
    onSlideRight: () => void;
    leftLabel: string;
    rightLabel: string;
    disabled?: boolean;
    color?: "primary" | "red";
}

export default function SlideToDualAction({
    onSlideLeft,
    onSlideRight,
    leftLabel,
    rightLabel,
    disabled,
    color = "primary",
}: SlideToDualActionProps) {
    const [pressed, setPressed] = useState<{
        direction: "left" | "right";
        pressed: boolean;
    }>({
        direction: "left",
        pressed: false,
    });

    // 버튼을 누르는 순간 상태 변경
    const handlePressIn = (direction: "left" | "right") => {
        setPressed({ direction, pressed: true });
    };

    // 버튼에서 손을 떼는 순간 상태 리셋
    const handlePressOut = () => {
        setPressed({ direction: "left", pressed: false }); // 방향은 상관없으므로 기본값으로 리셋
    };

    // 슬라이드를 성공했을 때의 로직
    const handleSlideSuccess = () => {
        // 눌린 방향에 따라 적절한 함수 실행
        if (pressed.direction === "left") {
            onSlideLeft();
        } else {
            onSlideRight();
        }
        // 액션 실행 후 원래 상태로 복귀
        handlePressOut();
    };

    // label 로직을 더 간결하게 수정했습니다.
    const sliderLabel =
        "밀어서 " + (pressed.direction === "left" ? leftLabel : rightLabel);

    if (pressed.pressed) {
        return (
            <SlideToAction
                label={sliderLabel}
                onSlideSuccess={handleSlideSuccess}
                onSlideFailure={handlePressOut}
                color={color === "primary" ? "green" : "red"}
                direction={pressed.direction}
            />
        );
    }

    return (
        <View
            style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                height: 56,
                paddingHorizontal: 26.5,
            }}
        >
            <TouchableOpacity
                onPressIn={() => handlePressIn("left")}
                onPressOut={handlePressOut}
                disabled={disabled}
                delayLongPress={10000}
            >
                <Typography variant="subhead2" color={color}>
                    {leftLabel}
                </Typography>
            </TouchableOpacity>
            <TouchableOpacity
                onPressIn={() => handlePressIn("right")}
                onPressOut={handlePressOut}
                disabled={disabled}
                delayLongPress={10000}
            >
                <Typography variant="subhead2" color={color}>
                    {rightLabel}
                </Typography>
            </TouchableOpacity>
        </View>
    );
}
