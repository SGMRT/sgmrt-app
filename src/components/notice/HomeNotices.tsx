import { dismiss, getNoticesActive, Notice } from "@/src/apis";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import localEvent from "./localEvent.json";
import { NoticeItem } from "./ui/NoticeItem";

export const HomeNotices = () => {
    const [localNotice, setLocalNotice] = useState<Notice | null>(null);
    const [activeNotices, setActiveNotices] = useState<Notice[]>([]);
    const router = useRouter();

    const { data } = useQuery({
        queryKey: ["active-notice"],
        queryFn: getNoticesActive,
    });

    useEffect(() => {
        if (data) setActiveNotices(data);
    }, [data]);

    const handlePress = useCallback(
        (noticeId: number) => {
            router.push(`/profile/notice/${noticeId}`);
        },
        [router]
    );

    const handleClose = useCallback((noticeId: number) => {
        if (noticeId === -1) {
            AsyncStorage.setItem("disableLocalNotice", "true");
            setLocalNotice(null);
            return;
        }
        setActiveNotices((prev) => prev.filter((n) => n.id !== noticeId));
        dismiss(noticeId);
    }, []);

    useEffect(() => {
        const getLocalNotice = async () => {
            const status = await AsyncStorage.getItem("disableLocalNotice");
            if (
                status !== "true" &&
                localEvent &&
                new Date(localEvent.endAt).getTime() > Date.now()
            ) {
                setLocalNotice(localEvent as unknown as Notice);
            } else {
                setLocalNotice(null);
            }
        };
        getLocalNotice();
    }, []);

    const mergedNotices = useMemo<Notice[]>(() => {
        const arr: Notice[] = [];
        if (localNotice) arr.push(localNotice);
        if (activeNotices.length) arr.push(...activeNotices);
        return arr;
    }, [localNotice, activeNotices]);

    if (mergedNotices.length === 0) return null;

    const top = mergedNotices[0];

    return (
        <NoticeItem
            key={top.id}
            content={top.title}
            onPress={() => handlePress(top.id)}
            onClose={() => handleClose(top.id)}
        />
    );
};
