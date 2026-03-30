// import { FIREBASE_auth, FIREBASE_db } from "@/firebaseConfig";
// import { Ionicons } from '@expo/vector-icons';
// import { useRouter } from "expo-router";
// import { signOut } from "firebase/auth";
// import { doc, onSnapshot } from "firebase/firestore";
// import React, { useEffect, useState } from "react";
// import { ActivityIndicator, Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
// import Svg, { Path } from 'react-native-svg';

// interface UserProfile {
//   displayName: string;
//   email?: string;
//   familyId?: string | null;
//   familyName?: string | null;
// }



// const { width } = Dimensions.get('screen');
// const SAGE = '#7F9C96';
// const SAGE_DARK = '#5f8a7c';
// const SAGE_LIGHT = '#e1f0ed';

// export default function Profile() {
//   // State variables
//   const [userData, setUserData] = useState<UserProfile | null>(null);
//   const [loading, setLoading] = useState(true);

//   // Variables
//   const router = useRouter();
//   const currentUser = FIREBASE_auth.currentUser;

//   // Navigation functions
//   const goToCreateFamily = () => router.push("/family/create");
//   const goToJoinFamily = () => router.push("/family/join");
//   const goToDashboard = () => router.push("/family/dashboard");
//   const goToSettings = () => router.push("/Settings/settingsconfig");

//   // Fetch user data
//   useEffect(() => {
    
//     if (!currentUser) return;

//     const unsubscribe = onSnapshot(
//       doc(FIREBASE_db, "users", currentUser.uid),

//       (docSnap) => {
//         if (docSnap.exists()) {
//           setUserData(docSnap.data() as UserProfile);
//         }
//         setLoading(false);
//       },
//       (error) => {
//         console.log("Error fetching user data:", error);
//         setLoading(false);
//       }
      
//     );

//     return () => unsubscribe();
//   }, []);

//   // Log out user
//   const handleLogout = async () => {

//     try {
//       await signOut(FIREBASE_auth);
//       router.replace("/auth/login");
//     } catch (error: any) {
//       console.log("Logout error:", error.message);
//     }

//   };

//   // If loading, show spinner
//   if (loading) {
//     return (
//       <View>
//         <ActivityIndicator size="large" color="#007AFF" />
//       </View>
//     );
//   }

//   // Main render
//   return (

//     <View style={styles.container}>

//       <View style={styles.top}>
//         <View style={styles.box}>
//           <Svg 
//             height={200}
//             width={Dimensions.get('screen').width}
//             viewBox="0 0 1440 320"
//             preserveAspectRatio="none"
//           >
//             <Path
//               fill="#7F9C96"
//               d='M0,192L60,170.7C120,149,240,107,360,112C480,117,600,171,720,197.3C840,224,960,224,1080,208C1200,192,1320,160,1380,144L1440,128L1440,0L1380,0C1320,0,1200,0,1080,0C960,0,840,0,720,0C600,0,480,0,360,0C240,0,120,0,60,0L0,0Z'
//             />
//           </Svg>
//         </View>
//       </View>


//       {/* Main content */}
//       <View style={styles.content}>

//         <View style={styles.greetingBlock}>
//           <Text style={styles.greeting}>Hi {userData?.displayName || "there"}!</Text>
//           {userData?.familyId && userData?.familyName && (
//             <Text style={styles.greetingSub}>{userData.familyName} family</Text>
//           )}
//         </View>

//         <View style={styles.cardGrid}>

//           {userData?.familyId ? (
//             <Pressable
//               style={({ pressed }) => [styles.card, styles.cardFilled, pressed && styles.cardPressed]}
//               onPress={goToDashboard}
//             >
//               <View style={styles.cardIconWrapFilled}>
//                 <Ionicons name="home" size={26} color="white" />
//               </View>
//               <Text style={styles.cardTextFilled}>Family{'\n'}Dashboard</Text>
//             </Pressable>
//           ) : (
//             <>
//               <Pressable
//                 style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
//                 onPress={goToCreateFamily}
//               >
//                 <View style={styles.cardIconWrap}>
//                   <Ionicons name="add-circle-outline" size={26} color={SAGE_DARK} />
//                 </View>
//                 <Text style={styles.cardText}>Create{'\n'}Family</Text>
//               </Pressable>

//               <Pressable
//                 style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
//                 onPress={goToJoinFamily}
//               >
//                 <View style={styles.cardIconWrap}>
//                   <Ionicons name="people-outline" size={26} color={SAGE_DARK} />
//                 </View>
//                 <Text style={styles.cardText}>Join{'\n'}Family</Text>
//               </Pressable>
//             </>
//           )}

//           <Pressable
//             style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
//             onPress={goToSettings}
//           >
//             <View style={styles.cardIconWrap}>
//               <Ionicons name="settings-outline" size={26} color={SAGE_DARK} />
//             </View>
//             <Text style={styles.cardText}>Settings</Text>
//           </Pressable>

