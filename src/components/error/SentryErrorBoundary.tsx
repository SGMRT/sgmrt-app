import * as Sentry from "@sentry/react-native";
import { PropsWithChildren } from "react";
import { radius } from "@/src/design-system/tokens/radius";
import { core } from "@/src/design-system/tokens/colors";
import { darkTheme } from "@/src/design-system/themes/dark";
import { spacing } from "@/src/design-system/tokens/spacing";
import {
    Text,
    View,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
} from "react-native";

interface FallbackProps {
    error: unknown;
    resetError: () => void;
}

function ErrorFallback({ resetError }: FallbackProps) {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>문제가 발생했습니다</Text>
                <Text style={styles.message}>
                    앱에서 오류가 발생했습니다.{"\n"}
                    다시 시도해 주세요.
                </Text>
                <TouchableOpacity style={styles.button} onPress={resetError}>
                    <Text style={styles.buttonText}>다시 시도</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

export function SentryErrorBoundary({ children }: PropsWithChildren) {
    return (
        <Sentry.ErrorBoundary
            fallback={({ error, resetError }) => (
                <ErrorFallback error={error} resetError={resetError} />
            )}
            beforeCapture={(scope) => {
                scope.setTag("where", "error-boundary");
                scope.setTag("priority", "high");
            }}
        >
            {children}
        </Sentry.ErrorBoundary>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: darkTheme.uiBackground,
    },
    content: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 24,
    },
    title: {
        fontSize: 20,
        fontFamily: "SpoqaHanSansNeo-Bold",
        color: core.white,
        marginBottom: 12,
    },
    message: {
        fontSize: 14,
        fontFamily: "SpoqaHanSansNeo-Regular",
        color: darkTheme.ui05,
        textAlign: "center",
        lineHeight: 22,
        marginBottom: 32,
    },
    button: {
        backgroundColor: darkTheme.primary,
        paddingHorizontal: 32,
        paddingVertical: spacing[12],
        borderRadius: radius.md,
    },
    buttonText: {
        fontSize: 16,
        // 밝은 면 위 어두운 글자는 한 단계 굵게 해야 같은 굵기로 읽힌다
        fontFamily: "SpoqaHanSansNeo-Bold",
        color: darkTheme.uiBackground,
    },
});
