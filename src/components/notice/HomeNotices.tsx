import { dismissNotice, getNoticesActive, Notice } from "@/src/apis";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { NoticeItem } from "./ui/NoticeItem";

export const HomeNotices = () => {
    const [activeNotices, setActiveNotices] = useState<Notice[]>([]);
    const router = useRouter();

    const { data } = useQuery({
        queryKey: ["active-notice"],
        queryFn: getNoticesActive,
    });

    useEffect(() => {
        if (data) {
            setActiveNotices(data);
        }
    }, [data]);

    const handlePress = useCallback((noticeId: number) => {
        router.push(`/notice/${noticeId}`);
    }, []);

    const handleClose = useCallback((noticeId: number) => {
        setActiveNotices((prev) =>
            prev.filter((notice) => notice.id !== noticeId)
        );
        dismissNotice(noticeId);
    }, []);

    if (!data || activeNotices.length === 0) {
        return null;
    }

    return (
        <NoticeItem
            key={activeNotices[0].id}
            content={activeNotices[0].content}
            onPress={() => handlePress(activeNotices[0].id)}
            onClose={() => handleClose(activeNotices[0].id)}
        />
    );
};
