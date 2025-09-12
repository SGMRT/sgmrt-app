import { HomeIcon, MapIcon, ShareIcon } from "@/assets/svgs/svgs";
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
    iconType: "map" | "home" | "share";
    containerStyle?: StyleProp<ViewStyle>;
    topStroke?: boolean;
}
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
                ) : iconType === "share" ? (
                    <>
                        <ShareIcon color={colors.gray[40]} />
                        <Typography variant="mini" color="gray40">
                            공유
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
