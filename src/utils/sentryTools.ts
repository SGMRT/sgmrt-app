import * as Sentry from "@sentry/react-native";

type JsonLike = Record<string, any>;

export const addPhase = (phase: string, data?: JsonLike) => {
    Sentry.addBreadcrumb({
        category: "saveRunning",
        level: "info",
        message: phase,
        data,
    });
};

export const addWarn = (msg: string, data?: JsonLike) => {
    Sentry.addBreadcrumb({
        category: "saveRunning",
        level: "warning",
        message: msg,
        data,
    });
};

const sanitizeValue = (v: any, depth = 0): any => {
    if (v == null) return v;
    if (depth > 2) return "[DepthCapped]";
    if (typeof v === "string")
        return v.length > 1000 ? v.slice(0, 1000) + "…" : v;
    if (typeof v !== "object") return v;
    if (Array.isArray(v)) {
        // 배열은 길이/앞뒤 일부만
        const len = v.length;
        return {
            __type: "array",
            len,
            head: v.slice(0, 3).map((x) => sanitizeValue(x, depth + 1)),
            tail: v
                .slice(Math.max(0, len - 3))
                .map((x) => sanitizeValue(x, depth + 1)),
        };
    }
    // 객체는 얕게만 복사
    const out: JsonLike = {};
    let count = 0;
    for (const [k, val] of Object.entries(v)) {
        out[k] = sanitizeValue(val, depth + 1);
        if (++count >= 20) {
            out.__truncatedKeys = true;
            break;
        }
    }
    return out;
};

export const captureError = (
    where: string,
    err: unknown,
    extras?: JsonLike,
    tags?: Record<string, string>
) => {
    Sentry.withScope((scope) => {
        scope.setTag("where", where);
        if (tags) {
            for (const [k, v] of Object.entries(tags))
                scope.setTag(k, String(v));
        }
        if (extras) {
            for (const [k, v] of Object.entries(extras)) {
                scope.setExtra(k, sanitizeValue(v));
            }
        }
        // Axios/Fetch 계열 힌트 붙이기
        const anyErr = err as any;
        if (anyErr?.response) {
            const { status, data, headers, request } = anyErr.response;
            scope.setExtra("http.response.status", status);
            scope.setExtra("http.response.data", sanitizeValue(data));
            scope.setExtra("http.response.headers", sanitizeValue(headers));
            scope.setExtra("http.request.url", request?.responseURL);
            scope.setTag("http.status", String(status));
        }
        Sentry.captureException(err);
    });
};

export const trackDuration = <T>(name: string) => {
    const start = Date.now();
    addPhase(`${name}:start`);
    return {
        end: (extra?: JsonLike) => {
            const ms = Date.now() - start;
            addPhase(`${name}:end`, { durationMs: ms, ...extra });
            return ms;
        },
    };
};
