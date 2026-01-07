const express = require("express");
const {getUserMessage} = require("../services/messageService");
// eslint-disable-next-line new-cap
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const chatbotId = req.body.userRequest?.user?.id;
    if (!chatbotId) {
      return res.json({
        version: "2.0",
        template: {
          outputs: [
            {
              simpleText: {text: "사용자 정보를 가져올 수 없습니다. '인증하기' 입력하여 인증 후 사용해주세요"},
            },
          ],
        },
      });
    }
    const result = await getUserMessage(chatbotId);
    if (result.needAuth) {
      return res.json({
        version: "2.0",
        template: {
          outputs: [
            {
              simpleText: {text: result.message},
            },
          ],
          quickReplies: [
            {label: "인증하기", action: "message", messageText: "인증하기"},
          ],
        },
      });
    }
    if (!result.message) {
      return res.json({
        version: "2.0",
        template: {
          outputs: [
            {
              simpleText: {
                text: "아직 저장된 메시지가 없어요! 😅\n" +
                    "오늘은 어플에서 내일의 나에게 메세지를 남겨봐요!!",
              },
            },
          ],
        },
      });
    }

    res.json({
      version: "2.0",
      template: {
        // eslint-disable-next-line max-len
        outputs: [{simpleText: {text: `어제의 내가 보내는 메세지 입니다.\n${result.message}`}}],
        context: [], // 연결 후 Context 삭제
      },
    });
  } catch (error) {
    console.error("스킬 처리 오류:", error);
    res.status(500).json({
      version: "2.0",
      template: {
        outputs: [
          {
            simpleText: {
              text: "메세지를 불러오는 중 오류가 발생했습니다 ⚠️",
            },
          },
        ],
      },
    });
  }
});

module.exports = router;
