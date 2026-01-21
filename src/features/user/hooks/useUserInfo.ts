/**
 * User Info React Query Hook
 *
 * authState의 userInfo/userSettings를 React Query로 대체
 * 서버 상태를 single source of truth로 관리
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { queryKeys } from "@/src/apis/queryKeys"
import {
  GetUserInfoResponse,
  PatchUserInfoRequest,
  PatchUserSettingsRequest,
} from "@/src/apis/types/user"
import { getUserInfo, patchUserInfo, patchUserSettings } from "@/src/apis/user"

/**
 * 사용자 정보 (프로필)
 */
export interface UserInfo {
  uuid: string
  nickname: string
  profilePictureUrl: string
  gender: "MALE" | "FEMALE" | ""
  weight: number | null
  height: number | null
  age: number | null
}

/**
 * 사용자 설정
 */
export interface UserSettings {
  pushAlarmEnabled: boolean
  vibrationEnabled: boolean
  voiceGuidanceEnabled: boolean
}

/**
 * API 응답에서 UserInfo 추출
 */
function extractUserInfo(response: GetUserInfoResponse): UserInfo {
  return {
    uuid: response.uuid,
    nickname: response.nickname,
    profilePictureUrl: response.profilePictureUrl,
    gender: response.gender || "",
    weight: response.weight,
    height: response.height,
    age: response.age,
  }
}

/**
 * API 응답에서 UserSettings 추출
 */
function extractUserSettings(response: GetUserInfoResponse): UserSettings {
  return {
    pushAlarmEnabled: response.pushAlarmEnabled,
    vibrationEnabled: response.vibrationEnabled,
    voiceGuidanceEnabled: response.voiceGuidanceEnabled,
  }
}

/**
 * 사용자 정보 조회 훅
 *
 * @example
 * ```tsx
 * const { userInfo, userSettings, isLoading } = useUserInfo()
 *
 * if (isLoading) return <Loading />
 * return <Text>{userInfo?.nickname}</Text>
 * ```
 */
export function useUserInfo() {
  const query = useQuery({
    queryKey: queryKeys.user.info(),
    queryFn: getUserInfo,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 30 * 60 * 1000, // 30분
  })

  return {
    ...query,
    userInfo: query.data ? extractUserInfo(query.data) : null,
    userSettings: query.data ? extractUserSettings(query.data) : null,
  }
}

/**
 * 사용자 정보 업데이트 훅
 *
 * @example
 * ```tsx
 * const { mutate: updateInfo } = useUpdateUserInfo()
 * updateInfo({ nickname: 'New Name' })
 * ```
 */
export function useUpdateUserInfo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: PatchUserInfoRequest) => patchUserInfo(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.info() })
    },
  })
}

/**
 * 사용자 설정 업데이트 훅
 *
 * @example
 * ```tsx
 * const { mutate: updateSettings } = useUpdateUserSettings()
 * updateSettings({ vibrationEnabled: false })
 * ```
 */
export function useUpdateUserSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: PatchUserSettingsRequest) => patchUserSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.info() })
    },
  })
}

/**
 * 사용자 정보 prefetch 유틸리티
 *
 * 로그인 직후 호출하여 캐시 워밍
 */
export function prefetchUserInfo(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.prefetchQuery({
    queryKey: queryKeys.user.info(),
    queryFn: getUserInfo,
  })
}
