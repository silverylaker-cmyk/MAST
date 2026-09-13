import { COLORS, CLASS_COLOR } from './theme';
import { useRise, useReveal, easeOut } from './anim';
import { Frame, Title, Sub, Em, Tag, ClassLegend, Illust, Footer } from './ui';
import type { Buckets } from '../lib/classify';
import { birchCrossReaction } from '../lib/classify';
import { avoidanceCards, type AvoidCard } from '../lib/avoidance';
import { config } from '../config';
import type { FamilyResult } from '../lib/types';

export interface SlideData {
  patientLabel: string;
  totalIgE: number | null;
  results: FamilyResult[];
  buckets: Buckets;
  imageDataUrl: string | null;
}

/* 1. 진단 확정 */
export function S1Diagnosis({ d }: { d: SlideData }) {
  const who = d.patientLabel ? `${d.patientLabel}님은` : '검사 결과,';
  const st = useRise(30, 24);
  return (
    <Frame style={{ justifyContent: 'center', padding: 0 }}>
      <Illust
        src="01-diagnosis.jpg"
        fade="right"
        style={{ position: 'absolute', left: 0, top: 0, width: 1000, height: 1080, objectFit: 'cover', objectPosition: 'left center' }}
      />
      <div style={{ position: 'absolute', right: 110, top: 0, bottom: 0, width: 960, display: 'flex', alignItems: 'center' }}>
        <div>
          <Sub delay={0} size={40}>{who}</Sub>
          <Title delay={10} size={84}>
            <Em>알레르기 비염</Em>
            <br />
            으로 진단되었습니다
          </Title>
          <p style={{ fontSize: 34, color: COLORS.sub, lineHeight: 1.6, ...st }}>
            오늘은 왜 생기는지, 무엇이 원인인지,
            <br />
            어떻게 관리할지 차례로 설명드리겠습니다.
          </p>
        </div>
      </div>
    </Frame>
  );
}

/* 2. 질병 모델 한 줄 평 */
const BASE = import.meta.env.BASE_URL;

/** 감염 vs 과민반응 비교 그림. 가운데 선이 왼쪽으로 밀리며 과민반응(오른쪽) 패널이 커진다 */
function CompareImage({ width, height }: { width: number; height: number }) {
  const r = useReveal();
  // 0~40프레임: 가운데, 40~110프레임: 왼쪽으로, 이후 유지. 살짝 흔들리며 계속 밀리는 느낌
  const move = easeOut(r(40, 70));
  const pulse = easeOut(r(110, 40));
  const divider = width * (0.5 - 0.22 * move - 0.02 * pulse);
  const fadeIn = easeOut(r(5, 20));
  return (
    <div style={{ position: 'relative', width, height, overflow: 'hidden', borderRadius: 24, opacity: fadeIn, flexShrink: 0 }}>
      <img
        src={`${BASE}images/02-left.jpg`}
        alt=""
        style={{ position: 'absolute', left: 0, top: 0, width: width * 0.5, height, objectFit: 'cover', objectPosition: 'left center' }}
      />
      <div style={{ position: 'absolute', left: divider, top: 0, right: 0, height, overflow: 'hidden' }}>
        <img
          src={`${BASE}images/02-right.jpg`}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'right center' }}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          left: divider - 3,
          top: 0,
          width: 6,
          height,
          background: '#7C8A9B',
          boxShadow: `${-14 * move}px 0 22px rgba(232,93,4,${0.35 * move})`,
        }}
      />
      {/* 밀리는 방향 화살표 */}
      <div
        style={{
          position: 'absolute',
          left: divider - 70,
          top: 24,
          fontSize: 48,
          fontWeight: 900,
          color: '#E85D04',
          opacity: move * (1 - pulse * 0.4),
          transform: `translateX(${-18 * pulse}px)`,
        }}
      >
        ◀
      </div>
    </div>
  );
}

