// src/updates/UpdateLoadingOverlay.tsx
import { Image } from "expo-image";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Modal, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Typography } from "@/src/components/ui";
import colors from "../theme/colors";

type Props = {
    visible: boolean;
    /** 노출할 메시지 배열 (원하면 교체) */
    messages?: string[];
    /** 메시지 변경 주기(ms) */
    messageIntervalMs?: number; // 기본 2400
    /** ... 점프 점프 주기(ms) */
    dotsIntervalMs?: number; // 기본 400
    /** 점의 최대 개수 */
    maxDots?: number; // 기본 3
};

const DEFAULT_MESSAGES = [
    "중요한 업데이트를 적용하고 있어요",
    "러닝 전에는 몸을 가볍게 풀어주세요",
    "일정한 페이스가 긴 호흡에 도움이 돼요",
    "호흡은 일정하게, 시선은 멀리",
    "러닝은 기록보다 지속이에요",
    "잠시만 기다려주세요",
];

export default function UpdateLoadingOverlay({
    visible,
    messages = DEFAULT_MESSAGES,
    messageIntervalMs = 5000,
    dotsIntervalMs = 1000,
    maxDots = 3,
}: Props) {
    const { bottom } = useSafeAreaInsets();

    // 메인 메시지 인덱스
    const [idx, setIdx] = useState(0);
    // ... 개수 (0~maxDots)
    const [dots, setDots] = useState(0);

    const safeMessages = useMemo(
        () => (messages.length > 0 ? messages : DEFAULT_MESSAGES),
        [messages]
    );

    const msgTimer = useRef<number | null>(null);
    const dotTimer = useRef<number | null>(null);

    useEffect(() => {
        if (!visible) return;
        // 메시지 순환
        msgTimer.current = setInterval(() => {
            setIdx((i) => (i + 1) % safeMessages.length);
        }, messageIntervalMs);

        // 점 애니메이션
        dotTimer.current = setInterval(() => {
            setDots((d) => (d + 1) % (maxDots + 1));
        }, dotsIntervalMs);

        return () => {
            if (msgTimer.current) clearInterval(msgTimer.current);
            if (dotTimer.current) clearInterval(dotTimer.current);
        };
    }, [
        visible,
        safeMessages.length,
        messageIntervalMs,
        dotsIntervalMs,
        maxDots,
    ]);

    // 현재 표시 문자열
    const display = `${safeMessages[idx]}${".".repeat(dots)}`;

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
        >
            <View
                style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "#111111",
                }}
            >
                <Image
                    source={require("@/assets/icons/logo.png")}
                    style={{ width: 257.44, height: 63.44 }}
                    contentFit="contain"
                />
                <View
                    style={{
                        position: "absolute",
                        bottom: bottom + 24,
                        alignItems: "center",
                        gap: 16,
                    }}
                >
                    <ActivityIndicator color={colors.primary} />
                    <Typography
                        variant="body3"
                        color="gray40"
                        numberOfLines={1}
                    >
                        {display}
                    </Typography>
                </View>
            </View>
        </Modal>
    );
}
