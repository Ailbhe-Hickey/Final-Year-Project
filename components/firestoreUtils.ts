import { FIREBASE_auth, FIREBASE_db } from "@/firebaseConfig";
import * as Device from "expo-device";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

export async function saveTokenToFirestore(token: string) {
  const user = FIREBASE_auth.currentUser;
  if (!user) return;

  // unique device id
  const deviceId =
    Device.osInternalBuildId ||
    Device.modelId ||
    Math.random().toString(36).substring(2);

  try {
    await setDoc(
      doc(FIREBASE_db, "users", user.uid, "devices", deviceId),
      {
        token: token,
        platform: Device.osName,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    console.log("Token saved for device:", deviceId);
  } catch (err) {
    console.log("Error saving token:", err);
  }
}
