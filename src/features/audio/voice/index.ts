import { VoiceOrchestrator } from "./orchestrator";
import { expoTTSEngine } from "./tts.engine.expo";
import { Settings } from "./types";

const defaultSettings: Settings = {
    enabled: true,
    lang: "ko-KR",
    rate: 0.85,
    cooldownMs: {
        "nav/approach-leg": 3000,
        "nav/end-approach-alert": 3000,
        "run/offcourse-warning": 5000,
        "ghost/change-leader": 5000,
        "ghost/periodic": 5000,
    },
};

export const voice = new VoiceOrchestrator(expoTTSEngine, defaultSettings);
export * from "./types";
