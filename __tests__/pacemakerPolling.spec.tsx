/**
 * @jest-environment jsdom
 */

import { getPacemakerDetail } from "@/src/apis";
import { usePacemakerJobPolling } from "@/src/features/pacemaker/hooks/usePacemakerJobPolling";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react-native";
import { AxiosError } from "axios";
import React from "react";

jest.mock("@/src/utils/devLog", () => ({
    devLog: jest.fn(),
}));

jest.mock("@/src/apis", () => ({
    getPacemakerDetail: jest.fn(),
}));

// 실제 스토어 대체 역할을 하는 메모리 상태
const mockState = {
    jobs: [] as any[],
    setStatus: jest.fn(),
};

// tick을 호출할 수 있도록 subscribe 리스너를 잡아둘 변수
let queueListener: ((next: any, prev: any) => void) | null = null;

// queueStore 모듈 전체를 Jest factory로 모킹
jest.mock("@/src/features/pacemaker/store/queueStore", () => {
    const usePacemakerQueue: any = (
        selector?: (s: typeof mockState) => any
    ) => {
        if (typeof selector === "function") {
            return selector(mockState);
        }
        return mockState;
    };

    usePacemakerQueue.subscribe = jest.fn(
        (
            _selector: (s: typeof mockState) => any,
            listener: (next: any, prev: any) => void,
            _opts?: any
        ) => {
            // 훅에서 등록한 listener (안에서 tick() 호출)를 보관
            queueListener = listener;
            return () => {
                queueListener = null;
            };
        }
    );

    usePacemakerQueue.getState = () => mockState;

    return { usePacemakerQueue };
});

