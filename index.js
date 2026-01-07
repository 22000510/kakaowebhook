// index.js

const { db } = require('./functions/firebase/firebaseConfig');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// --- 환경 변수 설정 ---
// 이 값들은 AWS Lambda 콘솔에서 설정해야 합니다.
const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// --- 서비스 로직 (통합) ---
// 이 로직은 'firebaseConfig.js'가 './firebase' 경로에 있다고 가정합니다.
// ZIP 파일에 이 파일이 반드시 포함되어야 합니다.

// userService.js의 로직
async function getUserInformation(userId) {
    try {
        const userRecordsRef = db.collection('users').doc(userId).collection('userInformation');
        const snapshot = await userRecordsRef.limit(1).get();

        if (snapshot.empty) {
            return { message: "사용자 정보가 없습니다 😢", data: null };
        }

        const data = snapshot.docs[0].data();
        const { age, gender, name, sleepGoal, recommandBedtime, notSleepReason } = data;

        function formatArrayTime(arr) {
            if (!Array.isArray(arr) || arr.length < 2) return "미입력";
            const hh = String(arr[0]).padStart(2, "0");
            const mm = String(arr[1]).padStart(2, "0");
            return `${hh}:${mm}`;
        }

        const recommandBedtimeStr = formatArrayTime(recommandBedtime);
        const sleepGoalStr = formatArrayTime(sleepGoal);

        const message = `👤 사용자 정보
이름: ${name || "미입력"}
성별: ${gender || "미입력"}
나이: ${age || "미입력"}세

💤 수면 관련 정보
수면 목표 시간: ${sleepGoalStr}
추천 취침 시간: ${recommandBedtimeStr}
수면 방해 요인: ${notSleepReason || "미입력"}`;

        return {
            message,
            data: { name, gender, age, notSleepReason, recommandBedtime: recommandBedtimeStr, sleepGoal: sleepGoalStr }
        };

    } catch (error) {
        console.error("사용자 정보 가져오기 오류:", error);
        return { message: "사용자 정보를 불러오는 중 오류가 발생했어요 ⚠️", data: null };
    }
}

// sleepService.js의 로직
async function getUserSleepFeedback(userId) {
    try {
        const sleepRecordsRef = db.collection('users').doc(userId).collection('sleepRecords');
        const snapshot = await sleepRecordsRef.orderBy('savedAt', 'desc').limit(1).get();

        if (snapshot.empty) {
            return { message: "수면 기록이 없습니다 😢", totalSleepHours: null };
        }

        const data = snapshot.docs[0].data();
        const hours = data.totalHours;
        const efficiency = data.sleepEfficiency;
        const deep = data.deepSleep;
        const hourPart = Math.floor(hours);
        const minutePart = Math.round((hours - hourPart) * 60);
        const deephourPart = Math.floor(deep);
        const deepminutePart = Math.round((deep - deephourPart) * 60);
        const timeStr = `${hourPart}시간 ${minutePart}분`;
        const deeptimeStr = `${deephourPart}시간 ${deepminutePart}분`;

        let prompt = "";
        if (hours >= 8) {
            prompt = "수면 시간이 8시간 이상인 사람에게 해줄 수 있는 긍정적이면서 현실적인 피드백을 100자 이내로 작성해줘.";
        } else if (hours >= 6) {
            prompt = "수면 시간이 6시간 이상 8시간 미만인 사람에게 해줄 수 있는 긍정적이면서 현실적인 피드백을 100자 이내로 작성해줘.";
        } else {
            prompt = "수면 시간이 6시간 미만인 사람에게 해줄 수 있는 긍정적이면서 현실적인 피드백을 100자 이내로 작성해줘.";
        }

        let feedback = "";
        try {
            const result = await geminiModel.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
            feedback = result.response.text().trim();
        } catch (apiError) {
            console.error("Gemini API 오류:", apiError);
            feedback = "충분히 주무셨어요! 좋은 하루 보내세요 ☀️";
        }

        return { message: `총 수면 시간: ${timeStr}\n깊은 수면 시간: ${deeptimeStr}\n수면 만족도:${efficiency}%\n${feedback}`, totalSleepHours: hours };

    } catch (error) {
        console.error("수면 피드백 가져오기 오류:", error);
        return { message: "수면 피드백을 불러오는 중 오류가 발생했어요 ⚠️", totalSleepHours: null };
    }
}