export function S2Model() {
  const r = useReveal();
  const a = easeOut(r(10, 20));
  const b = easeOut(r(40, 20));
  const c = useRise(90, 24);
  return (
    <Frame>
      <Title>알레르기 비염은 어떤 병인가요?</Title>
      <div style={{ display: 'flex', gap: 50, flex: 1, alignItems: 'center', minHeight: 0 }}>
        <CompareImage width={752} height={422} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 34 }}>
          <div style={{ opacity: a, transform: `translateX(${(1 - a) * 40}px)` }}>
            <div style={{ fontSize: 40, fontWeight: 900, color: COLORS.sub, textDecoration: 'line-through' }}>감염 ✗</div>
            <p style={{ fontSize: 28, color: COLORS.sub, margin: '6px 0 0' }}>세균·바이러스가 들어와서 생기는 병이 아닙니다</p>
          </div>
          <div style={{ opacity: b, transform: `translateX(${(1 - b) * 40}px)` }}>
            <div style={{ fontSize: 44, fontWeight: 900, color: COLORS.mintDark }}>면역 과민반응 ✓</div>
            <p style={{ fontSize: 28, lineHeight: 1.6, margin: '6px 0 0' }}>
              해롭지 않은 꽃가루·진드기에 몸의 면역이 <Em>지나치게 반응</Em>해서
              <br />
              콧물·재채기·코막힘이 생깁니다
            </p>
          </div>
        </div>
      </div>
      <div
        style={{
          marginTop: 18,
          display: 'flex',
          alignItems: 'center',
          gap: 28,
          padding: '14px 34px',
          background: COLORS.beige,
          borderRadius: 24,
          fontSize: 36,
          fontWeight: 900,
          ...c,
        }}
      >
        <Illust src="02b-control-not-cure.jpg" style={{ width: 100, height: 100, borderRadius: 18 }} />
        <div>
          그래서 목표는 <Em>완치</Em>가 아니라 <Em color="#D62828">잘 조절하는 것</Em>입니다
        </div>
      </div>
    </Frame>
  );
}

/* 3. 결과지 */
export function S3Report({ d }: { d: SlideData }) {
  const st = useRise(6, 20);
  return (
    <Frame>
      <Title>검사 결과지 (MAST 알레르기 검사)</Title>
      <Sub>혈액에서 항원별 IgE 항체를 측정한 결과입니다. 다음 장에서 정리해 드립니다.</Sub>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', ...st }}>
        {d.imageDataUrl ? (
          <img
            src={d.imageDataUrl}
            alt="검사 결과지"
            style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 16, boxShadow: '0 10px 40px rgba(0,0,0,.12)' }}
          />
        ) : (
          <div style={{ color: COLORS.sub, fontSize: 30 }}>결과지 이미지 없음</div>
        )}
      </div>
      {d.totalIgE !== null && <Footer text={`총 IgE ${d.totalIgE} IU/mL`} />}
    </Frame>
  );
}

function Column({
  title,
  when,
  items,
  image,
  delay,
  size,
  yearRound = false,
}: {
  title: string;
  when?: string;
  items: FamilyResult[];
  image: string;
  delay: number;
  size: number;
  yearRound?: boolean;
}) {
  const st = useRise(delay);
  return (
    <div
      style={{
        flex: 1,
        background: '#fff',
        borderRadius: 24,
        padding: 28,
        border: `2px solid ${COLORS.line}`,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        ...st,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {yearRound ? (
          <div aria-label="봄·여름·가을·겨울, 일 년 내내" role="img" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 44px)', gap: 4, flexShrink: 0 }}>
            {['spring', 'summer', 'autumn', 'winter'].map((season) => (
              <Illust key={season} src={`04-${season}.jpg`} style={{ width: 44, height: 44 }} />
            ))}
          </div>
        ) : <Illust src={image} style={{ width: 96, height: 96, borderRadius: 18 }} />}
        <div>
          <div style={{ fontSize: 36, fontWeight: 900 }}>{title}</div>
          {when && <div style={{ fontSize: 22, color: COLORS.sub }}>{when}</div>}
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 22 }}>
        {items.length === 0 ? (
          <span style={{ fontSize: 26, color: COLORS.sub }}>해당 없음</span>
        ) : (
          items.map((r, i) => <Tag key={r.family} r={r} delay={delay + 10 + i * 3} size={size} />)
        )}
      </div>
    </div>
  );
}

/** 양성 항원 수에 따라 태그 글자 크기를 줄인다 */
function tagSize(n: number): number {
  if (n <= 12) return 34;
  if (n <= 24) return 28;
  if (n <= 40) return 24;
  return 20;
}

