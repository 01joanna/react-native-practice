import { Account, Client, TablesDB } from 'react-native-appwrite';

export const client = new Client()
    .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!)
    .setPlatform(process.env.EXPO_PUBLIC_APPWRITE_PLATFORM!);

    export const account = new Account(client)
    export const databases = new TablesDB(client)
    
    export const DATABASE_ID = process.env.EXPO_PUBLIC_DATABASE_ID!
    export const HABITS_TABLE_ID = process.env.EXPO_PUBLIC_TABLE_ID!

    export interface RealTimeResponse {
        events: string[];
        payload: any
    }