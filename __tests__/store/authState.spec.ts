import { useAuthStore, UserInfo, UserSettings } from "@/src/store/authState"
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
      expect(state.userInfo).toBeNull()
      expect(state.userSettings).toBeNull()
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

    it("기존 userInfo/userSettings는 유지", () => {
      const { setUserInfo, setUserSettings, login } = useAuthStore.getState()

      const userInfo: UserInfo = {
        username: "testuser",
        height: 175,
        weight: 70,
        age: 25,
        gender: "MALE",
      }
      const userSettings: UserSettings = {
        pushAlarmEnabled: true,
        vibrationEnabled: false,
        voiceGuidanceEnabled: true,
      }

      setUserInfo(userInfo)
      setUserSettings(userSettings)
      login("new-access", "new-refresh", "new-uuid")

      const state = useAuthStore.getState()
      expect(state.userInfo).toEqual(userInfo)
      expect(state.userSettings).toEqual(userSettings)
    })
  })

  describe("logout", () => {
    it("모든 상태 초기화", () => {
      const { login, setUserInfo, setUserSettings, logout } =
        useAuthStore.getState()

      // 먼저 로그인 상태 설정
      login("access", "refresh", "uuid")
      setUserInfo({
        username: "testuser",
        height: 175,
        weight: 70,
        age: 25,
        gender: "MALE",
      })
      setUserSettings({
        pushAlarmEnabled: true,
        vibrationEnabled: true,
        voiceGuidanceEnabled: true,
      })

      // 로그아웃
      logout()

      const state = useAuthStore.getState()
      expect(state.accessToken).toBeNull()
      expect(state.refreshToken).toBeNull()
      expect(state.uuid).toBeNull()
      expect(state.isLoggedIn).toBe(false)
      expect(state.userInfo).toBeNull()
      expect(state.userSettings).toBeNull()
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

  describe("setUserInfo", () => {
    it("userInfo 설정", () => {
      const { setUserInfo } = useAuthStore.getState()

      const userInfo: UserInfo = {
        username: "runner",
        height: 180,
        weight: 75,
        age: 30,
        gender: "MALE",
      }

      setUserInfo(userInfo)

      const state = useAuthStore.getState()
      expect(state.userInfo).toEqual(userInfo)
    })

    it("부분 정보 (null 필드 포함)", () => {
      const { setUserInfo } = useAuthStore.getState()

      const partialInfo: UserInfo = {
        username: "newuser",
        height: null,
        weight: null,
        age: null,
        gender: "",
      }

      setUserInfo(partialInfo)

      const state = useAuthStore.getState()
      expect(state.userInfo).toEqual(partialInfo)
      expect(state.userInfo?.height).toBeNull()
      expect(state.userInfo?.gender).toBe("")
    })

    it("기존 정보 덮어쓰기", () => {
      const { setUserInfo } = useAuthStore.getState()

      setUserInfo({
        username: "old",
        height: 170,
        weight: 60,
        age: 20,
        gender: "FEMALE",
      })

      setUserInfo({
        username: "new",
        height: 180,
        weight: 75,
        age: 30,
        gender: "MALE",
      })

      const state = useAuthStore.getState()
      expect(state.userInfo?.username).toBe("new")
      expect(state.userInfo?.height).toBe(180)
    })
  })

  describe("setUserSettings", () => {
    it("userSettings 설정", () => {
      const { setUserSettings } = useAuthStore.getState()

      const settings: UserSettings = {
        pushAlarmEnabled: true,
        vibrationEnabled: false,
        voiceGuidanceEnabled: true,
      }

      setUserSettings(settings)

      const state = useAuthStore.getState()
      expect(state.userSettings).toEqual(settings)
    })

    it("모든 설정 false로 설정", () => {
      const { setUserSettings } = useAuthStore.getState()

      const settings: UserSettings = {
        pushAlarmEnabled: false,
        vibrationEnabled: false,
        voiceGuidanceEnabled: false,
      }

      setUserSettings(settings)

      const state = useAuthStore.getState()
      expect(state.userSettings?.pushAlarmEnabled).toBe(false)
      expect(state.userSettings?.vibrationEnabled).toBe(false)
      expect(state.userSettings?.voiceGuidanceEnabled).toBe(false)
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
      const { setUserInfo } = useAuthStore.getState()

      const info1: UserInfo = {
        username: "user1",
        height: 170,
        weight: 60,
        age: 25,
        gender: "MALE",
      }
      const info2: UserInfo = {
        username: "user2",
        height: 180,
        weight: 70,
        age: 30,
        gender: "FEMALE",
      }

      setUserInfo(info1)
      const state1 = useAuthStore.getState()

      setUserInfo(info2)
      const state2 = useAuthStore.getState()

      // 두 상태는 다른 객체
      expect(state1).not.toBe(state2)
      expect(state1.userInfo).toEqual(info1)
      expect(state2.userInfo).toEqual(info2)
    })
  })
})
