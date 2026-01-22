// ===== Admin Module =====

// 관리자 권한 체크 미들웨어
async function checkAdminAccess() {
    return new Promise((resolve) => {
        auth.onAuthStateChanged(async (user) => {
            if (!user) {
                resolve({ isAdmin: false, reason: 'not_logged_in' });
                return;
            }

            const isAdmin = await isUserAdmin(user.uid);
            resolve({ isAdmin, user, reason: isAdmin ? 'authorized' : 'not_admin' });
        });
    });
}

// 첫 번째 관리자 설정 (초기 설정용)
// Firebase Console에서 직접 users 컬렉션에 role: 'admin' 추가하거나
// 이 함수를 한 번 실행하여 첫 관리자 설정
async function setupFirstAdmin(userId) {
    try {
        await db.collection('users').doc(userId).set({
            role: 'admin',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log('First admin setup complete for:', userId);
        return { success: true };
    } catch (error) {
        console.error('Error setting up first admin:', error);
        return { success: false, error: error.message };
    }
}

// 관리자 활동 로그 기록
async function logAdminActivity(adminId, action, details = {}) {
    try {
        await db.collection('admin_logs').add({
            adminId,
            action,
            details,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            userAgent: navigator.userAgent
        });
    } catch (error) {
        console.error('Error logging admin activity:', error);
    }
}

// 관리자 활동 로그 조회
async function getAdminLogs(limitCount = 50) {
    try {
        const snapshot = await db.collection('admin_logs')
            .orderBy('timestamp', 'desc')
            .limit(limitCount)
            .get();

        const logs = [];
        snapshot.forEach(doc => {
            logs.push({ id: doc.id, ...doc.data() });
        });

        return { success: true, data: logs };
    } catch (error) {
        console.error('Error getting admin logs:', error);
        return { success: false, error: error.message };
    }
}

// 주문 상세 정보 가져오기
async function getOrderDetails(orderId) {
    try {
        const orderDoc = await db.collection('orders').doc(orderId).get();

        if (!orderDoc.exists) {
            return { success: false, error: '주문을 찾을 수 없습니다.' };
        }

        const order = { id: orderDoc.id, ...orderDoc.data() };

        // 사용자 정보도 함께 가져오기
        if (order.userId) {
            const userResult = await getUserProfile(order.userId);
            if (userResult.success) {
                order.userProfile = userResult.data;
            }
        }

        return { success: true, data: order };
    } catch (error) {
        console.error('Error getting order details:', error);
        return { success: false, error: error.message };
    }
}

// 사용자 상세 정보 가져오기 (주문 포함)
async function getUserDetails(userId) {
    try {
        const userDoc = await db.collection('users').doc(userId).get();

        if (!userDoc.exists) {
            return { success: false, error: '사용자를 찾을 수 없습니다.' };
        }

        const user = { id: userDoc.id, ...userDoc.data() };

        // 사용자의 주문 목록도 함께 가져오기
        const ordersResult = await getUserOrders(userId);
        if (ordersResult.success) {
            user.orders = ordersResult.data;
        }

        return { success: true, data: user };
    } catch (error) {
        console.error('Error getting user details:', error);
        return { success: false, error: error.message };
    }
}

// 날짜 범위별 주문 조회
async function getOrdersByDateRange(startDate, endDate) {
    try {
        const snapshot = await db.collection('orders')
            .where('createdAt', '>=', startDate)
            .where('createdAt', '<=', endDate)
            .orderBy('createdAt', 'desc')
            .get();

        const orders = [];
        snapshot.forEach(doc => {
            orders.push({ id: doc.id, ...doc.data() });
        });

        return { success: true, data: orders };
    } catch (error) {
        console.error('Error getting orders by date range:', error);
        return { success: false, error: error.message };
    }
}

// 매출 통계 계산
async function calculateRevenueStats(period = 'month') {
    try {
        const now = new Date();
        let startDate;

        switch (period) {
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        const snapshot = await db.collection('orders')
            .where('createdAt', '>=', startDate)
            .where('status', 'in', ['paid', 'completed'])
            .get();

        let totalRevenue = 0;
        let orderCount = 0;
        const dailyRevenue = {};

        snapshot.forEach(doc => {
            const order = doc.data();
            totalRevenue += order.amount || 0;
            orderCount++;

            // 일별 매출 집계
            if (order.createdAt) {
                const dateKey = new Date(order.createdAt.seconds * 1000).toISOString().split('T')[0];
                dailyRevenue[dateKey] = (dailyRevenue[dateKey] || 0) + (order.amount || 0);
            }
        });

        return {
            success: true,
            data: {
                totalRevenue,
                orderCount,
                averageOrderValue: orderCount > 0 ? totalRevenue / orderCount : 0,
                dailyRevenue,
                period
            }
        };
    } catch (error) {
        console.error('Error calculating revenue stats:', error);
        return { success: false, error: error.message };
    }
}

// 데이터 내보내기 (CSV 형식)
function exportToCSV(data, filename) {
    if (!data || data.length === 0) {
        alert('내보낼 데이터가 없습니다.');
        return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row =>
            headers.map(header => {
                let cell = row[header];
                // 날짜 처리
                if (cell && cell.seconds) {
                    cell = new Date(cell.seconds * 1000).toISOString();
                }
                // 문자열 이스케이프
                if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
                    cell = '"' + cell.replace(/"/g, '""') + '"';
                }
                return cell || '';
            }).join(',')
        )
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename + '_' + new Date().toISOString().split('T')[0] + '.csv';
    link.click();
}

// 대량 상태 업데이트
async function bulkUpdateOrderStatus(orderIds, status) {
    try {
        const batch = db.batch();

        orderIds.forEach(orderId => {
            const orderRef = db.collection('orders').doc(orderId);
            batch.update(orderRef, {
                status,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        });

        await batch.commit();
        return { success: true, updatedCount: orderIds.length };
    } catch (error) {
        console.error('Error bulk updating orders:', error);
        return { success: false, error: error.message };
    }
}

// 검색 기능
async function searchOrders(query) {
    try {
        // 주문 ID로 검색
        const orderDoc = await db.collection('orders').doc(query).get();
        if (orderDoc.exists) {
            return { success: true, data: [{ id: orderDoc.id, ...orderDoc.data() }] };
        }

        // orderId 필드로 검색
        const snapshot = await db.collection('orders')
            .where('orderId', '==', query)
            .get();

        const orders = [];
        snapshot.forEach(doc => {
            orders.push({ id: doc.id, ...doc.data() });
        });

        return { success: true, data: orders };
    } catch (error) {
        console.error('Error searching orders:', error);
        return { success: false, error: error.message };
    }
}

async function searchUsers(query) {
    try {
        // 이메일로 검색
        const snapshot = await db.collection('users')
            .where('email', '==', query)
            .get();

        const users = [];
        snapshot.forEach(doc => {
            users.push({ id: doc.id, ...doc.data() });
        });

        if (users.length > 0) {
            return { success: true, data: users };
        }

        // 이름으로 검색 (정확히 일치)
        const nameSnapshot = await db.collection('users')
            .where('name', '==', query)
            .get();

        nameSnapshot.forEach(doc => {
            users.push({ id: doc.id, ...doc.data() });
        });

        return { success: true, data: users };
    } catch (error) {
        console.error('Error searching users:', error);
        return { success: false, error: error.message };
    }
}

console.log('%cAdmin Module Loaded', 'color: #f59e0b; font-weight: bold;');
