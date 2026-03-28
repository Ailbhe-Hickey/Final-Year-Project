import { FIREBASE_auth, FIREBASE_db } from "@/firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { doc, onSnapshot, runTransaction, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";


const green = "#7F9C96";
const dark_green = "#5f8a7c";
const danger = "#c0544a";
const { width: SCREEN_WIDTH } = Dimensions.get("screen");


async function acceptRequest(requestId: string, currentUserId: string) {
  await runTransaction(FIREBASE_db, async (transaction) => {
    const ref = doc(FIREBASE_db, "helpRequests", requestId);
    const snap = await transaction.get(ref);
    if (snap.data()?.status === "pending") {
      transaction.update(ref, {
        status: "accepted",
        acceptedBy: currentUserId,
      });
    }
  });
}

async function declineRequest(requestId: string, currentUserId: string) {
  await updateDoc(doc(FIREBASE_db, "helpRequests", requestId), {
    [`declineTracker.${currentUserId}`]: "declined",
  });
}


interface Props {
  requestId: string;
  onDismiss: () => void;
}


export function HelpRequestModal({ requestId, onDismiss }: Props) {
  const [request, setRequest] = useState<any>(null);
  const [patientName, setPatientName] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);

  const currentUserId = FIREBASE_auth.currentUser?.uid;

  useEffect(() => {
    const unsub = onSnapshot(
      doc(FIREBASE_db, "helpRequests", requestId),
      (snap) => setRequest(snap.data())
    );
    return unsub;
  }, [requestId]);

  useEffect(() => {
    if (!request?.patientId) return;
    const unsub = onSnapshot(
      doc(FIREBASE_db, "users", request.patientId),
      (snap) => setPatientName(snap.data()?.displayName)
    );
    return unsub;
  }, [request?.patientId]);

  // Auto-dismiss if no longer pending
  useEffect(() => {
    if (request && request.status !== "pending") onDismiss();
  }, [request?.status]);

  if (!request || !currentUserId) return null;

  const handleAccept = async () => {
    setAccepting(true);
    try {
      await acceptRequest(requestId, currentUserId);
      onDismiss();
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = async () => {
    setDeclining(true);
    try {
      await declineRequest(requestId, currentUserId);
      onDismiss();
    } finally {
      setDeclining(false);
    }
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>

        {/* Icon */}
        <View style={styles.iconWrap}>
          <Ionicons name="alert-outline" size={32} color={dark_green} />
        </View>

        {/* Title */}
        <Text style={styles.title}>Help Requested</Text>
        <Text style={styles.subtitle}>
          <Text style={styles.nameHighlight}>{patientName ?? "Someone"}</Text>
          {" "}needs your assistance right now.
        </Text>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Buttons */}
        <View style={styles.btnRow}>
          {/* Decline */}
          <Pressable
            style={({ pressed }) => [
              styles.btn,
              styles.declineBtn,
              pressed && { opacity: 0.8 },
              declining && { opacity: 0.5 },
            ]}
            onPress={handleDecline}
            disabled={declining || accepting}
          >
            {declining ? (
              <ActivityIndicator size="small" color={danger} />
            ) : (
              <>
                <Ionicons name="close-outline" size={18} color={danger} />
                <Text style={[styles.btnText, styles.declineBtnText]}>Decline</Text>
              </>
            )}
          </Pressable>

          {/* Accept */}
          <Pressable
            style={({ pressed }) => [
              styles.btn,
              styles.acceptBtn,
              pressed && { opacity: 0.85 },
              accepting && { opacity: 0.6 },
            ]}
            onPress={handleAccept}
            disabled={accepting || declining}
          >
            {accepting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="checkmark-outline" size={18} color="white" />
                <Text style={[styles.btnText, styles.acceptBtnText]}>Accept</Text>
              </>
            )}
          </Pressable>
        </View>

      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(15, 30, 25, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },

  card: {
    width: SCREEN_WIDTH * 0.85,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 12,
  },

  // Icon badge
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#eef4f3",
    borderWidth: 1.5,
    borderColor: "#d0e3e0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },

  // Text
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a2e28",
    letterSpacing: -0.3,
    marginBottom: 8,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  
  nameHighlight: {
    fontWeight: "700",
    color: dark_green,
  },

  divider: {
    width: "100%",
    height: 1,
    backgroundColor: "#e8f0ee",
    marginBottom: 20,
  },

  // Buttons
  btnRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
  },
  btnText: {
    fontSize: 15,
    fontWeight: "700",
  },

  // Accept
  acceptBtn: {
    backgroundColor: green,
    shadowColor: dark_green,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  acceptBtnText: {
    color: "white",
  },

  // Decline
  declineBtn: {
    backgroundColor: "#fff5f5",
    borderWidth: 1,
    borderColor: "#f0d0ce",
  },
  declineBtnText: {
    color: danger,
  },
});