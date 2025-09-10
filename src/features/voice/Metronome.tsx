// Metronome.tsx
// Expo + react-native-audio-api 기반 메트로놈 (phase-preserving 템포 변경 + Pitch/Volume)
// - Development Build 필요 (Expo Go X)
// - app.json(app.config.*)에 플러그인 등록 후 `npx expo run:ios|android`

import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AudioContext } from "react-native-audio-api";

const MIN_BPM = 40;
const MAX_BPM = 240;
const DEFAULT_BPM = 120;
const BEATS_PER_BAR = 4; // 4/4

const PITCH_MIN = -12; // 반음 단위(세미톤)
const PITCH_MAX = 12;
const DEFAULT_PITCH = 0;

const VOL_MIN = 0.0;
const VOL_MAX = 1.0;
const DEFAULT_VOL = 0.8;

// --- 패턴 엔진 --------------------------------------------------------------
const patterns = {
    "4/4": { steps: 4, accents: [1.0, 0.5, 0.8, 0.5] },
    "8ths": { steps: 8, accents: [1.0, 0.35, 0.6, 0.35, 0.8, 0.35, 0.6, 0.35] },
    "12/8": {
        steps: 12,
        accents: [1.0, 0.2, 0.4, 0.2, 0.7, 0.2, 1.0, 0.2, 0.4, 0.2, 0.7, 0.2],
    },
} as const;
type PatternKey = keyof typeof patterns;

// --- 합성 클릭음 (Oscillator + Gain Envelope) ------------------------------
// destination: 마스터 게인 등 최종 연결 노드
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

