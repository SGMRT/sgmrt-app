import { useMemo, useState } from "react";
import {
    Pressable,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
} from "react-native";
import { useRunMetronome } from "../features/audio/useRunMetronome";

// 작은 스텝퍼 버튼
function Stepper({
    label,
    value,
    onChange,
    steps,
}: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    steps: number[];
}) {
    return (
        <View style={styles.block}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.row}>
                {steps.map((s, i) => (
                    <Pressable
                        key={i}
                        style={styles.btn}
                        onPress={() => onChange(value + s)}
                    >
                        <Text style={styles.btnText}>
                            {s > 0 ? `+${s}` : `${s}`}
                        </Text>
                    </Pressable>
                ))}
                <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={String(value)}
                    onChangeText={(t) => {
                        const n = Number(t.replace(/[^\-0-9.]/g, ""));
                        if (!Number.isNaN(n)) onChange(n);
                    }}
                />
            </View>
        </View>
    );
}

export default function RunMetronomeDemo() {
    const [enabled, setEnabled] = useState(true);
    const [baseBpm, setBaseBpm] = useState(180);
    const [deltaM, setDeltaM] = useState(0); // ghost - me (음수면 뒤처짐)
    const [mode, setMode] = useState<"ONE" | "ONE_TWO">("ONE");
    const [neutralWindowM, setNeutralWindowM] = useState(5);
    const [catchupGain, setCatchupGain] = useState(0.012);
    const [maxBoostPct, setMaxBoostPct] = useState(0.18);
    const [volume, setVolume] = useState(0.6);

    const { beat, effectiveBpm } = useRunMetronome({
        enabled,
        baseBpm,
        deltaM,
        thresholdM: neutralWindowM,
        gainFactor: catchupGain,
        maxBoostPercent: maxBoostPct,
        mode,
        volume,
    });

    const beatDots = useMemo(() => [0, 1, 2, 3], []);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>RunMetronome Test</Text>

            <View style={[styles.block, styles.rowBetween]}>
                <Text style={styles.label}>Enabled</Text>
                <Switch value={enabled} onValueChange={setEnabled} />
            </View>

            <Stepper
                label="Base BPM"
                value={baseBpm}
                onChange={(v) =>
                    setBaseBpm(Math.max(30, Math.min(260, Math.round(v))))
                }
                steps={[-10, -5, -1, +1, +5, +10]}
            />

            <Stepper
                label="deltaM (ghost - me, m)"
                value={deltaM}
                onChange={setDeltaM}
                steps={[-50, -10, -1, +1, +10, +50]}
            />

            <View style={styles.block}>
                <Text style={styles.label}>Mode</Text>
                <View style={styles.row}>
                    {(["ONE", "ONE_TWO"] as const).map((m) => (
                        <Pressable
                            key={m}
                            onPress={() => setMode(m)}
                            style={[styles.btn, mode === m && styles.btnActive]}
                        >
                            <Text
                                style={[
                                    styles.btnText,
                                    mode === m && styles.btnTextActive,
                                ]}
                            >
                                {m}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </View>

            <Stepper
                label="neutralWindowM (m)"
                value={neutralWindowM}
                onChange={(v) => setNeutralWindowM(Math.max(0, Math.round(v)))}
                steps={[-5, -1, +1, +5]}
            />

            <Stepper
                label="catchupGain (per m)"
                value={catchupGain}
                onChange={(v) =>
                    setCatchupGain(
                        Math.max(0, Math.min(0.05, Number(v.toFixed(3))))
                    )
                }
                steps={[-0.005, -0.001, +0.001, +0.005]}
            />

            <Stepper
                label="maxBoostPct (0~0.5)"
                value={maxBoostPct}
                onChange={(v) =>
                    setMaxBoostPct(
                        Math.max(0, Math.min(0.5, Number(v.toFixed(3))))
                    )
                }
                steps={[-0.05, -0.01, +0.01, +0.05]}
            />

            <Stepper
                label="volume (0~1)"
                value={volume}
                onChange={(v) =>
                    setVolume(Math.max(0, Math.min(1, Number(v.toFixed(2)))))
                }
                steps={[-0.1, -0.05, +0.05, +0.1]}
            />

            <View style={[styles.block, styles.rowBetween]}>
                <Text style={styles.big}>Effective BPM</Text>
                <Text style={styles.big}>{effectiveBpm.toFixed(2)}</Text>
            </View>

            <View style={[styles.block, styles.rowCenter]}>
                {beatDots.map((b) => (
                    <View
                        key={b}
                        style={[
                            styles.dot,
                            b === 0 && styles.dotAccent,
                            beat === b ? styles.dotOn : styles.dotOff,
                        ]}
                    />
                ))}
            </View>

            <Text style={styles.hint}>
                Hint: deltaM가 음수(뒤처짐)이고 neutralWindowM을 넘으면 템포가
                올라갑니다.
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0c0d0d", padding: 16 },
    title: {
        color: "#E2FF00",
        fontSize: 20,
        fontWeight: "700",
        marginBottom: 12,
    },
    block: { marginVertical: 8 },
    label: { color: "#cbd5e1", marginBottom: 6 },
    row: { flexDirection: "row", alignItems: "center", flexWrap: "wrap" },
    rowBetween: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    rowCenter: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    btn: {
        paddingHorizontal: 10,
        paddingVertical: 8,
        backgroundColor: "#1f2937",
        borderRadius: 10,
        marginRight: 8,
        marginBottom: 8,
    },
    btnActive: { backgroundColor: "#E2FF00" },
    btnText: { color: "#e5e7eb", fontWeight: "600" },
    btnTextActive: { color: "#111111" },
    input: {
        width: 90,
        paddingHorizontal: 10,
        paddingVertical: 8,
        backgroundColor: "#111827",
        color: "#e5e7eb",
        borderRadius: 10,
    },
    big: { color: "#f8fafc", fontSize: 18, fontWeight: "700" },
    dot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        marginHorizontal: 6,
        opacity: 0.7,
    },
    dotOn: { backgroundColor: "#E2FF00" },
    dotOff: { backgroundColor: "#374151" },
    dotAccent: { borderWidth: 2, borderColor: "#9ca3af" },
    hint: { color: "#9ca3af", marginTop: 10 },
});
