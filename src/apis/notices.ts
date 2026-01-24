import { useAuthStore } from "../store/authState";
import server from "./instance";

export type Notice = {
    id: number;
    title: string;
    type: "GENERAL" | "EVENT" | null;
    imageUrl: string;
    content: string;
    priority: number;
    startAt: number;
    endAt: number;
};

type GetNoticesResponse = {
    content: Notice[];
    page: {
        size: number;
        number: number;
        totalElements: number;
        totalPages: number;
    };
};

export async function getNoticesAll(
    page = 0,
    size = 10
): Promise<GetNoticesResponse> {
    const response = await server.get(`/notices`, {
        apiVersion: "v2",
        params: {
            page,
            size,
        },
    });
    return response.data;
}

export async function getNotice(noticeId: number): Promise<Notice> {
    const response = await server.get(`/notices/${noticeId}`, {
        apiVersion: "v2",
    });
    return response.data;
}

export async function getNoticesActive(): Promise<Notice[]> {
    const response = await server.get(`/notices/active`, { apiVersion: "v2" });
    return response.data;
}

export async function dismiss(noticeId: number) {
    const response = await server.post(
        `/notices/${noticeId}/dismissal`,
        {
            dismissDays: null,
        },
        {
            apiVersion: "v2",
        }
    );
    return response.data;
}

/** @deprecated POST /v1/member/{memberUuid}/push-token is deprecated. Use registerDevice from user.ts instead. */
export async function postUserPushToken(pushToken: string) {
    const { uuid } = useAuthStore.getState();
    const response = await server.post(`/member/${uuid}/push-token`, {
        pushToken,
    });
    return response.data;
}

export async function markPushAsRead(messageUuid: string) {
    const response = await server.post(`/push/${messageUuid}`);
    return response.data;
}
