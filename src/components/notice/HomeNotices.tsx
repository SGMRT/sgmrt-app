import { dismissNotice, getNoticesActive, Notice } from "@/src/apis";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { NoticeItem } from "./NoticeItem";

export const HomeNotices = () => {
    const [activeNotices, setActiveNotices] = useState<Notice[]>([]);

    const { data } = useQuery({
        queryKey: ["active-notice"],
        queryFn: getNoticesActive,
    });

    useEffect(() => {
        if (data) {
            setActiveNotices(data);
            console.log(data);
        }
    }, [data]);

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
            content={activeNotices[0].content}
            onClose={() => handleClose(activeNotices[0].id)}
        />
    );
};