/* 4. 내 원인 항원 */
export function S4Allergens({ d }: { d: SlideData }) {
  const b = d.buckets;
  const seasonal = [...b.spring, ...b.summer, ...b.autumn];
  const cross = birchCrossReaction(d.results);
  const st = useRise(90);
  const size = tagSize(d.results.length);
  return (
    <Frame>
      <Title>{d.patientLabel ? `${d.patientLabel}님의 ` : ''}원인 항원</Title>
      <ClassLegend delay={6} />
      <div style={{ display: 'flex', gap: 28, marginTop: 26, flex: 1 }}>
        <Column title="통년성" when="일 년 내내" items={b.perennial} image="04-perennial.jpg" delay={20} size={size} yearRound />
        <div style={{ flex: 1.6, display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
          <div style={{ fontSize: 30, fontWeight: 900, color: COLORS.sub }}>계절성 — 꽃가루 철에</div>
          <SeasonRow label="봄" when="3~5월" items={b.spring} image="04-spring.jpg" delay={35} size={size} />
          <SeasonRow label="여름" when="5~8월" items={b.summer} image="04-summer.jpg" delay={45} size={size} />
          <SeasonRow label="가을" when="8~10월" items={b.autumn} image="04-autumn.jpg" delay={55} size={size} />
          {seasonal.length === 0 && <div style={{ color: COLORS.sub, fontSize: 26 }}>계절성 항원 없음</div>}
        </div>
        <Column title="그 외 (음식·교차반응·기타)" items={[...b.food, ...b.other]} image="04-food-cross.jpg" delay={70} size={size} />
      </div>
      {cross.pollen.length > 0 && cross.foods.length > 0 && (
        <div style={{ marginTop: 18, fontSize: 26, color: COLORS.sub, ...st }}>
          ※ {cross.pollen.map((p) => p.family).join('·')} 꽃가루와 {cross.foods.map((f) => f.family).join('·')}은(는) 서로
          닮아서 함께 양성이 나오는 <Em>교차반응</Em>일 수 있습니다. 먹었을 때 증상이 없었다면 크게 걱정하지 않아도 됩니다.
        </div>
      )}
    </Frame>
  );
}

function SeasonRow({
  label,
  when,
  items,
  image,
  delay,
  size,
}: {
  label: string;
  when: string;
  items: FamilyResult[];
  image: string;
  delay: number;
  size: number;
}) {
  const st = useRise(delay);
  if (items.length === 0) return null;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        background: '#fff',
        borderRadius: 20,
        padding: '16px 22px',
        border: `2px solid ${COLORS.line}`,
        ...st,
      }}
    >
      <Illust src={image} alt={`${label} 계절 아이콘`} style={{ width: 77, height: 77, flexShrink: 0, borderRadius: 16 }} />
      <div style={{ width: 110, flexShrink: 0 }}>
        <div style={{ fontSize: 32, fontWeight: 900 }}>{label}</div>
        <div style={{ fontSize: 20, color: COLORS.sub, whiteSpace: 'nowrap' }}>{when}</div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, flex: 1 }}>
        {items.map((r, i) => (
          <Tag key={r.family} r={r} delay={delay + 8 + i * 3} size={size} />
        ))}
      </div>
    </div>
  );
}

