# 이미지 교체 기록 (2026-09-13)

Built-in `image_gen`으로 생성. 최종 JPEG는 `public/images/`에 저장.
계절 아이콘은 256px, 회피요법 그림은 800px로 웹용 최적화.
겨울은 새로운 꽃가루 분류를 만들지 않고 통년성 사계절 표시에 사용.
‘입안환기 금지’는 꽃가루가 많은 날 실내 환기를 피한다는 의미로 해석.

## 검증

- `npm run build` 성공 (기존 500kB 초과 JS 번들 경고는 남아 있음).
- `npm test` 기존 테스트 12개 통과.
- 실제 SlideShow 컴포넌트에 통년성·봄·여름·가을·음식 항원이 포함된 합성 검증 데이터를 전달하여 Chrome에서 14개 슬라이드 탐색.
- 전체 슬라이드 및 인쇄용 14페이지의 이미지 로딩 성공, 페이지 실행 오류 및 HTTP 오류 0건.
- 교체 대상 화면을 1440×900 및 390×844에서 확인. 휴대폰은 기존 16:9 슬라이드를 축소 표시하는 구조 유지.
- PDF 및 화면 캡처: `/tmp/mast-image-verification/`.
- 실제 환자 데이터나 외부 저장은 사용하지 않았으며 OCR 실입력 흐름은 이번 화면 검증 범위에 포함하지 않음.

## 04-spring.jpg

Use case: illustration-story. Create one square website season icon, flat rounded bold shapes, minimal details, white background, fills 85% of canvas, recognizable at 40px. No text, no border, no scenery, no watermark. One large pink five-petal spring blossom with yellow center and two fresh green leaves.

## 04-summer.jpg

Use case: illustration-story. Create one square website season icon, flat rounded bold shapes, minimal details, white background, fills 85% of canvas, recognizable at 40px. No text, no border, no scenery, no watermark. One large vivid golden summer sun with eight short thick rays and a simple orange center.

## 04-autumn.jpg

Use case: illustration-story. Create one square website season icon, flat rounded bold shapes, minimal details, white background, fills 85% of canvas, recognizable at 40px. No text, no border, no scenery, no watermark. One large orange-red autumn maple leaf with a short brown stem.

## 04-winter.jpg

Use case: illustration-story. Create one square website season icon, flat rounded bold shapes, minimal details, white background, fills 85% of canvas, recognizable at 40px. No text, no border, no scenery, no watermark. One large sky-blue winter snowflake with six thick symmetrical branches.
## 05-avoid-mite-3.jpg

Use case: text-localization. Edit target: supplied humidity-control patient education image. Replace the humidity meter number "50%" with exactly "40%", bold dark readable digits. Keep the water droplet, gauge, window, plants, colors and rounded square composition unchanged. No other text. Output square.

## 05-avoid-pollen-1.jpg

Use case: precise-object-edit. Edit target: supplied patient-education illustration. Same friendly brown-haired adult woman wearing eyeglasses and a white mask covering nose and mouth. Add a clearly visible wide-brim beige sun hat. Reframe to show her from head to upper thighs with both arms visible, wearing a mint long-sleeved jacket buttoned in front with sleeves fully covering both arms to wrists. Make hat, mask and long sleeves equally obvious. Same soft illustration style and lightly simplified outdoor pollen background, square. No text or watermark.

## 05-avoid-pollen-3.jpg

Use case: scientific-educational. One square patient-education illustration in soft friendly pastel mint, sky blue, beige matching a Korean allergy education website. ONE coherent indoor scene clearly shows THREE large elements: left, a tall wardrobe-style steam clothing-care cabinet (AirDresser appliance) with glass door and a hanging long-sleeve jacket visible inside; center foreground a distinct waist-high white HEPA air purifier with top grille and small blue clean-air curves; upper right a CLOSED house window, yellow pollen particles strictly outside behind glass, and a large red circle slash over a small open-window symbol placed on that window to convey do not open windows during high pollen. All three objects large and legible, simple balanced composition, clean warm white background, rounded shapes, gentle shading. No car, no text, no brand logo, no misleading medical claims.
