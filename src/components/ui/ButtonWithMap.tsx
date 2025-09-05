import { HomeIcon, MapIcon } from "@/assets/svgs/svgs";
import colors from "@/src/theme/colors";
import {
    Pressable,
    StyleProp,
    StyleSheet,
    View,
    ViewStyle,
} from "react-native";
import { Button, ButtonProps } from "./Button";
import { Typography } from "./Typography";

interface ButtonWithIconProps extends ButtonProps {
    onPressIcon: () => void;
    iconType: "map" | "home";
    containerStyle?: StyleProp<ViewStyle>;
    topStroke?: boolean;
}
/**
 * A composite button that pairs a square icon pressable with a configurable primary Button.
 *
 * Renders a horizontal container with a left square Pressable that shows either a map ("지도") or home ("메인") icon and label, and a right-side Button that receives the remaining Button props.
 *
 * @param onPressIcon - Callback invoked when the square icon Pressable is pressed.
 * @param iconType - Selects which icon and label to show: `"map"` renders a map icon and the label `지도`; any other value renders a home icon and the label `메인`.
 * @param containerStyle - Optional additional style applied to the outer container View.
 * @param topStroke - When true, applies an extra top border and padding to the container.
 * @returns The rendered React element.
 */
export default function ButtonWithIcon({
    onPressIcon,
    containerStyle,
    topStroke,
    iconType,
    ...props
}: ButtonWithIconProps) {
    return (
        <View
            style={[
                styles.container,
                containerStyle,
                topStroke && styles.topStroke,
            ]}
        >
            <Pressable style={styles.button} onPress={onPressIcon}>
                {iconType === "map" ? (
                    <>
                        <MapIcon color={colors.gray[40]} />
                        <Typography variant="mini" color="gray40">
                            지도
                        </Typography>
                    </>
                ) : (
                    <>
                        <HomeIcon color={colors.gray[40]} />
                        <Typography variant="mini" color="gray40">
                            메인
                        </Typography>
                    </>
                )}
            </Pressable>
            <Button {...props} />
        </View>
    );
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: "#222222",
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        width: 58,
        height: 58,
    },
    container: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 16.5,
        marginBottom: 6,
    },
    topStroke: {
        borderTopWidth: 1,
        borderTopColor: "#212121",
        paddingTop: 12,
    },
});
