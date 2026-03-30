import { FIREBASE_auth, FIREBASE_db } from "@/firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { collection, doc, getDoc, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, FlatList, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";


const green = "#7F9C96";
const dark_green = "#5f8a7c";
const light_green = "#eef4f3";
const { width: SCREEN_WIDTH } = Dimensions.get("screen");


interface HelpRequest {
  id: string;
  needId: string;
  needLabel?: string;
  status: "pending" | "accepted" | "declined" | "cancelled";
  acceptedBy: string | null;
  acceptedByName?: string | null;
  createdAt: any;
}


function formatTime(ts: any): string {
  if (!ts) return "";
  const date: Date = ts.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString("en-IE", { day: "numeric", month: "short" });
}

function statusConfig(status: HelpRequest["status"]) {
  switch (status) {
    case "accepted":
      return {
        label: "Accepted",
        color: dark_green,
        bg: light_green,
        icon: "checkmark-circle-outline" as const,
      };
    case "pending":
      return { label: "Pending", color: "#b07d2e", bg: "#fdf6ea", icon: "time-outline" as const };
    case "declined":
      return { label: "Declined", color: "#a32d2d", bg: "#fff0f0", icon: "close-circle-outline" as const };
    default:
      return { label: "Cancelled", color: "#999", bg: "#f5f5f5", icon: "remove-circle-outline" as const };
  }
}


