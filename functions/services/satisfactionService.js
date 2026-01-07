const {db} = require("../firebase/firebaseConfig");

// eslint-disable-next-line require-jsdoc
async function saveSatisfaction(chatbotUserId, satisfaction) {
  // 🔹 chatbotId로 user 문서 찾기
  const userSnapshot = await db.collection("users")
      .where("chatbotId", "==", chatbotUserId)
      .limit(1)
      .get();

  if (userSnapshot.empty) {
    return {success: false, message: "인증된 사용자를 찾을 수 없습니다."};
  }

  const userDoc = userSnapshot.docs[0];
  const userId = userDoc.id;

  const today = new Date();
  // eslint-disable-next-line max-len
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  // 🔹 수면 문서 업데이트
  const dailyRef = db.collection("sleep_records")
      .doc(userId)
      .collection("daily")
      .doc(todayStr);

  await dailyRef.set({
    satisfaction: satisfaction,
    updatedAt: new Date(),
  }, {merge: true});

  return {success: true, satisfaction};
}

module.exports = {saveSatisfaction};
