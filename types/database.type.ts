
export interface Habit {
    $id: string;
    $databaseId: string;
    $tableId: string;
    $createdAt: string;
    $updatedAt: string;
    $permissions: string[];

    user_id: string;
    title: string;
    description: string;
    frequency: string;
    streak_count: number;
    last_completed: string;
    created_at: string;
}

export interface HabitCompletion {

    $id: string;
    $databaseId: string;
    $tableId: string;
    $createdAt: string;
    $updatedAt: string;
    $permissions: string[]; 
    
    habit_id: string;
    user_id: string;
    last_completed: string;
}

interface StreakData {
    streak: number,
    bestStreak: number,
    total: number
}