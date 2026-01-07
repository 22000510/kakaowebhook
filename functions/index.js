/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {setGlobalOptions} = require("firebase-functions");
const functions = require("firebase-functions");
/** const admin = require("firebase-admin");*/
setGlobalOptions({maxInstances: 10});

const express = require("express");
const cors = require("cors");
// const bodyParser = require("body-parser");

const sleepRouter = require("./routes/sleepFeedback");
const weeklySleepRouter = require("./routes/weeklySleepFeedback");
const welcomeRouter = require("./routes/welcome");
const connectRouter = require("./routes/connect");
const satisfactionRouter = require("./routes/satisfaction");
const checkMessageRouter = require("./routes/checkMessage");
const pullbackRouter = require("./routes/pullback");
/** const {onSchedule} = require("firebase-functions/scheduler");
const {response} = require("express");*/

const app = express();

app.use((req, res, next) => {
  if (req.headers["content-type"]) {
    req.headers["content-type"] = req.headers["content-type"]
        .split(",")[0] // 제일 앞만 사용
        .trim();
  }
  next();
});

// ✅ 2. JSON / URL Encoded 파서
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// ✅ 3. CORS 설정
app.use(cors({
  origin: ["https://api-y4gm6mdiua-uc.a.run.app"],
}));

app.use("/api/sleep", sleepRouter);
app.use("/api/weeklySleep", weeklySleepRouter);
app.use("/api/welcome", welcomeRouter);
app.use("/api/auth", connectRouter);
app.use("/api/satisfaction", satisfactionRouter);
app.use("/api/checkMessage", checkMessageRouter);
app.use("/api/pullback", (req, res, next) => {
  console.log("📩 raw body check:", req.body?.toString?.());
  console.log("📩 parsed body keys:", Object.keys(req.body || {}));
  next();
}, pullbackRouter);

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({error: "서버 처리 중 오류가 발생했습니다."});
});

exports.api = functions.https.onRequest(app);
/**
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();
*/
/**
 * 특정 시간에서 분을 빼는 함수
 * @param {string} time HH:MM 문자열
 * @param {number} minutes 뺄 분
 * @return {string} HH:MM 문자열 반환
 */
/**
function subtractMinutes(time, minutes) {
  const [hour, minute] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hour);
  date.setMinutes(minute);
  date.setSeconds(0);
  date.setMilliseconds(0);
  date.setTime(date.getTime() - minutes * 60000);
  return date.toTimeString().substring(0, 5);
}

// eslint-disable-next-line max-len
exports.sendSleepReminder = onSchedule({ // 👈 v2 onSchedule로 변경
  schedule: "every 40 minutes", // 스케줄 정의
  timeZone: "Asia/Seoul", // 시간대 정의
}, async (event) => {
  // ✅ KST 시간 계산 로직으로 수정
  const now = new Date();
  // 1. Intl.DateTimeFormat을 사용하여 KST 시간 문자열을 정확히 얻음
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  });
  const currentTime = formatter.format(now).replace(/\s/g, "");
  console.log(`⏱ 현재 시간 : ${currentTime}`);

  const targetSleepTime = subtractMinutes(currentTime, -30);
  console.log(`🔍 조회할 시간 (현재 시각 + 30분): ${targetSleepTime}`);

  const usersSnapshot = await db.collection("users")
      .where("sleepStartTime", "==", targetSleepTime)
      .get();

  if (usersSnapshot.empty) {
    console.log("⚠️ 알림 보낼 사용자 없음");
    return null;
  }

  console.log(`📌 ${usersSnapshot.size}명에게 알림 전송 시도`);

  const kakaoEventUrl = "https://api.kakao.com/v2/bot/event";

  const tasks = usersSnapshot.docs.map(async (doc) => {
    const user = doc.data();
    if (!user.chatbotId) return;

    const payload = {
      userId: user.chatbotId,
      event: "sendMessage",
      template: {
        outputs: [
          {
            simpleText: {
              text: `⏰ 취침 30분 전이에요!\n편안한 수면을 위한 준비 해볼까요? 😊`,
            },
          },
        ],
        quickReplies: [
          {
            label: "수면 환경 체크",
            action: "message",
            messageText: "수면 환경 체크",
          },
        ],
      },
    };
    try {
      await fetch(kakaoEventUrl, {
        method: "POST",
        headers: {
          "Authorization": `KakaoAK ${process.env.KAKAO_ADMIN_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorText = await response.text();
        // eslint-disable-next-line max-len
        console.error(`❌ Kakao API 통신 오류: 상태 코드
${response.status}. 응답:`, errorText);
        // 401(인증), 400(요청 형식), 403(권한) 등의 코드가 찍힐 것임
        return;
      }
    } catch (error) {
      // 💡 DNS나 TLS 등 네트워크 연결 자체의 오류가 발생했을 때 로깅
      console.error(`❌ 심각한 네트워크 오류 (DNS/TLS 등):`, error);
    }

    console.log(`✅ Sleep Reminder Sent: ${user.chatbotId}`);
    console.log(`✅ Sleep Reminder Sent: ${user.chatbotId}`);
  });

  await Promise.all(tasks);
  return true;
});
*/
