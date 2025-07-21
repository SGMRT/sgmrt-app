import colors from "@/src/theme/colors";
import { KeyboardType, StyleSheet, TextInput, View } from "react-native";
import { Typography } from "./Typography";

interface InfoItemProps {
    title: string;
    required?: boolean;
    placeholder?: string;
    value?: string | null;
    keyboardType?: KeyboardType;
    maxLength?: number;
    unit?: string;
    onChangeText?: (text: string) => void;
}

export default function InfoItem({
    title,
    required = false,
    placeholder = "",
    value,
    keyboardType,
    maxLength,
    unit,
    onChangeText,
}: InfoItemProps) {
    return (
        <View>
            <InfoFieldTitle title={title} required={required} />
            <InfoField
                placeholder={placeholder}
                value={value}
                keyboardType={keyboardType}
                maxLength={maxLength}
                unit={unit}
                onChangeText={onChangeText}
            />
        </View>
    );
}

interface InfoFieldTitleProps {
    title: string;
    required?: boolean;
}

interface InfoFieldProps {
    placeholder?: string;
    unit?: string;
    keyboardType?: KeyboardType;
    maxLength?: number;
    value?: string | null;
    onChangeText?: (text: string) => void;
}

export const InfoFieldTitle = ({ title, required }: InfoFieldTitleProps) => {
    return (
        <View
            style={{
                flexDirection: "row",
            }}
        >
            <Typography variant="subhead2" color="white">
                {title}
            </Typography>
            {required && (
                <Typography variant="subhead2" color="red">
                    *
                </Typography>
            )}
        </View>
    );
};

const InfoField = ({
    placeholder,
    value,
    keyboardType,
    maxLength,
    unit,
    onChangeText,
}: InfoFieldProps) => {
    return (
        <View style={styles.infoField}>
            <TextInput
                style={styles.infoFieldInput}
                placeholderTextColor={colors.gray[60]}
                placeholder={placeholder}
                keyboardType={keyboardType}
                maxLength={maxLength ?? undefined}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="off"
                value={value ?? undefined}
                onChangeText={onChangeText}
            />
            {unit && (
                <Typography variant="body1" color="gray60">
                    {unit}
                </Typography>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    infoFieldInput: {
        color: colors.gray[20],
        fontSize: 16,
        fontFamily: "SpoqaHanSansNeo-Regular",
    },
    infoField: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 6,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#212121",
    },
});
