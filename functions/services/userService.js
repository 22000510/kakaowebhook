const {db} = require("../firebase/firebaseConfig");

// eslint-disable-next-line require-jsdoc
async function getUserInformation(chatbotId) {
  try {
    // chatbotId로 user 문서 검색
    const usersRef = db.collection("users");
    const userSnapshot = await usersRef
        .where("chatbotId", "==", chatbotId)
        .limit(1)
        .get();
    if (userSnapshot.empty) {
      return {
        message: "사용자 정보가 없습니다 😢",
        data: null,
      };
    }

    const data = userSnapshot.docs[0].data();

    // eslint-disable-next-line max-len
    const {
      nickname,
      sleepStartTime,
      recommendedWakeUpTime,
    } = data;

    const message =
            `👤 사용자 정보
이름: ${nickname || "미입력"}


💤 수면 관련 정보
기상 목표 시간: ${recommendedWakeUpTime || "미입력"}
추천 취침 시간: ${sleepStartTime || "미입력"}`;


    return {
      message,
      data: {
        nickname,
        sleepStartTime,
        recommendedWakeUpTime,
      },
    };
  } catch (error) {
    console.error("사용자 정보 가져오기 오류:", error);
    return {
      message: "사용자 정보를 불러오는 중 오류가 발생했어요 ⚠️",
      data: null,
    };
  }
}

module.exports = {getUserInformation};