//         </View>
//       </View>


//       {/* <View style={styles.bottom}>
//         <View style={styles.box}>
//           <Svg
//             height={200}
//             width={Dimensions.get('screen').width}
//             viewBox="0 0 1440 320"
//              preserveAspectRatio="none"
//             style={styles.bottomWavy}
//           >
//             <Path
//               fill="#7F9C96"
//               d='M0,64L40,96C80,128,160,192,240,202.7C320,213,400,171,480,149.3C560,128,640,128,720,154.7C800,181,880,235,960,218.7C1040,203,1120,117,1200,74.7C1280,32,1360,32,1400,32L1440,32L1440,320L1400,320C1360,320,1280,320,1200,320C1120,320,1040,320,960,320C880,320,800,320,720,320C640,320,560,320,480,320C400,320,320,320,240,320C160,320,80,320,40,320L0,320Z'
//             />
//           </Svg>
//         </View>
//       </View> */}
//     </View>
//   );
// }

// // Styles


// const styles = StyleSheet.create({
//   container: { flex: 1},

//   center: { flex: 1, justifyContent: "center", alignItems: "center", flexDirection: "row"},
//   title: { fontSize: 26, fontWeight: "bold", marginBottom: 10 , marginLeft: 40},

//   titleContainer: { 
//     justifyContent: "flex-start" },

//   buttonContainer: { 
//     flexWrap: "wrap", 
//     justifyContent: "space-evenly", 
//     flexDirection: "row", 
//     alignItems: "center",
//     marginTop: 50, 
//     gap: 20 },

//   buttonText: {
//     color: "#000000ff",
//     fontWeight: "600",
//     fontSize: 20,
//     textAlign: "center",
//   },

//   logOutButtonText: {
//     color: "#ff0909ff",
//     fontWeight: "600",
//     fontSize: 20,
//     textAlign: "center",
//   },

//   button: {
//     backgroundColor: "#fff",
//     borderRadius: 12,
//     shadowColor: "#000",
//     shadowOpacity: 0.2,
//     shadowOffset: { width: 0, height: 2 },
//     shadowRadius: 4,
//     elevation: 3,
//     alignSelf: "center",
//     height: 140,
//     width: 140,
//     justifyContent: "center",
//     alignItems: "center",
//   },

//   // Wavy Background

//   top: {
//     height: 150,
//     overflow: "hidden",
//   },

//   bottom: {
//     position: 'absolute',
//     width: Dimensions.get('screen').width,
//     bottom: 0,
//   },

//   box: {
//     backgroundColor: '#7F9C96',
//     height: 20,
//   },

//   bottomWavy: {
//     position: 'absolute',
//     bottom: 20,
//     width: Dimensions.get('screen').width
//   },

//     content: {
//     flex: 1,
//     paddingHorizontal: 24,
//   },

//   greetingBlock: {
//     marginTop: 8,
//     marginBottom: 40,
//   },
//   greeting: {
//     fontSize: 28,
//     fontWeight: '700',
//     color: '#1a2e28',
//     letterSpacing: -0.5,
//   },
//   greetingSub: {
//     fontSize: 14,
//     color: SAGE,
//     fontWeight: '500',
//     marginTop: 2,
//   },

//   cardGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 16,
//   },

//   card: {
//     backgroundColor: '#ffffff',
//     borderRadius: 20,
//     width: 150,
//     height: 150,
//     padding: 16,
//     justifyContent: 'space-between',
//     shadowColor: '#7F9C96',
//     shadowOpacity: 0.12,
//     shadowOffset: { width: 0, height: 4 },
//     shadowRadius: 12,
//     elevation: 3,
//   },

//   cardFilled: {
//     backgroundColor: SAGE,
//   },

//   cardPressed: {
//     opacity: 0.85,
//     transform: [{ scale: 0.97 }],
//   },

//   cardIconWrap: {
//     width: 44,
//     height: 44,
//     backgroundColor: SAGE_LIGHT,
//     borderRadius: 12,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },

//   cardIconWrapFilled: {
//     width: 44,
//     height: 44,
//     backgroundColor: 'rgba(255,255,255,0.2)',
//     borderRadius: 12,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },

//   cardText: {
//     fontSize: 15,
//     fontWeight: '600',
//     color: '#1a2e28',
//     lineHeight: 20,
//   },

//   cardTextFilled: {
//     fontSize: 15,
//     fontWeight: '600',
//     color: '#ffffff',
//     lineHeight: 20,
//   },
 
// });
import { FIREBASE_auth, FIREBASE_db } from "@/firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";


interface UserProfile {
  displayName: string;
  email?: string;
  familyId?: string | null;
  role?: string;
}

// A single settings row with an icon, label, and value
function SettingsRow({icon, label, value, badge}: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
    badge?: string;
  }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={light_green} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>

      {badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}

    </View>
  );
}

const green = "#7F9C96";
const dark_green = "#5f8a7c";
const light_green = "#e1f0ed";

