/**
 * @jest-environment jsdom
 */

import { getPacemakerDetail } from "@/src/apis";
import { usePacemakerJobPolling } from "@/src/features/pacemaker/hooks/usePacemakerJobPolling";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react-hooks";
import { AxiosError } from "axios";
import React from "react";

// devLog는 콘솔 덜 지저분하게 mock
jest.mock("@/src/utils/devLog", () => ({
    devLog: jest.fn(),
}));

// getPacemakerDetail 모킹
jest.mock("@/src/apis", () => ({
    getPacemakerDetail: jest.fn(),
}));

// 실제 스토어 대체 역할을 하는 메모리 상태
const mockState = {
    jobs: [] as any[],
    setStatus: jest.fn(),
};

// queueStore 모듈 전체를 Jest factory로 모킹
jest.mock("@/src/features/pacemaker/store/queueStore", () => {
    // create-style Zustand 훅 모양으로 흉내
    const usePacemakerQueue: any = (
        selector?: (s: typeof mockState) => any
    ) => {
        if (typeof selector === "function") {
            return selector(mockState);
        }
        return mockState;
    };

    // subscribe도 훅에 달려 있는 형태로 제공
    usePacemakerQueue.subscribe = jest.fn(
        (
            _selector: (s: typeof mockState) => any,
            _listener: (next: any, prev: any) => void,
            _opts?: any
        ) => {
            // 여기서는 폴링 훅이 subscribe 호출만 하고,
            // 실제 listener를 호출하진 않아도 테스트가 돌아가므로 no-op
            return () => {};
        }
    );

    usePacemakerQueue.getState = () => mockState;

    return { usePacemakerQueue };
});

jest.useFakeTimers();

describe("usePacemakerJobPolling", () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = new QueryClient();
        mockState.jobs = [];
        mockState.setStatus.mockClear();
        (getPacemakerDetail as jest.Mock).mockReset();
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
            overrides.queuedAt ?? new Date(Date.now() - 100_000).toISOString(), // 100초 전 → 90초 조건 통과
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

        await act(async () => {
            jest.advanceTimersByTime(1000);
        });

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

        await act(async () => {
            jest.advanceTimersByTime(1000);
        });

        expect(mockState.setStatus).toHaveBeenCalledWith(
            "job-2",
            "FAILED",
            "Pacemaker processing FAILED"
        );
    });

    test("404 → Pacemaker not found → FAILED", async () => {
        mockState.jobs = [mkJob({ jobId: "job-3", pacemakerId: 30 })];

        // isAxiosError가 true로 인식할 실제 AxiosError 인스턴스 생성
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

        await act(async () => {
            jest.advanceTimersByTime(1000);
        });

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

        await act(async () => {
            jest.advanceTimersByTime(1000);
        });

        expect(mockState.setStatus).toHaveBeenCalledWith(
            "job-4",
            "FAILED",
            "Pacemaker processing FAILED"
        );
    });

    test("queuedAt 90초 안 지난 잡은 폴링 대상에서 제외", async () => {
        mockState.jobs = [
            mkJob({
                jobId: "job-5",
                pacemakerId: 50,
                queuedAt: new Date().toISOString(), // 지금 시간 → 90초 미만
            }),
        ];

        (getPacemakerDetail as jest.Mock).mockResolvedValue({
            processingStatus: "COMPLETED",
        });

        renderHook(() => usePacemakerJobPolling({ intervalMs: 1000 }), {
            wrapper,
        });

        await act(async () => {
            jest.advanceTimersByTime(5000);
        });

        expect(mockState.setStatus).not.toHaveBeenCalled();
        expect(getPacemakerDetail).not.toHaveBeenCalled();
    });

    // 🔁 재시도 + 백오프 경로 테스트 (1): 몇 번 실패한 뒤 성공
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

        // 1, 2번째 호출은 500 에러 → 백오프
        // 3번째 호출에서 COMPLETED
        (getPacemakerDetail as jest.Mock)
            .mockRejectedValueOnce(transientErr)
            .mockRejectedValueOnce(transientErr)
            .mockResolvedValue({ processingStatus: "COMPLETED" });

        // 백오프를 눈에 좀 더 잘 보이게 baseBackoffMs를 줄여도 되고, 안 줄여도 됨
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

        await act(async () => {
            // 충분히 시간을 많이 돌려서
            // - 첫 tick: 실패(1회) → 백오프 예약
            // - 두 번째 백오프 이후: 실패(2회)
            // - 세 번째 백오프 이후: 성공(COMPLETED)
            jest.advanceTimersByTime(30_000);
        });

        // COMPLETED로 한 번 이상은 설정됐는지만 보면 됨
        expect(mockState.setStatus).toHaveBeenCalledWith(
            "job-6",
            "COMPLETED",
            undefined
        );
    });

    // 🔁 재시도 + 백오프 경로 테스트 (2): maxAttempts 다 쓰고 FAILED 처리
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

        // 항상 500 에러 → 계속 백오프 타게 하기
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

        await act(async () => {
            // 넉넉하게 돌려서 3번 시도 + 3번 백오프 루프를 모두 지나가게 함
            jest.advanceTimersByTime(60_000);
        });

        // maxAttempts 번 시도 후 FAILED 브랜치가 한 번이라도 실행됐는지 확인
        expect(mockState.setStatus).toHaveBeenCalledWith(
            "job-7",
            "FAILED",
            "Pacemaker polling failed after 3 attempts"
        );
    });
});
