// 선형 보간
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
// 라디안 → 도
const toDeg = (r: number) => (r * 180) / Math.PI;
// 두 점 사이의 헤딩 계산 (0°=북쪽 기준)
const headingBetween = (
    a: { x: number; y: number },
    b: { x: number; y: number }
) => (toDeg(Math.atan2(b.x - a.x, b.y - a.y)) + 360) % 360;

// -180..180로 정규화
const norm180 = (deg: number) => {
    let d = ((((deg + 180) % 360) + 360) % 360) - 180;
    return d === -180 ? 180 : d;
};

// 시간상수 → EMA 알파 (dt: 초)
const alphaFromTau = (tauSec: number, dtSec: number) =>
    tauSec <= 0 ? 1 : 1 - Math.exp(-dtSec / tauSec);

export { lerp, toDeg, headingBetween, norm180, alphaFromTau };
