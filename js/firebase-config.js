// ===== Firebase Configuration =====
// Firebase 프로젝트: test-aefe3

const firebaseConfig = {
    apiKey: "AIzaSyBqBXTylv_R-r7p3xCFvO65NTdyQIkoTBM",
    authDomain: "test-aefe3.firebaseapp.com",
    projectId: "test-aefe3",
    storageBucket: "test-aefe3.firebasestorage.app",
    messagingSenderId: "264417699151",
    appId: "1:264417699151:web:d52a857c5bd877da3d113a",
    measurementId: "G-QTVMJRLNN3"
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);

// Auth 인스턴스
const auth = firebase.auth();

// Firestore 인스턴스
const db = firebase.firestore();

// Google Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.setCustomParameters({
    prompt: 'select_account'
});

// 한국어 설정
auth.languageCode = 'ko';

// Firestore 설정
db.settings({
    timestampsInSnapshots: true
});

// Analytics 초기화 (Analytics SDK가 로드된 경우)
let analytics = null;
if (typeof firebase.analytics !== 'undefined') {
    analytics = firebase.analytics();
    console.log('%cFirebase Analytics Initialized', 'color: #f59e0b; font-weight: bold;');
}

// 페이지 뷰 추적
function logPageView(pageName) {
    if (analytics) {
        analytics.logEvent('page_view', {
            page_title: pageName,
            page_location: window.location.href,
            page_path: window.location.pathname
        });
    }
}

// 이벤트 추적
function logEvent(eventName, params = {}) {
    if (analytics) {
        analytics.logEvent(eventName, params);
    }
}

console.log('%cFirebase Initialized (Auth + Firestore + Analytics)', 'color: #6366f1; font-weight: bold;');
