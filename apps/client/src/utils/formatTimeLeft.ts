const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const PADDING_SIZE = 2;

export const formatTimeLeft = (ms: number) => {
    const totalSec = Math.ceil(ms / MS_PER_SECOND);
    const minutes = Math.floor(totalSec / SECONDS_PER_MINUTE);
    const seconds = totalSec % SECONDS_PER_MINUTE;
    return `${minutes}:${String(seconds).padStart(PADDING_SIZE, "0")}`;
};