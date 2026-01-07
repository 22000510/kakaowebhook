const admin = require("firebase-admin"); // 큰따옴표 사용

admin.initializeApp({
  credential: admin.credential.cert(
      require("../sleepmanager-1bac8-firebase-adminsdk-fbsvc-0001b4959c.json"),
  ),
});

const db = admin.firestore();

module.exports = {db}; // 중괄호 공백 제거 및 큰따옴표 사용
