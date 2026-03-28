import { PatientRequestBanner } from "@/components/mnd_request_modal";
import NeedsCarousel from "@/components/neeedsCarousel";
import { FIREBASE_auth, FIREBASE_db } from "@/firebaseConfig";
import { useRanksNeeds } from "@/hooks/useRanksNeeds";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Dimensions, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

// --- Constants ------------------------------------------------------------------------------------------------------------------------------
const green = "#7F9C96";
const dark_green = "#5f8a7c";
const { width: SCREEN_WIDTH } = Dimensions.get("screen");

export default function HomeScreen() {
  const { topNeeds, loading, handleNeedSelected } = useRanksNeeds();
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedNeed, setSelectedNeed] = useState<any | null>(null);
  const [mode, setMode] = useState<"tts" | "request">("tts");

  const flatListRef = useRef<Animated.FlatList<any>>(null);
  const selectedNeedRef = useRef(selectedNeed);
  const modeRef = useRef(mode);
  const topNeedsRef = useRef(topNeeds);

  useEffect(() => { selectedNeedRef.current = selectedNeed; }, [selectedNeed]);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { topNeedsRef.current = topNeeds; }, [topNeeds]);

  // Center on load
  useEffect(() => {
    if (topNeeds.length > 0) {
      setCurrentIndex(Math.floor(topNeeds.length / 2));
    }
  }, [topNeeds]);

  // Help Request
  const sendHelpRequest = useCallback(async (need: any) => {
    const userId = FIREBASE_auth.currentUser?.uid;
    if (!userId) return;

    const ref = await addDoc(collection(FIREBASE_db, "helpRequests"), {
      patientId: userId,
      needId: need.id,
      status: "pending",
      acceptedBy: null,
      createdAt: serverTimestamp(),
    });

    setActiveRequestId(ref.id);
  }, []);

  // Text To Speech
  const speakNeed = useCallback((need: any) => {
    Speech.speak(need.label);
  }, []);

  const handleSelect = useCallback(
    (need: any) => {
      const currentMode = modeRef.current;
      if (currentMode === "tts") {
        speakNeed(need);
        handleNeedSelected(need);
      }
      if (currentMode === "request") {
        sendHelpRequest(need);
      }
    },
    [speakNeed, handleNeedSelected, sendHelpRequest]
  );

  const handleSelectRef = useRef(handleSelect);
  useEffect(() => { handleSelectRef.current = handleSelect; }, [handleSelect]);

  // WebSocket
  useEffect(() => {
    const ws = new WebSocket("ws://192.168.0.214:8080");

    ws.onopen = () => console.log("Connected");

    ws.onmessage = (event) => {
      const message = event.data as string;
      const needs = topNeedsRef.current;
      if (!needs.length) return;

      if (message === "LEFT") {
        setCurrentIndex((prev) => Math.max(prev - 1, 0));
        return;
      }
      if (message === "RIGHT") {
        setCurrentIndex((prev) => Math.min(prev + 1, needs.length - 1));
        return;
      }
      if (message === "UP") {
        setMode((prev) => (prev === "tts" ? "request" : "tts"));
        return;
      }
      if (message === "SELECT") {
        const need = selectedNeedRef.current;
        if (need) {
          handleSelectRef.current(need);
        } else {
          console.warn("SELECT received but no need is selected");
        }
        return;
      }
      console.log("Unknown message:", message);
    };

    ws.onerror = (e) => console.error("Error:", (e as any).message);
    ws.onclose = (e) => console.log("Closed code:", e.code, "reason:", e.reason);

    return () => ws.close();
  }, [topNeeds.length]);

  if (loading) return null;

  const isTTS = mode === "tts";

  //  Greeting 
  const hour = new Date().getHours();
  const greeting =
  hour < 12 ? "Good morning!" : hour < 18 ? "Good afternoon!" : "Good evening!";


  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <View style={styles.box}>
          <Svg
            height={200}
            width={SCREEN_WIDTH}
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
          >
            <Path
              fill="#7F9C96"
              d="M0,192L60,170.7C120,149,240,107,360,112C480,117,600,171,720,197.3C840,224,960,224,1080,208C1200,192,1320,160,1380,144L1440,128L1440,0L1380,0C1320,0,1200,0,1080,0C960,0,840,0,720,0C600,0,480,0,360,0C240,0,120,0,60,0L0,0Z"
            />
          </Svg>
        </View>
      </View>


      <View style={styles.headerBlock}>
        <Text style={styles.greeting}>{greeting}</Text>
      </View>


      <View style={styles.tabRow}>
        <View style={[styles.tab, isTTS && styles.tabActive]}>
          <Ionicons name="volume-high-outline" size={20} color={isTTS ? dark_green : "#999"} />
          <Text style={[styles.tabText, isTTS && styles.tabTextActive]}>Speak</Text>
        </View>
        <View style={[styles.tab, !isTTS && styles.tabActive]}>
          <Ionicons name="alert-outline" size={20} color={!isTTS ? dark_green : "#999"} />
          <Text style={[styles.tabText, !isTTS && styles.tabTextActive]}>Request Help</Text>
        </View>
      </View>

      
      <View style={styles.content}>
        <NeedsCarousel
          data={topNeeds}
          currentIndex={currentIndex}
          setCurrentIndex={setCurrentIndex}
          flatListRef={flatListRef}
          onSelect={(need) => setSelectedNeed(need)}
        />
      </View>


      <PatientRequestBanner
        requestId={activeRequestId}
        onDismiss={() => setActiveRequestId(null)}
      />


      <View style={styles.bottom}>
        <View style={styles.box}>
          <Svg
            height={180}
            width={SCREEN_WIDTH}
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

  // Containers
  container: { 
    flex: 1 
  },

  content: {
    flex: 1,
    justifyContent: "center",
    paddingBottom: 350,
  },

  // Waves
  top: { 
    height: 150, 
    overflow: "hidden"
  },

  bottom: {
    position: "absolute",
    width: SCREEN_WIDTH,
    bottom: 0,
  },

  box: { 
    backgroundColor: "#7F9C96", 
    height: 20 
  },

  bottomWavy: {
    position: "absolute",
    bottom: 20,
    width: SCREEN_WIDTH,
    zIndex: -1,
  },

  // Header
  headerBlock: {
    paddingHorizontal: 24,
    marginTop: 8,
    marginBottom: 12,
  },

  greeting: { 
    fontSize: 32, 
    fontWeight: "700", 
    color: "#1a2e28",  
    marginBottom: 10 
  },


  // Mode switcher 
  tabRow: {
    flexDirection: "row",
    backgroundColor: "#f0f5f4",
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 60,
    marginBottom: 12,
  },

  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },

  tabActive: {
    backgroundColor: "#ffffff",
    shadowColor: green,
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },

  tabText: { 
    fontSize: 14, 
    fontWeight: "600",
    color: "#999" 
  },

  tabTextActive: { 
    color: dark_green 
  },

});