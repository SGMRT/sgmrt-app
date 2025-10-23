import { DefaultProfileIcon } from "@/assets/icons/icons";
import { TrashIcon } from "@/assets/svgs/svgs";
import { ProgressBar } from "@/src/components/ui/ProgressBar";
import { Typography } from "@/src/components/ui/Typography";
import colors from "@/src/theme/colors";
import { Image } from "expo-image";
import { Alert, StyleSheet, TouchableOpacity, View } from "react-native";
import { BaseGhostRow } from "./BaseGhostRow";

interface AIGhostRowProps {
    name: string;
    pace: string;
    isCreating: boolean;
    active?: boolean;
    onDelete: () => void;
    onSelect: () => void;
}

export const AIGhostRow = ({
    name,
    pace,
    isCreating,
    active = false,
    onDelete,
    onSelect,
}: AIGhostRowProps) => {
    const avatar = isCreating ? (
        <View style={styles.avatar} />
    ) : (
        <Image source={DefaultProfileIcon} style={styles.avatar} />
    );

    const handleDelete = () => {
        Alert.alert(
            "고스티를 삭제할까요?",
            "삭제한 고스티는 다시 복구할 수 없어요.",
            [
                {
                    text: "유지",
                },
                {
                    text: "삭제",
                    style: "destructive",
                    onPress: onDelete,
                },
            ]
        );
    };

    const stats = isCreating ? (
        <View style={{ marginRight: 13.5 }}>
            <Typography variant="body2" color="gray40">
                고스티가 준비중 이에요
            </Typography>
            <View style={{ marginVertical: 8 }}>
                <ProgressBar progress={0.8} />
            </View>
        </View>
    ) : (
        <View>
            <Typography
                variant="subhead1"
                color={active ? "primary" : "gray60"}
            >
                {name}
            </Typography>
            <Typography variant="body2" color={active ? "gray40" : "gray60"}>
                페이스: {pace}
            </Typography>
        </View>
    );

    const rightAccessory = (
        <TouchableOpacity
            disabled={!active}
            onPress={handleDelete}
            style={{ marginRight: 16.5 }}
        >
            <TrashIcon color={active ? colors.gray[40] : colors.gray[60]} />
        </TouchableOpacity>
    );

    return (
        <BaseGhostRow
            avatar={avatar}
            stats={stats}
            rightAccessory={isCreating ? undefined : rightAccessory}
            active={active}
            onSelect={onSelect}
        />
    );
};

const styles = StyleSheet.create({
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 100,
        backgroundColor: "#333333",
    },
});
