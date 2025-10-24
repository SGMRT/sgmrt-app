import { memo } from "react";
import { View } from "react-native";

type PhaseBarProps = {
    height: number;
    color: string;
};

export const PhaseBar = memo(function PhaseBar({
    height,
    color,
}: PhaseBarProps) {
    return <View style={{ height, backgroundColor: color }} />;
});
