# 알레르기 비염 · MAST 결과 설명 슬라이드

MAST 결과지 화면을 캡처해 붙여넣으면(Ctrl+V), 진료실에서 환자에게 넘겨 보여주는 설명 슬라이드를 만들어 줍니다.
서버 없이 브라우저 안에서만 동작하며(OCR 포함), GitHub Pages로 배포합니다.

## 사용법
1. 결과지의 「특이 IgE 항체 결과」 표를 `Print Screen` 또는 `Win+Shift+S` 로 캡처
2. 사이트에서 `Ctrl+V` → 자동 판독 (첫 실행은 언어 데이터 로딩으로 수십 초)
3. 판독 결과 확인 화면에서 틀린 항목 수정·삭제·추가, 환자 표기 입력
4. 「슬라이드 만들기」 → 화면 클릭 또는 ←/→ 로 넘김, 우상단 ‹이전/다음› 버튼, `PDF` 버튼으로 인쇄/저장

## 개발
```bash
npm install
npm run dev        # http://localhost:5173/MAST/
npm test           # 파서·매칭 단위 테스트
npm run build
node scripts/e2e.mjs scripts/sample.png   # 헤드리스 브라우저로 OCR→슬라이드 전체 흐름 검증
```

## 구조
- `src/lib/parse.ts` — OCR 줄/구분선 → Class별 항원 텍스트 → 항원 매칭
- `src/lib/match.ts` — 결과지 토큰 ↔ 마스터 항원 퍼지 매칭
- `src/lib/classify.ts` — family 단위 중복 제거, 통년성/계절성(봄·여름·가을)/음식·교차반응 분류
- `src/lib/avoidance.ts` — 항원 그룹별 회피요법 문구
- `src/slides/` — Remotion 슬라이드 9장
- `src/allergens.json` (= `data/allergens.json`) — 항원 마스터 165개
- `public/tess/` — Tesseract 워커·코어·한글/영문 언어 데이터 (자체 호스팅)
- `public/images/` — 슬라이드 그림 (`docs/image-prompts.md` 프롬프트로 생성해 넣기)
- `docs/google-sheets-setup.md` — 구글 시트 자동 저장 설정

## 배포
`main` 브랜치에 푸시하면 GitHub Actions가 GitHub Pages로 배포합니다.
저장소 Settings → Pages → Source 를 **GitHub Actions** 로 한 번 설정해야 합니다.
