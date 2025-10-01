import server from "@/src/apis/instance";
import { useAuthStore } from "@/src/store/authState";
import * as Sentry from "@sentry/react-native";
import MockAdapter from "axios-mock-adapter";

jest.mock("@sentry/react-native", () => ({
    withScope: (fn: any) => fn({ setTags: jest.fn(), setContext: jest.fn() }),
    captureException: jest.fn(),
}));

describe("axios refresh flow", () => {
    let mock: MockAdapter;

    beforeEach(() => {
        mock = new MockAdapter(server, { delayResponse: 5 });
        useAuthStore.getState().login("EXPIRED_AT", "VALID_RT", "uuid");
        (Sentry.captureException as jest.Mock).mockClear();
    });

    afterEach(() => {
        mock.reset();
    });

    test("401 → refresh 200 → 원요청 재시도 성공", async () => {
        // 1) 데이터 엔드포인트: 만료 토큰이면 401
        mock.onGet("/protected").reply((config) => {
            return config.headers?.Authorization === "Bearer EXPIRED_AT"
                ? [401, { code: "UNAUTH", message: "expired" }]
                : [200, { ok: true }];
        });

        // 2) refresh 성공
        mock.onPost("auth/reissue").reply(200, {
            uuid: "uuid",
            accessToken: "NEW_AT",
            refreshToken: "NEW_RT",
        });

        const res = await server.get("/protected");
        expect(res.status).toBe(200);
        expect(res.data.ok).toBe(true);

        // 스토어가 갱신됐는지
        const { accessToken, refreshToken } = useAuthStore.getState();
        expect(accessToken).toBe("NEW_AT");
        expect(refreshToken).toBe("NEW_RT");

        // refresh 1회만 호출
        expect(
            mock.history.post.filter((p) => p.url?.includes("auth/reissue"))
        ).toHaveLength(1);
    });

    test("401 → refresh 200 → 원요청 재시도 성공 → 다음 요청은 refresh 호출 없음", async () => {
        // GET은 EXPIRED_AT면 401, 그 외(NEW_AT)면 200
        mock.onGet("/protected").reply((config) => {
            return config.headers?.Authorization === "Bearer EXPIRED_AT"
                ? [401, { code: "UNAUTH" }]
                : [200, { ok: true }];
        });

        // refresh 응답
        mock.onPost("auth/reissue").reply(200, {
            uuid: "uuid",
            accessToken: "NEW_AT",
            refreshToken: "NEW_RT",
        });

        // 1) 첫 호출: 401 → refresh → 재시도 200
        const first = await server.get("/protected");
        expect(first.status).toBe(200);
        expect(first.data.ok).toBe(true);

        // 2) 두 번째(새로운) 호출: 바로 200이어야 하고 refresh 더 안 불려야 함
        const second = await server.get("/protected");
        expect(second.status).toBe(200);
        expect(second.data.ok).toBe(true);

        // refresh는 정확히 1번만 호출
        const refreshCalls = mock.history.post.filter((p) =>
            p.url?.includes("auth/reissue")
        );
        expect(refreshCalls).toHaveLength(1);

        // 두 번째 GET 요청의 Authorization이 NEW_AT인지 확인
        const lastGet = mock.history.get[mock.history.get.length - 1];
        const auth =
            (lastGet.headers as any)?.Authorization ??
            (lastGet.headers as any)?.authorization;
        expect(auth).toBe("Bearer NEW_AT");
    });

    test("동시에 2개의 401 → refresh는 1번만", async () => {
        mock.onGet("/a").reply((cfg) =>
            cfg.headers?.Authorization === "Bearer EXPIRED_AT"
                ? [401, {}]
                : [200, { ok: "a" }]
        );
        mock.onGet("/b").reply((cfg) =>
            cfg.headers?.Authorization === "Bearer EXPIRED_AT"
                ? [401, {}]
                : [200, { ok: "b" }]
        );
        mock.onPost("auth/reissue").reply(200, {
            uuid: "uuid",
            accessToken: "NEW_AT2",
            refreshToken: "NEW_RT2",
        });

        const [ra, rb] = await Promise.all([
            server.get("/a"),
            server.get("/b"),
        ]);
        expect(ra.data.ok).toBe("a");
        expect(rb.data.ok).toBe("b");
        // ✅ refresh 단 한 번
        expect(
            mock.history.post.filter((p) => p.url?.includes("auth/reissue"))
        ).toHaveLength(1);
    });

    test("refresh 실패 → logout 호출 & 요청 reject", async () => {
        mock.onGet("/protected").reply(401, {});
        mock.onPost("auth/reissue").reply(401, {});

        const logoutSpy = jest.spyOn(useAuthStore.getState(), "logout");

        await expect(server.get("/protected")).rejects.toBeTruthy();
        expect(logoutSpy).toHaveBeenCalled();
    });

    test("재시도 시 커스텀 헤더 보존", async () => {
        mock.onGet("/with-header").reply((cfg) =>
            cfg.headers?.Authorization === "Bearer EXPIRED_AT"
                ? [401, {}]
                : [200, { header: cfg.headers?.["X-Custom"] }]
        );
        mock.onPost("auth/reissue").reply(200, {
            uuid: "uuid",
            accessToken: "NEW_AT3",
            refreshToken: "NEW_RT3",
        });

        const res = await server.get("/with-header", {
            headers: { "X-Custom": "keepme" },
        });

        expect(res.data.header).toBe("keepme");
    });

    test("Sentry에 토큰이 마스킹되는지", async () => {
        // 강제로 400 에러 발생
        mock.onGet("/bad").reply(400, { code: "BAD", message: "oops" });

        await expect(
            server.get("/bad", {
                headers: { Authorization: "Bearer EXPIRED_AT" },
            })
        ).rejects.toBeTruthy();

        // captureException 호출은 됐으나 토큰 원문은 포함되면 안 됨
        const calls = (Sentry.captureException as jest.Mock).mock.calls;
        expect(calls.length).toBeGreaterThan(0);
        const argStr = JSON.stringify(calls[0]);
        expect(argStr).not.toMatch(/EXPIRED_AT/);
        expect(argStr).toMatch(/Bearer \[REDACTED\]/);
    });
});
