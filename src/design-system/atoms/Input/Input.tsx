// Ghost Runner Design System - Input
//
// 피그마 "Atom > 입력" 정의를 옮긴 컴포넌트다.
// 박스 높이 56 은 Button 의 large 와 같다. 둘이 한 화면에 섞여도 줄이 맞는다.
//
// 상태
//   - Default : 값이 비어 있을 때
//   - Filled  : 값이 있을 때. 지우기 버튼이 생긴다
//   - Error   : 박스 아래 왼쪽 메시지가 Ghost Red 로 바뀐다
//
// labelPosition
//   - inside  : 라벨이 박스 안에 있다. 값이 들어오면 위로 작아진다
//   - outside : 라벨이 박스 위에 따로 선다. 박스 안에는 placeholder 가 보인다
//
// 박스 안팎에 무엇을 두는지는 규칙이 있다.
//   박스 안 좌측 : 예시·안내 (placeholder)
//   박스 안 우측 : 값에 붙는 보조 정보 — 단위(cm·kg) 또는 글자 수
//   박스 밖 아래 : 그 입력에 대한 설명과 오류
// 단위와 글자 수는 성격이 같아 한 자리를 나눠 쓴다.
// 단위가 있는 항목은 글자 수가 필요 없고, 그 반대도 마찬가지다.
//
// 같은 자리에 오더라도 보조성이 다르므로 글자 크기로 위계를 나눈다.
//   값 18 → 단위 16 → 글자 수 12
// 단위는 값을 읽는 데 필요하고, 글자 수는 없어도 값을 읽을 수 있다.

