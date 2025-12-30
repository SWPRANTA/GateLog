export const formatDuration = (totalHours: number): string => {
    if (!totalHours && totalHours !== 0) return '0h 0m';
    const totalMinutes = Math.round(totalHours * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
};
