import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Log, Leave, LeaveType, Holiday } from '../types';
import { isFriday, isSameDay, startOfWeek, endOfWeek, differenceInMilliseconds, startOfDay, format, getYear, startOfMonth } from 'date-fns';
import { Alert } from 'react-native';

interface TimeContextType {
    logs: Log[];
    leaves: Leave[];
    holidays: Holiday[];
    weeklyHolidays: number[];
    status: 'IN' | 'OUT';
    lastLog: Log | null;
    punch: () => Promise<void>;
    addLeave: (date: Date, type: LeaveType, note?: string) => Promise<boolean>;
    addHoliday: (date: Date, note?: string) => Promise<boolean>;
    getRemainingLeaves: (type: LeaveType) => number;
    isLoading: boolean;
    getWeeklyProgress: () => number; // in hours
    getEffectiveWeeklyGoal: () => number; // Dynamic goal
    getTodayProgress: () => number; // in hours
    getMonthlyProgress: () => number;
    getDurationForDate: (date: Date) => number;
    goals: Goals;
    updateGoals: (newGoals: Goals) => Promise<void>;
    leaveLimits: LeaveLimits;
    updateLeaveLimits: (limits: LeaveLimits) => Promise<void>;
    updateWeeklyHolidays: (days: number[]) => Promise<void>;
    exportAllData: () => ExportData;
    importAllData: (data: ExportData) => Promise<void>;
}

export interface Goals {
    daily: number;
    friday: number;
    weekly: number;
}

export interface LeaveLimits {
    sick: number;
    casual: number;
}

export interface ExportData {
    logs: Log[];
    leaves: Leave[];
    holidays: Holiday[];
    weeklyHolidays: number[];
    goals: Goals;
    leaveLimits: LeaveLimits;
}

const TimeContext = createContext<TimeContextType>({} as TimeContextType);

const LOGS_KEY = 'attendance_logs';
const LEAVES_KEY = 'leave_records';
const GOALS_KEY = 'time_goals';
const HOLIDAYS_KEY = 'holiday_records';
const LEAVE_LIMITS_KEY = 'leave_limits';
const WEEKLY_HOLIDAYS_KEY = 'weekly_holidays';

// Defaults
const DEFAULT_SICK = 10;
const DEFAULT_CASUAL = 15;

