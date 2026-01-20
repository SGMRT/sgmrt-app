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

// 민감정보 마스킹 유틸
const SENSITIVE_KEY_RE =
    /^(authorization|cookie|set-cookie|x-api-key|api[-_]?key|token|access[-_]?token|refresh[-_]?token|jwt|password|secret)$/i;
const BEARER_RE = /Bearer\s+[A-Za-z0-9._-]+/g;

const maskString = (s: string) => s.replace(BEARER_RE, "Bearer [REDACTED]");

// object/array를 재귀적으로 훑되, sanitizeValue와 별개로 "민감 키/패턴"을 마스킹
const maskDeep = (v: any, depth = 0): any => {
    if (v == null) return v;
    if (depth > 3) return "[DepthCapped]";
    if (typeof v === "string") return maskString(v);
    if (typeof v !== "object") return v;

    if (Array.isArray(v))
        return v.slice(0, 20).map((x) => maskDeep(x, depth + 1));

    const out: Record<string, any> = {};
    let count = 0;
    for (const [k, val] of Object.entries(v)) {
        if (SENSITIVE_KEY_RE.test(k)) {
            out[k] = "[REDACTED]";
        } else {
            out[k] = maskDeep(val, depth + 1);
        }
        if (++count >= 50) {
            out.__truncatedKeys = true;
            break;
        }
    }
    return out;
};

const safeUpper = (v: any) => (typeof v === "string" ? v.toUpperCase() : "");

// URL/Path 정규화
export const normalizeRoute = (rawUrl?: string) => {
    if (!rawUrl) return "";

    const [pathOnly] = rawUrl.split("?");

    const uuidRe =
        /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi;

    const longTokenRe = /\b[A-Za-z0-9_-]{16,}\b/g;

    const numberIdRe = /\b\d+\b/g;

    return pathOnly
        .replace(uuidRe, ":id")
        .replace(longTokenRe, ":id")
        .replace(numberIdRe, ":id");
};

export const trackDuration = (name: string, baseData?: JsonLike) => {
    const start = Date.now();
  
    // Sentry span API를 안 써도(버전차/플랫폼차) 안전하게 동작하는 타이머
    return {
      end: (data?: JsonLike) => {
        const ms = Date.now() - start;
  
        Sentry.addBreadcrumb({
          category: "perf",
          level: "info",
          message: name,
          data: { ms, ...baseData, ...data },
        });
      },
    };
  };

/**
 * 센트리로 오류를 명시적으로 전송하는 함수
 * 이 함수를 통해서만 센트리로 오류를 전송
 */
export const captureError = (
    where: string,
    err: unknown,
    extras?: JsonLike,
    tags?: Record<string, string>
) => {
    Sentry.withScope((scope) => {
        // 의도적으로 보낸 이벤트 표식
        scope.setTag("where", where);

        if (tags) {
            for (const [k, v] of Object.entries(tags))
                scope.setTag(k, String(v));
        }

        if (extras) {
            for (const [k, v] of Object.entries(extras)) {
                const masked = maskDeep(v);
                scope.setExtra(k, sanitizeValue(masked));
            }
        }

        const anyErr = err as any;
        if (anyErr?.response) {
            const { status, data, headers, request } = anyErr.response;
            scope.setExtra("http.response.status", status);
            scope.setExtra("http.response.data", sanitizeValue(maskDeep(data)));
            scope.setExtra(
                "http.response.headers",
                sanitizeValue(maskDeep(headers))
            );
            scope.setExtra("http.request.url", request?.responseURL);
            scope.setTag("http.status", String(status));
        }

        const method =
            tags?.["api.method"] ?? tags?.["api.request.method"] ?? "";
        const route = tags?.["api.route"] ?? "";
        const status =
            tags?.["api.response.status"] ?? tags?.["http.status"] ?? "";
        if (method || route || status) {
            scope.setFingerprint(
                ["apis.instance", where, method, route, status].filter(Boolean)
            );
        }

        Sentry.captureException(err);
    });
};
