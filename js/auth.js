// ===== STUDIO X Authentication Module =====

// 이메일 회원가입
async function signupWithEmail(name, email, password) {
    try {
        showLoading(true);

        const userCredential = await auth.createUserWithEmailAndPassword(email, password);

        // 사용자 프로필 업데이트 (이름)
        await userCredential.user.updateProfile({
            displayName: name
        });

        // Firestore에 사용자 정보 저장
        if (typeof db !== 'undefined') {
            await db.collection('users').doc(userCredential.user.uid).set({
                name: name,
                email: email,
                role: 'user',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }

        // 이메일 인증 발송 (선택)
        // await userCredential.user.sendEmailVerification();

        showLoading(false);
        return { success: true, user: userCredential.user };
    } catch (error) {
        showLoading(false);
        console.error('회원가입 오류:', error);
        return { success: false, error: getErrorMessage(error.code) };
    }
}

// 이메일 로그인
async function loginWithEmail(email, password, rememberMe = false) {
    try {
        showLoading(true);

        // 로그인 상태 유지 설정
        const persistence = rememberMe
            ? firebase.auth.Auth.Persistence.LOCAL
            : firebase.auth.Auth.Persistence.SESSION;

        await auth.setPersistence(persistence);
        const userCredential = await auth.signInWithEmailAndPassword(email, password);

        showLoading(false);
        return { success: true, user: userCredential.user };
    } catch (error) {
        showLoading(false);
        console.error('로그인 오류:', error);
        return { success: false, error: getErrorMessage(error.code) };
    }
}

// Google 로그인
async function loginWithGoogle() {
    try {
        showLoading(true);
        const result = await auth.signInWithPopup(googleProvider);

        // 신규 사용자인 경우 Firestore에 저장
        if (result.additionalUserInfo && result.additionalUserInfo.isNewUser && typeof db !== 'undefined') {
            await db.collection('users').doc(result.user.uid).set({
                name: result.user.displayName || '',
                email: result.user.email,
                photoURL: result.user.photoURL || '',
                role: 'user',
                provider: 'google',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }

        showLoading(false);
        return { success: true, user: result.user };
    } catch (error) {
        showLoading(false);
        console.error('Google 로그인 오류:', error);
        return { success: false, error: getErrorMessage(error.code) };
    }
}

// 로그아웃
async function logoutUser() {
    try {
        await auth.signOut();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('로그아웃 오류:', error);
        alert('로그아웃 중 오류가 발생했습니다.');
    }
}

// 비밀번호 재설정 이메일 발송
async function resetPassword(email) {
    try {
        showLoading(true);
        await auth.sendPasswordResetEmail(email);
        showLoading(false);
        return { success: true };
    } catch (error) {
        showLoading(false);
        console.error('비밀번호 재설정 오류:', error);
        return { success: false, error: getErrorMessage(error.code) };
    }
}

// 현재 사용자 가져오기
function getCurrentUser() {
    return auth.currentUser;
}

// 로그인 필요한 페이지 보호
function requireAuth() {
    const user = auth.currentUser;
    if (!user) {
        // 현재 URL을 저장하고 로그인 페이지로
        sessionStorage.setItem('redirectUrl', window.location.href);
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// 인증 상태 변경 감지 및 UI 업데이트
auth.onAuthStateChanged(user => {
    updateAuthUI(user);

    // 로그인/회원가입 페이지에서 이미 로그인된 경우 리다이렉트
    const currentPage = window.location.pathname;
    if (user && (currentPage.includes('login.html') || currentPage.includes('signup.html'))) {
        const redirectUrl = sessionStorage.getItem('redirectUrl') || 'index.html';
        sessionStorage.removeItem('redirectUrl');
        window.location.href = redirectUrl;
    }
});

// UI 업데이트 함수
function updateAuthUI(user) {
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');

    if (user) {
        // 로그인 상태
        if (authButtons) authButtons.style.display = 'none';
        if (userMenu) {
            userMenu.style.display = 'flex';
            if (userName) {
                // 마이페이지 링크 추가
                const displayName = user.displayName || user.email.split('@')[0];
                userName.innerHTML = `<a href="mypage.html" style="color: inherit; text-decoration: none;">${displayName}</a>`;
            }
            if (userAvatar) {
                const initial = (user.displayName || user.email)[0].toUpperCase();
                userAvatar.textContent = initial;
                userAvatar.style.cursor = 'pointer';
                userAvatar.onclick = () => window.location.href = 'mypage.html';
            }
        }
    } else {
        // 비로그인 상태
        if (authButtons) authButtons.style.display = 'flex';
        if (userMenu) userMenu.style.display = 'none';
    }
}

// 에러 메시지 한글화
function getErrorMessage(errorCode) {
    const messages = {
        'auth/email-already-in-use': '이미 사용 중인 이메일입니다.',
        'auth/invalid-email': '유효하지 않은 이메일 형식입니다.',
        'auth/weak-password': '비밀번호는 6자 이상이어야 합니다.',
        'auth/user-not-found': '등록되지 않은 이메일입니다.',
        'auth/wrong-password': '비밀번호가 올바르지 않습니다.',
        'auth/invalid-credential': '이메일 또는 비밀번호가 올바르지 않습니다.',
        'auth/too-many-requests': '너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.',
        'auth/popup-closed-by-user': '로그인 창이 닫혔습니다.',
        'auth/network-request-failed': '네트워크 오류가 발생했습니다.',
        'auth/user-disabled': '비활성화된 계정입니다.',
        'auth/operation-not-allowed': '이 로그인 방식은 현재 사용할 수 없습니다.'
    };
    return messages[errorCode] || '오류가 발생했습니다. 다시 시도해주세요.';
}

// 로딩 표시
function showLoading(show) {
    const submitBtn = document.querySelector('button[type="submit"]');
    if (submitBtn) {
        if (show) {
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<div class="loading-spinner"></div><span class="btn-text">' + submitBtn.textContent + '</span>';
        } else {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
            const btnText = submitBtn.querySelector('.btn-text');
            if (btnText) {
                submitBtn.innerHTML = btnText.textContent;
            }
        }
    }
}

// 에러 메시지 표시
function showError(message) {
    const errorEl = document.getElementById('errorMessage');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.add('show');

        // 5초 후 숨김
        setTimeout(() => {
            errorEl.classList.remove('show');
        }, 5000);
    }
}

// 성공 메시지 표시
function showSuccess(message) {
    const successEl = document.getElementById('successMessage');
    if (successEl) {
        successEl.textContent = message;
        successEl.classList.add('show');

        setTimeout(() => {
            successEl.classList.remove('show');
        }, 5000);
    }
}

// 비밀번호 유효성 검사
function validatePassword(password) {
    if (password.length < 8) {
        return { valid: false, message: '비밀번호는 8자 이상이어야 합니다.' };
    }
    if (!/[A-Za-z]/.test(password)) {
        return { valid: false, message: '비밀번호에 영문자가 포함되어야 합니다.' };
    }
    if (!/[0-9]/.test(password)) {
        return { valid: false, message: '비밀번호에 숫자가 포함되어야 합니다.' };
    }
    return { valid: true };
}

// 이메일 유효성 검사
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

console.log('%cAuth Module Loaded', 'color: #22c55e; font-weight: bold;');
