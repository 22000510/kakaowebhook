const {db} = require("../firebase/firebaseConfig");
const {getUserInformation} = require("./userService");

// 어제 수면 기록 기반 메시지 조회
// eslint-disable-next-line require-jsdoc
async function getUserMessage(chatbotId) {
  try {
    // 1️⃣ 인증된 사용자 판별
    const userSnapshot = await db
        .collection("users")
        .where("chatbotId", "==", chatbotId)
        .get();

    if (userSnapshot.empty) {
      return {
        needAuth: true,
        message: "등록된 사용자를 찾을 수 없습니다.\n'인증하기'를 먼저 입력해주세요!",
      };
    }

    const userId = userSnapshot.docs[0].id;
    const userInfo = await getUserInformation(chatbotId);
    const userName = userInfo?.data?.nickname || "사용자";

    // 2️⃣ 한국시간(KST) 기준 어제 날짜 계산
    const kstNow = new Date(new Date().getTime() + 9 * 60 * 60 * 1000);
    const yesterday = new Date(kstNow);
    yesterday.setDate(yesterday.getDate() - 1);
    const yyyy = yesterday.getFullYear();
    const mm = String(yesterday.getMonth() + 1).padStart(2, "0");
    const dd = String(yesterday.getDate()).padStart(2, "0");
    const yesterdayStr = `${yyyy}-${mm}-${dd}`;

    // 3️⃣ 어제 데이터 조회
    const dailyDoc = await db
        .collection("sleep_records")
        .doc(userId)
        .collection("daily")
        .doc(yesterdayStr)
        .get();

    if (!dailyDoc.exists) {
      return {
        message: `어제(${yesterdayStr}) ${userName}님의 수면 기록이 없어요 😢\n오늘부터 시작해볼까요?`,
      };
    }

    const {sendMessage, totalSleepHours} = dailyDoc.data();

    // 4️⃣ 저장된 메시지 존재 여부에 따라 분기
    if (!sendMessage) {
      return {
        // eslint-disable-next-line max-len
        message: `어제(${yesterdayStr}) ${userName}님의 저장된 메시지가 없어요.\n수면 시간: ${totalSleepHours ?? "기록 없음"} 💤`,
      };
    }

    // ✅ 정상 저장 메시지 반환
    return {
      // eslint-disable-next-line max-len
      message: `어제(${yesterdayStr}) ${userName}님이 보낸 메시지에요.\n\n "${sendMessage}"`,
      totalSleepHours,
    };
  } catch (error) {
    console.error("getUserMessage 오류:", error);
    return {
      message: "어제 메시지를 불러오는 중 오류가 발생했어요 ⚠️",
    };
  }
}

module.exports = {getUserMessage};
