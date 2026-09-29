import { darkTheme } from "@/src/design-system/themes/dark";
import { radius } from "@/src/design-system/tokens/radius";
import { spacing } from "@/src/design-system/tokens/spacing";
import { useLocalPrefs } from "@/src/store/localPrefs";
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
                    style={
                        isEnabled
                            ? undefined
                            : { color: darkTheme.uiDisabledFg }
                    }
                    color="white"
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
                    style={
                        isEnabled
                            ? undefined
                            : { color: darkTheme.uiDisabledFg }
                    }
                    color="white"
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
                    style={
                        isEnabled
                            ? undefined
                            : { color: darkTheme.uiDisabledFg }
                    }
                    color="white"
                >
                    +10
                </Typography>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    cadenceAssistControl: {
        paddingHorizontal: spacing[16],
        paddingBottom: spacing[16],
        flexDirection: "row",
        alignItems: "center",
        gap: spacing[4],
    },
    // 값을 올리고 내리는 보조 행동이라 line 이다.
    // 면을 채우면 이 조작이 카드 안에서 가장 밝아져
    // 정작 읽어야 할 값보다 먼저 눈에 들어온다.
    cadenceAssistButton: {
        height: 32,
        paddingHorizontal: spacing[12],
        borderRadius: radius.sm,
        backgroundColor: "transparent",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: darkTheme.ui02,
    },
    // 지금 값을 보여 줄 뿐 누를 수 없다.
    // 테두리는 누를 수 있다는 뜻이므로 여기서는 쓰지 않고 면으로 둔다.
    //
    // 면은 카드 위가 아니라 아래로 둔다.
    // 고스티의 통계 박스는 카드 안에 다시 놓인 카드라 uiUp 이 맞지만,
    // 이것은 설정 한 줄에 딸린 값 칸이라 카드보다 앞설 이유가 없다.
    // 카드보다 어두우면 파여 들어간 칸으로 읽혀 읽을 것과 누를 것이 갈린다.
    cadenceAssistPanel: {
        flex: 1,
        height: 32,
        borderRadius: radius.sm,
        backgroundColor: darkTheme.uiBackground,
        justifyContent: "center",
        alignItems: "center",
    },
    // 이 조작은 위의 케이던스 보조 토글이 꺼지면 따라 꺼진다.
    // 제 사정으로 못 쓰게 된 것이 아니라 딸려서 꺼진 것이므로
    // 면과 테두리를 잃고 배경 높이로 내려앉는다.
    disabledCadenceAssistControl: {
        backgroundColor: darkTheme.uiBackground,
        borderColor: darkTheme.uiBackground,
    },
});