import { useRef, useState } from "react";
import {
    KeyboardType,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { darkTheme } from "../../themes/dark";
import { FieldLabel } from "../FieldLabel";
import { radius } from "../../tokens/radius";
import { spacing } from "../../tokens/spacing";

const BOX_HEIGHT = 56;
const BOX_PADDING = spacing[16];

interface InputProps {
    label: string;
    /** 필수 항목이면 라벨 옆에 빨간 별표를 붙인다 */
    required?: boolean;
    /** 라벨 위치. 기본은 박스 안 */
    labelPosition?: "inside" | "outside";
    /** labelPosition 이 outside 일 때 박스 안에 보일 안내 글 */
    placeholder?: string;
    value?: string | null;
    onChangeText?: (text: string) => void;
    keyboardType?: KeyboardType;
    maxLength?: number;
    /** 값 오른쪽에 붙는 단위 (cm, kg 등) */
    unit?: string;
    /** 박스 아래 왼쪽 안내 문구 */
    message?: string;
    /** 박스 아래 오른쪽 안내 문구 */
    messageRight?: string;
    /** 글자 수를 박스 안 오른쪽에 보여준다. 값이 있을 때만 나타난다 */
    counter?: boolean;
    error?: boolean;
    /**
     * 지우기 버튼을 켠다. 기본은 꺼짐.
     * 짧은 값은 지우개 몇 번이면 되므로 버튼이 자리만 차지한다.
     * 검색창처럼 길거나 자주 비우는 입력에서만 켠다.
     */
    clearable?: boolean;
}

export function Input({
    label,
    required = false,
    labelPosition = "inside",
    placeholder,
    value,
    onChangeText,
    keyboardType,
    maxLength,
    unit,
    message,
    messageRight,
    error = false,
    clearable = false,
    counter = false,
}: InputProps) {
    const inputRef = useRef<TextInput>(null);
    const [focused, setFocused] = useState(false);

    const filled = !!value && value.length > 0;
    const outside = labelPosition === "outside";
    // 박스 안 라벨은 값이 있거나 입력 중일 때 위로 올라간다
    const labelOnTop = outside || filled || focused;
    const showClear = filled && clearable;

    // 값이 들어가기 전 보이는 글(안쪽 라벨·placeholder)은 같은 밝기로 둔다.
    // 실제 값(ui10)보다 확실히 낮아야 입력 여부가 한눈에 갈린다.
    // 오류가 나도 이 색은 바뀌지 않는다. 오류는 아래 메시지가 말한다.
    const labelColor = darkTheme.ui05;

    return (
        <View>
            {outside ? (
                <FieldLabel label={label} required={required} />
            ) : null}

            <Pressable
                style={styles.box}
                onPress={() => inputRef.current?.focus()}
            >
                <View style={styles.boxInner}>
                    {outside ? null : (
                        <View style={styles.labelRow}>
                            <Text
                                style={[
                                    labelOnTop
                                        ? styles.labelSmall
                                        : styles.labelLarge,
                                    { color: labelColor },
                                ]}
                            >
                                {label}
                            </Text>
                            {required ? (
                                <Text
                                    style={
                                        labelOnTop
                                            ? styles.requiredSmall
                                            : styles.requiredLarge
                                    }
                                >
                                    *
                                </Text>
                            ) : null}
                        </View>
                    )}

                    {labelOnTop ? (
                        <View style={styles.valueRow}>
                            <TextInput
                                ref={inputRef}
                                style={styles.value}
                                value={value ?? ""}
                                onChangeText={onChangeText}
                                onFocus={() => setFocused(true)}
                                onBlur={() => setFocused(false)}
                                keyboardType={keyboardType}
                                maxLength={maxLength}
                                placeholder={outside ? placeholder : undefined}
                                placeholderTextColor={darkTheme.ui05}
                                cursorColor={darkTheme.primary}
                                selectionColor={darkTheme.primary}
                            />
                            {unit ? (
                                <Text style={styles.unit}>{unit}</Text>
                            ) : null}
                            {/* 글자 수는 칠 때만 필요하다. 비어 있으면 알려주는 게 없다 */}
                            {counter && maxLength && filled ? (
                                <Text style={styles.counter}>
                                    {`${value?.length ?? 0}/${maxLength}`}
                                </Text>
                            ) : null}
                            {/* 지우기 버튼 자리를 늘 비워둬 값이 버튼 밑으로 들어가지 않게 한다 */}
                            {showClear ? <View style={styles.clearSpace} /> : null}
                        </View>
                    ) : null}
                </View>

                {showClear ? (
                    <Pressable
                        style={styles.clear}
                        hitSlop={12}
                        onPress={() => onChangeText?.("")}
                    >
                        <Text style={styles.clearMark}>✕</Text>
                    </Pressable>
                ) : null}
            </Pressable>

            {message || messageRight ? (
                <View style={styles.messageRow}>
                    <Text
                        style={[
                            styles.message,
                            error ? { color: darkTheme.secondary } : null,
                        ]}
                    >
                        {message ?? ""}
                    </Text>
                    <Text style={styles.message}>{messageRight ?? ""}</Text>
                </View>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    box: {
        height: BOX_HEIGHT,
        backgroundColor: darkTheme.ui01,
        borderRadius: radius.base,
        justifyContent: "center",
        paddingHorizontal: BOX_PADDING,
    },
    boxInner: {
        justifyContent: "center",
    },
    labelRow: {
        flexDirection: "row",
        alignItems: "flex-start",
    },
    labelLarge: {
        fontFamily: "SpoqaHanSansNeo-Regular",
        fontSize: 18,
        lineHeight: 24,
        includeFontPadding: false,
    },
    labelSmall: {
        fontFamily: "SpoqaHanSansNeo-Regular",
        fontSize: 12,
        lineHeight: 14,
        includeFontPadding: false,
    },
    requiredLarge: {
        fontFamily: "SpoqaHanSansNeo-Regular",
        fontSize: 12,
        lineHeight: 16,
        color: darkTheme.secondary,
    },
    requiredSmall: {
        fontFamily: "SpoqaHanSansNeo-Regular",
        fontSize: 10,
        lineHeight: 12,
        color: darkTheme.secondary,
    },
    valueRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    value: {
        flex: 1,
        fontFamily: "SpoqaHanSansNeo-Regular",
        fontSize: 18,
        lineHeight: 24,
        color: darkTheme.ui10,
        padding: 0,
        includeFontPadding: false,
    },
    unit: {
        fontFamily: "SpoqaHanSansNeo-Regular",
        // 값(18)보다 한 단계 낮다. 값에 붙되 값을 가리지 않는다
        fontSize: 16,
        lineHeight: 24,
        color: darkTheme.ui05,
        marginLeft: spacing[4],
    },
    counter: {
        fontFamily: "SpoqaHanSansNeo-Regular",
        // 단위(16)보다 또 한 단계 낮다. 가장 보조적인 정보다
        fontSize: 12,
        lineHeight: 16,
        color: darkTheme.ui05,
        marginLeft: spacing[8],
    },
    clearSpace: {
        width: spacing[24],
    },
    clear: {
        position: "absolute",
        right: BOX_PADDING,
        top: 0,
        bottom: 0,
        justifyContent: "center",
    },
    clearMark: {
        fontSize: 18,
        lineHeight: 24,
        color: darkTheme.ui05,
    },
    messageRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: spacing[6],
        paddingHorizontal: spacing[4],
    },
    message: {
        fontFamily: "SpoqaHanSansNeo-Regular",
        fontSize: 12,
        lineHeight: 16,
        color: darkTheme.ui05,
    },
});
