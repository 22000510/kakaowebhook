const express = require("express");
// eslint-disable-next-line new-cap
const router = express.Router();
const {getWeeklySleepFeedback} = require("../services/weeklySleepService");

router.post("/", async (req, res) => {
  try {
    const chatbotId = req.body.userRequest?.user?.id;
    if (!chatbotId) {
      return res.json({
        version: "2.0",
        template: {
          outputs: [
            {
              simpleText: {text: "사용자 정보를 가져올 수 없습니다."},
            },
          ],
        },
      });
    }

    const result = await getWeeklySleepFeedback(chatbotId);
    const responseBody = {
      version: "2.0",
      template: {
        outputs: [
          {
            simpleText: {
              text: result.message,
            },
          },
        ],
      },
    };
    res.json(responseBody);
  } catch (error) {
    console.error("스킬 처리 오류:", error);
    res.status(500).json({
      version: "2.0",
      template: {
        outputs: [
          {
            simpleText: {
              text: "수면 정보를 불러오는 중 오류가 발생했습니다 ⚠️",
            },
          },
        ],
      },
    });
  }
});
module.exports = router;
