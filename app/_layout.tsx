import { HelpRequestProvider, useHelpRequest } from "@/context/helpRequestContext";
import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import type { User } from "firebase/auth";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { FIREBASE_auth } from "../firebaseConfig";

function NotificationHandler() {
  const responseListener = useRef<any>(null);
  const { setIncomingRequestId } = useHelpRequest();

  useEffect(() => {
    // When user taps a notification while app is open or in background
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const requestId = response.notification.request.content.data?.requestId;
      if (requestId && typeof requestId === "string") {
        setIncomingRequestId(requestId);
      }
    });

    // When app is opened from a closed state via notification
    Notifications.getLastNotificationResponseAsync().then(response => {
      if (response) {
        const requestId = response.notification.request.content.data?.requestId;
        if (requestId && typeof requestId === "string") {
          setIncomingRequestId(requestId);
        }
      }
    });

    return () => {
      if (responseListener.current) {
        responseListener.current?.remove();
      }
    };
  }, []);

  return null;
}

export default function RootLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = FIREBASE_auth.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <HelpRequestProvider>
      <NotificationHandler />
      <Stack screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="auth/login" />
            <Stack.Screen name="auth/signup" />
          </>
        ) : (
          <>
            <Stack.Screen name="tabs" />
          </>
        )}
      </Stack>
    </HelpRequestProvider>
  );
}

