import { EditIcon } from "@/assets/svgs/svgs";
import colors from "@/src/theme/colors";
import { useRef, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { typographyStyles } from "./Typography";

interface NameInputProps {
    defaultValue?: string;
    placeholder?: string;
    onChangeText?: (text: string) => void;
    onBlur?: () => Promise<void>;
}

export default function NameInput({
    defaultValue,
    placeholder,
    onChangeText,
    onBlur,
}: NameInputProps) {
    const [isEditing, setIsEditing] = useState(false);
    const InputRef = useRef<TextInput>(null);

    return (
        <View style={styles.titleLeft}>
            <TextInput
                editable={isEditing}
                placeholder={placeholder}
                defaultValue={defaultValue}
                placeholderTextColor={colors.gray[60]}
                autoFocus={true}
                autoCapitalize="none"
                autoCorrect={false}
                style={[
                    styles.titleInput,
                    {
                        maxWidth: "80%",
                    },
                ]}
                ref={InputRef}
                onBlur={async () => {
                    setIsEditing(false);
                    onBlur && (await onBlur());
                }}
                onChangeText={onChangeText}
            />
            <EditIcon
                onPress={() => {
                    setIsEditing(true);
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
        flex: 1,
    },
    titleInput: {
        ...typographyStyles.subhead1,
        color: colors.white,
        lineHeight: undefined,
    },
});
