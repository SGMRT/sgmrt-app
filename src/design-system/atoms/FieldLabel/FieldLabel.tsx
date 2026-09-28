// Ghost Runner Design System - FieldLabel
//
// 폼 항목 위에 서는 이름표다.
// Input 의 바깥 라벨과 선택지 묶음(성별 등)이 같은 것을 쓰게 하려고 따로 뺐다.
// 이걸 나눠 쓰지 않으면 입력마다 라벨 굵기와 색이 갈려 한 화면에서 튄다.

import { StyleSheet, Text, View } from "react-native";
import { darkTheme } from "../../themes/dark";
import { spacing } from "../../tokens/spacing";

interface FieldLabelProps {
    label: string;
    /** 필수 항목이면 빨간 별표를 붙인다 */
    required?: boolean;
}

// 오류가 나도 라벨 색은 그대로 둔다.
// 항목 이름은 상태와 무관하게 늘 같은 자리에서 같은 무게로 읽혀야 하고,
// 무엇이 잘못됐는지는 박스 아래 메시지가 말한다.
export function FieldLabel({ label, required = false }: FieldLabelProps) {
    return (
        <View style={styles.row}>
            <Text style={[styles.label, { color: darkTheme.ui07 }]}>
                {label}
            </Text>
            {required ? <Text style={styles.required}>*</Text> : null}
        </View>
    );
}

export const FIELD_LABEL_GAP = spacing[8];

const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: FIELD_LABEL_GAP,
    },
    label: {
        fontFamily: "SpoqaHanSansNeo-Medium",
        fontSize: 14,
        lineHeight: 20,
    },
    required: {
        fontFamily: "SpoqaHanSansNeo-Regular",
        fontSize: 12,
        lineHeight: 16,
        color: darkTheme.secondary,
    },
});
