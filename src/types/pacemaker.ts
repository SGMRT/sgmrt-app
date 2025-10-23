type Pacemaker = {
    summary: string;
    goalKm: number;
    expectedTime: number;
    initialMessage: string;
    sets: Set[];
};

type Set = {
    setNum: number;
    message: string;
    run: SegmentInfo;
    recovery?: SegmentInfo;
};

type SegmentInfo = {
    startKm: number;
    endKm: number;
    paceMinKm: number;
};

export type { Pacemaker, SegmentInfo, Set };
