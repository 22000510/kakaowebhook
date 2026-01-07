const express = require("express");
// eslint-disable-next-line new-cap
const router = express.Router();
// Firestore 및 기타 서비스 파일 불러오기
const {db} = require("../firebase/firebaseConfig");

router.post("/", async (req, res) => {
  try {
    const chatbotUserId = req.body.userRequest.user.id;
    const connectCode = req.body.action?.params?.connectCode;
    /* const context = req.body.action?.clientExtra?.contexts || [];
    const awaitingConnect = context.find((c) => c.name === "auth");
    if (!awaitingConnect) {
      return res.json({
        version: "2.0",
        template: {
          outputs: [{simpleText: {text: "인증 모드가 아닙니다. 먼저 '인증하기'를 입력해주세요."}}],
        },
      });
    }*/
    // ✅ 1️⃣ 이미 chatbotUserId가 등록된 사용자 확인
    const existingUser = await db
        .collection("users")
        .where("chatbotId", "==", chatbotUserId)
        .limit(1)
        .get();

    if (!existingUser.empty) {
      // 이미 인증된 사용자
      return res.json({
        version: "2.0",
        template: {
          outputs: [
            {
              simpleText: {
                text: "이미 인증된 사용자입니다 ✅\n앱과 챗봇이 정상적으로 연결되어 있습니다.",
              },
            },
          ],
          quickReplies: [
            // eslint-disable-next-line max-len
            {label: "오늘 수면 확인", action: "message", messageText: "/latest-sleep"},
          ],
        },
      });
    }
    if (!connectCode) {
      return res.json({
        version: "2.0",
        // eslint-disable-next-line max-len
        template: {outputs: [{simpleText: {text: "앱에서 발급받은 인증 코드를 입력해주세요."}}]},
      });
    }

    // Firebase 인증 처리
    const snapshot = await db.collection("users")
        .where("authCode", "==", connectCode)
        .limit(1)
        .get();

    if (snapshot.empty) {
      return res.json({
        version: "2.0",
        // eslint-disable-next-line max-len
        template: {outputs: [{simpleText: {text: "유효하지 않은 코드입니다. '인증하기' 입력 후 다시 입력해주세요."}}]},
      });
    }

    // eslint-disable-next-line max-len
    await snapshot.docs[0].ref.update({chatbotId: chatbotUserId, authCode: null});

    res.json({
      version: "2.0",
      template: {
        outputs: [{simpleText: {text: "앱과 챗봇 연결 완료 ✅"}}],
        context: [], // 연결 후 Context 삭제
        quickReplies: [
          {label: "오늘 수면 확인", action: "message", messageText: "수면 리포트"},
        ],
      },
    });
  } catch (error) {
    console.error("라우터에서 오류 발생:", error);
    const errorResponse = {
      "version": "2.0",
      "template": {
        "outputs": [
          {
            "simpleText": {
              "text": "죄송합니다. 현재 서비스에 문제가 발생했습니다.\n잠시 후 다시 시도해주세요.",
            },
          },
        ],
      },
    };
    res.status(500).json(errorResponse);
  }
});

module.exports = router;
