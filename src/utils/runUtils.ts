const getRunTime = (runTime: number, format: "HH:MM:SS" | "MM:SS") => {
    const hours = Math.floor(runTime / 3600);
    const minutes = Math.floor((runTime % 3600) / 60);
    const seconds = runTime % 60;

    if (format === "HH:MM:SS") {
        return `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    } else {
        const totalMinutes = hours * 60 + minutes;
        return `${totalMinutes.toString().padStart(2, "0")}:${seconds
            .toString()
            .padStart(2, "0")}`;
    }
};

function getPace(timeInSec: number, distanceInMeters: number): number {
    if (distanceInMeters === 0) distanceInMeters = 3;
    const distanceInKm = distanceInMeters / 1000;

    const paceInSec = timeInSec / distanceInKm; // 초/km
    return paceInSec;
}

function getFormattedPace(paceInSec: number): string {
    if (paceInSec === 0) return "--";
    const minutes = Math.floor(paceInSec / 60);
    const seconds = Math.floor(paceInSec % 60);
    return `${minutes}’${seconds.toString().padStart(2, "0")}”`;
}

function getCalories({
    distance,
    timeInSec,
    weight,
}: {
    distance: number;
    timeInSec: number;
    weight: number;
}): number {
    if (timeInSec === 0 || distance === 0 || weight === 0) return 0;

    const timeInHours = timeInSec / 3600;
    const distanceKm = distance / 1000;
    const speed = distanceKm / timeInHours;

    let met = 1;

    if (speed < 6) met = 3.5;
    else if (speed < 8) met = 6;
    else if (speed < 10) met = 8.3;
    else if (speed < 12) met = 9.8;
    else if (speed < 14) met = 11.5;
    else met = 13;

    return Math.round(met * weight * timeInHours);
}

// 요일/시간/러닝
// 월요일 아침 러닝
function getRunName(date: number): string {
    const dateObj = new Date(date);

    const day = dateObj.toLocaleDateString("ko-KR", {
        weekday: "long",
    });

    const hour = dateObj.getHours();

    let timeLabel = "";
    if (hour < 6) timeLabel = "새벽";
    else if (hour < 12) timeLabel = "아침";
    else if (hour < 17) timeLabel = "오후";
    else if (hour < 21) timeLabel = "저녁";
    else timeLabel = "야간";

    return `${day} ${timeLabel} 러닝`;
}

export { getCalories, getFormattedPace, getPace, getRunName, getRunTime };
