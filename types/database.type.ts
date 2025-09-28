import { Models } from "react-native-appwrite";

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

export interface HabitCompletion extends Models.Row {
    habit_id: string;
    user_id: string;
    completed_at: string;
}