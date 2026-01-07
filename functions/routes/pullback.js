const express = require("express");
const {GoogleGenerativeAI} = require("@google/generative-ai");
const {getUserInformation} = require("../services/userService");
const functions = require("firebase-functions");
const {getUserSleepFeedback} = require("../services/sleepService");
// eslint-disable-next-line new-cap
const router = express.Router();

// eslint-disable-next-line max-len
const API_KEY = process.env.GEMINI_API_KEY||functions.config().gemini?.key; // 환경 변수에서 API 키 가져오기
if (!API_KEY) throw new Error("Gemini API Key not set!");
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({model: "gemini-2.5-flash-lite"});

router.post("/", async (req, res) => {
  console.log("Request headers:", req.headers);
  console.log("Request method:", req.method);
  console.log("req.body:", req.body);
  try {
    const userMessage = req.body.userRequest?.utterance;
    const chatbotId = req.body.userRequest?.user?.id;
    // 발화가 없을 경우를 대비한 예외 처리
    if (!userMessage) {
      return res.status(400).json({
        "version": "2.0",
        "template": {
          "outputs": [
            {
              "simpleText": {
                "text": "메시지를 찾을 수 없습니다.",
              },
            },
          ],
        },
      });
    }
    if (!chatbotId) {
      console.warn("chatbotId 없음: userRequest.user.id 필드가 비어있습니다.");
      return res.status(400).json({
        version: "2.0",
        template: {
          outputs: [
            {
              simpleText: {
                text: "사용자 식별 정보를 찾을 수 없습니다 😢",
              },
            },
          ],
        },
      });
    }
    const userInfo = await getUserInformation(chatbotId);
    console.log("userInfo result:", userInfo);
    // ✅ Firestore에 해당 chatbotId의 데이터가 없을 경우
    if (!userInfo.data) {
      return res.json({
        version: "2.0",
        template: {
          outputs: [
            {
              simpleText: {
                text: "🔒 인증 후 챗봇을 사용해주세요.\n\n👉 카카오톡에서 '인증하기' 입력 후 " +
                    "\n 앱에서 받은 인증번호 입력해 주세요!",
              },
            },
          ],
        },
      });
    }
    const sleepFeedback = await getUserSleepFeedback(chatbotId);
    // eslint-disable-next-line max-len
    const sleepInfoSummary = `${sleepFeedback.latestDate} 기준 총 수면: ${sleepFeedback.totalSleepHours}분, 수면 만족도: ${sleepFeedback.satisfaction}/5점`;

    // Gemini API 호출
    // eslint-disable-next-line max-len
    const prompt = `
사용자의 최근 수면 정보: ${sleepInfoSummary}
사용자 발화: ${userMessage}

위 정보를 참고해서 수면 관련 피드백이 들어 있게 한국어로 300자 이내로 자연스럽게 답변해줘.
`;

    const result = await model.generateContent({
      contents: [
        {role: "user", parts: [{text: prompt}]}],
    });
    const reply = result.response.text().trim();
    const responseBody = {
      version: "2.0",
      template: {
        outputs: [
          {
            simpleText: {
              text: reply,
            },
          },
        ],
      },
    };

    res.json(responseBody);
    // 카카오 챗봇 응답 형식에 맞춰 반환
  } catch (error) {
    console.error("서버 에러:", error);
    res.status(500).json({
      "version": "2.0",
      "template": {
        "outputs": [
          {
            "simpleText": {
              "text": "죄송합니다. 서버 처리 중 오류가 발생했습니다.",
            },
          },
        ],
      },
    });
  }
});

module.exports = router;
