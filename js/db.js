// ===== Firestore Database Operations =====

// ==========================================
// 사용자 관련 함수
// ==========================================

// 사용자 프로필 생성/업데이트
async function saveUserProfile(userId, userData) {
    try {
        await db.collection('users').doc(userId).set({
            ...userData,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        return { success: true };
    } catch (error) {
        console.error('Error saving user profile:', error);
        return { success: false, error: error.message };
    }
}

// 사용자 프로필 가져오기
async function getUserProfile(userId) {
    try {
        const doc = await db.collection('users').doc(userId).get();
        if (doc.exists) {
            return { success: true, data: doc.data() };
        } else {
            return { success: false, error: '사용자를 찾을 수 없습니다.' };
        }
    } catch (error) {
        console.error('Error getting user profile:', error);
        return { success: false, error: error.message };
    }
}

// 사용자가 관리자인지 확인
async function isUserAdmin(userId) {
    try {
        const doc = await db.collection('users').doc(userId).get();
        if (doc.exists) {
            return doc.data().role === 'admin';
        }
        return false;
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}

// ==========================================
// 주문 관련 함수
// ==========================================

// 주문 생성
async function createOrder(orderData) {
    try {
        const orderRef = await db.collection('orders').add({
            ...orderData,
            status: 'pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return { success: true, orderId: orderRef.id };
    } catch (error) {
        console.error('Error creating order:', error);
        return { success: false, error: error.message };
    }
}

// 주문 상태 업데이트
async function updateOrderStatus(orderId, status, paymentInfo = {}) {
    try {
        await db.collection('orders').doc(orderId).update({
            status: status,
            ...paymentInfo,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('Error updating order:', error);
        return { success: false, error: error.message };
    }
}

// 사용자 주문 목록 가져오기
async function getUserOrders(userId) {
    try {
        const snapshot = await db.collection('orders')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .get();

        const orders = [];
        snapshot.forEach(doc => {
            orders.push({ id: doc.id, ...doc.data() });
        });

        return { success: true, data: orders };
    } catch (error) {
        console.error('Error getting user orders:', error);
        return { success: false, error: error.message };
    }
}

// 특정 주문 가져오기
async function getOrder(orderId) {
    try {
        const doc = await db.collection('orders').doc(orderId).get();
        if (doc.exists) {
            return { success: true, data: { id: doc.id, ...doc.data() } };
        } else {
            return { success: false, error: '주문을 찾을 수 없습니다.' };
        }
    } catch (error) {
        console.error('Error getting order:', error);
        return { success: false, error: error.message };
    }
}

// ==========================================
// 관리자 전용 함수
// ==========================================

// 모든 주문 가져오기 (관리자용)
async function getAllOrders(limitCount = 50) {
    try {
        const snapshot = await db.collection('orders')
            .orderBy('createdAt', 'desc')
            .limit(limitCount)
            .get();

        const orders = [];
        snapshot.forEach(doc => {
            orders.push({ id: doc.id, ...doc.data() });
        });

        return { success: true, data: orders };
    } catch (error) {
        console.error('Error getting all orders:', error);
        return { success: false, error: error.message };
    }
}

// 모든 사용자 가져오기 (관리자용)
async function getAllUsers(limitCount = 50) {
    try {
        const snapshot = await db.collection('users')
            .orderBy('createdAt', 'desc')
            .limit(limitCount)
            .get();

        const users = [];
        snapshot.forEach(doc => {
            users.push({ id: doc.id, ...doc.data() });
        });

        return { success: true, data: users };
    } catch (error) {
        console.error('Error getting all users:', error);
        return { success: false, error: error.message };
    }
}

// 대시보드 통계 가져오기
async function getDashboardStats() {
    try {
        // 전체 주문 수
        const ordersSnapshot = await db.collection('orders').get();
        const totalOrders = ordersSnapshot.size;

        // 전체 사용자 수
        const usersSnapshot = await db.collection('users').get();
        const totalUsers = usersSnapshot.size;

        // 완료된 주문 및 매출
        let completedOrders = 0;
        let totalRevenue = 0;
        let pendingOrders = 0;

        ordersSnapshot.forEach(doc => {
            const order = doc.data();
            if (order.status === 'completed' || order.status === 'paid') {
                completedOrders++;
                totalRevenue += order.amount || 0;
            } else if (order.status === 'pending') {
                pendingOrders++;
            }
        });

        return {
            success: true,
            data: {
                totalOrders,
                totalUsers,
                completedOrders,
                pendingOrders,
                totalRevenue
            }
        };
    } catch (error) {
        console.error('Error getting dashboard stats:', error);
        return { success: false, error: error.message };
    }
}

// 상태별 주문 가져오기
async function getOrdersByStatus(status, limitCount = 50) {
    try {
        const snapshot = await db.collection('orders')
            .where('status', '==', status)
            .orderBy('createdAt', 'desc')
            .limit(limitCount)
            .get();

        const orders = [];
        snapshot.forEach(doc => {
            orders.push({ id: doc.id, ...doc.data() });
        });

        return { success: true, data: orders };
    } catch (error) {
        console.error('Error getting orders by status:', error);
        return { success: false, error: error.message };
    }
}

// ==========================================
// 문의 관련 함수
// ==========================================

// 문의 생성
async function createInquiry(inquiryData) {
    try {
        const inquiryRef = await db.collection('inquiries').add({
            ...inquiryData,
            status: 'new',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return { success: true, inquiryId: inquiryRef.id };
    } catch (error) {
        console.error('Error creating inquiry:', error);
        return { success: false, error: error.message };
    }
}

// 모든 문의 가져오기 (관리자용)
async function getAllInquiries(limitCount = 50) {
    try {
        const snapshot = await db.collection('inquiries')
            .orderBy('createdAt', 'desc')
            .limit(limitCount)
            .get();

        const inquiries = [];
        snapshot.forEach(doc => {
            inquiries.push({ id: doc.id, ...doc.data() });
        });

        return { success: true, data: inquiries };
    } catch (error) {
        console.error('Error getting all inquiries:', error);
        return { success: false, error: error.message };
    }
}

// 문의 상태 업데이트
async function updateInquiryStatus(inquiryId, status) {
    try {
        await db.collection('inquiries').doc(inquiryId).update({
            status: status,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('Error updating inquiry:', error);
        return { success: false, error: error.message };
    }
}

console.log('%cFirestore DB Module Loaded', 'color: #10b981; font-weight: bold;');
