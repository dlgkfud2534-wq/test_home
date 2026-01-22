// ===== 토스페이먼츠 결제 모듈 =====

// 토스페이먼츠 클라이언트 키 (테스트)
const TOSS_CLIENT_KEY = 'test_ck_eqRGgYO1r5KWazmo7AMW3QnN2Eya';

// 상품 데이터
const PRODUCTS = {
    'test-100': {
        id: 'test-100',
        name: '테스트 상품',
        price: 100,
        description: '결제 테스트용 100원 상품입니다',
        duration: '즉시',
        category: '테스트',
        features: [
            '결제 시스템 테스트용',
            '실제 상품이 아닙니다',
            '테스트 완료 후 환불 가능'
        ],
        options: []
    },
    'bi-starter': {
        id: 'bi-starter',
        name: '브랜드 스타터 패키지',
        price: 1500000,
        description: '로고, 명함, 컬러 팔레트, 기본 가이드라인',
        duration: '2주',
        category: '브랜드 아이덴티티',
        features: [
            '로고 디자인 (3안 제시)',
            '명함 디자인',
            '컬러 팔레트 & 타이포그래피',
            '기본 브랜드 가이드라인',
            '원본 파일 제공 (AI, PDF)'
        ],
        options: [
            { id: 'extra-logo', name: '추가 로고 시안 (2안)', price: 300000 },
            { id: 'stationery', name: '문구류 디자인 (봉투, 레터헤드)', price: 400000 },
            { id: 'rush', name: '급행 처리 (1주 단축)', price: 300000 }
        ]
    },
    'web-package': {
        id: 'web-package',
        name: '웹사이트 패키지',
        price: 2000000,
        description: '랜딩페이지, 최대 5페이지, 반응형 디자인',
        duration: '3-4주',
        category: '웹디자인',
        features: [
            '메인 + 서브페이지 (최대 5페이지)',
            '반응형 디자인 (PC/태블릿/모바일)',
            '인터랙티브 프로토타입',
            '디자인 시스템 문서',
            '원본 파일 + 개발 에셋 제공'
        ],
        options: [
            { id: 'extra-pages', name: '추가 페이지 (5페이지)', price: 500000 },
            { id: 'seo', name: 'SEO 최적화', price: 300000 },
            { id: 'animation', name: '마이크로 인터랙션 추가', price: 400000 },
            { id: 'rush', name: '급행 처리 (1주 단축)', price: 400000 }
        ]
    },
    'app-full': {
        id: 'app-full',
        name: '앱 UI/UX 풀 패키지',
        price: 3000000,
        description: '사용자 리서치부터 프로토타입까지 풀 서비스',
        duration: '4-6주',
        category: '앱 UI/UX',
        features: [
            '사용자 리서치 & 페르소나',
            '와이어프레임 & 유저플로우',
            'UI 디자인 (iOS/Android)',
            '인터랙티브 프로토타입',
            '개발 핸드오프 문서'
        ],
        options: [
            { id: 'both-platform', name: 'iOS + Android 둘 다', price: 800000 },
            { id: 'usability-test', name: '사용성 테스트 (5인)', price: 500000 },
            { id: 'design-system', name: '디자인 시스템 구축', price: 600000 },
            { id: 'rush', name: '급행 처리 (1주 단축)', price: 500000 }
        ]
    },
    'all-in-one': {
        id: 'all-in-one',
        name: '올인원 패키지',
        price: 5500000,
        originalPrice: 6500000,
        description: '브랜딩 + 웹 + 앱 통합 솔루션',
        duration: '8주',
        category: '통합 패키지',
        features: [
            '풀 브랜드 아이덴티티',
            '웹사이트 디자인 (최대 10페이지)',
            '앱 UI/UX 디자인',
            '마케팅 에셋 (SNS, 배너 등)',
            '3개월 사후 지원'
        ],
        options: [
            { id: 'extra-support', name: '사후 지원 연장 (3개월)', price: 500000 },
            { id: 'motion', name: '모션 그래픽 패키지', price: 800000 },
            { id: 'rush', name: '급행 처리 (2주 단축)', price: 1000000 }
        ]
    }
};

// 토스페이먼츠 SDK 초기화
let tossPayments = null;

function initTossPayments() {
    if (typeof TossPayments !== 'undefined') {
        tossPayments = TossPayments(TOSS_CLIENT_KEY);
        console.log('%c토스페이먼츠 SDK 초기화 완료', 'color: #0064FF; font-weight: bold;');
        return true;
    } else {
        console.error('토스페이먼츠 SDK를 로드할 수 없습니다.');
        return false;
    }
}

// 상품 정보 가져오기
function getProductById(productId) {
    return PRODUCTS[productId] || null;
}

// URL에서 상품 ID 가져오기
function getProductIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// 총 금액 계산
function calculateTotal(basePrice, selectedOptions) {
    let total = basePrice;
    selectedOptions.forEach(option => {
        total += option.price;
    });
    return total;
}

// 금액 포맷팅
function formatPrice(price) {
    return '₩' + price.toLocaleString('ko-KR');
}

// 선택된 옵션 가져오기
function getSelectedOptions() {
    const checkboxes = document.querySelectorAll('input[name="option"]:checked');
    const options = [];

    checkboxes.forEach(checkbox => {
        options.push({
            id: checkbox.value,
            name: checkbox.dataset.name,
            price: parseInt(checkbox.dataset.price)
        });
    });

    return options;
}