export const TimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [logs, setLogs] = useState<Log[]>([]);
    const [leaves, setLeaves] = useState<Leave[]>([]);
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [weeklyHolidays, setWeeklyHolidays] = useState<number[]>([0]); // Default: Sunday
    const [goals, setGoals] = useState<Goals>({ daily: 5, friday: 3, weekly: 36 });
    const [leaveLimits, setLeaveLimits] = useState<LeaveLimits>({ sick: 10, casual: 15 });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const storedLogs = await AsyncStorage.getItem(LOGS_KEY);
            const storedLeaves = await AsyncStorage.getItem(LEAVES_KEY);
            const storedHolidays = await AsyncStorage.getItem(HOLIDAYS_KEY);
            const storedLimits = await AsyncStorage.getItem(LEAVE_LIMITS_KEY);
            const storedWeeklyHolidays = await AsyncStorage.getItem(WEEKLY_HOLIDAYS_KEY);

            if (storedLogs) setLogs(JSON.parse(storedLogs));
            if (storedLeaves) setLeaves(JSON.parse(storedLeaves));
            if (storedHolidays) setHolidays(JSON.parse(storedHolidays));
            if (storedLimits) setLeaveLimits(JSON.parse(storedLimits));
            if (storedWeeklyHolidays) setWeeklyHolidays(JSON.parse(storedWeeklyHolidays));

            const storedGoals = await AsyncStorage.getItem(GOALS_KEY);
            if (storedGoals) setGoals(JSON.parse(storedGoals));

        } catch (e) {
            console.error('Failed to load data', e);
        } finally {
            setIsLoading(false);
        }
    };

    const saveLogs = async (newLogs: Log[]) => {
        setLogs(newLogs);
        await AsyncStorage.setItem(LOGS_KEY, JSON.stringify(newLogs));
    };

    const saveLeaves = async (newLeaves: Leave[]) => {
        setLeaves(newLeaves);
        await AsyncStorage.setItem(LEAVES_KEY, JSON.stringify(newLeaves));
    };

    const saveHolidays = async (newHolidays: Holiday[]) => {
        setHolidays(newHolidays);
        await AsyncStorage.setItem(HOLIDAYS_KEY, JSON.stringify(newHolidays));
    };

    const updateGoals = async (newGoals: Goals) => {
        setGoals(newGoals);
        await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(newGoals));
    };

    const updateWeeklyHolidays = async (days: number[]) => {
        setWeeklyHolidays(days);
        await AsyncStorage.setItem(WEEKLY_HOLIDAYS_KEY, JSON.stringify(days));
    };

    const exportAllData = (): ExportData => {
        return {
            logs,
            leaves,
            holidays,
            weeklyHolidays,
            goals,
            leaveLimits,
        };
    };

    const importAllData = async (data: ExportData) => {
        await saveLogs(data.logs || []);
        await saveLeaves(data.leaves || []);
        await saveHolidays(data.holidays || []);
        await updateWeeklyHolidays(data.weeklyHolidays || [0]);
        await updateGoals(data.goals || { daily: 5, friday: 3, weekly: 36 });
        await updateLeaveLimits(data.leaveLimits || { sick: DEFAULT_SICK, casual: DEFAULT_CASUAL });
    };

    const addHoliday = async (date: Date, note?: string): Promise<boolean> => {
        const dateStr = format(date, 'yyyy-MM-dd');
        if (holidays.some(h => h.date === dateStr)) {
            Alert.alert("Duplicate", "Holiday already recorded for this date.");
            return false;
        }
        if (leaves.some(l => l.date === dateStr)) {
            Alert.alert("Conflict", "A leave is already recorded for this date.");
            return false;
        }

        const newHoliday: Holiday = {
            id: Date.now().toString(),
            date: dateStr,
            note
        };
        const newList = [...holidays, newHoliday];
        await saveHolidays(newList);
        return true;
    };

    const getEffectiveWeeklyGoal = () => {
        const now = new Date();
        const start = startOfWeek(now, { weekStartsOn: 1 });
        const end = endOfWeek(now, { weekStartsOn: 1 });

        // Find holidays in current week
        const weekHolidays = holidays.filter(h => {
            const d = new Date(h.date);
            return d >= start && d <= end;
        });

        let reduction = 0;
        weekHolidays.forEach(h => {
            const d = new Date(h.date);
            const isFri = d.getDay() === 5;
            reduction += isFri ? goals.friday : goals.daily;
        });

        return Math.max(0, goals.weekly - reduction);
    };

    const lastLog = logs.length > 0 ? logs[logs.length - 1] : null;
    const status = lastLog && lastLog.type === 'ENTRY' ? 'IN' : 'OUT';

    const punch = async () => {
        const newType = status === 'IN' ? 'EXIT' : 'ENTRY';
        const newLog: Log = {
            id: Date.now().toString(),
            timestamp: Date.now(),
            type: newType,
        };
        const newLogs = [...logs, newLog];
        await saveLogs(newLogs);
    };

    const calculateDuration = (logList: Log[], until: number = Date.now()) => {
        let total = 0;
        for (let i = 0; i < logList.length; i++) {
            if (logList[i].type === 'ENTRY') {
                const entryTime = logList[i].timestamp;
                const exitLog = logList[i + 1];

                if (exitLog && exitLog.type === 'EXIT') {
                    total += (exitLog.timestamp - entryTime);
                    i++; // skip exit
                } else {
                    // Ongoing
                    total += (until - entryTime);
                }
            }
        }
        return total;
    };

    const getWeeklyProgress = () => {
        const now = new Date();
        const start = startOfWeek(now, { weekStartsOn: 1 });
        const currentLogs = logs.filter(l => l.timestamp >= start.getTime());
        return calculateDuration(currentLogs) / (1000 * 60 * 60);
    };

    const getTodayProgress = () => {
        const now = new Date();
        const start = startOfDay(now);
        const currentLogs = logs.filter(l => l.timestamp >= start.getTime());
        return calculateDuration(currentLogs) / (1000 * 60 * 60);
    };

    const getMonthlyProgress = () => {
        const now = new Date();
        const start = startOfMonth(now);
        const currentLogs = logs.filter(l => l.timestamp >= start.getTime());
        return calculateDuration(currentLogs) / (1000 * 60 * 60);
    };

    const getDurationForDate = (date: Date) => {
        const start = startOfDay(date);
        const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
        const dailyLogs = logs.filter(l => l.timestamp >= start.getTime() && l.timestamp < end.getTime());
        return calculateDuration(dailyLogs) / (1000 * 60 * 60);
    };

    const updateLeaveLimits = async (newLimits: LeaveLimits) => {
        setLeaveLimits(newLimits);
        await AsyncStorage.setItem(LEAVE_LIMITS_KEY, JSON.stringify(newLimits));
    };

    const getRemainingLeaves = (type: LeaveType) => {
        const currentYear = getYear(new Date());
        const used = leaves.filter(l => l.type === type && getYear(new Date(l.date)) === currentYear).length;
        const max = type === 'SICK' ? leaveLimits.sick : leaveLimits.casual;
        return Math.max(0, max - used);
    };

    const addLeave = async (date: Date, type: LeaveType, note?: string): Promise<boolean> => {
        const remaining = getRemainingLeaves(type);
        if (remaining <= 0) {
            Alert.alert("Limit Reached", `You have used all your ${type} leaves for this year.`);
            return false;
        }

        const dateStr = format(date, 'yyyy-MM-dd');
        // Check if already exists
        if (leaves.some(l => l.date === dateStr)) {
            Alert.alert("Duplicate", "Leave already recorded for this date.");
            return false;
        }
        if (holidays.some(h => h.date === dateStr)) {
            Alert.alert("Conflict", "A holiday is already recorded for this date.");
            return false;
        }

        const newLeave: Leave = {
            id: Date.now().toString(),
            date: dateStr,
            type,
            note
        };

        const newLeaves = [...leaves, newLeave];
        await saveLeaves(newLeaves);
        return true;
    };

    return (
        <TimeContext.Provider value={{
            logs,
            leaves,
            holidays,
            weeklyHolidays,
            status,
            lastLog,
            punch,
            addLeave,
            addHoliday,
            getRemainingLeaves,
            isLoading,
            getWeeklyProgress,
            getTodayProgress,
            getMonthlyProgress,
            getDurationForDate,
            goals,
            updateGoals,
            getEffectiveWeeklyGoal,
            leaveLimits,
            updateLeaveLimits,
            updateWeeklyHolidays,
            exportAllData,
            importAllData,
        }}>
            {children}
        </TimeContext.Provider>
    );
};

export const useTime = () => useContext(TimeContext);
