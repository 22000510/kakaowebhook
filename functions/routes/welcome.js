const express = require("express");
// eslint-disable-next-line new-cap
const router = express.Router();
const {getUserInformation} = require("../services/userService");
// async 함수는 항상 try...catch 블록으로 감싸는 것이 좋습니다.
router.post("/", async (req, res) => {
  try {
    const chatbotUserId = req.body.userRequest?.user?.id;

    const userResult = await getUserInformation(chatbotUserId);

    let responseText = "";
    const quickReplies = [];

    if (!userResult.data) {
      // ✅ 미인증 사용자 응답
      responseText =
          "Sleep Manager에 오신 것을 환영합니다 😴\n\n" +
          "앱과 챗봇이 아직 연결되지 않았어요!\n" +
          "아래 버튼을 눌러 '인증하기'를 진행해주세요.";

      quickReplies.push({
        label: "인증하기",
        action: "message",
        messageText: "인증하기",
      });
    } else {
      // ✅ 인증된 사용자 응답
      const nickname = userResult.data.nickname || "사용자";
      responseText =
          // eslint-disable-next-line max-len
          `앱과 연결 완료! 😎\n${nickname}님, 반가워요!\n\n 제가 수면 매니저로서 많은 도움을 드릴 수 있도록 할게요!!\n 언제든 불러주세요!`;
    }

    const responseBody = {
      version: "2.0",
      template: {
        outputs: [
          {
            simpleText: {text: responseText},
          },
        ],
        quickReplies,
      },
    };

    res.status(200).json(responseBody);
  } catch (error) {
    console.error("웰컴 메시지 처리 오류:", error);
    res.status(500).json({
      version: "2.0",
      template: {
        outputs: [
          {
            simpleText: {
              text: "서비스 오류가 발생했습니다 ⚠️\n잠시 후 다시 시도해주세요.",
            },
          },
        ],
      },
    });
  }
});

module.exports = router;