export default function settings() {

  // State variables
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
    
  // Variables
  const router = useRouter();
  const currentUser = FIREBASE_auth.currentUser;

  // Fetch user data
  useEffect(() => {
    if (!currentUser) return;
      const unsubscribe = onSnapshot(
      doc(FIREBASE_db, "users", currentUser.uid),
        (docSnap) => {
          if (docSnap.exists()) {
          setUserData(docSnap.data() as UserProfile);
            }
            setLoading(false);
          },
          (error) => {
            console.log("Error fetching user data:", error);
            setLoading(false);
          }
        );
        return () => unsubscribe();
        }, []);

  // Log out user
  const handleLogout = async () => {
    try {
      await signOut(FIREBASE_auth);
      router.replace("/auth/login");
    } catch (error: any) {
      console.log("Logout error:", error.message);
    }
  };
  
  // If loading, show spinner
  if (loading) {
    return (
      <View>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Initials avatar from display name
  const initials = (userData?.displayName || "?")
  .split(" ")
  .map((n) => n[0])
  .join("")
  .toUpperCase()
  .slice(0, 2);

  return (
    <View style={styles.container}>
        <View style={styles.top}>
          <View style={styles.box}>
            <Svg 
              height={200}
              width={Dimensions.get('screen').width}
              viewBox="0 0 1440 320"
              preserveAspectRatio="none"
            >
              <Path
                fill="#7F9C96"
                d='M0,192L60,170.7C120,149,240,107,360,112C480,117,600,171,720,197.3C840,224,960,224,1080,208C1200,192,1320,160,1380,144L1440,128L1440,0L1380,0C1320,0,1200,0,1080,0C960,0,840,0,720,0C600,0,480,0,360,0C240,0,120,0,60,0L0,0Z'
              />
            </Svg>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >

          {/* Avatar + name */}
          <View style={styles.profileBlock}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <Text style={styles.profileName}>{userData?.displayName}</Text>
            <Text style={styles.profileSub}>Family member</Text>
          </View>

          {/* Account section */}
          <Text style={styles.sectionLabel}>Account</Text>
          <View style={styles.card}>
            <SettingsRow
              icon="person-outline"
              label="Username"
              value={userData?.displayName || "—"}
            />
            <View style={styles.divider} />
            <SettingsRow
              icon="mail-outline"
              label="Email"
              value={userData?.email || "—"}
            />
            <View style={styles.divider} />
            <SettingsRow
              icon={userData?.role === 'family' ? 'people-outline' : 'share-social-outline'}
              label="Role"
              value={userData?.role === 'family' ? 'Family' : 'MND'}
            />
          </View>



        </ScrollView>

        {/* Log out */}
          <Pressable
            style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.8 }]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={18} color="#a32d2d" />
            <Text style={styles.logoutText}>Log out</Text>
          </Pressable>

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

const styles = StyleSheet.create({

  // Main container

  container: { 
    flex: 1,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f8f5",
  },
  

  // SVG styles

  top: {
    height: 150,
    overflow: "hidden",
  },

  bottom: {
    position: "absolute",
    width: Dimensions.get("screen").width,
    bottom: 0,
  },

  box: {
    backgroundColor: "#7F9C96",
    height: 20,
    zIndex: -1
  },

  bottomWavy: {
    position: "absolute",
    bottom: 20,
    width: "100%",
    zIndex: -1
    
  },

  // Scroll
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 160,
  },

  // Avatar + profile header
  profileBlock: {
    alignItems: "center",
    marginBottom: 28,
  },

  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: green,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  avatarText: {
    color: "white",
    fontSize: 22,
    fontWeight: "700",
  },

  profileName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a2e28",
  },

  profileSub: {
    fontSize: 13,
    color: green,
    fontWeight: "500",
    marginTop: 2,
  },

  // Section labels
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: dark_green,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },

  // Card
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: green,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
  },

  // Row
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },

  rowIcon: {
    width: 36,
    height: 36,
    backgroundColor: dark_green,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  rowText: {
    flex: 1,
  },

  rowLabel: {
    fontSize: 11,
    color: dark_green,
    fontWeight: "500",
    marginBottom: 2,
  },

  rowValue: {
    fontSize: 15,
    color: "#1a2e28",
    fontWeight: "500",
  },

  divider: {
    height: 0.5,
    backgroundColor: "#e8eeec",
    marginLeft: 62,
  },


  // Badge
  badge: {
    backgroundColor: light_green,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },

  badgeText: {
    fontSize: 11,
    color: dark_green,
    fontWeight: "600",
  },


  // Logout
  logoutBtn: {
    marginHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: "#f7c1c1",
    paddingVertical: 14,
    shadowColor: "#e24b4a",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
    position: "absolute",
    bottom: 160,
    left: 24,
    right: 24,
  },

  logoutText: {
    color: "#a32d2d",
    fontSize: 15,
    fontWeight: "600",
  },

});