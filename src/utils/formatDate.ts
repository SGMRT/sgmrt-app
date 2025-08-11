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
