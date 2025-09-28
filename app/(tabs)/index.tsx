import { client, DATABASE_ID, databases, HABITS_TABLE_ID, RealTimeResponse } from "@/lib/appwrite";
import { useAuth } from "@/lib/auth-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Query } from "react-native-appwrite";
import { Button, Surface, Text } from "react-native-paper";
import { Habit } from '../../types/database.type';

export default function HomeScreen() {

    const { signOut, user } = useAuth();
    const [habits, setHabits] = useState<Habit[]>([])

    useEffect(() => {
        if (user) {
            fetchHabits();

            const channel = `databases.${DATABASE_ID}.collections.${HABITS_TABLE_ID}`

            const habitsSubscription = client.subscribe(channel, (response: RealTimeResponse) => {
                if (response.events.includes("databases.*.tables.*.documents.*.create")) {
                    fetchHabits();
                } else if (
                    response.events.includes(
                        "databases.*.tables.*.documents.*.update")
                ) {
                    fetchHabits();
                } else if (
                    response.events.includes(
                        "databases.*.tables.*.documents.*.delete")
                ) {
                    fetchHabits();
                }
            }
            )

            fetchHabits();
            return () => {
                habitsSubscription();
            }
        }
    }, [user])

    const fetchHabits = async () => {
        if (!user) return;

        try {
            const response = await databases.listRows({
                databaseId: DATABASE_ID,
                tableId: HABITS_TABLE_ID,
                queries: [Query.equal("user_id", user.$id)],
            });

            const mappedHabits: Habit[] = response.rows.map(row => ({
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


    return (
        <View style={styles.container}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text variant="headlineSmall" style={styles.title}>
                        {" "}
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
                        habits.map((habit, key) => (
                            <Surface style={styles.card} elevation={0} key={key}>
                                <View key={key} style={styles.cardContent}>
                                    <Text style={styles.title}> {habit.title}</Text>
                                    <Text style={styles.cardDescription}> {habit.description}</Text>
                                    <View style={styles.cardFooter}>
                                        <View style={styles.streakBadge}>
                                            <MaterialCommunityIcons name="fire" size={18} color={"#ff9800"} />
                                            <Text style={styles.streakText}>{habit.streak_count} day streak</Text>
                                        </View>
                                        <View style={styles.frequencyBadge}>
                                            <Text style={styles.frequencyText}>
                                                {" "}
                                                {habit.frequency.charAt(0).toUpperCase() +
                                                    habit.frequency.slice(1)}</Text>
                                        </View>
                                    </View>
                                </View>
                            </Surface>
                        ))
                    )}
                </ScrollView>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: "#f5f5f5",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
    },
    title: {
        fontWeight: "bold",
    },

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

    cardCompleted: {
        opacity: 0.6,
    },
    cardContent: {
        padding: 20,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 4,
        color: "#22223b",
    },
    cardDescription: {
        fontSize: 15,
        marginBottom: 16,
        color: "#6c6c80",
    },
    cardFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    streakBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff3e0",
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    streakText: {
        marginLeft: 6,
        color: "#ff9800",
        fontWeight: "bold",
        fontSize: 14,
    },
    frequencyBadge: {
        backgroundColor: "#ede7f6",
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    frequencyText: {
        color: "#7c4dff",
        fontWeight: "bold",
        fontSize: 14,
    },
    emptyState: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    emptyStateText: {
        color: "#666666",
    },
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