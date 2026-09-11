/** 앱 설정. 구글 시트 저장은 Apps Script 웹앱 URL을 넣으면 활성화된다 (docs/google-sheets-setup.md). */
export const config = {
  /** Google Apps Script 웹앱 배포 URL. 비어 있으면 저장을 건너뛴다. */
  sheetsWebAppUrl: '',
  /** 양성 판정 최소 Class */
  positiveMinClass: 1,
  /** 재진 안내 문구 */
  followUp: '2~4주 뒤',
  /** 효과 발현 안내 */
  onsetText: '1~2주',
};
