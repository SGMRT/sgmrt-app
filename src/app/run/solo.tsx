// RunScreen.tsx
import { useRunningSession } from "@/src/features/run/hooks/useRunningSession";
import { Button, Text, View } from "react-native";
import { FlatList } from "react-native-gesture-handler";

function fmt(sec: number | null) {
    if (sec == null || !isFinite(sec)) return "-";
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}/km`;
}

export default function RunScreen() {
    const { context, controls } = useRunningSession();

    return (
        <View
            style={{
                padding: 16,
                gap: 8,
                alignItems: "center",
                justifyContent: "center",
                flex: 1,
            }}
        >
            <Text>status: {context.status}</Text>
            <Text>
                distance: {(context.stats.totalDistanceM / 1000).toFixed(2)} km
            </Text>
            <Text>time: {(context.stats.totalTimeMs / 1000).toFixed(0)} s</Text>
            <Text>pace(avg): {fmt(context.stats.avgPaceSecPerKm)}</Text>
            <Text>pace(cur): {fmt(context.stats.currentPaceSecPerKm)}</Text>
            <Text>
                cadence:{" "}
                {context.stats.cadenceSpm
                    ? context.stats.cadenceSpm.toFixed(0)
                    : "-"}{" "}
                spm
            </Text>
            <Text>
                elev: +{context.stats.gainM.toFixed(0)} / -
                {context.stats.lossM.toFixed(0)} m
            </Text>
            <Text>telemetries</Text>
            <FlatList
                data={context.telemetries}
                renderItem={({ item }) => (
                    <View>
                        <Text>{item.timeStamp}</Text>
                        <Text>{item.dist.toFixed(2)}</Text>
                        <Text>{item.pace.toFixed(2)}</Text>
                        <Text>{item.isRunning ? "running" : "paused"}</Text>
                    </View>
                )}
            />

            {context.status === "IDLE" ? (
                <Button
                    title="START"
                    onPress={() => controls.start("COURSE")}
                />
            ) : (
                <>
                    <Button title="PAUSE" onPress={controls.pauseUser} />
                    <Button title="RESUME" onPress={controls.resume} />
                    <Button title="OFFCOURSE" onPress={controls.offcourse} />
                    <Button title="ONCOURSE" onPress={controls.oncourse} />
                    <Button title="COMPLETE" onPress={controls.complete} />
                    <Button title="EXTEND" onPress={controls.extend} />
                    <Button title="STOP" onPress={controls.stop} />
                    <Button title="RESET" onPress={controls.reset} />
                </>
            )}
            {/* {context.status === "IDLE" ? (
                <Button title="START" onPress={() => controls.start("SOLO")} />
            ) : (
                <>
                    <Button title="PAUSE" onPress={controls.pauseUser} />
                    <Button title="RESUME" onPress={controls.resume} />
                    <Button title="STOP" onPress={controls.stop} />
                    <Button title="RESET" onPress={controls.reset} />
                </>
            )} */}
        </View>
    );
}
