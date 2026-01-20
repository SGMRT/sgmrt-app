/**
 * 시간 관련 유틸리티 함수
 */

type TimeFormat = "HH:MM:SS" | "MM:SS" | "HH:MM:SS_IF_HH_EXISTS"

/**
 * 초 단위 시간을 포맷팅된 문자열로 변환
 * @param runTime 초 단위 시간
 * @param format 출력 포맷 (기본: HH:MM:SS_IF_HH_EXISTS)
 */
export function getRunTime(
  runTime: number,
  format: TimeFormat = "HH:MM:SS_IF_HH_EXISTS"
): string {
  let isNegative = false
  if (runTime < 0) {
    isNegative = true
    runTime = -runTime
  }

  const hours = Math.floor(runTime / 3600)
  const minutes = Math.floor((runTime % 3600) / 60)
  const seconds = Math.floor(runTime % 60)

  const prefix = isNegative ? "-" : ""

  if (
    format === "HH:MM:SS" ||
    (format === "HH:MM:SS_IF_HH_EXISTS" && hours > 0)
  ) {
    return `${prefix}${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  const totalMinutes = hours * 60 + minutes
  return `${prefix}${totalMinutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`
}

/**
 * 타임스탬프를 YYYY.MM.DD 형식으로 변환
 * @param date 타임스탬프 (밀리초)
 */
export function getDate(date: number): string {
  return new Date(date)
    .toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .slice(0, 12)
    .split(". ")
    .join(".")
}

/**
 * 타임스탬프로부터 러닝 이름 생성 (요일 + 시간대 + 러닝)
 * @param date 타임스탬프 (밀리초)
 */
export function getRunName(date: number): string {
  const dateObj = new Date(date)

  const day = dateObj.toLocaleDateString("ko-KR", {
    weekday: "long",
  })

  const hour = dateObj.getHours()

  let timeLabel = ""
  if (hour < 6) timeLabel = "새벽"
  else if (hour < 12) timeLabel = "아침"
  else if (hour < 17) timeLabel = "오후"
  else if (hour < 21) timeLabel = "저녁"
  else timeLabel = "야간"

  return `${day} ${timeLabel} 러닝`
}
