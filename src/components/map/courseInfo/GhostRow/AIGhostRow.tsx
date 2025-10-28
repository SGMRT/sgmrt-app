import { BreezeFace } from "@/assets/icons/icons";
import { TrashIcon } from "@/assets/svgs/svgs";
import { ProgressBar } from "@/src/components/ui/ProgressBar";
import { Typography } from "@/src/components/ui/Typography";
import { usePacemakerQueue } from "@/src/features/pacemaker/store/queueStore";
import colors from "@/src/theme/colors";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, TouchableOpacity, View } from "react-native";
import { BaseGhostRow } from "./BaseGhostRow";

const CREATE_DURATION_MS = 2 * 60 * 1000 + 30 * 1000; // 2분 30초
const MAX_PROGRESS = 0.98; // 98%

interface AIGhostRowProps {
    courseId: number;
    name: string;
    pace: string;
    isCreating: boolean;
    active?: boolean;
    onDelete: () => void;
    onSelect: () => void;
}

export const AIGhostRow = ({
    courseId,
    name,
    pace,
    isCreating,
    active = false,
    onDelete,
    onSelect,
}: AIGhostRowProps) => {
    const [progress, setProgress] = useState(0);
    const { findByCourseId } = usePacemakerQueue();

    useEffect(() => {
        let interval: any;

        (async () => {
            const job = findByCourseId(courseId);
            if (!job) return;

            const startTime = new Date(job.queuedAt).getTime();

            interval = setInterval(() => {
                const now = Date.now();
                const elapsed = now - startTime;
                const ratio = elapsed / CREATE_DURATION_MS;

                // 95%까지만 증가
                const newProgress = Math.min(ratio, MAX_PROGRESS);
                setProgress(newProgress);
            }, 1000);
        })();

        return () => clearInterval(interval);
    }, [courseId]);

    const avatar = isCreating ? (
        <View style={styles.avatar} />
    ) : (
        <Image source={BreezeFace} style={styles.avatar} />
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
                <ProgressBar progress={progress} controller={false} />
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
        boxShadow: "0px 2px 6px 0px rgba(0, 0, 0, 0.15)",
    },
});