// 결제 처리
async function processPayment() {
    const productId = getProductIdFromUrl();
    const product = getProductById(productId);

    if (!product) {
        alert('상품 정보를 찾을 수 없습니다.');
        return;
    }

    // 테스트 상품(test-100)은 로그인 없이 결제 가능
    const isTestProduct = productId === 'test-100';
    const user = auth.currentUser;

    // 테스트 상품이 아닌 경우에만 로그인 확인
    if (!isTestProduct && !user) {
        alert('결제를 위해 로그인이 필요합니다.');
        sessionStorage.setItem('redirectUrl', window.location.href);
        window.location.href = 'login.html';
        return;
    }

    if (!tossPayments) {
        if (!initTossPayments()) {
            alert('결제 시스템을 초기화할 수 없습니다. 페이지를 새로고침 해주세요.');
            return;
        }
    }

    const selectedOptions = getSelectedOptions();
    const totalAmount = calculateTotal(product.price, selectedOptions);

    // 주문 ID 생성 (영문, 숫자, -, _ 만 허용, 최대 64자)
    const orderId = `STUDIOX_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`.toUpperCase();

    // 주문명 생성 (최대 100자)
    let orderName = product.name;
    if (selectedOptions.length > 0) {
        orderName += ` 외 ${selectedOptions.length}건`;
    }

    // 주문 정보 저장 (결제 성공 후 사용)
    const orderInfo = {
        orderId,
        productId: product.id,
        productName: product.name,
        basePrice: product.price,
        options: selectedOptions,
        totalAmount,
        userId: user ? user.uid : 'guest',
        userEmail: user ? user.email : 'guest@test.com',
        userName: user ? (user.displayName || user.email.split('@')[0]) : '게스트',
        isGuest: !user,
        timestamp: new Date().toISOString()
    };

    // 세션과 로컬 스토리지에 저장
    sessionStorage.setItem('pendingOrder', JSON.stringify(orderInfo));
    localStorage.setItem('lastPaymentInfo', JSON.stringify({
        productId: product.id,
        productName: orderName
    }));

    // 현재 페이지의 base URL 가져오기
    const currentUrl = window.location.href;
    const baseUrl = currentUrl.substring(0, currentUrl.lastIndexOf('/'));

    // 성공/실패 URL 설정
    const successUrl = `${baseUrl}/payment-success.html`;
    const failUrl = `${baseUrl}/payment-fail.html`;

    console.log('결제 URL 설정:', { successUrl, failUrl });

    try {
        // 토스페이먼츠 결제창 호출
        await tossPayments.requestPayment('카드', {
            amount: totalAmount,
            orderId: orderId,
            orderName: orderName.substring(0, 100),
            customerName: user ? (user.displayName || '고객') : '테스트 고객',
            customerEmail: user ? user.email : 'test@example.com',
            successUrl: successUrl,
            failUrl: failUrl,
        });
    } catch (error) {
        if (error.code === 'USER_CANCEL') {
            console.log('사용자가 결제를 취소했습니다.');
        } else if (error.code === 'INVALID_CARD_COMPANY') {
            alert('유효하지 않은 카드입니다.');
        } else {
            console.error('결제 오류:', error);
            alert('결제 처리 중 오류가 발생했습니다: ' + (error.message || '다시 시도해주세요.'));
        }
    }
}

// Firestore에 주문 저장
async function saveOrderToFirestore(orderData) {
    if (typeof db !== 'undefined') {
        try {
            await db.collection('orders').add({
                ...orderData,
                status: 'paid',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('주문이 Firestore에 저장되었습니다.');
            return true;
        } catch (error) {
            console.error('Firestore 저장 오류:', error);
            return false;
        }
    }
    return false;
}

// 결제 성공 처리
async function handlePaymentSuccess() {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentKey = urlParams.get('paymentKey');
    const orderId = urlParams.get('orderId');
    const amount = urlParams.get('amount');

    // 저장된 주문 정보 가져오기
    const orderInfo = JSON.parse(sessionStorage.getItem('pendingOrder') || '{}');

    // 주문 정보 완성
    const completeOrder = {
        ...orderInfo,
        paymentKey,
        orderId,
        amount: parseInt(amount),
        status: 'paid',
        completedAt: new Date().toISOString()
    };

    // Firestore에 저장
    await saveOrderToFirestore(completeOrder);

    // 로컬 스토리지에도 백업
    saveOrderToLocal(completeOrder);

    // 세션 스토리지 정리
    sessionStorage.removeItem('pendingOrder');

    return completeOrder;
}

// 로컬 스토리지에 주문 저장
function saveOrderToLocal(orderData) {
    let orders = JSON.parse(localStorage.getItem('studioXOrders') || '[]');
    orders.push(orderData);
    localStorage.setItem('studioXOrders', JSON.stringify(orders));
    console.log('주문 로컬 저장 완료:', orderData.orderId);
}

// 주문 내역 조회
function getOrders() {
    return JSON.parse(localStorage.getItem('studioXOrders') || '[]');
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    // 토스페이먼츠 SDK가 로드된 후 초기화
    if (typeof TossPayments !== 'undefined') {
        initTossPayments();
    } else {
        // SDK 로드 대기
        window.addEventListener('load', initTossPayments);
    }
});

console.log('%cToss Payments Module Loaded', 'color: #0064FF; font-weight: bold;');
