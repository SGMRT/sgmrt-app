import { CheckIcon } from "@/assets/svgs/svgs";
import { Pressable, StyleSheet } from "react-native";

interface CheckboxProps {
    isChecked: boolean;
    onPress: () => void;
}

export const Checkbox = ({ isChecked, onPress }: CheckboxProps) => {
    return (
        <Pressable
            onPress={onPress}
            style={[
                styles.container,
                { backgroundColor: isChecked ? "#E2FF00" : "#383838" },
            ]}
        >
            <CheckIcon color={isChecked ? "#212121" : "#CCCCCC"} />
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        width: 24,
        height: 24,
        borderRadius: 4,
        justifyContent: "center",
        alignItems: "center",
    },
});
