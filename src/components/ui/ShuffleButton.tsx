import { RedoIcon } from "@/assets/svgs/svgs";
import { useEffect, useRef } from "react";
import { Pressable, StyleSheet } from "react-native";
import { Typography } from "./Typography";

export const ShuffleButton = ({ onPress }: { onPress: () => void }) => {
    const pressedRef = useRef(false);
    const timeoutRef = useRef<number | null>(null);

    const handlePress = () => {
        if (pressedRef.current) return;
        pressedRef.current = true;
        onPress();
        timeoutRef.current = setTimeout(() => {
            pressedRef.current = false;
        }, 500);
    };

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return (
        <Pressable style={styles.container} onPress={handlePress}>
            <RedoIcon />
            <Typography variant="subhead2" color="white">
                코스 셔플
            </Typography>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 10,
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: "rgba(92, 92, 92, 0.8)",
        borderRadius: 30,
        flexDirection: "row",
        gap: 8,
        alignSelf: "center",
        alignItems: "center",
        boxShadow: "0px 2px 6px 0px rgba(0, 0, 0, 0.15)",
    },
});
