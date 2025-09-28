import { client, COMPLETIONS_TABLE_ID, DATABASE_ID, databases, HABITS_TABLE_ID, RealTimeResponse } from "@/lib/appwrite";
import { useAuth } from "@/lib/auth-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import React, { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Query } from "react-native-appwrite";
import Swipeable, { SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";
import { Button, Surface, Text } from "react-native-paper";
import { Habit, HabitCompletion } from "../../types/database.type";

export default function HomeScreen() {
    const { signOut, user } = useAuth();
    const [habits, setHabits] = useState<Habit[]>([]);
    const [completedHabits, setCompletedHabits] = useState<string[]>([]);

    const swipeableRefs = useRef<Record<string, React.RefObject<SwipeableMethods | null>>>({});


    useEffect(() => {
        if (user) {

            const habitsChannel = `databases.${DATABASE_ID}.collections.${HABITS_TABLE_ID}`;

            const habitsSubscription = client.subscribe(habitsChannel, (response: RealTimeResponse) => {
                if (
                    response.events.includes("databases.*.tables.*.documents.*.create") ||
                    response.events.includes("databases.*.tables.*.documents.*.update") ||
                    response.events.includes("databases.*.tables.*.documents.*.delete")
                ) {
                    fetchHabits();
                }
            });

            const completionsChannel = `databases.${DATABASE_ID}.collections.${COMPLETIONS_TABLE_ID}`;
            const completionsSubscription = client.subscribe(completionsChannel, (response: RealTimeResponse) => {
                if (
                    response.events.includes("databases.*.tables.*.documents.*.create")
                ) {
                    fetchTodayCompletions();
                }
            });

            fetchHabits();
            fetchTodayCompletions();


            return () => {
                habitsSubscription();
                completionsSubscription();
            };
        }
    }, [user]);

    const fetchHabits = async () => {
        if (!user) return;

        try {
            const response = await databases.listRows({
                databaseId: DATABASE_ID,
                tableId: HABITS_TABLE_ID,
                queries: [Query.equal("user_id", user.$id)],
            });

            const mappedHabits: Habit[] = response.rows.map((row) => ({
                $id: row.$id,
                $databaseId: row.$databaseId,
                $tableId: row.$tableId,
                $createdAt: row.$createdAt,
                $updatedAt: row.$updatedAt,
                $permissions: row.$permissions,
                user_id: row.user_id,
                title: row.title,
                description: row.description,
                frequency: row.frequency,
                streak_count: row.streak_count,
                last_completed: row.last_completed,
                created_at: row.created_at,
            }));

            setHabits(mappedHabits);
        } catch (error) {
            console.error("Error fetching habits:", error);
        }
    };

    const fetchTodayCompletions = async () => {
        if (!user) return;

        try {

            const today = new Date()
            today.setHours(0, 0, 0, 0);
            const endDay = new Date();
            endDay.setHours(23, 59, 59, 999);

            const response = await databases.listRows({
                databaseId: DATABASE_ID,
                tableId: COMPLETIONS_TABLE_ID,
                queries: [
                    Query.equal("user_id", user.$id), 
                    Query.greaterThanEqual("completed_at", today.toISOString()),
                    Query.lessThanEqual("completed_at", endDay.toISOString())]
            });

            const mappedCompletions: HabitCompletion[] = response.rows.map((row) => ({
                $id: row.$id,
                $databaseId: row.$databaseId,
                $tableId: row.$tableId,
                $createdAt: row.$createdAt,
                $updatedAt: row.$updatedAt,
                $permissions: row.$permissions,
                user_id: row.user_id,
                habit_id: row.habit_id,
                title: row.title,
                last_completed: row.last_completed,
            }));

            const completions = mappedCompletions.map((completion) => completion.habit_id);
            setCompletedHabits(completions);
        } catch (error) {
            console.error("Error fetching habits:", error);
        }
    };

    const isHabitCompleted = (habitId: string) => completedHabits?.includes(habitId)

    const renderLeft = () => (
        <View style={styles.swipeActionLeft}>
            <MaterialCommunityIcons name="trash-can-outline" size={32} color={"#fff"} />
        </View>
    );

    const renderRight = (habitId: string) => (
        <View style={styles.swipeActionRight}>
            {isHabitCompleted(habitId) ? (<Text style={{color: "#fff"}}>Completed!</Text> ) :
            <MaterialCommunityIcons name="check-circle-outline" size={32} color={"#fff"} />}
        </View>
    );

    const handleDeleteHabit = async (id: string) => {
        try {
            await databases.deleteRow(DATABASE_ID, HABITS_TABLE_ID, id);
            fetchHabits();
        } catch (error) {
            console.log(error);
        }
    };

    const handleCompleteHabit = async (habitId: string) => {
        if (!user || completedHabits?.includes(habitId)) return;

        const currentDate = new Date().toISOString();
        try {
            await databases.createRow({
                databaseId: DATABASE_ID,
                tableId: COMPLETIONS_TABLE_ID,
                rowId: "unique()",
                data: {
                    habit_id: habitId,
                    user_id: user.$id,
                    completed_at: currentDate,
                },
            });

            const habit = habits?.find((h) => h.$id === habitId);
            if (!habit) return;

            await databases.updateRow({
                databaseId: DATABASE_ID,
                tableId: HABITS_TABLE_ID,
                rowId: habitId,
                data: {
                    streak_count: (habit.streak_count || 0) + 1,
                    last_completed: currentDate,
                },
            });

            fetchHabits();
        } catch (error) {
            console.error("Error completing habit:", error);
        }
    };


    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text variant="headlineSmall" style={styles.title}>
                    Today's Habits
                </Text>
                <Button mode="text" onPress={signOut} icon={"logout"}>
                    Sign Out
                </Button>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {habits?.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>No habits yet. Add your first habit!</Text>
                    </View>
                ) : (
                    habits.map((habit) => {
                        if (!swipeableRefs.current[habit.$id]) {
                            swipeableRefs.current[habit.$id] = React.createRef<SwipeableMethods>();
                        }


                        return (
                            <Swipeable
                                ref={swipeableRefs.current[habit.$id]}
                                key={habit.$id}
                                overshootLeft={false}
                                overshootRight={false}
                                renderLeftActions={renderLeft}
                                renderRightActions={() => renderRight(habit.$id)}
                                onSwipeableOpen={(direction) => {
                                    if (direction === "right") {
                                        handleDeleteHabit(habit.$id);
                                    } else if (direction === "left") {
                                        handleCompleteHabit(habit.$id)
                                    }
                                    
                                    swipeableRefs.current[habit.$id]?.current?.close();
                                }}
                            >
                                <Surface style={[styles.card, isHabitCompleted(habit.$id) && styles.cardCompleted]} elevation={0}>
                                    <View style={styles.cardContent}>
                                        <Text style={styles.title}>{habit.title}</Text>
                                        <Text style={styles.cardDescription}>{habit.description}</Text>
                                        <View style={styles.cardFooter}>
                                            <View style={styles.streakBadge}>
                                                <MaterialCommunityIcons name="fire" size={18} color={"#ff9800"} />
                                                <Text style={styles.streakText}>{habit.streak_count} day streak</Text>
                                            </View>
                                            <View style={styles.frequencyBadge}>
                                                <Text style={styles.frequencyText}>
                                                    {habit.frequency.charAt(0).toUpperCase() + habit.frequency.slice(1)}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </Surface>
                            </Swipeable>
                        );
                    })
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: "#f5f5f5" },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
    },
    title: { fontWeight: "bold" },
    card: {
        marginBottom: 18,
        borderRadius: 18,
        backgroundColor: "#f7f2fa",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
    cardCompleted: { opacity: 0.6}, 
    cardContent: { padding: 20 },
    cardDescription: { fontSize: 15, marginBottom: 16, color: "#6c6c80" },
    cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    streakBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff3e0",
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    streakText: { marginLeft: 6, color: "#ff9800", fontWeight: "bold", fontSize: 14 },
    frequencyBadge: {
        backgroundColor: "#ede7f6",
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    frequencyText: { color: "#7c4dff", fontWeight: "bold", fontSize: 14 },
    emptyState: { flex: 1, justifyContent: "center", alignItems: "center" },
    emptyStateText: { color: "#666666" },
    swipeActionLeft: {
        justifyContent: "center",
        alignItems: "flex-start",
        flex: 1,
        backgroundColor: "#e53935",
        borderRadius: 18,
        marginBottom: 18,
        marginTop: 2,
        paddingLeft: 16,
    },
    swipeActionRight: {
        justifyContent: "center",
        alignItems: "flex-end",
        flex: 1,
        backgroundColor: "#4caf50",
        borderRadius: 18,
        marginBottom: 18,
        marginTop: 2,
        paddingRight: 16,
    },
});
