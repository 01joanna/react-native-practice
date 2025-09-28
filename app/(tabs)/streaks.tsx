import { client, COMPLETIONS_TABLE_ID, DATABASE_ID, databases, HABITS_TABLE_ID, RealTimeResponse } from "@/lib/appwrite";
import { useAuth } from "@/lib/auth-context";
import { Habit, HabitCompletion } from "@/types/database.type";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from 'react-native';
import { Query } from "react-native-appwrite";
import { Card, Text } from 'react-native-paper';

export default function StreaksScreen() {

    const [habits, setHabits] = useState<Habit[]>([]);
    const [completedHabits, setCompletedHabits] = useState<HabitCompletion[]>([]);
    const { user } = useAuth();


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
                    fetchCompletions();
                }
            });
            
            fetchHabits();
            fetchCompletions();

            return () => {
                habitsSubscription();
                completionsSubscription();
            }
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

    const fetchCompletions = async () => {
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
                    Query.equal("user_id", user.$id)]
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

            const completions = response.rows as unknown as HabitCompletion[];
            setCompletedHabits(completions);
        } catch (error) {
            console.error("Error fetching habits:", error);
        }
    };



    const getStreakData = (habitId: string) => {
        const habitCompletions = completedHabits.filter(completion => completion.habit_id === habitId)
            .sort((a, b) => new Date(a.last_completed).getTime() -
                new Date(b.last_completed).getTime());

        if (habitCompletions?.length === 0) {
            return { streak: 0, bestStreak: 0, total: 0 };
        }

        // build streak data
        let streak = 0;
        let bestStreak = 0;
        let total = habitCompletions.length;

        let lastDate: Date | null = null;
        let currentStreak = 0;

        habitCompletions?.forEach((c) => {
            const date = new Date(c.last_completed)
            if (lastDate) {
                const diff = (date.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)

                if (diff <= 1.5) {
                    currentStreak += 1
                } else {
                    currentStreak = 1;
                }
            } else {
                currentStreak = 1;
            }

                if (currentStreak > bestStreak) bestStreak = currentStreak;
                streak = currentStreak
                lastDate = date

        })

        return { streak, bestStreak, total };
    };

    const habitsStreaks = habits.map((habit) => {
        const { streak, bestStreak, total } = getStreakData(habit.$id);
        return { habit, bestStreak, total, streak }
    })

    const rankedHabits = habitsStreaks.sort((a, b) => b.bestStreak - a.bestStreak)
    const badgeStyles = [styles.badge1, styles.badge2, styles.badge3]

    return (
        <View style={styles.container}>
            <Text style={styles.title} variant="headlineSmall">Habit Streaks</Text>

            {rankedHabits.length > 0 && (
                <View style={styles.rankingContainer}>
                    <Text style={styles.rankingTitle}>Top Streaks</Text>
                    {rankedHabits.slice(0, 3).map((item, key) => (
                        <View key={key} style={styles.rankingRow}>
                            <View style={[styles.rankingBadge, badgeStyles[key]]}>
                                <Text style={styles.rankingBadgeText}> {key + 1 } </Text>
                            </View>
                            <Text style={styles.rankingHabit}> {item.habit.title}</Text>
                            <Text style={styles.rankingStreak}>{item.bestStreak}</Text>
                        </View>
                    ))}
                </View>
            )}
            {habits.length === 0 ? (
                <View>
                    <Text>No habits yet. Add your fiirst Habit!</Text>
                </View>
            ) : (
                <ScrollView  style={styles.container} showsVerticalScrollIndicator={false}>
                {rankedHabits.map(({
                    habit,
                    streak,
                    bestStreak,
                    total
                }, key) => (
                    <Card key={key} style={[styles.card, key === 0 && styles.firstCard]}>
                        <Card.Content>
                            <Text style={styles.habitTitle}>{habit.title} </Text>
                            <Text style={styles.habitDescription}>{habit.description}</Text>
                            <View style={styles.statsRow}>
                                <View style={styles.statBadge}>
                                    <Text style={styles.statBadgeText}>{streak}</Text>
                                    <Text style={styles.statLabel}>Current</Text>
                                </View>
                                <View style={styles.statBadgeGold}>
                                    <Text style={styles.statBadgeText}>{bestStreak}</Text>
                                    <Text style={styles.statLabel}>Best</Text>
                                </View>
                                <View style={styles.statBadgeGreen}>
                                    <Text style={styles.statBadgeText}>{total}</Text>
                                    <Text style={styles.statLabel}>Total</Text>
                                </View>
                            </View>
                        </Card.Content>
                    </Card>
                ))}
                </ScrollView>
            )
            }
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5",
        padding: 16,
    },
    title: {
        fontWeight: "bold",
        marginBottom: 16,
    },
    card: {
        marginBottom: 18,
        borderRadius: 18,
        backgroundColor: "#fff",
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        borderWidth: 1,
        borderColor: "#f0f0f0",
    },
    firstCard: {
        borderWidth: 2,
        borderColor: "#7c4dff",
    },
    habitTitle: {
        fontWeight: "bold",
        fontSize: 18,
        marginBottom: 2,
    },
    habitDescription: {
        color: "#6c6c80",
        marginBottom: 8,
    },
    statsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 12,
        marginTop: 8,
    },
    statBadge: {
        backgroundColor: "#fff3e0",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 6,
        alignItems: "center",
        minWidth: 60,
    },
    statBadgeGold: {
        backgroundColor: "#fffde7",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 6,
        alignItems: "center",
        minWidth: 60,
    },
    statBadgeGreen: {
        backgroundColor: "#e8f5e9",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 6,
        alignItems: "center",
        minWidth: 60,
    },
    statBadgeText: {
        fontWeight: "bold",
        fontSize: 15,
        color: "#22223b",
    },
    statLabel: {
        fontSize: 11,
        color: "#888",
        marginTop: 2,
        fontWeight: "500",
    },

    rankingContainer: {
        marginBottom: 24,
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },
    rankingTitle: {
        fontWeight: "bold",
        fontSize: 18,
        marginBottom: 12,
        color: "#7c4dff",
        letterSpacing: 0.5,
    },
    rankingRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
        paddingBottom: 8,
    },
    rankingBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
        backgroundColor: "#e0e0e0",
    },
    badge1: { backgroundColor: "#ffd700" }, // gold
    badge2: { backgroundColor: "#c0c0c0" }, // silver
    badge3: { backgroundColor: "#cd7f32" }, // bronze

    rankingBadgeText: {
        fontWeight: "bold",
        color: "#fff",
        fontSize: 15,
    },

    rankingHabit: {
        flex: 1,
        fontSize: 15,
        color: "#333",
        fontWeight: "600",
    },
    rankingStreak: {
        fontSize: 14,
        color: "#7c4dff",
        fontWeight: "bold",
    },
});