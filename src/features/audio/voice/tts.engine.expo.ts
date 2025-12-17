import { captureError } from "@/src/utils/sentryTools";
import { setAudioModeAsync } from "expo-audio";
import * as Speech from "expo-speech";
import { TTSEngine } from "./types";

export const expoTTSEngine: TTSEngine = {
    speak(text, { lang, rate, onDone, onStopped, onError }) {
        Speech.speak(text, {
            language: lang,
            rate,
            onDone,
            onStopped,
            onError: (e) => {
                captureError("tts.engine.expo", e);
                onError(e);
            },
        });
    },
    stop() {
        Speech.stop();
    },
    async enableDuck() {
        await setAudioModeAsync({
            playsInSilentMode: true,
            interruptionMode: "duckOthers",
            shouldPlayInBackground: true,
        });
    },
    async disableDuck() {
        await setAudioModeAsync({
            playsInSilentMode: true,
            interruptionMode: "mixWithOthers",
            shouldPlayInBackground: true,
        });
    },
};
