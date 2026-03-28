import { FIREBASE_auth, FIREBASE_db } from "@/firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import {
    addDoc,
    arrayRemove,
    arrayUnion,
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    updateDoc,
    where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import Svg, { Path } from "react-native-svg";

// ─── Types 

interface Member {
  uid: string;
  displayName: string;
}

// ─── Constants 

const green = "#7F9C96";
const dark_green = "#5f8a7c";
const danger = "#c0544a";
const { width: SCREEN_WIDTH } = Dimensions.get("screen");

// ─── Helpers 

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ─── Sub-screens ──────────────────────────────────────────────────────────────

function NoFamilyScreen({ onFamilyJoined }: { onFamilyJoined: () => void }) {
  const [tab, setTab] = useState<"create" | "join">("create");
  const [familyName, setFamilyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [busy, setBusy] = useState(false);

  const createFamily = async () => {
    const user = FIREBASE_auth.currentUser;
    if (!user || !familyName.trim()) {
      Alert.alert("Enter a family name first.");
      return;
    }
    setBusy(true);
    try {
      const code = generateCode();
      const familyRef = await addDoc(collection(FIREBASE_db, "families"), {
        name: familyName.trim(),
        createdBy: user.uid,
        members: [user.uid],
        inviteCode: code,
      });
      await updateDoc(doc(FIREBASE_db, "users", user.uid), {
        familyId: familyRef.id,
      });
      Alert.alert("Family Created", `Your invite code is ${code}`);
      onFamilyJoined();
    } catch (e) {
      Alert.alert("Error", (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const joinFamily = async () => {
    const user = FIREBASE_auth.currentUser;
    if (!user || !inviteCode.trim()) {
      Alert.alert("Enter an invite code first.");
      return;
    }
    setBusy(true);
    try {
      const q = query(
        collection(FIREBASE_db, "families"),
        where("inviteCode", "==", inviteCode.trim())
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        Alert.alert("Error", "Family not found. Check the code and try again.");
        return;
      }
      const familyDoc = snap.docs[0];
      const familyRef = doc(FIREBASE_db, "families", familyDoc.id);
      await updateDoc(familyRef, { members: arrayUnion(user.uid) });
      await updateDoc(doc(FIREBASE_db, "users", user.uid), {
        familyId: familyDoc.id,
      });
      Alert.alert("Success", "You've joined the family!");
      onFamilyJoined();
    } catch (e) {
      Alert.alert("Error", (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.top}>
        <View style={styles.box}>
          <Svg height={200} width={SCREEN_WIDTH} viewBox="0 0 1440 320" preserveAspectRatio="none">
            <Path
              fill="#7F9C96"
              d="M0,192L60,170.7C120,149,240,107,360,112C480,117,600,171,720,197.3C840,224,960,224,1080,208C1200,192,1320,160,1380,144L1440,128L1440,0L1380,0C1320,0,1200,0,1080,0C960,0,840,0,720,0C600,0,480,0,360,0C240,0,120,0,60,0L0,0Z"
            />
          </Svg>
        </View>
      </View>

      <View style={styles.noFamilyContent}>
        <Text style={styles.noFamilyTitle}>Your Family</Text>
        <Text style={styles.noFamilySubtitle}>
          Create a new family or join one with an invite code.
        </Text>

        <View style={styles.tabRow}>
          <Pressable
            style={[styles.tab, tab === "create" && styles.tabActive]}
            onPress={() => setTab("create")}
          >
            <Text style={[styles.tabText, tab === "create" && styles.tabTextActive]}>Create</Text>
          </Pressable>
          <Pressable
            style={[styles.tab, tab === "join" && styles.tabActive]}
            onPress={() => setTab("join")}
          >
            <Text style={[styles.tabText, tab === "join" && styles.tabTextActive]}>Join</Text>
          </Pressable>
        </View>

        {tab === "create" && (
          <View style={styles.formCard}>
            <View style={styles.inputRow}>
              <Ionicons name="people-outline" size={18} color={green} />
              <TextInput
                style={styles.input}
                placeholder="Family name"
                placeholderTextColor="#aaa"
                value={familyName}
                onChangeText={setFamilyName}
                returnKeyType="done"
              />
            </View>
            <Pressable
              style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.8 }, busy && { opacity: 0.6 }]}
              onPress={createFamily}
              disabled={busy}
            >
              {busy ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Ionicons name="add-circle-outline" size={18} color="white" />
                  <Text style={styles.actionBtnText}>Create Family</Text>
                </>
              )}
            </Pressable>
          </View>
        )}

        {tab === "join" && (
          <View style={styles.formCard}>
            <View style={styles.inputRow}>
              <Ionicons name="key-outline" size={18} color={green} />
              <TextInput
                style={styles.input}
                placeholder="6-digit invite code"
                placeholderTextColor="#aaa"
                value={inviteCode}
                onChangeText={setInviteCode}
                keyboardType="number-pad"
                maxLength={6}
                returnKeyType="done"
              />
            </View>
            <Pressable
              style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.8 }, busy && { opacity: 0.6 }]}
              onPress={joinFamily}
              disabled={busy}
            >
              {busy ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Ionicons name="enter-outline" size={18} color="white" />
                  <Text style={styles.actionBtnText}>Join Family</Text>
                </>
              )}
            </Pressable>
          </View>
        )}
      </View>

      <View style={styles.bottom}>
        <View style={styles.box}>
          <Svg height={180} width={SCREEN_WIDTH} viewBox="0 0 1440 320" preserveAspectRatio="none" style={styles.bottomWavy}>
            <Path
              fill="#7F9C96"
              d="M0,192L80,170.7C160,149,320,107,480,112C640,117,800,171,960,181.3C1120,192,1280,160,1360,144L1440,128L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"
            />
          </Svg>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FamilyDashboard() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [hasFamily, setHasFamily] = useState(false);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [familyName, setFamilyName] = useState("");
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [copied, setCopied] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const fetchFamily = async () => {
    try {
      const user = FIREBASE_auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(FIREBASE_db, "users", user.uid));
      if (!userDoc.exists()) return;

      const { familyId: fid } = userDoc.data();
      if (!fid) { setHasFamily(false); return; }

      const familyDoc = await getDoc(doc(FIREBASE_db, "families", fid));
      if (!familyDoc.exists()) { setHasFamily(false); return; }

      const data = familyDoc.data();
      setFamilyId(fid);
      setFamilyName(data?.name || "Unnamed Family");
      setInviteCode(data?.inviteCode || null);

      const memberIds: string[] = data?.members || [];
      const memberData: Member[] = [];
      for (const uid of memberIds) {
        const mDoc = await getDoc(doc(FIREBASE_db, "users", uid));
        if (mDoc.exists()) {
          const m = mDoc.data();
          memberData.push({ uid, displayName: m.displayName || "Unknown" });
        }
      }

      setMembers(memberData);
      setHasFamily(true);
    } catch (err: any) {
      console.log("Error fetching family:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFamily(); }, []);

  const handleFamilyJoined = () => {
    setLoading(true);
    setHasFamily(false);
    fetchFamily();
  };

  const copyCode = async () => {
    if (!inviteCode) return;
    await Clipboard.setStringAsync(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Leave family ──────────────────────────────────────────────────────────

  const confirmLeave = () => {
    Alert.alert(
      "Leave Family",
      `Are you sure you want to leave "${familyName}"? You'll need a new invite code to rejoin.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Leave", style: "destructive", onPress: leaveFamily },
      ]
    );
  };

  const leaveFamily = async () => {
    const user = FIREBASE_auth.currentUser;
    if (!user || !familyId) return;

    setLeaving(true);
    try {
      await updateDoc(doc(FIREBASE_db, "families", familyId), {
        members: arrayRemove(user.uid),
      });
      await updateDoc(doc(FIREBASE_db, "users", user.uid), {
        familyId: null,
      });

      // Reset state → drops back to Create/Join screen
      setFamilyId(null);
      setFamilyName("");
      setInviteCode(null);
      setMembers([]);
      setHasFamily(false);
    } catch (e) {
      Alert.alert("Error", (e as Error).message);
    } finally {
      setLeaving(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={green} />
      </View>
    );
  }

  if (!hasFamily) {
    return <NoFamilyScreen onFamilyJoined={handleFamilyJoined} />;
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <View style={styles.box}>
          <Svg height={200} width={SCREEN_WIDTH} viewBox="0 0 1440 320" preserveAspectRatio="none">
            <Path
              fill="#7F9C96"
              d="M0,192L60,170.7C120,149,240,107,360,112C480,117,600,171,720,197.3C840,224,960,224,1080,208C1200,192,1320,160,1380,144L1440,128L1440,0L1380,0C1320,0,1200,0,1080,0C960,0,840,0,720,0C600,0,480,0,360,0C240,0,120,0,60,0L0,0Z"
            />
          </Svg>
        </View>
      </View>

      <FlatList
        data={members}
        style={{ flex: 1 }}
        keyExtractor={(item) => item.uid}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <View style={styles.headerBlock}>
              <View style={styles.headerRow}>
                <View>
                  <Text style={styles.familyName}>{familyName}</Text>
                  <Text style={styles.memberCount}>
                    {members.length} {members.length === 1 ? "member" : "members"}
                  </Text>
                </View>

                {/* Leave button */}
                <Pressable
                  style={({ pressed }) => [
                    styles.leaveBtn,
                    pressed && { opacity: 0.75 },
                    leaving && { opacity: 0.5 },
                  ]}
                  onPress={confirmLeave}
                  disabled={leaving}
                >
                  {leaving ? (
                    <ActivityIndicator size="small" color={danger} />
                  ) : (
                    <>
                      <Ionicons name="exit-outline" size={15} color={danger} />
                      <Text style={styles.leaveBtnText}>Leave</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>

            <View style={styles.sectionRow}>
              <Ionicons name="people-outline" size={16} color={dark_green} />
              <Text style={styles.sectionLabel}>Family Members</Text>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.memberRow}>
            <View style={[styles.avatar, { backgroundColor: dark_green }]}>
              <Text style={styles.avatarText}>{getInitials(item.displayName)}</Text>
            </View>
            <Text style={styles.memberName}>{item.displayName}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No members yet.</Text>}
      />

      {inviteCode && (
        <View style={styles.inviteCard}>
          <View style={styles.inviteTop}>
            <Ionicons name="link-outline" size={18} color={dark_green} />
            <Text style={styles.inviteLabel}>INVITE CODE</Text>
          </View>
          <Text style={styles.inviteCode}>{inviteCode}</Text>
          <Pressable
            style={({ pressed }) => [styles.copyBtn, pressed && { opacity: 0.8 }]}
            onPress={copyCode}
          >
            <Ionicons name={copied ? "checkmark-outline" : "copy-outline"} size={16} color="white" />
            <Text style={styles.copyText}>{copied ? "Copied!" : "Copy code"}</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.bottom}>
        <View style={styles.box}>
          <Svg height={180} width={SCREEN_WIDTH} viewBox="0 0 1440 320" preserveAspectRatio="none" style={styles.bottomWavy}>
            <Path
              fill="#7F9C96"
              d="M0,192L80,170.7C160,149,320,107,480,112C640,117,800,171,960,181.3C1120,192,1280,160,1360,144L1440,128L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"
            />
          </Svg>
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const cardShadow = {
  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 4,
  elevation: 3,
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  top: { height: 150, overflow: "hidden" },
  bottom: { width: "100%" },
  box: { backgroundColor: "#7F9C96", height: 20 },
  bottomWavy: { position: "absolute", bottom: 20, width: "100%", zIndex: -1 },

  // No-family screen
  noFamilyContent: { flex: 1, paddingHorizontal: 24, paddingTop: 8 },
  noFamilyTitle: { fontSize: 28, fontWeight: "700", color: "#1a2e28", letterSpacing: -0.5, marginBottom: 6 },
  noFamilySubtitle: { fontSize: 14, color: "#777", marginBottom: 28, lineHeight: 20 },

  tabRow: { flexDirection: "row", backgroundColor: "#f0f5f4", borderRadius: 12, padding: 4, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  tabActive: { backgroundColor: "#ffffff", shadowColor: green, shadowOpacity: 0.15, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 14, fontWeight: "600", color: "#999" },
  tabTextActive: { color: dark_green },

  formCard: { backgroundColor: "#ffffff", borderRadius: 16, padding: 20, borderWidth: 0.5, borderColor: "#d0e3e0", ...cardShadow, gap: 14 },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: "#d0e3e0", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: "#f8fbfa" },
  input: { flex: 1, fontSize: 15, color: "#1a2e28" },
  actionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: green, borderRadius: 12, paddingVertical: 14 },
  actionBtnText: { color: "white", fontSize: 15, fontWeight: "700" },

  // Dashboard header
  listContent: { paddingHorizontal: 24, paddingBottom: 20 },
  headerBlock: { marginBottom: 24 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  familyName: { fontSize: 28, fontWeight: "700", color: "#1a2e28", letterSpacing: -0.5 },
  memberCount: { fontSize: 14, color: green, fontWeight: "500", marginTop: 2 },

  // Leave button
  leaveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#f0d0ce",
    backgroundColor: "#fff5f5",
  },
  leaveBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: danger,
  },

  sectionRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  sectionLabel: { fontSize: 13, fontWeight: "600", color: dark_green, textTransform: "uppercase", letterSpacing: 0.6 },

  memberRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#ffffff", borderRadius: 14, padding: 12, marginBottom: 8, gap: 12, shadowColor: green, shadowOpacity: 0.1, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2 },
  avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  avatarText: { color: "white", fontSize: 14, fontWeight: "700" },
  memberName: { fontSize: 15, fontWeight: "500", color: "#1a2e28" },
  emptyText: { textAlign: "center", color: "#999", marginTop: 20 },

  inviteCard: { marginHorizontal: 86, marginBottom: 150, backgroundColor: "#ffffff", borderRadius: 14, padding: 10, borderWidth: 0.5, borderColor: "#7F9C96", shadowColor: green, shadowOpacity: 0.08, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 3 },
  inviteTop: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8,marginLeft: 4},
  inviteLabel: { fontSize: 12, color: dark_green, fontWeight: "600"},
  inviteCode: { fontSize: 22, fontWeight: "600", color: "#1a2e28",  marginBottom: 10, marginLeft: 4 },
  copyBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: green, borderRadius: 10, paddingVertical: 10 },
  copyText: { color: "white", fontSize: 14, fontWeight: "600" },
});
