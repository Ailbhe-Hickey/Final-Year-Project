import { FIREBASE_auth, FIREBASE_db } from "@/firebaseConfig";
import {
  getTimeOfDay,
  Need,
  rankNeeds,
  UserContext,
  UserStatsMap,
} from "@/services/rankingService";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";

export function useRanksNeeds() {
  const [topNeeds, setTopNeeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSelectedNeed, setLastSelectedNeed] = useState<Need | null>(null);

  const userId = FIREBASE_auth.currentUser?.uid;

  // ── Core fetch + rank ────────────────────────────────────────────────────
  // `silent` skips the loading spinner — used for background re-ranks after selection
  const load = async (lastNeed: Need | null = null, silent = false) => {
    if (!userId) return;

    if (!silent) setLoading(true);

    try {
      // Fetch needs
      const needsSnap = await getDocs(collection(FIREBASE_db, "needs"));
      const needs: Need[] = needsSnap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          label: data.label,
          category: data.category,
          emergency: data.emergency,
        };
      });

      // Fetch usage stats
      const usageSnap = await getDocs(
        collection(FIREBASE_db, "users", userId, "needsUsage")
      );
      const userStats: UserStatsMap = {};
      usageSnap.docs.forEach((d) => {
        userStats[d.id] = d.data() as { frequency: number; lastUsed: number };
      });

      // Build context
      const context: UserContext = {
        timeOfDay: getTimeOfDay(),
        lastSelectedNeedCategory: lastNeed?.category ?? null,
      };

      const ranked = rankNeeds(needs, userStats, context, 20);
      setTopNeeds(ranked);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Initial load (shows spinner)
  useEffect(() => {
    if (!userId) return;
    load(null, false);
  }, [userId]);

  // ── Handle selection ─────────────────────────────────────────────────────
  // Updates Firestore stats then silently re-ranks without touching loading state
  const handleNeedSelected = async (need: Need) => {
    if (!userId) return;

    const now = Date.now();
    const needRef = doc(FIREBASE_db, "users", userId, "needsUsage", need.id);
    const snapshot = await getDoc(needRef);

    if (snapshot.exists()) {
      const data = snapshot.data();
      await updateDoc(needRef, {
        frequency: (data.frequency || 0) + 1,
        lastUsed: now,
      });
    } else {
      await setDoc(needRef, { frequency: 1, lastUsed: now });
    }

    setLastSelectedNeed(need);

    // Silent re-rank — carousel stays mounted, no flicker
    await load(need, true);
  };

  return { topNeeds, loading, handleNeedSelected };
}
