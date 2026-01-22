// ===== Google Sheets API =====
const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbxiXuGdNkKNTmzfKrCDIByi_qVVuzhHdGvpE-Fg-wx8DHy7s9zSiAZgsXqai6fjwdhD8Q/exec';

// ===== Lead Form Modal =====
function openLeadForm() {
    document.getElementById('leadModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLeadForm() {
    document.getElementById('leadModal').classList.remove('active');
    document.body.style.overflow = '';
}

async function submitLeadForm(event) {
    event.preventDefault();

    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '전송 중...';
    submitBtn.disabled = true;

    const formData = {
        name: document.getElementById('name').value,
        company: document.getElementById('company').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        service: document.getElementById('service').value,
        budget: document.getElementById('budget').value,
        message: document.getElementById('message').value,
        timestamp: new Date().toISOString()
    };

    // 로컬 스토리지에 백업 저장
    saveLeadToStorage(formData);

    try {
        // Google Sheets API로 데이터 전송
        const response = await fetch(GOOGLE_SHEETS_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        // no-cors 모드에서는 응답을 읽을 수 없으므로 성공으로 처리
        console.log('Google Sheets 전송 완료');

        // 폼 리셋
        document.getElementById('leadForm').reset();
        closeLeadForm();

        // 성공 메시지 표시
        showSuccessMessage('상담 신청이 완료되었습니다! 24시간 내에 연락드리겠습니다.');
    } catch (error) {
        console.error('Google Sheets 전송 오류:', error);

        // 오류가 발생해도 로컬 저장은 되었으므로 성공 메시지 표시
        document.getElementById('leadForm').reset();
        closeLeadForm();
        showSuccessMessage('상담 신청이 완료되었습니다! 24시간 내에 연락드리겠습니다.');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

function saveLeadToStorage(leadData) {
    let leads = JSON.parse(localStorage.getItem('studioXLeads') || '[]');
    leads.push(leadData);
    localStorage.setItem('studioXLeads', JSON.stringify(leads));
    console.log('Lead saved:', leadData);
    console.log('Total leads:', leads.length);
}

function showSuccessMessage(message) {
    const toast = document.createElement('div');
    toast.className = 'success-toast';
    toast.innerHTML = `
        <span class="toast-icon">✓</span>
        <span class="toast-message">${message}</span>
    `;
    toast.style.cssText = `
        position: fixed;
        top: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: #10b981;
        color: white;
        padding: 16px 32px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        gap: 12px;
        font-weight: 600;
        box-shadow: 0 10px 40px rgba(16, 185, 129, 0.3);
        z-index: 3000;
        animation: slideDown 0.5s ease;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideUp 0.5s ease';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// ===== AI Chatbot with Gemini 2.5 Flash =====
let isChatbotOpen = false;
let isApiSettingsOpen = false;
let chatHistory = [];

// STUDIO X 컨텍스트 정보 (AI에게 제공할 회사 정보)
const STUDIO_X_CONTEXT = `
당신은 STUDIO X 디자인 에이전시의 AI 상담사입니다. 친절하고 전문적으로 응대해주세요.

[회사 정보]
- 회사명: STUDIO X
- 업종: 디자인 에이전시 (10년 경력)
- 완료 프로젝트: 500+ 건
- 고객 만족도: 98%

[서비스 및 가격]
1. 브랜드 아이덴티티 (BI): ₩1,500,000~
   - 로고, 명함, 브랜드 가이드라인
2. 웹사이트 디자인: ₩2,000,000~ (BEST 인기)
   - 랜딩페이지, 기업 웹사이트, 이커머스
3. 앱 UI/UX 디자인: ₩3,000,000~
   - 사용자 리서치부터 프로토타입까지

[진행 기간]
- 로고 디자인: 1-2주
- 웹사이트: 3-4주
- 앱 UI/UX: 4-6주

[장점]
- 전담 디자이너 배정
- 명확한 가격 정책 (추가 비용 없음)
- 무제한 수정
- 저작권 100% 양도

[프로세스]
1단계: 상담 & 분석 → 2단계: 기획 & 컨셉 → 3단계: 디자인 & 수정 → 4단계: 납품 & 지원

[응대 지침]
- 한국어로 친절하게 응대
- 답변은 간결하게 (3-4문장)
- 상담 신청을 자연스럽게 유도
- 고객의 질문에 정확하게 답변
`;

// 페이지 로드 시 저장된 API 키 확인
document.addEventListener('DOMContentLoaded', function() {
    checkSavedApiKey();
});

function checkSavedApiKey() {
    const savedKey = localStorage.getItem('geminiApiKey');
    if (savedKey) {
        document.getElementById('geminiApiKey').value = savedKey;
        updateApiStatus(true);
    }
}

function toggleApiSettings() {
    isApiSettingsOpen = !isApiSettingsOpen;
    document.getElementById('apiSettingsPanel').classList.toggle('active', isApiSettingsOpen);
}

function saveApiKey() {
    const apiKeyInput = document.getElementById('geminiApiKey');
    const apiKey = apiKeyInput.value.trim();

    if (apiKey) {
        localStorage.setItem('geminiApiKey', apiKey);
        updateApiStatus(true);
        addBotMessage('✅ API 키가 저장되었습니다! 이제 AI 상담을 이용하실 수 있습니다.', true);
        toggleApiSettings();
    } else {
        alert('API 키를 입력해주세요.');
    }
}

function updateApiStatus(connected) {
    const statusEl = document.getElementById('apiStatus');
    if (connected) {
        statusEl.textContent = '연결됨';
        statusEl.classList.add('connected');
    } else {
        statusEl.textContent = '미연결';
        statusEl.classList.remove('connected');
    }
}

function getApiKey() {
    return localStorage.getItem('geminiApiKey');
}

function toggleChatbot() {
    isChatbotOpen = !isChatbotOpen;
    document.getElementById('chatbotWidget').classList.toggle('active', isChatbotOpen);
}

function openChatbot() {
    isChatbotOpen = true;
    document.getElementById('chatbotWidget').classList.add('active');
}

function closeChatbot() {
    isChatbotOpen = false;
    document.getElementById('chatbotWidget').classList.remove('active');
}

function sendQuickReply(text) {
    addUserMessage(text);
    processUserMessage(text);
}

function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();

    if (message) {
        addUserMessage(message);
        processUserMessage(message);
        input.value = '';
    }
}

function handleChatKeypress(event) {
    if (event.key === 'Enter') {
        sendChatMessage();
    }
}

function addUserMessage(text) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageEl = document.createElement('div');
    messageEl.className = 'chat-message user';
    messageEl.innerHTML = `<div class="message-content">${text}</div>`;
    messagesContainer.appendChild(messageEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // 대화 기록에 추가
    chatHistory.push({ role: 'user', content: text });
}

function addBotMessage(html, showQuickReplies = false) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageEl = document.createElement('div');
    messageEl.className = 'chat-message bot';

    let content = `<div class="message-content">${html}</div>`;

    if (showQuickReplies) {
        content += `
            <div class="quick-replies">
                <button onclick="sendQuickReply('서비스 종류가 궁금해요')">서비스 종류</button>
                <button onclick="sendQuickReply('가격이 궁금해요')">가격 문의</button>
                <button onclick="sendQuickReply('상담 신청하고 싶어요')">상담 신청</button>
            </div>
        `;
    }

    messageEl.innerHTML = content;
    messagesContainer.appendChild(messageEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // 대화 기록에 추가
    chatHistory.push({ role: 'assistant', content: html });
}

function addTypingIndicator() {
    const messagesContainer = document.getElementById('chatMessages');
    const typingEl = document.createElement('div');
    typingEl.className = 'chat-message bot';
    typingEl.id = 'typingIndicator';
    typingEl.innerHTML = `
        <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;
    messagesContainer.appendChild(typingEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function removeTypingIndicator() {
    const typingEl = document.getElementById('typingIndicator');
    if (typingEl) {
        typingEl.remove();
    }
}

async function processUserMessage(message) {
    const apiKey = getApiKey();

    if (apiKey) {
        // Gemini API 사용
        addTypingIndicator();
        try {
            const response = await callGeminiAPI(message, apiKey);
            removeTypingIndicator();
            addBotMessage(response, true);

            // 상담 관련 키워드 감지 시 버튼 추가
            if (message.includes('상담') || message.includes('신청') || message.includes('문의')) {
                setTimeout(() => {
                    addBotMessage(`
                        <button onclick="openLeadForm(); closeChatbot();" style="
                            background: #6366f1;
                            color: white;
                            border: none;
                            padding: 12px 24px;
                            border-radius: 20px;
                            font-weight: 600;
                            cursor: pointer;
                            width: 100%;
                            margin-top: 8px;
                        ">상담 신청서 작성하기</button>
                    `);
                }, 300);
            }
        } catch (error) {
            removeTypingIndicator();
            console.error('Gemini API Error:', error);
            addBotMessage(`⚠️ <strong>오류 발생</strong><br><br>${error.message}<br><br>
                <small>문제가 지속되면 상단 ⚙ 버튼에서 API 키를 다시 확인해주세요.</small>`, true);
        }
    } else {
        // API 키 없으면 기존 키워드 기반 응답
        setTimeout(() => {
            const response = generateFallbackResponse(message);
            addBotMessage(response.text, response.showQuickReplies);

            if (response.showLeadForm) {
                setTimeout(() => {
                    addBotMessage(`
                        <button onclick="openLeadForm(); closeChatbot();" style="
                            background: #6366f1;
                            color: white;
                            border: none;
                            padding: 12px 24px;
                            border-radius: 20px;
                            font-weight: 600;
                            cursor: pointer;
                            width: 100%;
                            margin-top: 8px;
                        ">상담 신청서 작성하기</button>
                    `);
                }, 500);
            }
        }, 800);
    }
}

async function callGeminiAPI(message, apiKey) {
    // gemini-3-flash-preview 사용 (최신 모델)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

    // 대화 기록을 Gemini 형식으로 변환
    const contents = [];

    // 시스템 컨텍스트를 첫 번째 사용자 메시지로 추가
    contents.push({
        role: 'user',
        parts: [{ text: STUDIO_X_CONTEXT + '\n\n위 정보를 바탕으로 고객 응대를 시작합니다.' }]
    });
    contents.push({
        role: 'model',
        parts: [{ text: '네, 이해했습니다. STUDIO X AI 상담사로서 친절하게 응대하겠습니다.' }]
    });

    // 이전 대화 기록 추가 (최근 10개만)
    const recentHistory = chatHistory.slice(-10);
    for (const msg of recentHistory) {
        if (msg.role === 'user') {
            contents.push({
                role: 'user',
                parts: [{ text: msg.content }]
            });
        } else {
            contents.push({
                role: 'model',
                parts: [{ text: msg.content.replace(/<[^>]*>/g, '') }] // HTML 태그 제거
            });
        }
    }

    // 현재 메시지 추가
    contents.push({
        role: 'user',
        parts: [{ text: message }]
    });

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: contents,
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 500,
            },
            safetySettings: [
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
            ]
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || '';
        console.error('API Response Error:', response.status, errorData);

        // 구체적인 오류 메시지 생성
        if (response.status === 400) {
            throw new Error(`요청 오류: ${errorMessage || 'API 키 또는 요청 형식을 확인해주세요.'}`);
        } else if (response.status === 403) {
            throw new Error(`접근 거부: ${errorMessage || 'API 키가 활성화되지 않았습니다.'}`);
        } else if (response.status === 429) {
            throw new Error(`한도 초과: ${errorMessage || '잠시 후 다시 시도해주세요.'}`);
        } else {
            throw new Error(`오류 ${response.status}: ${errorMessage || '알 수 없는 오류'}`);
        }
    }

    const data = await response.json();

    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        let text = data.candidates[0].content.parts[0].text;
        // 줄바꿈을 <br>로 변환
        text = text.replace(/\n/g, '<br>');
        return text;
    }

    // 응답이 차단된 경우
    if (data.candidates && data.candidates[0] && data.candidates[0].finishReason === 'SAFETY') {
        return '죄송합니다. 해당 질문에는 답변드리기 어렵습니다. 다른 질문을 해주세요.';
    }

    throw new Error('응답을 처리할 수 없습니다.');
}

// API 키 없을 때 사용할 폴백 응답 (기존 키워드 기반)
function generateFallbackResponse(message) {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('서비스') || lowerMessage.includes('종류') || lowerMessage.includes('뭐')) {
        return {
            text: `STUDIO X에서 제공하는 서비스입니다.<br><br>
                <strong>1. 브랜드 아이덴티티</strong><br>
                로고, 명함, 브랜드 가이드라인 등<br><br>
                <strong>2. 웹사이트 디자인</strong><br>
                랜딩페이지, 기업 웹사이트, 이커머스<br><br>
                <strong>3. 앱 UI/UX 디자인</strong><br>
                사용자 리서치부터 프로토타입까지<br><br>
                어떤 서비스에 관심이 있으신가요?`,
            showQuickReplies: true,
            showLeadForm: false
        };
    }

    if (lowerMessage.includes('가격') || lowerMessage.includes('비용') || lowerMessage.includes('얼마')) {
        return {
            text: `가격 정보를 안내해드릴게요.<br><br>
                <strong>브랜드 아이덴티티</strong>: ₩1,500,000 ~<br>
                <strong>웹사이트 디자인</strong>: ₩2,000,000 ~ (BEST)<br>
                <strong>앱 UI/UX 디자인</strong>: ₩3,000,000 ~<br><br>
                정확한 견적은 무료 상담을 통해 안내받으실 수 있어요.`,
            showQuickReplies: true,
            showLeadForm: false
        };
    }

    if (lowerMessage.includes('기간') || lowerMessage.includes('시간') || lowerMessage.includes('얼마나')) {
        return {
            text: `프로젝트 진행 기간 안내입니다.<br><br>
                <strong>로고 디자인</strong>: 1-2주<br>
                <strong>웹사이트</strong>: 3-4주<br>
                <strong>앱 UI/UX</strong>: 4-6주<br><br>
                급한 일정도 조율 가능합니다.`,
            showQuickReplies: true,
            showLeadForm: false
        };
    }

    if (lowerMessage.includes('상담') || lowerMessage.includes('신청') || lowerMessage.includes('문의')) {
        return {
            text: `네! 무료 상담 신청을 도와드릴게요.<br><br>
                간단한 정보만 입력해주시면<br>
                <strong>24시간 내에 전담 매니저가 연락드립니다.</strong>`,
            showQuickReplies: false,
            showLeadForm: true
        };
    }

    if (lowerMessage.includes('안녕') || lowerMessage.includes('하이') || lowerMessage.includes('hello')) {
        return {
            text: `안녕하세요! STUDIO X 상담사입니다.<br><br>
                디자인 서비스에 대해 무엇이든 물어보세요.<br><br>
                💡 <strong>Tip:</strong> 상단 ⚙ 버튼에서 API 키를 설정하시면<br>
                AI가 더 자연스럽게 대화해드려요!`,
            showQuickReplies: true,
            showLeadForm: false
        };
    }

    return {
        text: `해당 내용은 전문 상담사가 더 자세히 안내해드릴 수 있어요.<br><br>
            무료 상담을 신청하시면 24시간 내에 연락드리겠습니다.<br><br>
            💡 <strong>Tip:</strong> 상단 ⚙ 버튼에서 API 키를 설정하시면<br>
            AI가 더 정확하게 답변해드려요!`,
        showQuickReplies: true,
        showLeadForm: true
    };
}

// ===== FAQ Accordion =====
document.addEventListener('DOMContentLoaded', function() {
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');

        question.addEventListener('click', () => {
            // 다른 아이템 닫기
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });

            // 현재 아이템 토글
            item.classList.toggle('active');
        });
    });
});

