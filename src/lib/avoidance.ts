import type { FamilyResult } from './types';

export interface AvoidCard {
  key: string;
  title: string;
  image: string;
  tips: string[];
  /** 이 카드에 해당하는 항원 family 목록 */
  families: string[];
}

const PET = new Set(['고양이', '개', '말', '기니피그', '쥐', '양모', '토끼', '햄스터']);
const MOLD = new Set(['페니실리움', '클라도스포리움', '아스페르길루스', '칸디다', '알터나리아', '리조푸스']);
const MITE = new Set(['집먼지', '집먼지진드기', '수중다리진드기', '긴털가루진드기']);

/** 양성 항원 묶음 → 해당되는 회피요법 카드만 반환 */
export function avoidanceCards(results: FamilyResult[]): AvoidCard[] {
  const cards: AvoidCard[] = [];
  const has = (pred: (r: FamilyResult) => boolean) => results.filter(pred);

  const mite = has((r) => r.group === 'perennial' && MITE.has(r.family));
  if (mite.length)
    cards.push({
      key: 'mite',
      title: '집먼지진드기',
      image: '05-avoid-mite.png',
      families: mite.map((r) => r.family),
      tips: [
        '침구는 55~60℃ 뜨거운 물로 1~2주마다 세탁',
        '진드기 방지 커버(매트리스·베개)',
        '실내 습도 50% 이하, 자주 환기',
        '카펫·천 소파·봉제인형은 줄이기',
      ],
    });

  const pet = has((r) => r.group === 'perennial' && PET.has(r.family));
  if (pet.length)
    cards.push({
      key: 'pet',
      title: '동물 털·비듬',
      image: '05-avoid-pet.png',
      families: pet.map((r) => r.family),
      tips: [
        '침실에는 동물이 들어오지 않게',
        '만진 뒤 손 씻기, 옷 갈아입기',
        '공기청정기(HEPA) 사용',
        '주 1회 목욕·빗질은 다른 가족이',
      ],
    });

  const mold = has((r) => r.group === 'perennial' && MOLD.has(r.family));
  if (mold.length)
    cards.push({
      key: 'mold',
      title: '곰팡이',
      image: '05-avoid-mold.png',
      families: mold.map((r) => r.family),
      tips: [
        '욕실·주방은 사용 후 환풍기, 물기 제거',
        '결로·누수 부위 곰팡이 제거',
        '제습기로 습도 50% 이하 유지',
        '화분 흙·오래된 음식물 관리',
      ],
    });

  const roach = has((r) => r.family === '바퀴벌레');
  if (roach.length)
    cards.push({
      key: 'roach',
      title: '바퀴벌레',
      image: '05-avoid-mold.png',
      families: ['바퀴벌레'],
      tips: ['음식물은 밀폐 보관, 싱크대 물기 제거', '틈새 막기·전문 방제', '쓰레기는 바로 비우기'],
    });

  const pollen = has((r) => r.group === 'seasonal');
  if (pollen.length) {
    const seasons = [...new Set(pollen.map((r) => r.season))];
    const when =
      seasons
        .map((s) => (s === 'spring' ? '봄(3~5월)' : s === 'summer' ? '여름(5~8월)' : '가을(8~10월)'))
        .join('·') || '꽃가루 철';
    cards.push({
      key: 'pollen',
      title: `꽃가루 — ${when}`,
      image: '05-avoid-pollen.png',
      families: pollen.map((r) => r.family),
      tips: [
        '꽃가루 철에는 외출 시 마스크·안경',
        '창문은 닫고, 차 안은 내기순환',
        '귀가 후 샤워·옷 갈아입기',
        '꽃가루 예보 확인 (건조하고 바람 부는 날 심함)',
      ],
    });
  }

  const food = has((r) => r.group === 'food');
  if (food.length)
    cards.push({
      key: 'food',
      title: '음식·교차반응',
      image: '04-food-cross.png',
      families: food.map((r) => r.family),
      tips: [
        '검사 양성 ≠ 반드시 먹으면 안 됨',
        '먹고 입·목이 가렵거나 두드러기가 있었던 음식만 피하기',
        '꽃가루 알레르기가 있으면 생과일·견과에 입이 따끔할 수 있음 (익히면 대부분 괜찮음)',
        '심한 반응이 있었다면 재진 때 꼭 알려주세요',
      ],
    });

  return cards;
}
