export const formatDate = (date: Date) => {
    return date
        .toLocaleDateString("ko-KR", {
            year: "2-digit",
            month: "2-digit",
            day: "2-digit",
        })
        .slice(0, 10)
        .split(".")
        .map((item) => item.trim())
        .join(".");
};

export const startOfDay = (date: Date) => {
    const x = new Date(date);
    x.setHours(0, 0, 0, 0);
    return x;
};

export const endOfDay = (date: Date) => {
    const x = new Date(date);
    x.setHours(23, 59, 59, 999);
    return x;
};
