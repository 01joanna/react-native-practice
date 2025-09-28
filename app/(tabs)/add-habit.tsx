import { DATABASE_ID, databases, HABITS_TABLE_ID } from "@/lib/appwrite";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { ID } from "react-native-appwrite";
import { Button, SegmentedButtons, Text, TextInput, useTheme } from 'react-native-paper';

const frequencies = ["daily", "weekly", "monthly"]
type Frequency = (typeof frequencies)[number];

export default function AddHabit() {

    const [title, setTitle] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [frequency, setFrequency] = useState<Frequency>("daily");
    const [error, setError] = useState<string>("")

    const theme = useTheme();
    const { user } = useAuth()
    const router = useRouter();

    const handleSubmit = async () => {
        if (!user) return

        try {
            await databases.createRow({
                databaseId: DATABASE_ID,
                tableId: HABITS_TABLE_ID,
                rowId: ID.unique(),
                data: {
                    user_id: user.$id,
                    title,
                    description,
                    frequency,
                    streak_count: 0,
                    last_completed: new Date().toISOString(),
                    $createdAt: new Date().toISOString(),
                },
                // permissions: [`user:${user.$id}`],
            });

            router.back();

        } catch (error) {
            if (error instanceof Error) {
                setError(error.message)
            }
        }
    }

    return (
        <View style={styles.container}>
            <TextInput
                label="Title"
                mode="outlined"
                style={styles.input}
                onChangeText={setTitle}
            />

            <TextInput
                label="Description"
                mode="outlined"
                style={styles.input}
                onChangeText={setDescription}
            />
            <View>
                <SegmentedButtons
                    value={frequency}
                    style={styles.frequencyContainer}
                    onValueChange={(value) => setFrequency(value as Frequency)}
                    buttons={
                        frequencies.map((freq) => ({
                            value: freq,
                            label: freq.charAt(0).toUpperCase() + freq.slice(1)
                        }))
                    } />
            </View>
            <Button mode="contained"
                onPress={handleSubmit}
                disabled={!title || !description}>Add habit</Button>
            {error && <Text style={{ color: theme.colors.error }}> {error}</Text>}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: "#f5f5f5",
        justifyContent: "center",
    },

    input: {
        marginBottom: 16,
    },

    frequencyContainer: {
        marginBottom: 24,
    },
})

