import { EditIcon } from "@/assets/svgs/svgs";
import colors from "@/src/theme/colors";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { useRef } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { typographyStyles } from "./Typography";

interface NameInputProps {
    defaultValue?: string;
    placeholder?: string;
    onChangeText?: (text: string) => void;
    onBlur?: () => Promise<void>;
    bottomSheet?: boolean;
}

export default function NameInput({
    defaultValue,
    placeholder,
    onChangeText,
    onBlur,
    bottomSheet = false,
}: NameInputProps) {
    const InputRef = useRef<TextInput>(null);
    return (
        <View style={styles.titleLeft}>
            {bottomSheet ? (
                <BottomSheetTextInput
                    placeholder={placeholder}
                    defaultValue={defaultValue}
                    placeholderTextColor={colors.gray[60]}
                    autoFocus={true}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={[
                        styles.titleInput,
                        {
                            maxWidth: "100%",
                        },
                    ]}
                    ref={InputRef}
                    onBlur={async () => {
                        onBlur && (await onBlur());
                    }}
                    onChangeText={onChangeText}
                />
            ) : (
                <TextInput
                    placeholder={placeholder}
                    defaultValue={defaultValue}
                    placeholderTextColor={colors.gray[60]}
                    autoFocus={true}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={[
                        styles.titleInput,
                        {
                            maxWidth: "100%",
                        },
                    ]}
                    ref={InputRef}
                    onBlur={async () => {
                        onBlur && (await onBlur());
                    }}
                    onChangeText={onChangeText}
                />
            )}
            <EditIcon
                onPress={() => {
                    InputRef.current?.focus();
                }}
            />
        </View>
    );
}
const styles = StyleSheet.create({
    titleLeft: {
        flexDirection: "row",
        gap: 4,
        alignItems: "center",
        overflow: "hidden",
    },
    titleInput: {
        ...typographyStyles.subhead1,
        color: colors.white,
        lineHeight: undefined,
    },
});
