import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Tabs } from "expo-router";


export default function TabsLayout() {
    return (
        <Tabs screenOptions={{
            headerStyle: { backgroundColor: "#f5f5f5"},
            headerShadowVisible: false,
            tabBarStyle: { backgroundColor: "#f5f5f5", borderTopWidth: 0, elevation: 0, shadowOpacity: 0},
            tabBarActiveTintColor: "#6200ee",
            tabBarInactiveTintColor: "#666666"
        }}>
            <Tabs.Screen name="index" 
            options={{title: "Today's Habits", 
            tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={24} color={color} /> }}>
            </Tabs.Screen>

            <Tabs.Screen name="streaks" 
            options={{title: "Streaks", 
            tabBarIcon: ({ color }) => <MaterialCommunityIcons name="chart-line" size={24} color={color} /> }}>
            </Tabs.Screen>

            <Tabs.Screen name="add-habit" 
            options={{title: "Add habit", 
            tabBarIcon: ({ color }) => <MaterialCommunityIcons name="plus-circle" size={24} color={color} /> }}>
            </Tabs.Screen>
        </Tabs>
    )
}