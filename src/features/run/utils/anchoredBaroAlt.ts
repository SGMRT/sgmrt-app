class AnchoredBaroAlt {
    private anchorP?: number; // hPa at anchor
    private anchorAlt?: number; // GPS altitude at anchor (m)
    private lastFused: number | null = null;
    private pFilt?: number; // low-pass filtered pressure
    private armed = false;

    constructor(
        private readonly K: number = 8434, // m, ~ R*T/g (T≈288K)
        private readonly alphaLP: number = 0.25, // pressure LPF
        private readonly gpsAccGood: number = 8, // m
        private readonly betaGps: number = 0.02 // slow GPS correction
    ) {}

    reset() {
        this.anchorP = undefined;
        this.anchorAlt = undefined;
        this.lastFused = null;
        this.pFilt = undefined;
        this.armed = false;
    }

    /** 호출 시점마다: hPa(pressure), gpsAlt(m), gpsAltAcc(m) */
    update(
        ts: number,
        pressureHPa?: number | null,
        gpsAltM?: number | null,
        gpsAltAccM?: number | null
    ): number | null {
        const hasP = typeof pressureHPa === "number" && isFinite(pressureHPa);
        const hasGoodGps =
            typeof gpsAltM === "number" &&
            isFinite(gpsAltM!) &&
            (gpsAltAccM ?? Infinity) <= this.gpsAccGood;

        // 1) Pressure 필터
        if (hasP) {
            this.pFilt =
                this.pFilt == null
                    ? pressureHPa!
                    : this.alphaLP * pressureHPa! +
                      (1 - this.alphaLP) * this.pFilt;
        }

        // 2) 앵커 설정 (좋은 GPS 나올 때)
        if (!this.armed && hasP && hasGoodGps && this.pFilt != null) {
            this.anchorP = this.pFilt;
            this.anchorAlt = gpsAltM!;
            this.armed = true;
            this.lastFused = this.anchorAlt;
            return this.lastFused;
        }

        // 3) 아직 앵커가 없으면: GPS가 있으면 그걸 쓰고, 아니면 마지막 값 유지
        if (!this.armed) {
            if (typeof gpsAltM === "number") {
                this.lastFused = gpsAltM!;
            }
            return this.lastFused;
        }

        // 4) 앵커 있음: pressure만으로 상대높이 계산 (Δh = K * ln(p_anchor / p_now))
        if (
            this.pFilt != null &&
            this.anchorP != null &&
            this.anchorAlt != null
        ) {
            const deltaH = this.K * Math.log(this.anchorP / this.pFilt);
            let fused = this.anchorAlt + deltaH;

            // 5) 좋은 GPS 오면 offset을 아주 천천히 보정 → 드리프트 억제
            if (hasGoodGps) {
                const err = gpsAltM! - fused;
                this.anchorAlt += this.betaGps * err; // 앵커를 미세하게 이동
                fused = this.anchorAlt + deltaH; // 재계산
            }

            this.lastFused = fused;
            return fused;
        }

        // 6) pressure가 없을 땐 마지막 값 or GPS
        if (typeof gpsAltM === "number") {
            this.lastFused = gpsAltM!;
            return this.lastFused;
        }
        return this.lastFused;
    }
}

export const anchoredBaroAlt = new AnchoredBaroAlt();
