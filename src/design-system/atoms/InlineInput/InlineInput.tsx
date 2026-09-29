// Ghost Runner Design System - InlineInput
//
// 이미 화면에 놓인 글자를 그 자리에서 고치는 입력이다.
// 러닝 이름이나 코스 이름처럼, 평소에는 제목으로 읽히다가
// 누르면 고칠 수 있게 되는 자리에 쓴다.
//
// 상자가 있는 Input 과는 쓰임이 다르다.
//   Input       무엇을 채워야 하는 빈칸. 라벨과 상자가 있고 높이는 56 이다
//   InlineInput 이미 값이 있는 제목. 상자가 없고 주변 글자와 같은 크기로 앉는다
//
// 상자를 두르지 않으므로 고칠 수 있다는 것이 드러나지 않는다.
// 그래서 연필 아이콘을 붙이고, 아이콘을 눌러도 입력으로 들어가게 한다.

import { EditIcon } from "@/assets/svgs/svgs";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { useRef } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { darkTheme } from "../../themes/dark";
import { spacing } from "../../tokens/spacing";
import { typographyVariants } from "../../tokens/typography";

interface InlineInputProps {
    /** 처음에 보여 줄 값 */
    defaultValue?: string;
    /** 값이 비었을 때 보여 줄 안내 */
    placeholder?: string;
    onChangeText?: (text: string) => void;
    /** 입력에서 손을 뗄 때. 보통 여기서 저장한다 */
    onBlur?: () => Promise<void> | void;
    /**
     * 바텀시트 안에서 쓸 때 켠다.
     * 바텀시트는 제 손으로 키보드를 다루므로 전용 입력을 써야
     * 키보드가 올라올 때 시트가 따라 올라간다.
     */
    bottomSheet?: boolean;
}

export function InlineInput({
    defaultValue,
    placeholder,
    onChangeText,
    onBlur,
    bottomSheet = false,
}: InlineInputProps) {
    const inputRef = useRef<TextInput>(null);

    const shared = {
        placeholder,
        defaultValue,
        placeholderTextColor: darkTheme.ui05,
        autoCapitalize: "none" as const,
        autoCorrect: false,
        style: styles.input,
        onChangeText,
        onBlur: async () => {
            await onBlur?.();
        },
    };

    return (
        <View style={styles.container}>
            {bottomSheet ? (
                <BottomSheetTextInput
                    {...shared}
                    ref={inputRef as React.RefObject<never>}
                />
            ) : (
                <TextInput {...shared} ref={inputRef} />
            )}
            {/* 아이콘은 표시이자 또 하나의 누를 자리다.
                글자가 짧으면 겨냥할 곳이 좁아 아이콘 쪽이 더 누르기 쉽다. */}
            <Pressable
                onPress={() => inputRef.current?.focus()}
                hitSlop={spacing[8]}
            >
                <EditIcon />
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        gap: spacing[4],
        alignItems: "center",
        overflow: "hidden",
    },
    input: {
        ...typographyVariants.subhead1,
        color: darkTheme.ui10,
        lineHeight: undefined,
        maxWidth: "100%",
    },
});