/* 5. 회피요법 — 항원 묶음마다 한 장, 음식·교차반응은 안내문도 표시 */
export function S5AvoidOne({ c }: { c: AvoidCard }) {
  const r = useReveal();
  const single = c.images.length === 1;
  const showTips = c.key === 'food';
  const fams = c.families.slice(0, 8).join(', ') + (c.families.length > 8 ? ` 외 ${c.families.length - 8}개` : '');
  return (
    <Frame>
      <Title>{c.title}{showTips ? ' 안내' : ' 피하기'}</Title>
      <Sub>{fams}</Sub>
      <div
        style={{
          display: 'flex',
          gap: 40,
          flex: 1,
          minHeight: 0,
          alignItems: 'center',
          justifyContent: 'center',
          paddingBottom: 10,
        }}
      >
        {c.images.map((src, i) => {
          const t = easeOut(r(10 + i * 14, 18));
          return (
            <Illust
              key={src}
              src={src}
              alt={c.imageAlts?.[i] ?? ''}
              style={{
                width: showTips ? '43%' : single ? '58%' : undefined,
                flex: showTips ? '0 0 43%' : single ? undefined : '1 1 0',
                minWidth: 0,
                height: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                borderRadius: 28,
                opacity: t,
                transform: `translateY(${(1 - t) * 30}px)`,
              }}
            />
          );
        })}
        {showTips && (
          <div style={{ flex: 1, minWidth: 0, opacity: easeOut(r(24, 18)) }}>
            <ul style={{ margin: 0, paddingLeft: 44, fontSize: 36, lineHeight: 1.55, color: COLORS.ink }}>
              {c.tips.map((tip, i) => (
                <li key={tip} style={{ marginBottom: i === c.tips.length - 1 ? 0 : 28, fontWeight: i === 0 ? 900 : 500 }}>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Frame>
  );
}

/* 6. 동반 질환·증상 */
const COMORBID = [
  { name: '천식', desc: '기침·쌕쌕거림·숨참. 코와 기관지는 하나로 이어진 길입니다' },
  { name: '알레르기 결막염', desc: '눈 가려움·충혈·눈물' },
  { name: '부비동염(축농증)', desc: '누런 콧물, 얼굴 통증, 코막힘이 오래감' },
  { name: '수면 장애', desc: '코막힘으로 입 호흡·코골이·낮 졸림' },
  { name: '후각 저하', desc: '냄새를 잘 못 맡음, 코 점막 부종 때문' },
];
export function S6Comorbid() {
  const r = useReveal();
  const warn = useRise(8, 22);
  return (
    <Frame>
      <Title>함께 나타날 수 있는 증상·질환</Title>
      <Sub>비염만 있는 게 아니라 아래 증상이 같이 있는 경우가 많습니다. 해당되면 말씀해 주세요.</Sub>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          alignSelf: 'flex-start',
          margin: '2px 0 14px',
          padding: '12px 28px',
          background: COLORS.beige,
          borderRadius: 18,
          fontSize: 30,
          fontWeight: 800,
          color: '#9D0208',
          ...warn,
        }}
      >
        <span style={{ fontSize: 30 }}>⚠</span>
        조절하지 않으면 귀, 목을 거쳐 심장과 폐까지 번집니다.
      </div>
      <div style={{ display: 'flex', gap: 30, flex: 1, alignItems: 'center' }}>
        <Illust src="06-comorbid.jpg" fade="right" style={{ width: 608, height: 512, objectFit: 'cover', objectPosition: 'left center', marginLeft: -40 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {COMORBID.map((c, i) => {
            const t = easeOut(r(15 + i * 14, 16));
            return (
              <div
                key={c.name}
                style={{
                  display: 'flex',
                  gap: 22,
                  alignItems: 'baseline',
                  background: '#fff',
                  border: `2px solid ${COLORS.line}`,
                  borderRadius: 18,
                  padding: '16px 26px',
                  opacity: t,
                  transform: `translateX(${(1 - t) * 40}px)`,
                }}
              >
                <div style={{ fontSize: 34, fontWeight: 900, color: COLORS.mintDark, minWidth: 300 }}>{c.name}</div>
                <div style={{ fontSize: 26, color: COLORS.sub }}>{c.desc}</div>
              </div>
            );
          })}
        </div>
      </div>
    </Frame>
  );
}

/* 7. 치료 계획 */
export function S7Treatment() {
  const a = useRise(10);
  const b = useRise(30);
  const c = useRise(55);
  const box = (extra: React.CSSProperties): React.CSSProperties => ({
    background: '#fff',
    border: `2px solid ${COLORS.line}`,
    borderRadius: 24,
    padding: 30,
    ...extra,
  });
  return (
    <Frame>
      <Title>치료 계획</Title>
      <div style={{ display: 'flex', gap: 40, flex: 1, alignItems: 'stretch' }}>
        <Illust src="07-treatment.jpg" fade="right" style={{ width: 624, height: 560, objectFit: 'cover', objectPosition: 'left center', alignSelf: 'center', marginLeft: -40 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div style={box({ borderColor: COLORS.mintDark, borderWidth: 4, ...a })}>
            <div style={{ fontSize: 26, color: COLORS.mintDark, fontWeight: 900 }}>기본 치료 ①</div>
            <div style={{ fontSize: 44, fontWeight: 900 }}>스테로이드 코 스프레이</div>
            <div style={{ fontSize: 26, color: COLORS.sub, lineHeight: 1.5 }}>
              매일 꾸준히. 코 점막에만 작용하고 몸으로 거의 흡수되지 않아 안전합니다.
            </div>
          </div>
          <div style={box({ borderColor: COLORS.mintDark, borderWidth: 4, ...b })}>
            <div style={{ fontSize: 26, color: COLORS.mintDark, fontWeight: 900 }}>기본 치료 ②</div>
            <div style={{ fontSize: 44, fontWeight: 900 }}>코 세척 (생리식염수)</div>
            <div style={{ fontSize: 26, color: COLORS.sub, lineHeight: 1.5 }}>
              하루 1~2회. 콧속 항원과 분비물을 씻어내 스프레이가 더 잘 듣게 합니다.
            </div>
          </div>
          <div style={box({ opacity: 1, ...c })}>
            <div style={{ fontSize: 26, color: COLORS.sub, fontWeight: 900 }}>선택</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: COLORS.sub }}>경구 알레르기약</div>
            <div style={{ fontSize: 24, color: COLORS.sub, lineHeight: 1.5 }}>
              증상이 심한 날, 또는 눈 가려움이 동반될 때 필요에 따라 함께 씁니다.
            </div>
          </div>
        </div>
      </div>
    </Frame>
  );
}

/* 8. 효과 시점 · 재진 */
export function S8Timeline() {
  const r = useReveal();
  const line = easeOut(r(10, 50));
  const steps = [
    { t: '오늘', s: '스프레이 + 코세척 시작', c: COLORS.sky },
    { t: config.onsetText, s: '효과가 느껴지기 시작 — 그 전엔 효과 없어 보여도 계속 쓰세요', c: COLORS.mint },
    { t: config.followUp, s: '재진 — 효과 확인, 용법 조정', c: COLORS.mintDark },
  ];
  return (
    <Frame>
      <Title>언제 좋아지고, 언제 다시 오나요?</Title>
      <Illust src="08-timeline-crop.jpg" style={{ width: '84%', height: 'auto', margin: '-6px auto 0', borderRadius: 20 }} />
      <div style={{ position: 'relative', marginTop: 30, flex: 1 }}>
        <div
          style={{
            position: 'absolute',
            left: 60,
            right: 60,
            top: 40,
            height: 10,
            borderRadius: 5,
            background: COLORS.line,
          }}
        >
          <div style={{ width: `${line * 100}%`, height: '100%', borderRadius: 5, background: COLORS.mintDark }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 20px' }}>
          {steps.map((s, i) => {
            const t = easeOut(r(15 + i * 20, 16));
            return (
              <div key={i} style={{ width: 520, textAlign: 'center', opacity: t, transform: `translateY(${(1 - t) * 30}px)` }}>
                <div
                  style={{
                    width: 90,
                    height: 90,
                    borderRadius: '50%',
                    background: s.c,
                    margin: '0 auto 22px',
                    boxShadow: '0 6px 18px rgba(0,0,0,.12)',
                  }}
                />
                <div style={{ fontSize: 44, fontWeight: 900 }}>{s.t}</div>
                <div style={{ fontSize: 26, color: COLORS.sub, lineHeight: 1.5, marginTop: 8 }}>{s.s}</div>
              </div>
            );
          })}
        </div>
      </div>
    </Frame>
  );
}

/* 9. 향후 옵션 */
export function S9Future() {
  const a = useRise(10);
  const b = useRise(40, 24);
  return (
    <Frame style={{ justifyContent: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <Illust src="09-future.jpg" fade="right" style={{ width: 768, height: 512, objectFit: 'cover', objectPosition: 'center', marginLeft: -20, flexShrink: 0 }} />
        <div>
          <Title delay={0}>앞으로의 선택지</Title>
          <p style={{ fontSize: 38, lineHeight: 1.6, ...a }}>
            약으로 조절이 충분하지 않으면
            <br />
            <Em>면역치료</Em>(원인 항원에 몸을 길들이는 치료)나
            <br />
            <Em>수술</Em>(코막힘 구조 교정)도 고려할 수 있습니다.
          </p>
          <div style={{ marginTop: 30, padding: '20px 30px', background: COLORS.beige, borderRadius: 20, fontSize: 30, ...b }}>
            자세한 내용은 <b>재진 때</b> 상태를 보고 말씀드리겠습니다.
          </div>
        </div>
      </div>
    </Frame>
  );
}

export interface SlideDef {
  key: string;
  title: string;
  render: (d: SlideData) => React.ReactNode;
  frames: number;
}

export function buildSlides(d: SlideData): SlideDef[] {
  const avoid: SlideDef[] = avoidanceCards(d.results).map((c) => ({
    key: `avoid-${c.key}`,
    title: `회피 — ${c.title}`,
    render: () => <S5AvoidOne c={c} />,
    frames: 90,
  }));
  return [
    { key: 'diagnosis', title: '진단', render: (x) => <S1Diagnosis d={x} />, frames: 90 },
    { key: 'model', title: '질병 모델', render: () => <S2Model />, frames: 170 },
    { key: 'report', title: '결과지', render: (x) => <S3Report d={x} />, frames: 60 },
    { key: 'allergens', title: '원인 항원', render: (x) => <S4Allergens d={x} />, frames: 150 },
    ...avoid,
    { key: 'comorbid', title: '동반 증상', render: () => <S6Comorbid />, frames: 130 },
    { key: 'treatment', title: '치료 계획', render: () => <S7Treatment />, frames: 100 },
    { key: 'timeline', title: '효과·재진', render: () => <S8Timeline />, frames: 100 },
    { key: 'future', title: '향후 옵션', render: () => <S9Future />, frames: 90 },
  ];
}
