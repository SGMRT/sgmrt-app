import { useAuthStore } from "@/src/store/authState"
import * as amplitude from "@amplitude/analytics-react-native"

// Amplitude mock은 jest.setup.js에서 설정됨

describe("authState", () => {
  // 각 테스트 전에 상태 초기화
  beforeEach(() => {
    useAuthStore.getState().logout()
    jest.clearAllMocks()
  })

  describe("초기 상태", () => {
    it("로그아웃 상태로 시작", () => {
      const state = useAuthStore.getState()

      expect(state.accessToken).toBeNull()
      expect(state.refreshToken).toBeNull()
      expect(state.uuid).toBeNull()
      expect(state.isLoggedIn).toBe(false)
    })
  })

  describe("login", () => {
    it("토큰과 uuid 저장 및 isLoggedIn true 설정", () => {
      const { login } = useAuthStore.getState()

      login("access-token-123", "refresh-token-456", "user-uuid-789")

      const state = useAuthStore.getState()
      expect(state.accessToken).toBe("access-token-123")
      expect(state.refreshToken).toBe("refresh-token-456")
      expect(state.uuid).toBe("user-uuid-789")
      expect(state.isLoggedIn).toBe(true)
    })
  })

  describe("logout", () => {
    it("모든 상태 초기화", () => {
      const { login, logout } = useAuthStore.getState()

      // 먼저 로그인 상태 설정
      login("access", "refresh", "uuid")

      // 로그아웃
      logout()

      const state = useAuthStore.getState()
      expect(state.accessToken).toBeNull()
      expect(state.refreshToken).toBeNull()
      expect(state.uuid).toBeNull()
      expect(state.isLoggedIn).toBe(false)
    })

    it("amplitude.reset() 호출", () => {
      const { login, logout } = useAuthStore.getState()

      login("access", "refresh", "uuid")
      logout()

      expect(amplitude.reset).toHaveBeenCalled()
    })
  })

  describe("refresh", () => {
    it("accessToken과 refreshToken만 갱신", () => {
      const { login, refresh } = useAuthStore.getState()

      login("old-access", "old-refresh", "uuid-123")
      refresh("new-access", "new-refresh")

      const state = useAuthStore.getState()
      expect(state.accessToken).toBe("new-access")
      expect(state.refreshToken).toBe("new-refresh")
      expect(state.uuid).toBe("uuid-123") // uuid는 유지
      expect(state.isLoggedIn).toBe(true) // 로그인 상태 유지
    })
  })

  describe("subscribeWithSelector", () => {
    it("특정 상태 변경 구독 가능", () => {
      const { login } = useAuthStore.getState()
      const callback = jest.fn()

      // isLoggedIn 변경만 구독
      const unsubscribe = useAuthStore.subscribe(
        (state) => state.isLoggedIn,
        callback
      )

      login("access", "refresh", "uuid")

      expect(callback).toHaveBeenCalledWith(true, false) // new, old

      unsubscribe()
    })

    it("구독 취소 후 콜백 호출 안 됨", () => {
      const { login, logout } = useAuthStore.getState()
      const callback = jest.fn()

      const unsubscribe = useAuthStore.subscribe(
        (state) => state.isLoggedIn,
        callback
      )

      login("access", "refresh", "uuid")
      unsubscribe()
      logout()

      // login에서 1번만 호출, logout에서는 호출 안 됨
      expect(callback).toHaveBeenCalledTimes(1)
    })
  })

  describe("불변성 (Immutability)", () => {
    it("상태 변경 시 새로운 객체 생성", () => {
      const { login, refresh } = useAuthStore.getState()

      login("access1", "refresh1", "uuid1")
      const state1 = useAuthStore.getState()

      refresh("access2", "refresh2")
      const state2 = useAuthStore.getState()

      // 두 상태는 다른 객체
      expect(state1).not.toBe(state2)
      expect(state1.accessToken).toBe("access1")
      expect(state2.accessToken).toBe("access2")
    })
  })
})
