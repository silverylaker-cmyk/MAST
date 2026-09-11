# 구글 시트 자동 저장 설정

1. 구글 시트를 하나 만들고 1행에 헤더를 적는다: `일시 | 환자 | 총IgE | 양성항원 | 원문`
2. 메뉴 **확장 프로그램 → Apps Script** 를 열고 아래 코드를 붙여넣는다.

```js
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  const p = JSON.parse(e.postData.contents);
  sheet.appendRow([p.createdAt, p.patient, p.totalIgE, p.positives, p.raw]);
  return ContentService.createTextOutput('ok');
}
```

3. **배포 → 새 배포 → 유형: 웹 앱**, 실행 사용자: **나**, 액세스 권한: **모든 사용자** 로 배포한다.
4. 발급된 웹앱 URL(`https://script.google.com/macros/s/.../exec`)을 `src/config.ts` 의 `sheetsWebAppUrl` 에 넣고 다시 배포한다.

이미지(결과지 캡처)는 시트에 저장하지 않는다.
