import { alphaFromTau, norm180 } from "../utils";

export type SmoothingOptions = {
    posDeadbandUnits?: number;
    maxPosSpeedUnitsPerSec?: number;
    posTauSec?: number;
    headingTauSec?: number;
    maxTurnRateDps?: number;
};

export type SmoothState = {
    x: number;
    y: number;
    heading: number;
};

export type RawPose = {
    x: number;
    y: number;
    heading: number;
};

/**
 * 위치와 헤딩에 EMA 스무딩을 적용합니다.
 * 불변 함수: 새로운 SmoothState를 반환합니다.
 */
export function applySmoothingToPosition(
    raw: RawPose,
    prev: SmoothState,
    dtSec: number,
    opts: SmoothingOptions
): SmoothState {
    const {
        posDeadbandUnits = 0,
        maxPosSpeedUnitsPerSec = 0,
        posTauSec = 0.12,
        headingTauSec = 0.1,
        maxTurnRateDps = 180,
    } = opts;

    let sx = prev.x;
    let sy = prev.y;
    let sh = prev.heading;

    // 1) 데드밴드
    const dx = raw.x - sx;
    const dy = raw.y - sy;
    const dist = Math.hypot(dx, dy);
    let tx = raw.x;
    let ty = raw.y;

    if (posDeadbandUnits > 0 && dist < posDeadbandUnits) {
        tx = sx;
        ty = sy;
    }

    // 2) 속도 캡 (좌표단위/초)
    if (maxPosSpeedUnitsPerSec > 0 && dtSec > 0) {
        const maxStep = maxPosSpeedUnitsPerSec * dtSec;
        const mx = tx - sx;
        const my = ty - sy;
        const mDist = Math.hypot(mx, my);
        if (mDist > maxStep) {
            const k = maxStep / mDist;
            tx = sx + mx * k;
            ty = sy + my * k;
        }
    }

    // 3) 좌표 EMA 스무딩
    if (posTauSec > 0) {
        const a = 1 - Math.exp(-dtSec / posTauSec);
        sx = sx + (tx - sx) * a;
        sy = sy + (ty - sy) * a;
    } else {
        sx = tx;
        sy = ty;
    }

    // 4) 헤딩 스무딩 (+ 회전속도 캡)
    let delta = norm180(raw.heading - sh);
    if (maxTurnRateDps > 0 && dtSec > 0) {
        const maxDelta = maxTurnRateDps * dtSec;
        if (delta > maxDelta) delta = maxDelta;
        else if (delta < -maxDelta) delta = -maxDelta;
    }
    if (headingTauSec > 0) {
        const ah = alphaFromTau(headingTauSec, dtSec);
        sh = sh + delta * ah;
    } else {
        sh = sh + delta;
    }
    if (sh < 0) sh += 360;
    else if (sh >= 360) sh -= 360;

    return { x: sx, y: sy, heading: sh };
}
