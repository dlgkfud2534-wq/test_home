// Google Apps Script - Lead Collection API
// 이 파일을 Google Apps Script에 복사하여 붙여넣으세요.

const SHEET_ID = "1ItO1zNBx2BWEJ-VBiNq6Q5P45rVYZAocAXL8yRAAQxI";

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
    const data = JSON.parse(e.postData.contents);

    // 첫 행에 헤더가 없으면 추가
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "신청일시",
        "이름",
        "회사명",
        "이메일",
        "연락처",
        "관심서비스",
        "예상예산",
        "프로젝트설명",
      ]);
    }

    // 서비스명 변환
    const serviceNames = {
      branding: "브랜드 아이덴티티",
      web: "웹사이트 디자인",
      app: "앱 UI/UX 디자인",
      all: "전체 패키지",
    };

    // 예산 변환
    const budgetNames = {
      under1m: "100만원 미만",
      "1m-3m": "100만원 ~ 300만원",
      "3m-5m": "300만원 ~ 500만원",
      over5m: "500만원 이상",
    };

    // 데이터 추가
    sheet.appendRow([
      new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }),
      data.name || "",
      data.company || "",
      data.email || "",
      data.phone || "",
      serviceNames[data.service] || data.service || "",
      budgetNames[data.budget] || data.budget || "",
      data.message || "",
    ]);

    return ContentService.createTextOutput(
      JSON.stringify({ success: true, message: "저장 완료" })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({
      status: "API is running",
      message: "Use POST to submit data",
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

// 테스트 함수 - Apps Script 에디터에서 실행하여 시트 연결 테스트
function testConnection() {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
    Logger.log("연결 성공! 시트 이름: " + sheet.getName());
    Logger.log("현재 행 수: " + sheet.getLastRow());
    return true;
  } catch (error) {
    Logger.log("연결 실패: " + error.toString());
    return false;
  }
}

// 헤더 초기화 함수 - 필요시 수동 실행
function initializeHeaders() {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();

  // 첫 행이 비어있으면 헤더 추가
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "신청일시",
      "이름",
      "회사명",
      "이메일",
      "연락처",
      "관심서비스",
      "예상예산",
      "프로젝트설명",
    ]);
    Logger.log("헤더가 추가되었습니다.");
  } else {
    Logger.log(
      "이미 데이터가 존재합니다. 첫 행: " +
        sheet.getRange(1, 1, 1, 8).getValues()
    );
  }
}
