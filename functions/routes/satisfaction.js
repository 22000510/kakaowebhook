const express = require("express");
// eslint-disable-next-line new-cap
const router = express.Router();
const {saveSatisfaction} = require("../services/satisfactionService");

// ✅ 라우터는 요청/응답만 담당
router.post("/", async (req, res) => {
  try {
    const chatbotUserId = req.body.userRequest?.user?.id;
    const satisfaction = Number(req.body.action?.params?.satisfaction);

    if (isNaN(satisfaction) || satisfaction < 0 || satisfaction > 5) {
      return res.json({
        version: "2.0",
        template: {
          outputs: [{simpleText: {text: "수면 만족도 점수를 0~5 사이로 입력해주세요."}}],
        },
      });
    }

    // ✅ 서비스 호출
    const result = await saveSatisfaction(chatbotUserId, satisfaction);

    if (!result.success) {
      return res.json({
        version: "2.0",
        template: {
          outputs: [{simpleText: {text: result.message}}],
        },
      });
    }

    // ✅ 성공 응답
    return res.json({
      version: "2.0",
      template: {
        outputs: [
          {
            simpleText: {
              text: `오늘 수면 만족도 점수(${result.satisfaction}/5)가 저장되었습니다 ✅`,
            },
          },
        ],
      },
    });
  } catch (error) {
    console.error("라우터에서 오류 발생:", error);
    res.status(500).json({
      version: "2.0",
      template: {
        outputs: [
          {
            simpleText: {
              text: "죄송합니다. 현재 서비스에 문제가 발생했습니다.\n잠시 후 다시 시도해주세요.",
            },
          },
        ],
      },
    });
  }
});

module.exports = router;