describe("usePacemakerJobPolling", () => {
    let queryClient: QueryClient;
    let now = 0;
    let dateNowSpy: jest.SpyInstance<number, []>;

    // 비동기 + microtask queue 비우기용 유틸
    const flushAll = async () => {
        await Promise.resolve();
        await Promise.resolve();
    };

    // 매 tick을 직접 실행하는 헬퍼 (subscribe가 받은 listener 호출)
    const runTick = async () => {
        if (!queueListener) {
            throw new Error("queueListener is not set. Did the hook mount?");
        }
        await act(async () => {
            // zustand subscribe listener는 (next, prev)를 받지만,
            // 여기서는 크게 상관 없으니 동일한 state 전달
            queueListener!(mockState.jobs, mockState.jobs);
            await flushAll();
        });
    };

    beforeEach(() => {
        now = 0;
        // Date.now를 우리가 제어할 수 있도록 mock
        dateNowSpy = jest.spyOn(Date, "now").mockImplementation(() => now);

        queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                    gcTime: Infinity,
                },
            },
        });

        mockState.jobs = [];
        mockState.setStatus.mockClear();
        (getPacemakerDetail as jest.Mock).mockReset();
        queueListener = null;
    });

    afterEach(async () => {
        dateNowSpy.mockRestore();
        await flushAll();
    });

    const wrapper: React.FC<{ children?: React.ReactNode }> = ({
        children,
    }) => (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );

    const mkJob = (
        overrides: Partial<(typeof mockState.jobs)[number]> = {}
    ) => ({
        jobId: overrides.jobId ?? "job-1",
        pacemakerId: overrides.pacemakerId ?? 123,
        courseId: overrides.courseId ?? 999,
        queuedAt:
            overrides.queuedAt ?? new Date(Date.now() - 100_000).toISOString(), // 기본: now보다 100초 전
        status: overrides.status ?? "PROCEEDING",
        ...overrides,
    });

    test("processingStatus = COMPLETED → setStatus(COMPLETED)", async () => {
        mockState.jobs = [
            mkJob({ jobId: "job-1", pacemakerId: 10, courseId: 77 }),
        ];

        (getPacemakerDetail as jest.Mock).mockResolvedValue({
            processingStatus: "COMPLETED",
        });

        renderHook(() => usePacemakerJobPolling({ intervalMs: 1000 }), {
            wrapper,
        });

        // 90초 경과 조건을 만족시키기 위해 now를 크게 올림
        now = 200_000;

        await runTick();

        expect(mockState.setStatus).toHaveBeenCalledWith(
            "job-1",
            "COMPLETED",
            undefined
        );
    });

    test("processingStatus = FAILED → setStatus(FAILED, reason)", async () => {
        mockState.jobs = [mkJob({ jobId: "job-2", pacemakerId: 20 })];

        (getPacemakerDetail as jest.Mock).mockResolvedValue({
            processingStatus: "FAILED",
        });

        renderHook(() => usePacemakerJobPolling({ intervalMs: 1000 }), {
            wrapper,
        });

        now = 200_000;

        await runTick();

        expect(mockState.setStatus).toHaveBeenCalledWith(
            "job-2",
            "FAILED",
            "Pacemaker processing FAILED"
        );
    });

    test("404 → Pacemaker not found → FAILED", async () => {
        mockState.jobs = [mkJob({ jobId: "job-3", pacemakerId: 30 })];

        const err = new AxiosError(
            "not found",
            undefined,
            undefined,
            undefined,
            { status: 404 } as any
        );

        (getPacemakerDetail as jest.Mock).mockRejectedValue(err);

        renderHook(() => usePacemakerJobPolling({ intervalMs: 1000 }), {
            wrapper,
        });

        now = 200_000;

        await runTick();

        expect(mockState.setStatus).toHaveBeenCalledWith(
            "job-3",
            "FAILED",
            "Pacemaker not found"
        );
    });

    test("4xx(429 제외) 에러 → 재시도 없이 FAILED", async () => {
        mockState.jobs = [mkJob({ jobId: "job-4", pacemakerId: 40 })];

        const err = new AxiosError(
            "bad request",
            undefined,
            undefined,
            undefined,
            { status: 400 } as any
        );

        (getPacemakerDetail as jest.Mock).mockRejectedValue(err);

        renderHook(() => usePacemakerJobPolling({ intervalMs: 1000 }), {
            wrapper,
        });

        now = 200_000;

        await runTick();

        expect(mockState.setStatus).toHaveBeenCalledWith(
            "job-4",
            "FAILED",
            "Pacemaker processing FAILED"
        );
    });

    test("queuedAt 90초 안 지난 잡은 폴링 대상에서 제외", async () => {
        // queuedAt = now 시점 → 90초 경과 전
        now = 0;
        mockState.jobs = [
            mkJob({
                jobId: "job-5",
                pacemakerId: 50,
                queuedAt: new Date(Date.now()).toISOString(), // now
            }),
        ];

        (getPacemakerDetail as jest.Mock).mockResolvedValue({
            processingStatus: "COMPLETED",
        });

        renderHook(() => usePacemakerJobPolling({ intervalMs: 1000 }), {
            wrapper,
        });

        // now를 30초까지만 올리면 queuedAt + 90_000 > now
        now = 30_000;

        await runTick();

        expect(mockState.setStatus).not.toHaveBeenCalled();
        expect(getPacemakerDetail).not.toHaveBeenCalled();
    });

    test("일시적인 서버 에러로 몇 번 실패 후, 백오프를 거쳐 COMPLETED로 종료", async () => {
        mockState.jobs = [
            mkJob({ jobId: "job-6", pacemakerId: 60, courseId: 1000 }),
        ];

        const transientErr = new AxiosError(
            "server error",
            undefined,
            undefined,
            undefined,
            { status: 500 } as any
        );

        (getPacemakerDetail as jest.Mock)
            .mockRejectedValueOnce(transientErr)
            .mockRejectedValueOnce(transientErr)
            .mockResolvedValue({ processingStatus: "COMPLETED" });

        renderHook(
            () =>
                usePacemakerJobPolling({
                    intervalMs: 1000,
                    baseBackoffMs: 1000,
                    maxBackoffMs: 10_000,
                    maxAttempts: 5,
                }),
            { wrapper }
        );

        // 1번째 tick: 실패 (attempts=1, nextAt 설정)
        now = 100_000;
        await runTick();

        // 2번째 tick: 실패 (attempts=2, nextAt 재설정)
        now = 200_000;
        await runTick();

        // 3번째 tick: 성공 (COMPLETED)
        now = 300_000;
        await runTick();

        expect(mockState.setStatus).toHaveBeenCalledWith(
            "job-6",
            "COMPLETED",
            undefined
        );
    });

    test("백오프 재시도를 maxAttempts까지 모두 사용한 뒤 FAILED로 종료", async () => {
        mockState.jobs = [
            mkJob({ jobId: "job-7", pacemakerId: 70, courseId: 2000 }),
        ];

        const err = new AxiosError(
            "server error",
            undefined,
            undefined,
            undefined,
            { status: 500 } as any
        );

        (getPacemakerDetail as jest.Mock).mockRejectedValue(err);

        renderHook(
            () =>
                usePacemakerJobPolling({
                    intervalMs: 1000,
                    baseBackoffMs: 1000,
                    maxBackoffMs: 10_000,
                    maxAttempts: 3,
                }),
            { wrapper }
        );

        // attempts 1
        now = 100_000;
        await runTick();

        // attempts 2
        now = 200_000;
        await runTick();

        // attempts 3 → maxAttempts 도달 → FAILED
        now = 300_000;
        await runTick();

        expect(mockState.setStatus).toHaveBeenCalledWith(
            "job-7",
            "FAILED",
            "Pacemaker polling failed after 3 attempts"
        );
    });
});
