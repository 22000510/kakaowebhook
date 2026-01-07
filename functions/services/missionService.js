const {db} = require("../firebase/firebaseConfig");

// eslint-disable-next-line require-jsdoc
async function getUserSleepMission(userId) {
  try {
    const sleepRecordsRef = db
        .collection("users")
        .doc("test_user_123")
        .collection("sleepRecords");

    // eslint-disable-next-line max-len
    const snapshot = await sleepRecordsRef.orderBy("savedAt", "desc").limit(1).get();

    if (snapshot.empty) {
      return {
        message: "수면 기록이 없습니다 😢",
        totalSleepHours: null,
      };
    }

    const data = snapshot.docs[0].data();
    const hours = data.totalHours;

    const hourPart = Math.floor(hours);
    const minutePart = Math.round((hours - hourPart) * 60);
    const timeStr = `${hourPart}시간 ${minutePart}분`;

    let feedback = "";
    if (hours >= 8) {
      // eslint-disable-next-line max-len
      feedback = `${timeStr} 오늘은 수면이 충분했어요! 어제와 동일한 시간에 자보는 것은 어떨까요? 규칙적인 생활이 중요해요!`;
    } else if (hours >= 6) {
      feedback = "오늘은 자기 전에 따뜻한 물에 샤워를 하고 자보는게 어떨까요? 잠이 더 잘 올거에요!";
    } else {
      feedback = "수면 시간이 너무 짧았어요! 오늘은 운동 1시간 목표로 해서 잠이 더 잘 오게 해봐요!";
    }

    return {
      message: `${feedback}`,
      totalSleepHours: hours,
    };
  } catch (error) {
    console.error("Error fetching sleep feedback:", error);
    return {
      message: "수면 피드백을 불러오는 중 오류가 발생했습니다 ⚠️",
      totalSleepHours: null,
    };
  }
}

module.exports = {getUserSleepMission};