// --- Lambda 핸들러 함수 ---

/**
 * AWS Lambda의 메인 핸들러 함수입니다.
 * API Gateway로부터의 모든 요청을 처리합니다.
 * @param {object} event 들어오는 API Gateway 요청 이벤트.
 * @returns {object} API Gateway 응답 객체.
 */
exports.handler = async (event) => {
    // 1. 요청 본문 파싱
    let body;
    try {
        body = JSON.parse(event.body);
    } catch (error) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                "version": "2.0",
                "template": { "outputs": [{ "simpleText": { "text": "잘못된 요청 형식입니다." } }] }
            }),
            headers: { 'Content-Type': 'application/json' }
        };
    }

    // 2. 사용자 ID 추출 (하드코딩된 값 대신 실제 ID 사용)
    const userId = body.userRequest?.user?.id || "test_user_123";

    // 3. 요청 경로에 따라 라우팅
    const path = event.path;
    let responseBody;

    try {
        // --- welcome.js 로직 ---
        if (path.includes('/api/welcome')) {
            const userInfo = await getUserInformation(userId);
            responseBody = {
                version: "2.0",
                template: {
                    outputs: [{
                        simpleText: {
                            text: `안녕하세요! ${userInfo.data.name}님😊\n저는 규칙적인 수면 습관을 위한 수면 매니저에요!\n\n먼저 아래 정보가 맞는지 확인해주세요!\n${userInfo.message}\n\n사용자 정보가 맞으신가요? 맞지 않다면 어플에서 수정해주시고 맞다면 아래 채널 메뉴를 통해 원하는 기능을 선택해주세요.`
                        }
                    }]
                }
            };
        }
        // --- sleepFeedback.js 로직 ---
        else if (path.includes('/api/sleep')) {
            const result = await getUserSleepFeedback(userId);
            responseBody = {
                version: "2.0",
                template: {
                    outputs: [{ simpleText: { text: result.message } }]
                }
            };
        }
        // --- pullback.js 로직 ---
        else if (path.includes('/api/pullback')) {
            const userMessage = body.userRequest?.utterance || body.action?.params?.utterance;

            if (!userMessage) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({
                        "version": "2.0",
                        "template": { "outputs": [{ "simpleText": { "text": "메시지를 찾을 수 없습니다." } }] }
                    }),
                    headers: { 'Content-Type': 'application/json' }
                };
            }

            // Gemini 프롬프트 동적 생성
            const userInfo = await getUserInformation(userId);
            const userSleepInfo = await getUserSleepFeedback(userId);

            const prompt = `사용자의 오늘 총 수면 시간은 ${userSleepInfo.totalSleepHours}시간이고, 사용자의 이름은 ${userInfo.data.name}이야. 이 정보를 참고해서 다음 사용자의 말에 한국어로 자연스럽게 답변해줘.\n\n사용자: ${userMessage}`;
            const result = await geminiModel.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
            const reply = result.response.text();

            responseBody = {
                version: "2.0",
                template: {
                    outputs: [{ simpleText: { text: reply } }]
                }
            };
        }

        // 4. 최종 응답 반환
        return {
            statusCode: 200,
            body: JSON.stringify(responseBody),
            headers: { 'Content-Type': 'application/json' }
        };

    } catch (error) {
        console.error("Lambda 에러:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                "version": "2.0",
                "template": { "outputs": [{ "simpleText": { "text": "죄송합니다. 서버 처리 중 오류가 발생했습니다." } }] }
            }),
            headers: { 'Content-Type': 'application/json' }
        };
    }
};