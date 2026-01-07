const {db} = require("../firebase/firebaseConfig");
const {GoogleGenerativeAI} = require("@google/generative-ai");
const functions = require("firebase-functions");

const API_KEY = process.env.GEMINI_API_KEY || functions.config().gemini?.key;
if (!API_KEY) throw new Error("Gemini API Key not set!");

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({model: "gemini-2.5-flash-lite"});

// eslint-disable-next-line valid-jsdoc
/**
 * chatbotId로 이번 주 월요일 ~ today까지 수면 데이터 가져와 피드백 생성
 */
async function getWeeklySleepFeedback(chatbotId) {
  try {
    // 오늘
    const today = new Date();
    const dayOfWeek = today.getDay(); // 일요일:0, 월요일:1
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    // eslint-disable-next-line max-len
    const startStr = `${monday.getFullYear()}-${String(monday.getMonth()+1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;
    // eslint-disable-next-line max-len
    const endStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const userSnapshot = await db.collection("users")
        .where("chatbotId", "==", chatbotId)
        .limit(1)
        .get();
    if (userSnapshot.empty) return {message: "사용자 정보 없음", data: null};

    const userId = userSnapshot.docs[0].id;
    const dailyRef = db.collection("sleep_records")
        .doc(userId)
        .collection("daily");

    // 월요일 ~ 오늘 범위의 데이터 가져오기
    const dailySnapshot = await dailyRef
        .where("__name__", ">=", startStr)
        .where("__name__", "<=", endStr)
        .get();

    if (dailySnapshot.empty) {
      return {message: "이번 주 수면 데이터가 없습니다 😢", data: null};
    }

    let totalSleepMinutes = 0;
    let totalDeepSleep = 0;
    let satisfactionSum = 0;
    let count = 0;

    dailySnapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.sleepInfo) { // sleepInfo 있는 날만 계산
        totalSleepMinutes += data.sleepInfo.totalHours ?? 0;
        totalDeepSleep += data.sleepInfo.deepSleep ?? 0;
        if (typeof data.satisfaction === "number") {
          satisfactionSum += data.satisfaction;
        }
        count++;
      }
    });

    // eslint-disable-next-line max-len
    const avgSatisfaction = count > 0 ? (satisfactionSum / count).toFixed(1) : "데이터 없음";

    const summary = `
이번 주 수면 데이터 (${startStr} ~ ${endStr})
총 수면: ${totalSleepMinutes}분
깊은 수면: ${totalDeepSleep}분
평균 만족도: ${avgSatisfaction}
`;

    // Gemini API로 자연스러운 피드백 생성
    const prompt = `
사용자의 이번 주 수면 정보:
${summary}

위 정보를 참고해서 긍정적이고 현실적인 주간 피드백을 100자 이내로 한국어로 작성해줘.
`;

    let feedback;
    try {
      const result = await model.generateContent({
        contents: [{role: "user", parts: [{text: prompt}]}],
      });
      feedback = result.response.text().trim();
    } catch (err) {
      console.error("Gemini API 오류:", err);
      feedback = "이번 주 수면 기록을 기반으로 한 피드백을 생성할 수 없습니다 😢";
    }

    return {
      message: summary + "\n💬 " + feedback,
      data: {totalSleepMinutes, totalDeepSleep, avgSatisfaction, count},
    };
  } catch (error) {
    console.error("주간 수면 피드백 오류:", error);
    return {message: "주간 수면 피드백 생성 중 오류 발생 ⚠️", data: null};
  }
}

module.exports = {getWeeklySleepFeedback};
