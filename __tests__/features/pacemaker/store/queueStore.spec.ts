import { act } from "@testing-library/react-native"
import { usePacemakerQueue } from "@/src/features/pacemaker/store/queueStore"
import { PacemakerJob } from "@/src/features/pacemaker/types"

// 테스트 헬퍼: 기본 job 데이터 생성
const createJobInput = (
  courseId: number,
  pacemakerId: number,
  status: PacemakerJob["status"] = "PROCEEDING"
): Omit<PacemakerJob, "queuedAt" | "updatedAt" | "jobId"> => ({
  courseId,
  pacemakerId,
  status,
})

describe("usePacemakerQueue", () => {
  beforeEach(() => {
    // 각 테스트 전 스토어 초기화
    act(() => {
      usePacemakerQueue.getState().removeAllJobs()
    })
  })

  describe("addJob", () => {
    it("새 job을 추가한다", () => {
      const input = createJobInput(1, 100)

      act(() => {
        usePacemakerQueue.getState().addJob(input)
      })

      const jobs = usePacemakerQueue.getState().findAll()
      expect(jobs).toHaveLength(1)
      expect(jobs[0].courseId).toBe(1)
      expect(jobs[0].pacemakerId).toBe(100)
    })

    it("jobId, queuedAt, updatedAt을 자동 생성한다", () => {
      const input = createJobInput(1, 100)

      let newJob: PacemakerJob | undefined
      act(() => {
        newJob = usePacemakerQueue.getState().addJob(input)
      })

      expect(newJob?.jobId).toBeDefined()
      expect(newJob?.queuedAt).toBeDefined()
      expect(newJob?.updatedAt).toBeDefined()
    })

    it("동일한 courseId의 기존 job을 제거하고 새 job을 추가한다", () => {
      act(() => {
        usePacemakerQueue.getState().addJob(createJobInput(1, 100))
        usePacemakerQueue.getState().addJob(createJobInput(1, 200)) // 같은 courseId
      })

      const jobs = usePacemakerQueue.getState().findAll()
      expect(jobs).toHaveLength(1)
      expect(jobs[0].pacemakerId).toBe(200) // 새 job만 남음
    })

    it("다른 courseId의 job은 유지된다", () => {
      act(() => {
        usePacemakerQueue.getState().addJob(createJobInput(1, 100))
        usePacemakerQueue.getState().addJob(createJobInput(2, 200))
      })

      const jobs = usePacemakerQueue.getState().findAll()
      expect(jobs).toHaveLength(2)
    })

    it("추가된 job을 반환한다", () => {
      let result: PacemakerJob | undefined
      act(() => {
        result = usePacemakerQueue.getState().addJob(createJobInput(1, 100))
      })

      expect(result).toBeDefined()
      expect(result?.courseId).toBe(1)
    })
  })

  describe("patchJob", () => {
    it("job의 일부 필드를 업데이트한다", () => {
      let jobId: string | undefined
      act(() => {
        const job = usePacemakerQueue.getState().addJob(createJobInput(1, 100))
        jobId = job.jobId
      })

      act(() => {
        usePacemakerQueue.getState().patchJob(jobId!, { status: "COMPLETED" })
      })

      const job = usePacemakerQueue.getState().findByCourseId(1)
      expect(job?.status).toBe("COMPLETED")
    })

    it("updatedAt을 자동 갱신한다", async () => {
      let jobId: string | undefined
      let originalUpdatedAt: string | undefined

      act(() => {
        const job = usePacemakerQueue.getState().addJob(createJobInput(1, 100))
        jobId = job.jobId
        originalUpdatedAt = job.updatedAt
      })

      // 비동기 처리를 위한 짧은 대기
      await new Promise((r) => setTimeout(r, 10))

      act(() => {
        usePacemakerQueue.getState().patchJob(jobId!, { error: "test error" })
      })

      const job = usePacemakerQueue.getState().findByCourseId(1)
      expect(job?.updatedAt).not.toBe(originalUpdatedAt)
    })

    it("존재하지 않는 jobId는 무시한다", () => {
      act(() => {
        usePacemakerQueue.getState().addJob(createJobInput(1, 100))
        usePacemakerQueue.getState().patchJob("non-existent", { status: "FAILED" })
      })

      const jobs = usePacemakerQueue.getState().findAll()
      expect(jobs[0].status).toBe("PROCEEDING")
    })
  })

  describe("setStatus", () => {
    it("job의 status를 변경한다", () => {
      let jobId: string | undefined
      act(() => {
        const job = usePacemakerQueue.getState().addJob(createJobInput(1, 100))
        jobId = job.jobId
      })

      act(() => {
        usePacemakerQueue.getState().setStatus(jobId!, "COMPLETED")
      })

      const job = usePacemakerQueue.getState().findByCourseId(1)
      expect(job?.status).toBe("COMPLETED")
    })

    it("FAILED 상태와 함께 error 메시지를 설정한다", () => {
      let jobId: string | undefined
      act(() => {
        const job = usePacemakerQueue.getState().addJob(createJobInput(1, 100))
        jobId = job.jobId
      })

      act(() => {
        usePacemakerQueue.getState().setStatus(jobId!, "FAILED", "Network error")
      })

      const job = usePacemakerQueue.getState().findByCourseId(1)
      expect(job?.status).toBe("FAILED")
      expect(job?.error).toBe("Network error")
    })
  })

  describe("removeJob", () => {
    it("특정 job을 제거한다", () => {
      let jobId: string | undefined
      act(() => {
        const job = usePacemakerQueue.getState().addJob(createJobInput(1, 100))
        jobId = job.jobId
        usePacemakerQueue.getState().addJob(createJobInput(2, 200))
      })

      act(() => {
        usePacemakerQueue.getState().removeJob(jobId!)
      })

      const jobs = usePacemakerQueue.getState().findAll()
      expect(jobs).toHaveLength(1)
      expect(jobs[0].courseId).toBe(2)
    })
  })

  describe("removeAllJobs", () => {
    it("모든 job을 제거한다", () => {
      act(() => {
        usePacemakerQueue.getState().addJob(createJobInput(1, 100))
        usePacemakerQueue.getState().addJob(createJobInput(2, 200))
        usePacemakerQueue.getState().addJob(createJobInput(3, 300))
      })

      act(() => {
        usePacemakerQueue.getState().removeAllJobs()
      })

      const jobs = usePacemakerQueue.getState().findAll()
      expect(jobs).toHaveLength(0)
    })
  })

  describe("findAll", () => {
    it("모든 job을 반환한다", () => {
      act(() => {
        usePacemakerQueue.getState().addJob(createJobInput(1, 100))
        usePacemakerQueue.getState().addJob(createJobInput(2, 200))
      })

      const jobs = usePacemakerQueue.getState().findAll()
      expect(jobs).toHaveLength(2)
    })

    it("빈 배열을 반환한다", () => {
      const jobs = usePacemakerQueue.getState().findAll()
      expect(jobs).toEqual([])
    })
  })

  describe("findInProgress", () => {
    it("PROCEEDING 상태의 job만 반환한다", () => {
      act(() => {
        const job1 = usePacemakerQueue.getState().addJob(createJobInput(1, 100))
        usePacemakerQueue.getState().addJob(createJobInput(2, 200))
        usePacemakerQueue.getState().setStatus(job1.jobId, "COMPLETED")
      })

      const inProgress = usePacemakerQueue.getState().findInProgress()
      expect(inProgress).toHaveLength(1)
      expect(inProgress[0].courseId).toBe(2)
    })
  })

  describe("findCompleted", () => {
    it("COMPLETED 상태의 job만 반환한다", () => {
      act(() => {
        const job1 = usePacemakerQueue.getState().addJob(createJobInput(1, 100))
        usePacemakerQueue.getState().addJob(createJobInput(2, 200))
        usePacemakerQueue.getState().setStatus(job1.jobId, "COMPLETED")
      })

      const completed = usePacemakerQueue.getState().findCompleted()
      expect(completed).toHaveLength(1)
      expect(completed[0].courseId).toBe(1)
    })
  })

  describe("findByCourseId", () => {
    it("courseId로 job을 찾는다", () => {
      act(() => {
        usePacemakerQueue.getState().addJob(createJobInput(1, 100))
        usePacemakerQueue.getState().addJob(createJobInput(2, 200))
      })

      const job = usePacemakerQueue.getState().findByCourseId(2)
      expect(job?.pacemakerId).toBe(200)
    })

    it("존재하지 않는 courseId는 undefined를 반환한다", () => {
      act(() => {
        usePacemakerQueue.getState().addJob(createJobInput(1, 100))
      })

      const job = usePacemakerQueue.getState().findByCourseId(999)
      expect(job).toBeUndefined()
    })
  })

  describe("findByPacemakerId", () => {
    it("pacemakerId로 job을 찾는다", () => {
      act(() => {
        usePacemakerQueue.getState().addJob(createJobInput(1, 100))
        usePacemakerQueue.getState().addJob(createJobInput(2, 200))
      })

      const job = usePacemakerQueue.getState().findByPacemakerId(200)
      expect(job?.courseId).toBe(2)
    })

    it("존재하지 않는 pacemakerId는 undefined를 반환한다", () => {
      const job = usePacemakerQueue.getState().findByPacemakerId(999)
      expect(job).toBeUndefined()
    })
  })

  describe("pinnedCourseIds", () => {
    it("FAILED가 아닌 job의 courseId 목록을 반환한다", () => {
      act(() => {
        const job1 = usePacemakerQueue.getState().addJob(createJobInput(1, 100))
        usePacemakerQueue.getState().addJob(createJobInput(2, 200))
        usePacemakerQueue.getState().addJob(createJobInput(3, 300))
        usePacemakerQueue.getState().setStatus(job1.jobId, "FAILED")
      })

      const pinnedIds = usePacemakerQueue.getState().pinnedCourseIds()
      expect(pinnedIds).toHaveLength(2)
      expect(pinnedIds).toContain(2)
      expect(pinnedIds).toContain(3)
      expect(pinnedIds).not.toContain(1)
    })

    it("중복 courseId를 제거한다", () => {
      act(() => {
        usePacemakerQueue.getState().addJob(createJobInput(1, 100))
        // 같은 courseId로 다시 추가하면 기존 것이 제거되므로 중복은 발생하지 않음
      })

      const pinnedIds = usePacemakerQueue.getState().pinnedCourseIds()
      const uniqueIds = [...new Set(pinnedIds)]
      expect(pinnedIds).toEqual(uniqueIds)
    })

    it("빈 배열을 반환한다", () => {
      const pinnedIds = usePacemakerQueue.getState().pinnedCourseIds()
      expect(pinnedIds).toEqual([])
    })

    it("COMPLETED 상태의 job도 포함한다", () => {
      act(() => {
        const job = usePacemakerQueue.getState().addJob(createJobInput(1, 100))
        usePacemakerQueue.getState().setStatus(job.jobId, "COMPLETED")
      })

      const pinnedIds = usePacemakerQueue.getState().pinnedCourseIds()
      expect(pinnedIds).toContain(1)
    })
  })

  describe("불변성", () => {
    it("addJob은 새 배열을 생성한다", () => {
      act(() => {
        usePacemakerQueue.getState().addJob(createJobInput(1, 100))
      })
      const jobs1 = usePacemakerQueue.getState().jobs

      act(() => {
        usePacemakerQueue.getState().addJob(createJobInput(2, 200))
      })
      const jobs2 = usePacemakerQueue.getState().jobs

      expect(jobs1).not.toBe(jobs2)
    })

    it("patchJob은 새 배열을 생성한다", () => {
      let jobId: string | undefined
      act(() => {
        const job = usePacemakerQueue.getState().addJob(createJobInput(1, 100))
        jobId = job.jobId
      })
      const jobs1 = usePacemakerQueue.getState().jobs

      act(() => {
        usePacemakerQueue.getState().patchJob(jobId!, { status: "COMPLETED" })
      })
      const jobs2 = usePacemakerQueue.getState().jobs

      expect(jobs1).not.toBe(jobs2)
    })
  })
})
