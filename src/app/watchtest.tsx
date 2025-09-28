import Watch, { sendToWatch, start } from "@/modules/expo-watch-module";
import {
    startWatchApp,
    WorkoutActivityType,
    WorkoutSessionLocationType,
} from "@kingstinct/react-native-healthkit";
import { useEffect, useState } from "react";
import { Button, Text, View } from "react-native";

export default function WatchTest() {
    const [message, setMessage] = useState("");
    useEffect(() => {
        startWatchApp({
            activityType: WorkoutActivityType.running,
            locationType: WorkoutSessionLocationType.outdoor,
        })
            .then((success) => {
                console.log("startWatchApp", success);
                start(); // WCSession.activate()
                const sub = Watch.addListener("watchMessage", (p) => {
                    console.log("WATCH → PHONE", p);
                    setMessage("from watch: " + (p.text ?? ""));
                });
                return () => sub.remove();
            })
            .catch((error) => {
                console.log("startWatchApp", error);
            })
            .finally(() => {
                console.log("startWatchApp finished");
            });
    }, []);
    return (
        <View
            style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "white",
            }}
        >
            <Text>Watch Test</Text>
            <Text>{message}</Text>
            <Button
                title="Send to Watch"
                onPress={() => {
                    sendToWatch({
                        text: "Hello from Phone",
                    });
                }}
            />
        </View>
    );
}
