import { useRouter } from "expo-router";
import { User as FirebaseUser, onAuthStateChanged } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { saveTokenToFirestore } from "../components/firestoreUtils";
import { registerForPushNotificationsAsync } from "../components/notification_register";
import { FIREBASE_auth } from "../firebaseConfig";


export default function Index() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<FirebaseUser | null>(null);

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(FIREBASE_auth, (authUser) => {
      setUser(authUser);
      setLoading(false);

      if (authUser) {
        router.replace("/mnd_carousel");
      } else {
        router.replace("/auth/login");
      }
    });

    return unsubscribe;
  }, []);

  // Register notifications AFTER login
  useEffect(() => {
    if (!user) return;

    async function setupPush() {
      const token = await registerForPushNotificationsAsync();
      if (token) await saveTokenToFirestore(token);
    }

    setupPush();
  }, [user]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#043d11" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.welcome}>Welcome to FYP App</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  welcome: { fontSize: 24, fontWeight: "bold" },
});