// ===== Smooth Scroll for Navigation =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ===== Navbar Background on Scroll =====
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(10, 10, 15, 0.98)';
    } else {
        navbar.style.background = 'rgba(10, 10, 15, 0.9)';
    }
});

// ===== Animation Keyframes =====
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }

    @keyframes slideUp {
        from {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        to {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
    }
`;
document.head.appendChild(style);

// ===== Lead Database Export (Admin Function) =====
function exportLeads() {
    const leads = JSON.parse(localStorage.getItem('studioXLeads') || '[]');

    if (leads.length === 0) {
        alert('저장된 리드가 없습니다.');
        return;
    }

    // CSV 형식으로 변환
    const headers = ['이름', '회사명', '이메일', '연락처', '관심서비스', '예산', '메시지', '신청일시'];
    const csvContent = [
        headers.join(','),
        ...leads.map(lead => [
            lead.name,
            lead.company || '',
            lead.email,
            lead.phone,
            lead.service || '',
            lead.budget || '',
            `"${(lead.message || '').replace(/"/g, '""')}"`,
            lead.timestamp
        ].join(','))
    ].join('\n');

    // 다운로드
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `studio-x-leads-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    console.log(`Exported ${leads.length} leads`);
}

// 콘솔에서 리드 확인 가능
function viewLeads() {
    const leads = JSON.parse(localStorage.getItem('studioXLeads') || '[]');
    console.table(leads);
    return leads;
}

// 콘솔 안내 메시지
console.log('%cSTUDIO X Lead Management', 'color: #6366f1; font-size: 16px; font-weight: bold;');
console.log('%cviewLeads() - 저장된 리드 확인', 'color: #a0a0b0;');
console.log('%cexportLeads() - CSV로 내보내기', 'color: #a0a0b0;');
