type Pacemaker = {
    summary: string;
    goalKm: number;
    expectedTime: number;
    initialMessage: string;
    sets: PaceSet[];
};

type PaceSet = {
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

export type { Pacemaker, PaceSet, SegmentInfo };
