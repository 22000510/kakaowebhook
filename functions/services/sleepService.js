const {db} = require("../firebase/firebaseConfig");
const {GoogleGenerativeAI} = require("@google/generative-ai");
const {getUserInformation} = require("./userService");

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);
// eslint-disable-next-line max-len
const model = genAI.getGenerativeModel({model: "gemini-2.5-flash-lite"}); // 안정적인 버전 권장

// eslint-disable-next-line require-jsdoc
async function getUserSleepFeedback(chatbotId) {
  try {
    // 1️⃣ chatbotId → userId 찾기
    const userSnapshot = await db
        .collection("users")
        .where("chatbotId", "==", chatbotId)
        .get();

    if (userSnapshot.empty) {
      return {
        needAuth: true,
        message: "인증된 사용자를 찾을 수 없습니다. 인증하기 입력 후 인증 코드를 입력해주세요",
      };
    }

    const userId = userSnapshot.docs[0].id;
    const userInfo = await getUserInformation(chatbotId);
    const userName = userInfo?.data?.nickname || "사용자";
    const today = new Date();
    // eslint-disable-next-line max-len
    const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const dailyDoc = await db
        .collection("sleep_records")
        .doc(userId)
        .collection("daily")
        .doc(todayStr)
        .get();
    // 문서 자체가 없음
    if (!dailyDoc.exists) {
      return {
        message: `오늘(${todayStr}) 수면 기록이 없습니다 😢\nuser name: ${userName}`,
        totalSleepHours: null,
        satisfaction: 0,
      };
    }

    const data = dailyDoc.data();
    if (!data.sleepInfo) {
      return {
        message: `오늘(${todayStr}) 수면 기록이 없습니다 😢\nuser name: ${userName}`,
        totalSleepHours: null,
        satisfaction: data.satisfaction ?? 0,
      };
    }

    const hours = data.sleepInfo?.totalHours ?? 0;
    const deep = data.sleepInfo?.deepSleep ?? 0;
    const satisfaction = data.satisfaction ?? "미입력";

    const formatTime = (time) => {
      const hourPart = Math.floor(time / 60);
      const minutePart = time % 60;
      return {hourPart, minutePart};
    };

    const {hourPart, minutePart} = formatTime(hours);
    const timeStr = `${hourPart}시간 ${minutePart}분`;

    const {hourPart: deepH, minutePart: deepM} = formatTime(deep);
    const deepStr = `${deepH}시간 ${deepM}분`;

    if (data.satisfaction === undefined || data.satisfaction === null) {
      return {
        // eslint-disable-next-line max-len
        message: `오늘(${todayStr}) 수면 만족도 평가가 아직 없습니다. \n'만족도 평가'를 채팅창에 입력하시거나 '만족도평가' 메뉴룰 통해 먼저 입력해주세`,
        totalSleepHours: data.sleepInfo?.totalHours ?? 0,
        satisfaction: null,
      };
    }
    // 생성형 피드백 요청 텍스트 생성
    let prompt = "";
    const hour = Math.floor(hours / 60);
    if (hour >= 8) {
      prompt = "수면 시간이 8시간 이상인 사람에게 해줄 수 있는 긍정적이면서 현실적인 피드백을 200자 이내로 작성해줘.";
    } else if (hour >= 6) {
      // eslint-disable-next-line max-len
      prompt = "수면 시간이 6시간 이상 8시간 미만인 사람에게 해줄 수 있는 긍정적이면서 현실적인 피드백을 200자 이내로 작성해줘.";
    } else if (hour >= 4) {
      // eslint-disable-next-line max-len
      prompt = "수면 시간이 4시간 이상 6시간 미만인 사람에게 해줄 수 있는 긍정적이면서 현실적인 피드백을 200자 이내로 작성해줘.";
    } else {
      // eslint-disable-next-line max-len
      prompt = "수면 시간이 4시간 미만인 사람에게 해줄 수 있는 긍정적이면서 현실적인 피드백을 200자 이내로 작성해줘.";
    }

    let feedback = "";

    try {
      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [{text: prompt}],
          },
        ],
      });

      const response = await result.response;
      feedback = response.text().trim();
    } catch (apiError) {
      console.error("Gemini API 오류:", apiError);
      feedback = "충분히 주무셨어요! 좋은 하루 보내세요 ☀️";
    }
    // eslint-disable-next-line max-len
    const finalFeedback = `총 수면 시간: ${timeStr}\n깊은 수면 시간: ${deepStr}\n수면 만족도: ${satisfaction}/5\n\n💬 ${feedback}`;
    await dailyDoc.ref.update({
      feedback: finalFeedback,
      satisfaction: satisfaction, // ✅ 추가
    });
    return {
      // eslint-disable-next-line max-len
      message: `🛌 ${userName}님의 수면 리포트 (${todayStr})\n\n💬 ${finalFeedback}`,
      totalSleepHours: hours,
      latestDate: todayStr,
      satisfaction: satisfaction,
    };
  } catch (error) {
    console.error("수면 피드백 가져오기 오류:", error);
    return {
      message: "수면 피드백을 불러오는 중 오류가 발생했어요 ⚠️",
      totalSleepHours: null,
    };
  }
}

module.exports = {getUserSleepFeedback};
