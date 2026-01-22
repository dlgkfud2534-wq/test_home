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

// ===== AI Chatbot =====
let isChatbotOpen = false;

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
}

function processUserMessage(message) {
    // 타이핑 효과를 위한 지연
    setTimeout(() => {
        const response = generateBotResponse(message);
        addBotMessage(response.text, response.showQuickReplies);

        // 상담 신청 관련 메시지면 폼 열기 버튼 추가
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

function generateBotResponse(message) {
    const lowerMessage = message.toLowerCase();

    // 서비스 관련 질문
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

    // 가격 관련 질문
    if (lowerMessage.includes('가격') || lowerMessage.includes('비용') || lowerMessage.includes('얼마')) {
        return {
            text: `가격 정보를 안내해드릴게요.<br><br>
                <strong>브랜드 아이덴티티</strong><br>
                ₩1,500,000 ~<br><br>
                <strong>웹사이트 디자인</strong><br>
                ₩2,000,000 ~ (BEST)<br><br>
                <strong>앱 UI/UX 디자인</strong><br>
                ₩3,000,000 ~<br><br>
                정확한 견적은 프로젝트 규모에 따라 달라질 수 있어요.<br>
                무료 상담을 통해 맞춤 견적을 받아보시겠어요?`,
            showQuickReplies: true,
            showLeadForm: false
        };
    }

    // 기간 관련 질문
    if (lowerMessage.includes('기간') || lowerMessage.includes('시간') || lowerMessage.includes('얼마나')) {
        return {
            text: `프로젝트 진행 기간을 안내해드릴게요.<br><br>
                <strong>로고 디자인</strong>: 1-2주<br>
                <strong>웹사이트</strong>: 3-4주<br>
                <strong>앱 UI/UX</strong>: 4-6주<br><br>
                급한 일정도 조율 가능합니다.<br>
                자세한 상담을 원하시면 상담 신청을 해주세요.`,
            showQuickReplies: true,
            showLeadForm: false
        };
    }

    // 상담 신청 관련
    if (lowerMessage.includes('상담') || lowerMessage.includes('신청') || lowerMessage.includes('문의')) {
        return {
            text: `네! 무료 상담 신청을 도와드릴게요.<br><br>
                아래 버튼을 눌러 간단한 정보만 입력해주시면<br>
                <strong>24시간 내에 전담 매니저가 연락드립니다.</strong><br><br>
                - 상담 후 계약 강요 없음<br>
                - 견적서 무료 제공<br>
                - 맞춤형 솔루션 제안`,
            showQuickReplies: false,
            showLeadForm: true
        };
    }

    // 포트폴리오 관련
    if (lowerMessage.includes('포트폴리오') || lowerMessage.includes('작업') || lowerMessage.includes('사례')) {
        return {
            text: `저희 포트폴리오를 소개해드릴게요.<br><br>
                <strong>테크스타트업 A사</strong><br>
                → 리브랜딩 후 인지도 300% 상승<br><br>
                <strong>이커머스 B사</strong><br>
                → 웹사이트 리뉴얼로 전환율 150% 개선<br><br>
                <strong>핀테크 C사</strong><br>
                → 앱 디자인으로 앱스토어 피처드 선정<br><br>
                더 많은 포트폴리오는 상담 시 자세히 보여드릴게요.`,
            showQuickReplies: true,
            showLeadForm: false
        };
    }

    // 수정 관련
    if (lowerMessage.includes('수정') || lowerMessage.includes('피드백')) {
        return {
            text: `STUDIO X는 <strong>무제한 수정</strong>을 제공합니다.<br><br>
                고객님이 100% 만족하실 때까지<br>
                수정 횟수에 제한 없이 진행해드려요.<br><br>
                걱정 마시고 원하시는 대로 말씀해주세요.`,
            showQuickReplies: true,
            showLeadForm: false
        };
    }

    // 인사 관련
    if (lowerMessage.includes('안녕') || lowerMessage.includes('하이') || lowerMessage.includes('hello')) {
        return {
            text: `안녕하세요!<br><br>
                STUDIO X 상담사입니다.<br>
                디자인 서비스에 대해 무엇이든 물어보세요.<br><br>
                어떤 것이 궁금하신가요?`,
            showQuickReplies: true,
            showLeadForm: false
        };
    }

    // 기본 응답
    return {
        text: `감사합니다.<br><br>
            해당 내용에 대해서는 전문 상담사가<br>
            더 자세하게 안내해드릴 수 있어요.<br><br>
            무료 상담을 신청하시면<br>
            24시간 내에 연락드리겠습니다.`,
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
