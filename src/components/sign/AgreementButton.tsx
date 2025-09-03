import { CheckIcon } from "@/assets/svgs/svgs";
import colors from "@/src/theme/colors";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Typography } from "../ui/Typography";

interface AgreementButtonProps {
    title: string;
    isAgreed: boolean;
    onPress: () => void;
}

export default function AgreementButton({
    title,
    isAgreed,
    onPress,
}: AgreementButtonProps) {
    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={onPress}>
                <View
                    style={{
                        gap: 8,
                        flexDirection: "row",
                        alignItems: "center",
                    }}
                >
                    <View
                        style={[
                            styles.checkIcon,
                            {
                                backgroundColor: isAgreed
                                    ? colors.primary
                                    : colors.gray[60],
                            },
                        ]}
                    >
                        <CheckIcon
                            color={isAgreed ? colors.black : colors.gray[20]}
                        />
                    </View>
                    <Typography variant="subhead1" color="gray40">
                        {title}
                    </Typography>
                </View>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 60,
        backgroundColor: "#171717",
        justifyContent: "center",
        paddingHorizontal: 20,
        borderRadius: 16,
        marginHorizontal: 16,
    },
    checkIcon: {
        borderRadius: 100,
        width: 26,
        height: 26,
        alignItems: "center",
        justifyContent: "center",
    },
});
