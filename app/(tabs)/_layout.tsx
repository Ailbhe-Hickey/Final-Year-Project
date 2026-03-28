import { HelpRequestModal } from "@/components/family_request_modal";
import { FIREBASE_auth, FIREBASE_db } from "@/firebaseConfig";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { View } from "react-native";

export default function TabLayout() {
  const [role, setRole] = useState<string | null>(null);
  const [incomingRequestId, setIncomingRequestId] = useState<string | null>(null);

  const currentUser = FIREBASE_auth.currentUser;

  // Get user role
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = onSnapshot(
      doc(FIREBASE_db, "users", currentUser.uid),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setRole(data.role || null);
        }
      },
      (error) => {
        console.log("Error fetching user role:", error);
      }
    );
    return () => unsubscribe();
  }, []);

  // Listen for incoming help requests 
  useEffect(() => {
    if (!currentUser || role !== "family") return;

    const q = query(
      collection(FIREBASE_db, "helpRequests"),
      where("status", "==", "pending"),
      where(`declineTracker.${currentUser.uid}`, "==", "pending")
    );

    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        setIncomingRequestId(snap.docs[0].id);
      } else {
        setIncomingRequestId(null);
      }
    });

    return () => unsub();
  }, [currentUser, role]);

  return (
    <View style={{ flex: 1 }}>
      <NativeTabs tintColor="#7F9C96"> 

        {role === "mnd" && (
          <NativeTabs.Trigger name="mnd_carousel">
            <Icon sf="square.grid.2x2.fill" drawable="custom_android_drawable" />
            <Label hidden />
          </NativeTabs.Trigger>
        )}

        {role === "family" && (
          <NativeTabs.Trigger name="home">
            <Icon sf="house.fill" drawable="custom_settings_drawable" />
            <Label hidden />
          </NativeTabs.Trigger>
        )}
        
          <NativeTabs.Trigger name="family">
            <Icon sf="person.3.fill" drawable="custom_settings_drawable" />
            <Label hidden />
          </NativeTabs.Trigger>
        

          <NativeTabs.Trigger name="profile">
            <Label hidden />
            <Icon sf="person.fill" drawable="custom_settings_drawable" />
          </NativeTabs.Trigger>
  
       
        
      </NativeTabs>

      {/* Shows on top of any tab when a help request comes in */}
      {incomingRequestId && (
        <HelpRequestModal
          requestId={incomingRequestId}
          onDismiss={() => setIncomingRequestId(null)}
        />
      )}
    </View>
  );
}
