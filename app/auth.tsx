import { useAuth } from "@/lib/auth-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { Button, Text, TextInput, useTheme } from "react-native-paper";

export default function AuthScreen() {

    const [isSignUp, setIsSignUp] = useState<boolean>(false);
    const [email, setEmail] = useState<string>("")
    const [password, setPassword] = useState<string>("")
    const [error, setError] = useState<string | null>("")

    const theme = useTheme();
    const { signIn, signUp } = useAuth();
    const router = useRouter()

    async function handleAuth() {
        if (!email || !password) {
            setError("Please fill in all fields")
            return;
        }

        if (password.length < 6) {
            setError("Passwords must be at least 6 characters long");
            return;
        }

        setError(null);

        if (isSignUp) {
            const error = await signUp(email, password);
            if (error) {
                setError(error);
                return;
            }
        } else {
            const error = await signIn(email, password);
            if (error) {
                setError(error);
                return;
            }

        }

        router.replace("/")

    }

    function handleSwitchMode() {
        setIsSignUp((prev) => !prev)
    }



    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title} variant="headlineMedium">  {isSignUp ? "Create Account" : "Welcome Back"}</Text>

                <TextInput
                    placeholder="email@email.com"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    label="Email"
                    mode="outlined"
                    style={styles.input}
                    onChangeText={setEmail}
                />

                {error && (
                    <Text style={{ color: theme.colors.error }}>{error}</Text>
                )}

                <TextInput
                    autoCapitalize="none"
                    label="Password"
                    mode="outlined"
                    style={styles.input}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                {error && <Text style={{ color: theme.colors.error }}> {error}</Text>}

                <Button mode="contained" style={styles.button} onPress={handleAuth}>
                    {isSignUp ? "Sign Up" : "Sign In"}
                </Button>
                <Button
                    mode="text"
                    onPress={handleSwitchMode}
                    style={styles.switchButton}>
                    {isSignUp ? "Already have an account? Sign in" : "Dont have an account? Sign Up"}</Button>
            </View>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5"
    },
    content: {
        flex: 1,
        padding: 16,
        justifyContent: "center",
    },
    title: {
        textAlign: "center",
        marginBottom: 24
    },
    button: {
        marginTop: 8
    },
    input: {
        marginBottom: 16
    },
    switchButton: {
        marginTop: 16
    }
});