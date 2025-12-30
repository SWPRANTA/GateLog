export interface Log {
    id: string;
    timestamp: number; // Unix for easier calcs, or ISO. Unix is fine.
    type: 'ENTRY' | 'EXIT';
}

export interface DaySummary {
    date: string; // YYYY-MM-DD
    totalDurationMs: number;
    isComplete: boolean; // meets min hours?
}

export interface WeekSummary {
    weekStart: string; // YYYY-MM-DD
    totalDurationMs: number;
    days: DaySummary[];
}

export type LeaveType = 'SICK' | 'CASUAL';

export interface Leave {
    id: string;
    date: string; // YYYY-MM-DD
    type: LeaveType;
    note?: string;
}

export interface Holiday {
    id: string;
    date: string; // YYYY-MM-DD
    note?: string;
}

