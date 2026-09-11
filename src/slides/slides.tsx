import { COLORS, CLASS_COLOR } from './theme';
import { useRise, useReveal, easeOut } from './anim';
import { Frame, Title, Sub, Em, Tag, ClassLegend, Illust, Footer } from './ui';
import type { Buckets } from '../lib/classify';
import { birchCrossReaction } from '../lib/classify';
import { avoidanceCards } from '../lib/avoidance';
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
        style={{ position: 'absolute', left: 0, top: 0, width: 1250, height: 1080, objectFit: 'cover', objectPosition: 'left center' }}
      />
      <div style={{ position: 'absolute', right: 110, top: 0, bottom: 0, width: 900, display: 'flex', alignItems: 'center' }}>
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
export function S2Model() {
  const r = useReveal();
  const a = easeOut(r(10, 20));
  const b = easeOut(r(40, 20));
  const c = useRise(80, 24);
  const img = useRise(5, 20);
  return (
    <Frame>
      <Title>알레르기 비염은 어떤 병인가요?</Title>
      <div style={{ display: 'flex', gap: 50, flex: 1, alignItems: 'center', minHeight: 0 }}>
        <Illust src="02-infection-vs-allergy.jpg" fade="right" style={{ width: 1060, height: 596, flexShrink: 0, marginLeft: -40, ...img }} />
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
          marginTop: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 28,
          padding: '18px 34px',
          background: COLORS.beige,
          borderRadius: 24,
          fontSize: 38,
          fontWeight: 900,
          ...c,
        }}
      >
        <Illust src="02b-control-not-cure.jpg" style={{ width: 130, height: 130, borderRadius: 18 }} />
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
}: {
  title: string;
  when?: string;
  items: FamilyResult[];
  image: string;
  delay: number;
  size: number;
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
        <Illust src={image} style={{ width: 120, height: 120, borderRadius: 18 }} />
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
        <Column title="통년성" when="일 년 내내" items={b.perennial} image="04-perennial.jpg" delay={20} size={size} />
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
      <Illust src={image} style={{ width: 96, height: 96, borderRadius: 16 }} />
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

/* 5. 회피요법 */
export function S5Avoid({ d }: { d: SlideData }) {
  const cards = avoidanceCards(d.results);
  return (
    <Frame>
      <Title>원인 항원 피하기</Title>
      <Sub>완전히 없앨 수는 없지만, 노출을 줄이면 약이 훨씬 잘 듣습니다.</Sub>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cards.length <= 3 ? cards.length || 1 : Math.ceil(cards.length / 2)}, 1fr)`,
          gridAutoRows: '1fr',
          gap: 20,
          flex: 1,
          minHeight: 0,
        }}
      >
        {cards.length === 0 && <div style={{ fontSize: 30, color: COLORS.sub }}>양성 항원이 없어 회피요법 카드가 없습니다.</div>}
        {cards.slice(0, 6).map((c, i) => (
          <AvoidCardView key={c.key} c={c} delay={15 + i * 15} compact={cards.length > 3} />
        ))}
      </div>
    </Frame>
  );
}

function AvoidCardView({
  c,
  delay,
  compact,
}: {
  c: ReturnType<typeof avoidanceCards>[number];
  delay: number;
  compact: boolean;
}) {
  const st = useRise(delay);
  const r = useReveal();
  const img = compact ? 110 : 150;
  return (
    <div style={{ background: '#fff', borderRadius: 24, padding: compact ? 18 : 26, border: `2px solid ${COLORS.line}`, minHeight: 0, overflow: 'hidden', ...st }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <Illust src={c.image} style={{ width: img, height: img, borderRadius: 16 }} />
        <div>
          <div style={{ fontSize: compact ? 28 : 34, fontWeight: 900 }}>{c.title}</div>
          <div style={{ fontSize: compact ? 18 : 20, color: COLORS.sub }}>{c.families.slice(0, 8).join(', ')}{c.families.length > 8 ? ` 외 ${c.families.length - 8}개` : ''}</div>
        </div>
      </div>
      <ul style={{ margin: compact ? '10px 0 0' : '18px 0 0', paddingLeft: 28, fontSize: compact ? 21 : 25, lineHeight: 1.5 }}>
        {c.tips.map((t, i) => (
          <li key={i} style={{ opacity: easeOut(r(delay + 12 + i * 6, 12)) }}>
            {t}
          </li>
        ))}
      </ul>
    </div>
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
  return (
    <Frame>
      <Title>함께 나타날 수 있는 증상·질환</Title>
      <Sub>비염만 있는 게 아니라 아래 증상이 같이 있는 경우가 많습니다. 해당되면 말씀해 주세요.</Sub>
      <div style={{ display: 'flex', gap: 30, flex: 1, alignItems: 'center' }}>
        <Illust src="06-comorbid.jpg" fade="right" style={{ width: 760, height: 640, objectFit: 'cover', objectPosition: 'left center', marginLeft: -60 }} />
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
        <Illust src="07-treatment.jpg" fade="right" style={{ width: 780, height: 700, objectFit: 'cover', objectPosition: 'left center', alignSelf: 'center', marginLeft: -60 }} />
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
      <Illust src="08-timeline.jpg" fade="bottom" style={{ width: '100%', height: 520, objectFit: 'cover', objectPosition: 'center top', marginTop: -20 }} />
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
        <Illust src="09-future.jpg" fade="right" style={{ width: 960, height: 640, objectFit: 'cover', objectPosition: 'center', marginLeft: -40, flexShrink: 0 }} />
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

export const SLIDES: { key: string; title: string; render: (d: SlideData) => React.ReactNode; frames: number }[] = [
  { key: 'diagnosis', title: '진단', render: (d) => <S1Diagnosis d={d} />, frames: 90 },
  { key: 'model', title: '질병 모델', render: () => <S2Model />, frames: 130 },
  { key: 'report', title: '결과지', render: (d) => <S3Report d={d} />, frames: 60 },
  { key: 'allergens', title: '원인 항원', render: (d) => <S4Allergens d={d} />, frames: 150 },
  { key: 'avoid', title: '회피요법', render: (d) => <S5Avoid d={d} />, frames: 150 },
  { key: 'comorbid', title: '동반 증상', render: () => <S6Comorbid />, frames: 120 },
  { key: 'treatment', title: '치료 계획', render: () => <S7Treatment />, frames: 100 },
  { key: 'timeline', title: '효과·재진', render: () => <S8Timeline />, frames: 100 },
  { key: 'future', title: '향후 옵션', render: () => <S9Future />, frames: 90 },
];
