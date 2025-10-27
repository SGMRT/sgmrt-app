import { getPacemakerDetail, postGhosty } from "@/src/apis";
import { CreateGhostyRequest } from "@/src/apis/types/ghosty";

type CreateOpts = {
    maxCreateRetries?: number; // FAILED일 때 새로 생성 재시도 횟수
    baseDelayMs?: number; // 백오프 기본 지연
    maxDelayMs?: number; // 백오프 최대 지연 상한
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const backoff = (attempt: number, baseMs: number, maxMs: number) =>
    Math.min(maxMs, baseMs * Math.pow(2, attempt)) + Math.random() * 200;

/**
 * - postGhosty 성공 후 detail.processingStatus가 FAILED면 새로 생성해서 재시도
 * - PROCESSING 또는 SUCCEEDED면 즉시 pacemakerId 반환
 * - postGhosty / getPacemakerDetail 둘 중 하나 에러 시에는 재시도 가치가 있다고 보고 다음 루프로
 */
export async function createGhostyWithRetries(
    params: CreateGhostyRequest,
    opts: CreateOpts = {}
): Promise<number> {
    const { maxCreateRetries = 3, baseDelayMs = 600, maxDelayMs = 4000 } = opts;

    let lastError: unknown;

    for (let attempt = 0; attempt < maxCreateRetries; attempt++) {
        try {
            // 1) 생성 시도
            const { pacemakerId } = await postGhosty(params);

            // 2) 상태 한 번만 확인
            try {
                const detail = await getPacemakerDetail(pacemakerId);

                if (detail.processingStatus === "FAILED") {
                    lastError = new Error("Pacemaker processing FAILED");
                } else {
                    return pacemakerId;
                }
            } catch (e) {
                lastError = e;
            }
        } catch (e) {
            lastError = e;
        }
        if (attempt < maxCreateRetries - 1) {
            await sleep(backoff(attempt, baseDelayMs, maxDelayMs));
        }
    }

    throw lastError ?? new Error("고스티 생성 실패(FAILED 지속)");
}
