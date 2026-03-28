import { FIREBASE_db } from "@/firebaseConfig";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { Animated, Text, TouchableOpacity, View } from "react-native";

const ACCEPTED_DISMISS_DELAY = 4000;
const FAILED_DISMISS_DELAY = 6000;
const FADE_DURATION = 700;

function PulsingDots() {
  const anims = [
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.3)).current,
  ];

  useEffect(() => {
    const pulse = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ])
      ).start();
    anims.forEach((anim, i) => pulse(anim, i * 200));
  }, []);

  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8, gap: 5 }}>
      {anims.map((anim, i) => (
        <Animated.View
          key={i}
          style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#e8a020", opacity: anim }}
        />
      ))}
      <Text style={{ fontSize: 11, color: "#999" }}>Live</Text>
    </View>
  );
}

type ResendReason = "all_declined" | "timeout" | undefined;

function getResendLabel(reason: ResendReason, resendCount: number): string | null {
  if (!resendCount || resendCount < 1) return null;
  if (reason === "all_declined") return "Everyone declined, notifying family again...";
  if (reason === "timeout") return "No response yet, notifying family again...";
  return "Retrying...";
}

interface Props {
  requestId: string | null;
  onDismiss?: () => void;
}

export function PatientRequestBanner({ requestId, onDismiss }: Props) {
  const [request, setRequest] = useState<any>(null);
  const [acceptedByName, setAcceptedByName] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerAutoDismiss = (delay: number) => {
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    dismissTimerRef.current = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: FADE_DURATION,
        useNativeDriver: true,
      }).start(() => onDismiss?.());
    }, delay);
  };

  useEffect(() => {
    if (!requestId) return;
    fadeAnim.setValue(1);
    const unsub = onSnapshot(
      doc(FIREBASE_db, "helpRequests", requestId),
      (snap) => setRequest(snap.data())
    );
    return () => {
      unsub();
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, [requestId]);

  useEffect(() => {
    if (!request?.acceptedBy) return;
    const unsub = onSnapshot(
      doc(FIREBASE_db, "users", request.acceptedBy),
      (snap) => setAcceptedByName(snap.data()?.displayName)
    );
    return unsub;
  }, [request?.acceptedBy]);

  useEffect(() => {
    if (request?.status === "accepted") triggerAutoDismiss(ACCEPTED_DISMISS_DELAY);
    if (request?.status === "failed") triggerAutoDismiss(FAILED_DISMISS_DELAY);
  }, [request?.status]);

  if (!request || !["pending", "accepted", "failed"].includes(request.status)) return null;

  const isPending = request.status === "pending";
  const isFailed = request.status === "failed";
  const resendCount: number = request.resendCount ?? 0;
  const resendReason: ResendReason = request.lastResendReason;
  const resendLabel = getResendLabel(resendReason, resendCount);
  const accentColor = isFailed ? "#c0392b" : isPending ? "#e8a020" : "#22641c";

  const handleCancel = async () => {
    if (!requestId) return;
    await updateDoc(doc(FIREBASE_db, "helpRequests", requestId), { status: "cancelled" });
    onDismiss?.();
  };

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        alignSelf: "center",        
        width: "70%",               
        marginTop: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: "white",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
        borderLeftWidth: 3,
        borderLeftColor: accentColor,
        borderTopWidth: 3,
        borderTopColor: accentColor,
      }}
    >
      <Text style={{ fontSize: 11, fontWeight: "700", color: accentColor, marginBottom: 3 }}>
        {isFailed ? "NO ONE RESPONDED" : isPending ? "HELP REQUEST SENT" : "HELP IS ON THE WAY"}
      </Text>

      <Text style={{ fontSize: 13, color: "#333" }}>
        {isFailed
          ? "No one was able to respond."
          : isPending
          ? "Waiting for a family member..."
          : `${acceptedByName ?? "Someone"} is on the way.`}
      </Text>

      {isPending && resendLabel && (
        <Text style={{ fontSize: 11, color: "#e8a020", marginTop: 6, fontStyle: "italic" }}>
          {resendLabel}
        </Text>
      )}

      {isPending && resendCount > 0 && (
        <Text style={{ fontSize: 10, color: "#bbb", marginTop: 3 }}>
          Attempt {resendCount + 1}
        </Text>
      )}

      {isPending && <PulsingDots />}

      {isPending && (
        <TouchableOpacity onPress={handleCancel} style={{ marginTop: 8 }}>
          <Text style={{ fontSize: 12, color: "#999" }}>Cancel request</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}
