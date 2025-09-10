// useMetronome.ts
// Expo Dev Build 필요 (react-native-audio-api 사용)
// 사용 예시는 파일 하단 참고

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AudioContext } from "react-native-audio-api";

export type PatternKey = "4/4" | "8ths" | "12/8";

const BEATS_PER_BAR = 4;
const MIN_BPM = 40;
const MAX_BPM = 240;

const PITCH_MIN = -12;
const PITCH_MAX = 12;
const VOL_MIN = 0.0;
const VOL_MAX = 1.0;

const patterns: Record<PatternKey, { steps: number; accents: number[] }> = {
    "4/4": { steps: 4, accents: [1.0, 0.5, 0.8, 0.5] },
    "8ths": { steps: 8, accents: [1.0, 0.35, 0.6, 0.35, 0.8, 0.35, 0.6, 0.35] },
    "12/8": {
        steps: 12,
        accents: [1.0, 0.2, 0.4, 0.2, 0.7, 0.2, 1.0, 0.2, 0.4, 0.2, 0.7, 0.2],
    },
};

// 짧은 클릭음을 합성 (Oscillator + Gain Envelope)
function scheduleClick(
    ctx: AudioContext,
    destination: any,
    when: number,
    freq: number,
    gain = 0.25
) {
    const osc = ctx.createOscillator();
    const env = ctx.createGain();

    osc.type = "square";
    osc.frequency.value = freq;

    const attack = 0.001; // 1ms
    const dur = 0.02; // 20ms

    env.gain.setValueAtTime(0, when);
    env.gain.linearRampToValueAtTime(gain, when + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    env.gain.setValueAtTime(0, when + dur + 0.003);

    osc.connect(env);
    env.connect(destination);

    osc.start(when);
    osc.stop(when + dur + 0.02);
}

type UseMetronomeOptions = {
    initialBpm?: number; // 기본 120
    initialPitchSemis?: number; // 기본 0
    initialVolume?: number; // 0~1, 기본 0.8
    pattern?: PatternKey; // 기본 "4/4"
    // 시각적 비트 변화가 필요 없으면 onVisualBeatChange 안 써도 됨
    onVisualBeatChange?: (beatIndexZeroToThree: number) => void;
};

export function useMetronome({
    initialBpm = 120,
    initialPitchSemis = 0,
    initialVolume = 0.8,
    pattern = "4/4",
    onVisualBeatChange,
}: UseMetronomeOptions = {}) {
    const ctxRef = useRef<AudioContext | null>(null);
    const masterGainRef = useRef<any | null>(null);

    const [bpm, setBpm] = useState(initialBpm);
    const [pitchSemis, setPitchSemis] = useState(initialPitchSemis);
    const [volume, setVolume] = useState(initialVolume);
    const [patternKey, setPatternKey] = useState<PatternKey>(pattern);
    const [running, setRunning] = useState(false);
    const [visualBeat, setVisualBeat] = useState(0); // 0~3

    // 스케줄링 관련 ref
    const nextNoteTimeRef = useRef(0);
    const stepIndexRef = useRef(0);
    const lastStepStartRef = useRef(0);
    const prevSpbRef = useRef(60 / initialBpm);
    const timerIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // 스케줄 파라미터
    const lookAhead = 0.02; // 20ms마다 깨어남
    const scheduleAheadTime = 0.08; // ~80ms 앞까지 예약

    // AudioContext + master gain 준비
    const getCtx = useCallback(() => {
        if (!ctxRef.current) {
            const ctx = new AudioContext();
            ctxRef.current = ctx;

            const master = ctx.createGain();
            master.gain.value = Math.max(VOL_MIN, Math.min(VOL_MAX, volume));
            master.connect(ctx.destination);
            masterGainRef.current = master;
        }
        return ctxRef.current;
    }, [volume]);

    // 볼륨 실시간 반영
    useEffect(() => {
        const ctx = getCtx();
        if (masterGainRef.current) {
            masterGainRef.current.gain.setValueAtTime(
                Math.max(VOL_MIN, Math.min(VOL_MAX, volume)),
                ctx.currentTime
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [volume]);

    const secondsPerBeat = useMemo(() => 60 / bpm, [bpm]);
    const pitchRatio = useMemo(
        () => Math.pow(2, pitchSemis / 12),
        [pitchSemis]
    );

    const scheduler = useCallback(() => {
        const ctx = getCtx();
        const now = ctx.currentTime;
        const { steps, accents } = patterns[patternKey];

        // 한 스텝 길이 = 한 박 길이 * (4/steps)
        const secondsPerStep = secondsPerBeat * (BEATS_PER_BAR / steps);
        const stepsPerBeat = steps / BEATS_PER_BAR;

        while (nextNoteTimeRef.current < now + scheduleAheadTime) {
            const si = stepIndexRef.current;
            const accent = accents[si] ?? 0.5;

            const isStrong = si % stepsPerBeat === 0;
            const baseFreq = isStrong ? 1500 : 900;
            const freq = baseFreq * pitchRatio;

            // per-click 게인(악센트), 최종 음량은 master에서
            const clickGain = 0.18 + 0.16 * accent;

            const startTime = nextNoteTimeRef.current;
            scheduleClick(
                ctx,
                masterGainRef.current!,
                startTime,
                freq,
                clickGain
            );

            // 시각용 beat index (0..3)
            const visBeat = Math.floor(si / stepsPerBeat) % BEATS_PER_BAR;
            const delayMs = Math.max(
                0,
                (startTime - ctx.currentTime) * 1000 - 5
            );
            setTimeout(() => {
                setVisualBeat(visBeat);
                onVisualBeatChange?.(visBeat);
            }, delayMs);

            // 다음 스텝
            stepIndexRef.current = (si + 1) % steps;
            lastStepStartRef.current = startTime;
            nextNoteTimeRef.current += secondsPerStep;
        }

        timerIdRef.current = setTimeout(scheduler, lookAhead * 1000);
    }, [getCtx, secondsPerBeat, patternKey, pitchRatio, onVisualBeatChange]);

    const start = useCallback(async () => {
        if (running) return;
        const ctx = getCtx();
        try {
            await ctx.resume(); // iOS: 사용자 제스처 후 재생 허용
        } catch {}
        setRunning(true);
        stepIndexRef.current = 0;

        const now = ctx.currentTime;
        lastStepStartRef.current = now;
        prevSpbRef.current = secondsPerBeat;

        nextNoteTimeRef.current = now + 0.05; // 50ms 뒤 첫 클릭
        scheduler();
    }, [getCtx, running, scheduler, secondsPerBeat]);

    const stop = useCallback(() => {
        setRunning(false);
        if (timerIdRef.current) {
            clearTimeout(timerIdRef.current);
            timerIdRef.current = null;
        }
    }, []);

    // BPM 변경 시 위상 보존 (phase-preserving tempo change)
    useEffect(() => {
        if (!running) return;
        const ctx = getCtx();
        const now = ctx.currentTime;

        const oldSpb = prevSpbRef.current;
        const newSpb = secondsPerBeat;

        const { steps } = patterns[patternKey];
        const ratio = BEATS_PER_BAR / steps;

        const oldSps = oldSpb * ratio;
        const newSps = newSpb * ratio;

        const elapsed = Math.max(0, now - lastStepStartRef.current);
        const frac = Math.min(1, elapsed / oldSps);

        const remainingNew = Math.max(0.005, (1 - frac) * newSps);
        nextNoteTimeRef.current = now + remainingNew;

        prevSpbRef.current = newSpb;

        if (timerIdRef.current) {
            clearTimeout(timerIdRef.current);
            timerIdRef.current = null;
        }
        scheduler();
    }, [secondsPerBeat, running, getCtx, scheduler, patternKey]);

    // 언마운트 시 타이머 정리
    useEffect(() => {
        return () => {
            if (timerIdRef.current) clearTimeout(timerIdRef.current);
            timerIdRef.current = null;
        };
    }, []);

    // --- 외부로 내보내는 컨트롤러/상태 -----------------------------------------
    const setBpmClamped = useCallback(
        (next: number | ((b: number) => number)) => {
            if (typeof next === "function") {
                setBpm((b) => {
                    const v = Math.round(next(b));
                    return Math.max(MIN_BPM, Math.min(MAX_BPM, v));
                });
            } else {
                const v = Math.round(next);
                setBpm(Math.max(MIN_BPM, Math.min(MAX_BPM, v)));
            }
        },
        []
    );

    const setPitchClamped = useCallback(
        (next: number | ((p: number) => number)) => {
            if (typeof next === "function") {
                setPitchSemis((p) => {
                    const v = next(p);
                    return Math.max(PITCH_MIN, Math.min(PITCH_MAX, v));
                });
            } else {
                setPitchSemis(Math.max(PITCH_MIN, Math.min(PITCH_MAX, next)));
            }
        },
        []
    );

    const setVolumeClamped = useCallback(
        (next: number | ((v: number) => number)) => {
            if (typeof next === "function") {
                setVolume((v) => {
                    const nv = +next(v).toFixed(2);
                    return Math.max(VOL_MIN, Math.min(VOL_MAX, nv));
                });
            } else {
                const nv = +next.toFixed(2);
                setVolume(Math.max(VOL_MIN, Math.min(VOL_MAX, nv)));
            }
        },
        []
    );

    const toggle = useCallback(() => {
        if (running) stop();
        else start();
    }, [running, start, stop]);

    return {
        // 상태
        running,
        bpm,
        pitchSemis,
        volume,
        patternKey,
        visualBeat, // 0~3

        // 제어
        start,
        stop,
        toggle,

        setBpm: setBpmClamped,
        setPitchSemis: setPitchClamped,
        setVolume: setVolumeClamped,
        setPatternKey, // "4/4" | "8ths" | "12/8"
    };
}
