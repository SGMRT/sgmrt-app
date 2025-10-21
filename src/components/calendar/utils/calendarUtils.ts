const formatKey = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
};

const shiftYM = (y: number, m: number, delta: number) => {
    const base = new Date(y, m - 1 + delta, 1); // JS Date는 자동 롤오버 처리
    return { y: base.getFullYear(), m: base.getMonth() + 1 };
};

const parseYM = (ym: string) => {
    const [yy, mm] = ym.split("-").map(Number);
    return { y: yy, m: mm };
};

const runningDaysKey = (y: number, m: number) => ["runningDays", y, m] as const;

export { formatKey, shiftYM, parseYM, runningDaysKey };
