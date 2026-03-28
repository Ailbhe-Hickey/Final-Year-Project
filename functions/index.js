const functions = require("firebase-functions/v2");
const firestore = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const fetch = require("node-fetch");
admin.initializeApp();

// ───────────────────────────────────────────────────────────────────

async function getFamilyTokens(patientId) {
  const familyQuery = await admin
    .firestore()
    .collection("families")
    .where("members", "array-contains", patientId)
    .limit(1)
    .get();

  if (familyQuery.empty) return { tokens: [], familyMembers: [] };

  const familyMembers = familyQuery.docs[0].data().members || [];
  const tokens = [];

  for (const memberId of familyMembers) {
    if (memberId === patientId) continue;
    const devicesSnap = await admin
      .firestore()
      .collection("users")
      .doc(memberId)
      .collection("devices")
      .get();
    devicesSnap.forEach((doc) => {
      const token = doc.data().token;
      if (token) tokens.push(token);
    });
  }

  return { tokens, familyMembers };
}

async function sendHelpNotifications(tokens, requestId) {
  if (tokens.length === 0) return;
  const messages = tokens.map((token) => ({
    to: token,
    sound: "default",
    title: "Patient Needs Help",
    body: "Tap to respond",
    data: { requestId },
  }));
  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(messages),
  });
}

// ─── New help request ───────────────────────────────────────────────

exports.notifyCaregivers = firestore.onDocumentCreated(
  "helpRequests/{requestId}",
  async (event) => {
    const requestData = event.data?.data();
    if (!requestData || !requestData.patientId) return;

    const { patientId } = requestData;
    const requestId = event.params.requestId;
    const { tokens, familyMembers } = await getFamilyTokens(patientId);
    if (tokens.length === 0) return;

    // Track which family members have been notified and their responses
    const declineTracker = {};
    familyMembers
      .filter((id) => id !== patientId)
      .forEach((id) => (declineTracker[id] = "pending"));

    // Stamp the request with metadata for timeout/decline tracking
    await admin.firestore().collection("helpRequests").doc(requestId).update({
      notifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      declineTracker,
      resendCount: 0,
    });

    await sendHelpNotifications(tokens, requestId);
  }
);

// ─── Response received (accept or decline) ─────────────────────────

exports.onRequestUpdated = firestore.onDocumentUpdated(
  "helpRequests/{requestId}",
  async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();
    const requestId = event.params.requestId;

    // ── Accepted, notify patient ──────────────────────────────────────────
    if (before.status !== "accepted" && after.status === "accepted") {
      const devicesSnap = await admin
        .firestore()
        .collection("users")
        .doc(after.patientId)
        .collection("devices")
        .get();

      const tokens = [];
      devicesSnap.forEach((doc) => {
        if (doc.data().token) tokens.push(doc.data().token);
      });
      if (tokens.length === 0) return;

      const messages = tokens.map((token) => ({
        to: token,
        sound: "default",
        title: "Help is on the way",
        body: "A caregiver has accepted your request",
      }));
      await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messages),
      });
      return;
    }

    // ── check if all declined ────────────────────
    const trackerChanged =
      JSON.stringify(before.declineTracker) !==
      JSON.stringify(after.declineTracker);

    if (
      trackerChanged &&
      after.status !== "accepted" &&
      after.status !== "cancelled"
    ) {
      const tracker = after.declineTracker || {};
      const allDeclined =
        Object.values(tracker).length > 0 &&
        Object.values(tracker).every((v) => v === "declined");

      if (allDeclined) {
        await resendNotification(requestId, after, "all_declined");
      }
    }
  }
);

// ─── 1 min timeout check ──────────────────────────────────────

exports.checkPendingRequests = onSchedule("every 1 minutes", async () => {
  const cutoff = new Date(Date.now() - 1 * 60 * 1000); // 1 minute ago

  const pendingSnap = await admin
    .firestore()
    .collection("helpRequests")
    .where("status", "==", "pending")
    .where("notifiedAt", "<=", cutoff)
    .get();

  for (const doc of pendingSnap.docs) {
    const data = doc.data();
    const lastSent = data.lastResentAt?.toDate() || data.notifiedAt?.toDate();

    // Only resend if 1 minute since last send attempt
    if (lastSent && new Date() - lastSent >= 1 * 60 * 1000) {
      await resendNotification(doc.id, data, "timeout");
    }
  }
});

// ───  resend  ─────────────────────────────────────────────────────

async function resendNotification(requestId, requestData, reason) {
  const MAX_RESENDS = 2; 
  const resendCount = (requestData.resendCount || 0) + 1;

  if (resendCount > MAX_RESENDS) {
    await admin.firestore().collection("helpRequests").doc(requestId).update({
      status: "failed",
    });
    return;
  }

  const { patientId } = requestData;
  const { tokens, familyMembers } = await getFamilyTokens(patientId);
  if (tokens.length === 0) return;

  // Reset all decline statuses back to pending for the new round
  const freshTracker = {};
  familyMembers
    .filter((id) => id !== patientId)
    .forEach((id) => (freshTracker[id] = "pending"));

  await admin.firestore().collection("helpRequests").doc(requestId).update({
    declineTracker: freshTracker,
    resendCount,
    lastResentAt: admin.firestore.FieldValue.serverTimestamp(),
    lastResendReason: reason, 
  });

  console.log(`Resending request ${requestId} (reason: ${reason}, attempt: ${resendCount})`);
  await sendHelpNotifications(tokens, requestId);
}
