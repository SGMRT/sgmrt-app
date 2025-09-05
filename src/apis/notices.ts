import server from "./instance";

export type Notice = {
    id: number;
    title: string;
    imageUrl: string;
    content: string;
    priority: 0;
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
        params: {
            page,
            size,
        },
    });
    return response.data;
}

export async function getNotice(noticeId: number): Promise<Notice> {
    const response = await server.get(`/notices/${noticeId}`);
    return response.data;
}

export async function getNoticesActive(): Promise<Notice[]> {
    const response = await server.get(`/notices/active`);
    return response.data;
}

export async function dismissNotice(noticeId: number) {
    const response = await server.post(`/notices/${noticeId}/dismissal`);
    return response.data;
}
