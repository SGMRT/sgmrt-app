// useRunMetronome.ts
// react-native-audio-api 기반 / Chris Wilson 예제 느낌의 'beep' 사운드
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AudioContext } from "react-native-audio-api";

type Mode = "ONE" | "ONE_TWO";

type RunMetronomeProps = {
    enabled: boolean;
    baseBpm: number; // 내 BPM/케이던스
    deltaM: number; // ghost - me (음수면 뒤처짐)
    maxBoostPercent?: number; // 0~1 (기본 0.2)
    gainFactor?: number; // m당 증가율 (기본 0.06)
    thresholdM?: number; // ±중립 구간 (기본 5m)
    mode?: Mode; // 기본 모드
    volume?: number; // 0~1 (기본 0.2)
    autoTwoBeatsM?: number; // 이만큼 뒤지면 ONE_TWO 자동 (기본 20m)
};

export function useRunMetronome({
    enabled,
    baseBpm,
    deltaM,
    maxBoostPercent = 0.2,
    gainFactor = 0.06,
    thresholdM = 5,
    mode = "ONE",
    volume = 0.2,
    autoTwoBeatsM = 50,
}: RunMetronomeProps) {
    const ctxRef = useRef<AudioContext | null>(null);
    const nextNoteTimeRef = useRef(0);
    const beatRef = useRef<0 | 1 | 2 | 3>(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [beat, setBeat] = useState<0 | 1 | 2 | 3>(0);

    // 뒤처짐 → 부스트 퍼센트
    const boostPercent = useMemo(() => {
        if (deltaM >= -thresholdM) return 0;
        const deficit = Math.abs(deltaM) - thresholdM;
        return Math.min(maxBoostPercent, deficit * gainFactor);
    }, [deltaM, thresholdM, gainFactor, maxBoostPercent]);

    const effectiveBpm = useMemo(
        () => Math.max(1, baseBpm * (1 + boostPercent)),
        [baseBpm, boostPercent]
    );

    // 너무 뒤지면 자동 1·3박(0,2) 켜기
    const tooFarBehind = deltaM <= -autoTwoBeatsM;
    const effectiveMode: Mode = useMemo(
        () => (mode === "ONE" && tooFarBehind ? "ONE_TWO" : mode),
        [mode, tooFarBehind]
    );

    // ONE: 1박만(0), ONE_TWO: 1·3박(0,2)
    const audible = useMemo<Set<number>>(
        () => (effectiveMode === "ONE" ? new Set([0]) : new Set([0, 2])),
        [effectiveMode]
    );

    // 초/박
    const spbRef = useRef(60 / Math.max(1, effectiveBpm));
    useEffect(() => {
        spbRef.current = 60 / Math.max(1, effectiveBpm);
    }, [effectiveBpm]);

    // 오디오 컨텍스트 준비
    const ensureAudio = () => {
        if (!ctxRef.current) {
            ctxRef.current = new AudioContext();
        }
    };

    const scheduleClick = useCallback(
        (time: number, isAccent: boolean) => {
            const ctx = ctxRef.current!;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            const master = Math.min(1, Math.max(0, volume));
            const accentVolume = 1.0;
            const quarterVolume = 0.75;
            const g = master * (isAccent ? accentVolume : quarterVolume);

            const noteLength = 0.05; // 50ms
            const f = isAccent ? 880 : 440;

            osc.type = "sine";
            osc.frequency.setValueAtTime(f, time);

            gain.gain.setValueAtTime(0.0001, time);
            gain.gain.linearRampToValueAtTime(g, time + 0.003);
            gain.gain.setValueAtTime(g, time + noteLength - 0.01);
            gain.gain.exponentialRampToValueAtTime(0.0001, time + noteLength);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(time);
            osc.stop(time + noteLength);
        },
        [volume]
    );

    // 스케줄러
    const tick = useCallback(() => {
        const ctx = ctxRef.current!;
        const scheduleAhead = 0.1; // 100ms
        const look = 0.025; // 25ms

        while (nextNoteTimeRef.current < ctx.currentTime + scheduleAhead) {
            const b = beatRef.current;
            const isAccent = b === 0;
            if (audible.has(b))
                scheduleClick(nextNoteTimeRef.current, isAccent);

            nextNoteTimeRef.current += spbRef.current;
            beatRef.current = ((b + 1) % 4) as 0 | 1 | 2 | 3;
            setBeat(b);
        }
        if (!timerRef.current)
            timerRef.current = setInterval(tick, look * 1000);
    }, [audible, scheduleClick]);

    // on/off
    useEffect(() => {
        ensureAudio();
        if (!ctxRef.current) return;

        if (enabled) {
            const ctx = ctxRef.current;
            if (nextNoteTimeRef.current === 0)
                nextNoteTimeRef.current = ctx.currentTime + 0.04;
            if (!timerRef.current) timerRef.current = setInterval(tick, 25);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [enabled, tick]);

    return { beat, effectiveBpm };
}
