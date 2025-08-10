import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

interface SectionProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
}

export default function Section({ children, style }: SectionProps) {
    return <View style={[styles.container, style]}>{children}</View>;
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#171717",
        paddingHorizontal: 20,
        paddingVertical: 20,
        borderRadius: 20,
    },
});
