import { PlayIcon } from "@/assets/svgs/svgs";
import colors from "@/src/theme/colors";
import { useGlobalStyles } from "@/src/theme/useGlobalStyles";
import { BlurView } from "expo-blur";
import {
    Pressable,
    StyleProp,
    StyleSheet,
    View,
    ViewStyle,
} from "react-native";
import { Typography } from "../display/Typography";
import { darkTheme } from "@/src/design-system/themes/dark";

type ActionButtonProps =
    | {
          type: "text";
          text: string;
          style?: StyleProp<ViewStyle>;
          postion?: "bottom-left";
          onPress?: () => void;
      }
    | {
          type: "active";
          text?: never;
          style?: StyleProp<ViewStyle>;
          postion?: "bottom-left";
          onPress?: () => void;
      }
    | {
          type: "inactive";
          text?: never;
          style?: StyleProp<ViewStyle>;
          postion?: "bottom-left";
          onPress?: () => void;
      };

export const ActionButton = ({
    type,
    text,
    style,
    postion,
    onPress,
}: ActionButtonProps) => {
    const isText = type === "text";
    const globalStyles = useGlobalStyles();

    return (
        <View
            style={[
                styles.container,
                styles.sharedRadius,
                isText ? styles.textButtonSize : styles.iconButtonSize,
                type === "inactive" && { overflow: "hidden" },
                style,
                postion === "bottom-left" && globalStyles.bottomLeft,
            ]}
        >
            <BlurView
                intensity={type === "inactive" ? 8 : 0}
                style={[StyleSheet.absoluteFill, styles.sharedRadius]}
            />

            <Pressable
                onPress={onPress}
                style={[
                    styles.content,
                    styles.sharedRadius,
                    isText
                        ? {
                              backgroundColor: darkTheme.primary,
                              boxShadow:
                                  "0px 0px 14px 0px rgba(226, 255, 0, 0.2)",
                              paddingHorizontal: 30,
                          }
                        : type === "active"
                        ? {
                              backgroundColor: darkTheme.primary,
                              boxShadow:
                                  "0px 0px 14px 0px rgba(226, 255, 0, 0.2)",
                          }
                        : {
                              backgroundColor: "rgba(17,17,17,0.35)",
                              borderWidth: 1,
                              borderColor: darkTheme.ui02,
                              boxShadow: "0px 2px 6px 0px rgba(0, 0, 0, 0.15)",
                          },
                ]}
                hitSlop={8}
            >
                {isText ? (
                    <Typography variant="subhead2" color="black">
                        {text}
                    </Typography>
                ) : (
                    <PlayIcon
                        color={
                            type === "active" ? colors.black : darkTheme.ui07
                        }
                    />
                )}
            </Pressable>
        </View>
    );
};

const RADIUS = 16;
const HEIGHT = 54;

const styles = StyleSheet.create({
    container: {
        position: "relative",
    },
    sharedRadius: {
        borderRadius: RADIUS,
    },
    textButtonSize: {
        height: HEIGHT,
    },
    iconButtonSize: {
        width: HEIGHT,
        height: HEIGHT,
    },
    content: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
});
