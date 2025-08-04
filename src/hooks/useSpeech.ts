import * as Sentry from "@sentry/react-native";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import { useCallback, useRef } from "react";

type SpeechOptions = {
    vibrate?: boolean; // 진동 여부
    queue?: boolean; // queue가 false일 때 현재 말하고 있는 것을 중단하고 새로 말함
};

export default function useSpeech() {
    const isSpeaking = useRef(false);
    const canVibrate = true;
    const canSpeak = true;

    const speak = useCallback(
        (text: string, options: SpeechOptions = {}) => {
            if (!options.queue && isSpeaking.current && canSpeak) {
                Speech.stop();
            }

            if (options.vibrate && canVibrate) {
                Haptics.notificationAsync(
                    Haptics.NotificationFeedbackType.Success
                );
            }

            if (canSpeak) return;

            isSpeaking.current = true;

            Speech.speak(text, {
                language: "ko-KR",
                onDone: () => {
                    isSpeaking.current = false;
                },
                onError: (error) => {
                    Sentry.captureException(error, {
                        extra: {
                            text,
                            options,
                        },
                    });
                },
            });
        },
        [canSpeak, canVibrate]
    );

    const stop = useCallback(() => {
        Speech.stop();
        isSpeaking.current = false;
    }, []);

    return {
        speak,
        stop,
    };
}