export default function Metronome() {
    const ctxRef = useRef<AudioContext | null>(null);
    const masterGainRef = useRef<any | null>(null);

    const [bpm, setBpm] = useState(DEFAULT_BPM);
    const [running, setRunning] = useState(false);
    const [visualBeat, setVisualBeat] = useState(0);
    const [patternKey] = useState<PatternKey>("4/4");

    // 새로 추가된 상태: 피치(세미톤), 볼륨(0~1)
    const [pitchSemis, setPitchSemis] = useState(DEFAULT_PITCH);
    const [volume, setVolume] = useState(DEFAULT_VOL);

    // 스케줄링 관련 ref
    const nextNoteTimeRef = useRef(0);
    const stepIndexRef = useRef(0);
    const lastStepStartRef = useRef(0);
    const prevSpbRef = useRef(60 / DEFAULT_BPM);
    const timerIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const lookAhead = 0.02;
    const scheduleAheadTime = 0.08;

    // 컨텍스트 + 마스터 게인 초기화
    const getCtx = useCallback(() => {
        if (!ctxRef.current) {
            const ctx = new AudioContext();
            ctxRef.current = ctx;

            // 마스터 게인 생성 및 연결
            const master = ctx.createGain();
            master.gain.value = volume;
            master.connect(ctx.destination);
            masterGainRef.current = master;
        }
        return ctxRef.current;
    }, [volume]);

    // 볼륨 변경 시 즉시 반영 (마스터 게인)
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

    // 세미톤 -> 주파수 배수
    const pitchRatio = useMemo(
        () => Math.pow(2, pitchSemis / 12),
        [pitchSemis]
    );

    const scheduler = useCallback(() => {
        const ctx = getCtx();
        const now = ctx.currentTime;
        const { steps, accents } = patterns[patternKey];

        const secondsPerStep = secondsPerBeat * (BEATS_PER_BAR / steps);
        const stepsPerBeat = steps / BEATS_PER_BAR;

        while (nextNoteTimeRef.current < now + scheduleAheadTime) {
            const si = stepIndexRef.current;
            const accent = accents[si] ?? 0.5;

            const isStrong = si % stepsPerBeat === 0;
            const baseFreq = isStrong ? 1500 : 900;

            // 피치 트랜스포즈 적용
            const freq = baseFreq * pitchRatio;

            // per-click 게인(악센트), 최종 볼륨은 마스터 게인에서 제어
            const clickGain = 0.18 + 0.16 * accent;

            const startTime = nextNoteTimeRef.current;
            scheduleClick(
                ctx,
                masterGainRef.current!,
                startTime,
                freq,
                clickGain
            );

            lastStepStartRef.current = startTime;

            const visBeat = Math.floor(si / stepsPerBeat) % BEATS_PER_BAR;
            const delayMs = Math.max(
                0,
                (startTime - ctx.currentTime) * 1000 - 5
            );
            setTimeout(() => setVisualBeat(visBeat), delayMs);

            stepIndexRef.current = (si + 1) % steps;
            nextNoteTimeRef.current += secondsPerStep;
        }

        timerIdRef.current = setTimeout(scheduler, lookAhead * 1000);
    }, [getCtx, secondsPerBeat, patternKey, pitchRatio]);

    const start = useCallback(async () => {
        if (running) return;
        const ctx = getCtx();
        try {
            await ctx.resume();
        } catch {}

        setRunning(true);
        stepIndexRef.current = 0;

        const now = ctx.currentTime;
        lastStepStartRef.current = now;
        prevSpbRef.current = secondsPerBeat;

        nextNoteTimeRef.current = now + 0.05;
        scheduler();
    }, [getCtx, running, scheduler, secondsPerBeat]);

    const stop = useCallback(() => {
        setRunning(false);
        if (timerIdRef.current) {
            clearTimeout(timerIdRef.current);
            timerIdRef.current = null;
        }
    }, []);

    // BPM 변경 시 위상 보존
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

    useEffect(() => {
        return () => {
            if (timerIdRef.current) clearTimeout(timerIdRef.current);
            timerIdRef.current = null;
        };
    }, []);

    // --- UI -------------------------------------------------------------------
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Metronome (4/4)</Text>

            <View style={styles.beatRow}>
                {Array.from({ length: BEATS_PER_BAR }).map((_, i) => (
                    <View
                        key={i}
                        style={[
                            styles.beatDot,
                            visualBeat === i && styles.beatDotActive,
                        ]}
                    />
                ))}
            </View>

            {/* BPM*/}
            <View style={styles.ctrlBlock}>
                <Text style={styles.ctrlTitle}>BPM</Text>
                <Text style={styles.ctrlValue}>{bpm} BPM</Text>
                <View style={styles.row}>
                    <Pressable
                        style={[styles.btn, styles.smallBtn]}
                        onPress={() => setBpm((p) => Math.min(MAX_BPM, p + 10))}
                    >
                        <Text style={styles.btnText}>BPM +</Text>
                    </Pressable>
                    <Pressable
                        style={[styles.btn, styles.smallBtn]}
                        onPress={() => setBpm((p) => Math.max(MIN_BPM, p - 10))}
                    >
                        <Text style={styles.btnText}>BPM −</Text>
                    </Pressable>
                    <Pressable
                        style={[styles.btn, styles.smallBtnGhost]}
                        onPress={() => setBpm(DEFAULT_BPM)}
                    >
                        <Text style={styles.btnText}>Reset</Text>
                    </Pressable>
                </View>
            </View>

            {/* 피치(세미톤) */}
            <View style={styles.ctrlBlock}>
                <Text style={styles.ctrlTitle}>Pitch (semitones)</Text>
                <Text style={styles.ctrlValue}>
                    {pitchSemis > 0 ? `+${pitchSemis}` : `${pitchSemis}`} st
                </Text>
                <View style={styles.row}>
                    <Pressable
                        style={[styles.btn, styles.smallBtn]}
                        onPress={() =>
                            setPitchSemis((p) => Math.min(PITCH_MAX, p + 1))
                        }
                    >
                        <Text style={styles.btnText}>Pitch +</Text>
                    </Pressable>
                    <Pressable
                        style={[styles.btn, styles.smallBtn]}
                        onPress={() =>
                            setPitchSemis((p) => Math.max(PITCH_MIN, p - 1))
                        }
                    >
                        <Text style={styles.btnText}>Pitch −</Text>
                    </Pressable>
                    <Pressable
                        style={[styles.btn, styles.smallBtnGhost]}
                        onPress={() => setPitchSemis(DEFAULT_PITCH)}
                    >
                        <Text style={styles.btnText}>Reset</Text>
                    </Pressable>
                </View>
            </View>

            {/* 볼륨(마스터 게인) */}
            <View style={styles.ctrlBlock}>
                <Text style={styles.ctrlTitle}>Volume</Text>
                <Text style={styles.ctrlValue}>{(volume * 100) | 0}%</Text>
                <View style={styles.row}>
                    <Pressable
                        style={[styles.btn, styles.smallBtn]}
                        onPress={() =>
                            setVolume((v) =>
                                Math.min(VOL_MAX, +(v + 0.05).toFixed(2))
                            )
                        }
                    >
                        <Text style={styles.btnText}>Vol +</Text>
                    </Pressable>
                    <Pressable
                        style={[styles.btn, styles.smallBtn]}
                        onPress={() =>
                            setVolume((v) =>
                                Math.max(VOL_MIN, +(v - 0.05).toFixed(2))
                            )
                        }
                    >
                        <Text style={styles.btnText}>Vol −</Text>
                    </Pressable>
                    <Pressable
                        style={[styles.btn, styles.smallBtnGhost]}
                        onPress={() => setVolume(DEFAULT_VOL)}
                    >
                        <Text style={styles.btnText}>Reset</Text>
                    </Pressable>
                </View>
            </View>

            <View style={styles.controls}>
                {!running ? (
                    <Pressable
                        style={[styles.btn, styles.start]}
                        onPress={start}
                    >
                        <Text style={styles.btnText}>Start</Text>
                    </Pressable>
                ) : (
                    <Pressable style={[styles.btn, styles.stop]} onPress={stop}>
                        <Text style={styles.btnText}>Stop</Text>
                    </Pressable>
                )}
            </View>

            <View style={styles.controls}>
                <Pressable
                    style={[styles.btn, styles.start]}
                    onPress={() => router.back()}
                >
                    <Text style={styles.btnText}>Back</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0b0c0f",
        padding: 20,
        paddingTop: 48,
        gap: 20,
    },
    title: {
        color: "#E2FF00",
        fontSize: 22,
        fontWeight: "700",
        textAlign: "center",
    },
    beatRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
    },
    beatDot: {
        flex: 1,
        height: 16,
        borderRadius: 999,
        backgroundColor: "#23262d",
    },
    beatDotActive: {
        backgroundColor: "#E2FF00",
    },
    bpmLabel: {
        color: "white",
        fontSize: 18,
        textAlign: "center",
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
    },
    ctrlBlock: {
        gap: 8,
        padding: 12,
        borderRadius: 12,
        backgroundColor: "#121419",
        borderWidth: 1,
        borderColor: "#1d2129",
    },
    ctrlTitle: {
        color: "#9aa0a6",
        fontSize: 12,
        letterSpacing: 0.2,
    },
    ctrlValue: {
        color: "white",
        fontSize: 16,
        fontWeight: "700",
    },
    controls: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 12,
    },
    btn: {
        minWidth: 120,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#2b2f36",
    },
    smallBtn: {
        minWidth: 90,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,
    },
    smallBtnGhost: {
        minWidth: 90,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor: "#3a3f47",
    },
    start: {
        backgroundColor: "#2dd36f",
    },
    stop: {
        backgroundColor: "#ef4444",
    },
    btnText: {
        color: "white",
        fontSize: 16,
        fontWeight: "700",
    },
    hint: {
        color: "#9aa0a6",
        fontSize: 12,
        lineHeight: 18,
        textAlign: "center",
    },
});
