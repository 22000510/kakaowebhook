# Kakao Chatbot Webhook Server for Sleep Management Service

카카오 챗봇과 모바일 앱을 연동하여  
사용자의 수면 데이터를 기반으로 **개인화된 수면 피드백**을 제공하는  
카카오 챗봇 **웹훅(Webhook) 서버**입니다.

본 서버는 **Firebase Functions 환경에서 Express 기반 REST API**로 구현되었으며,  
카카오 i 오픈빌더의 스킬 서버로 사용됩니다.

---

## 🛠 Tech Stack

- Node.js
- Express.js
- Firebase Functions
- Firebase Firestore
- Kakao i OpenBuilder
- Gemini API

---

## 📌 Architecture Overview

- 카카오 챗봇 → Webhook 요청 → Firebase Functions (Express 서버)
- Firebase Firestore에 저장된 사용자 수면 데이터 조회
- Gemini API를 활용한 맞춤형 수면 피드백 생성
- 카카오 챗봇 응답 메시지 반환

---

## ✨ Key Features

### 1. Kakao Chatbot Skill Server
- 카카오 i 오픈빌더에서 호출되는 웹훅 서버
- Express 기반 REST API 형태로 챗봇 요청 처리

### 2. App–Chatbot User Authentication
- 모바일 앱에서 발급한 인증 코드를 챗봇 채팅에 입력
- 앱 사용자와 카카오 챗봇 사용자를 동일 인물로 식별

### 3. Personalized Sleep Feedback
- Firebase Firestore에 저장된 수면 데이터 조회
- Gemini API를 활용한 사용자 맞춤형 수면 피드백 메시지 생성

### 4. Serverless Architecture
- Firebase Functions 기반 서버리스 구조
- 확장성과 유지보수를 고려한 API 설계

---

## 🎥 Demo Video

아래 링크에서 **모바일 앱 및 카카오 챗봇 연동 데모 영상**을 확인할 수 있습니다.

👉 **YouTube Demo Video**  
https://www.youtube.com/watch?v=73GsZDYJ76k

---

## 🏆 Achievements

- 한동대학교 캡스톤 디자인 2 우수상 선정

---

## 👤 Author

- 이동은  
- Computer Engineering (Advanced Major), Handong Global University