function RequestCard({ item }: { item: HelpRequest }) {
  const { label, color, bg, icon } = statusConfig(item.status);

  return (
    <View style={styles.card}>
      <View style={[styles.cardAccent, { backgroundColor: color }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <Text style={styles.needLabel}>{item.needLabel ?? item.needId}</Text>
          <Text style={styles.timeText}>{formatTime(item.createdAt)}</Text>
        </View>
        <View style={styles.cardBottom}>
          <View style={[styles.statusChip, { backgroundColor: bg }]}>
            <Ionicons name={icon} size={13} color={color} />
            <Text style={[styles.statusText, { color }]}>{label}</Text>
          </View>
          {item.status === "accepted" && item.acceptedByName && (
          <View style={styles.acceptedRow}>
            <Ionicons name="person-outline" size={12} color="#999" />
            <Text style={styles.acceptedText}>{item.acceptedByName}</Text>
          </View>
          )}
        </View>
      </View>
    </View>
  );
}


export default function CarerHomeScreen() {
  const [patientName, setPatientName] = useState<string | null>(null);
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for Firebase auth to initialize
    const unsubAuth = FIREBASE_auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        console.log("No logged-in user");
        setLoading(false);
        return;
      }

      try {
        // 1. Get current user doc
        const userSnap = await getDoc(doc(FIREBASE_db, "users", currentUser.uid));
        if (!userSnap.exists()) {
          console.log("User doc not found");
          setLoading(false);
          return;
        }

        const { familyId } = userSnap.data();
        if (!familyId) {
          console.log("No familyId found");
          setLoading(false);
          return;
        }

        // 2. Get family doc
        const familySnap = await getDoc(doc(FIREBASE_db, "families", familyId));
        if (!familySnap.exists()) {
          console.log("Family doc not found");
          setLoading(false);
          return;
        }

        const memberIds: string[] = familySnap.data()?.members ?? [];
        let patientId: string | null = null;

        for (const uid of memberIds) {
          const mSnap = await getDoc(doc(FIREBASE_db, "users", uid));
          if (mSnap.exists() && mSnap.data()?.role === "mnd") {
            patientId = uid;
            setPatientName(mSnap.data()?.displayName ?? "Your family member");
            break;
          }
        }

        if (!patientId) {
          console.log("No patient found in family");
          setLoading(false);
          return;
        }

        // 3. Subscribe to helpRequests
        const q = query(
          collection(FIREBASE_db, "helpRequests"),
          where("patientId", "==", patientId),
          orderBy("createdAt", "desc")
        );

        const unsubSnap = onSnapshot(q, async (snap) => {
          try {
            const raw: HelpRequest[] = snap.docs.slice(0, 20).map((d) => ({
              id: d.id,
              ...(d.data() as Omit<HelpRequest, "id">),
            }));

            const enriched = await Promise.all(
              raw.map(async (r) => {
                if (r.needId) {
                  const nSnap = await getDoc(doc(FIREBASE_db, "needs", r.needId));
                  if (nSnap.exists()) r.needLabel = nSnap.data()?.label;
                }
                if (r.acceptedBy) {
                  const aSnap = await getDoc(doc(FIREBASE_db, "users", r.acceptedBy));
                  if (aSnap.exists()) r.acceptedByName = aSnap.data()?.displayName;
                }
                return r;
              })
            );

            setRequests(enriched);
          } catch (e) {
            console.log("Error enriching requests:", e);
          } finally {
            setLoading(false);
          }
        });

        // Cleanup snapshot on unmount
        return () => unsubSnap();
      } catch (e) {
        console.log("CarerHomeScreen error:", e);
        setLoading(false);
      }
    });

    return () => unsubAuth();
  }, []);

  //  Greeting 
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";


  return (
    <View style={styles.container}>

      <View style={styles.top}>
        <View style={styles.box}>
          <Svg height={200} width={SCREEN_WIDTH} viewBox="0 0 1440 320" preserveAspectRatio="none">
            <Path
              fill={green}
              d="M0,192L60,170.7C120,149,240,107,360,112C480,117,600,171,720,197.3C840,224,960,224,1080,208C1200,192,1320,160,1380,144L1440,128L1440,0L1380,0C1320,0,1200,0,1080,0C960,0,840,0,720,0C600,0,480,0,360,0C240,0,120,0,60,0L0,0Z"
            />
          </Svg>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={green} />
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          style={{ flex: 1 }}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <>
              <View style={styles.headerBlock}>
                <Text style={styles.greeting}>{greeting}</Text>
                {patientName && (
                  <Text style={styles.subGreeting}>
                    Here's how <Text style={styles.patientName}>{patientName}</Text> has been doing
                  </Text>
                )}
              </View>
              <View style={styles.sectionRow}>
                <Ionicons name="list-outline" size={15} color={dark_green} />
                <Text style={styles.sectionLabel}>Recent Requests</Text>
              </View>
            </>
          }
          renderItem={({ item }) => <RequestCard item={item} />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="checkmark-done-outline" size={36} color={green} />
              <Text style={styles.emptyTitle}>All quiet</Text>
              <Text style={styles.emptyText}>
                No help requests yet. They'll appear here when {patientName ?? "your family member"} needs something.
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <View style={styles.bottom}>
        <View style={styles.box}>
          <Svg
            height={180}
            width={Dimensions.get('screen').width}
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
            style={styles.bottomWavy}
          >
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

// --- Styles ------------------------------------------------------------------------------------------------------------------------------

const styles = StyleSheet.create({

  // containers
  container: { 
    flex: 1, 
  },

  center: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center" 
  },

  // waves
  top: { 
    height: 150, 
    overflow: "hidden" 
  },

  bottom: { 
    position: "absolute", 
    width: SCREEN_WIDTH, 
    bottom: 0
  },

  box: { 
    backgroundColor: green, 
    height: 20 
  },

  bottomWavy: { 
    position: "absolute", 
    bottom: 20, 
    width: "100%" 
  },

  // summary
  listContent: { 
    paddingHorizontal: 24, 
    paddingBottom: 160 
  },

  headerBlock: { 
    marginBottom: 24 
  },

  greeting: { 
    fontSize: 32, 
    fontWeight: "700", 
    color: "#1a2e28", 
    marginBottom: 4 
  },

  subGreeting: { 
    fontSize: 14, 
    color: "#777", 
    lineHeight: 20 
  },

  patientName: { 
    fontWeight: "700", 
    color: dark_green 
  },

  sectionRow: { 
    flexDirection: "row", 
    alignItems: "center",
    gap: 6, 
    marginBottom: 12 
  },

  sectionLabel: { 
    fontSize: 13, 
    fontWeight: "600", 
    color: dark_green, 
  },

  card: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    marginBottom: 10,
    overflow: "hidden",
    shadowColor: green,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },

  cardAccent: { 
    width: 4 
  },

  cardBody: { 
    flex: 1, 
    padding: 14, 
    gap: 8 
  },

  cardTop: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between" 
  },

  needLabel: { 
    fontSize: 16, 
    fontWeight: "600", 
    color: "#1a2e28" 
  },

  timeText: { 
    fontSize: 12, 
    color: "#aaa", 
    fontWeight: "500" 
  },

  cardBottom: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 10 
  },

  statusChip: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 4, 
    paddingHorizontal: 8, 
    paddingVertical: 3, 
    borderRadius: 6 
  },

  statusText: { 
    fontSize: 12, 
    fontWeight: "600" 
  },

  acceptedRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 4 
  },

  acceptedText: { 
    fontSize: 12, 
    color: "#999", 
    fontWeight: "500" 
  },

  emptyBox: { 
    alignItems: "center", 
    paddingVertical: 48, 
    gap: 10 
  },

  emptyTitle: { 
    fontSize: 18, 
    fontWeight: "700", 
    color: "#1a2e28" 
  },

  emptyText: { 
    fontSize: 14, 
    color: "#aaa", 
    textAlign: "center", 
    lineHeight: 20, 
    paddingHorizontal: 16 
  },
});