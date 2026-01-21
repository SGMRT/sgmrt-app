import { convertToName } from "@/src/features/pacemaker/utils/convertToName"
import { GhostyType } from "@/src/apis/types/ghosty"

describe("convertToName", () => {
  it("undefined면 '고스티' 반환", () => {
    expect(convertToName(undefined)).toBe("고스티")
  })

  it("코드로 RECOVERY_JOGGING이면 '브리즈' 반환", () => {
    expect(convertToName("RECOVERY_JOGGING")).toBe("브리즈")
  })

  it("코드로 STAMINA면 '버디' 반환", () => {
    expect(convertToName("STAMINA")).toBe("버디")
  })

  it("코드로 SPEED면 '스파키' 반환", () => {
    expect(convertToName("SPEED")).toBe("스파키")
  })

  it("코드로 MARATHON이면 '마일로' 반환", () => {
    expect(convertToName("MARATHON")).toBe("마일로")
  })

  it("코드로 FREE면 '루피' 반환", () => {
    expect(convertToName("FREE")).toBe("루피")
  })

  it("enum value로 전달해도 이름 반환", () => {
    expect(convertToName(GhostyType.RECOVERY_JOGGING)).toBe("브리즈")
    expect(convertToName(GhostyType.STAMINA)).toBe("버디")
    expect(convertToName(GhostyType.SPEED)).toBe("스파키")
    expect(convertToName(GhostyType.MARATHON)).toBe("마일로")
    expect(convertToName(GhostyType.FREE)).toBe("루피")
  })

  it("알 수 없는 값이면 '고스티' 반환", () => {
    expect(convertToName("UNKNOWN" as any)).toBe("고스티")
  })
})
