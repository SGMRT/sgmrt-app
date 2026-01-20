import { useLocalPrefs } from "@/src/store/localPrefs";
import colors from "@/src/theme/colors";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Typography } from "@/src/components/ui";

interface CadenceAssistControlProps {
    isEnabled: boolean;
}

export const CadenceAssistControl = ({ isEnabled }: CadenceAssistControlProps) => {
    const {
        cadenceTarget: value,
        decCadenceTarget,
        incCadenceTarget,
    } = useLocalPrefs();

    return (
        <View style={styles.cadenceAssistControl}>
            {/* -10 버튼 */}
            <TouchableOpacity
                disabled={!isEnabled}
                onPress={() => decCadenceTarget(10)}
                onLongPress={() => decCadenceTarget(10)}
                style={[
                    styles.cadenceAssistButton,
                    isEnabled ? {} : styles.disabledCadenceAssistControl,
                ]}
            >
                <Typography
                    variant="subhead3"
                    color={isEnabled ? "white" : "gray60"}
                >
                    -10
                </Typography>
            </TouchableOpacity>

            {/* 현재 값 */}
            <View
                style={[
                    styles.cadenceAssistPanel,
                    isEnabled ? {} : styles.disabledCadenceAssistControl,
                ]}
            >
                <Typography
                    variant="subhead3"
                    color={isEnabled ? "white" : "gray60"}
                >
                    {value} spm
                </Typography>
            </View>

            {/* +10 버튼 */}
            <TouchableOpacity
                disabled={!isEnabled}
                onPress={() => incCadenceTarget(10)}
                onLongPress={() => incCadenceTarget(10)}
                style={[
                    styles.cadenceAssistButton,
                    isEnabled ? {} : styles.disabledCadenceAssistControl,
                ]}
            >
                <Typography
                    variant="subhead3"
                    color={isEnabled ? "white" : "gray60"}
                >
                    +10
                </Typography>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    cadenceAssistControl: {
        marginTop: -2,
        paddingHorizontal: 17,
        paddingBottom: 17,
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    cadenceAssistButton: {
        height: 32,
        paddingHorizontal: 12,
        borderRadius: 6,
        backgroundColor: colors.gray[80],
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#171717",
        boxShadow: "0px 2px 6px 0px rgba(0, 0, 0, 0.15)",
    },
    cadenceAssistPanel: {
        flex: 1,
        height: 32,
        borderRadius: 6,
        backgroundColor: "#171717",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.gray[80],
    },
    disabledCadenceAssistControl: {
        backgroundColor: "#171717",
        borderColor: "#171717",
    },
});
