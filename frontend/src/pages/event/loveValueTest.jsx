import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Client from '../../api/client';
import styles from './loveValueTest.module.css';

// 15개 연애 가치관 질문 리스트
const QUESTIONS = [
  // 1. 연락 & 소통 스타일
  {
    id: 1,
    category: '1. 연락 & 소통 스타일',
    question: '연인과의 이상적인 연락 빈도는?',
    options: [
      { text: '바쁘더라도 수시로 톡·전화를 주고받고 싶다 📱', tag: '#칼답수시연락러', type: 'passionate' },
      { text: '출퇴근·점심·자기 전 등 정해진 루틴에 맞춰 연락하면 충분하다 ⏰', tag: '#루틴연락안정파', type: 'stable' },
      { text: '각자 할 일에 집중하다가 여유 있을 때 몰아서 연락하는 게 편하다 ☕', tag: '#여유로운개인파', type: 'independent' },
    ],
  },
  {
    id: 2,
    category: '1. 연락 & 소통 스타일',
    question: '다툼이나 서운한 일이 생겼을 때 선호하는 해결 방식은?',
    options: [
      { text: '감정이 식기 전에 바로 대화로 풀어야 직성이 풀린다 ⚡', tag: '#당일즉시해결파', type: 'passionate' },
      { text: '서로 감정을 가라앉힐 시간을 잠깐 가진 뒤 차분하게 얘기한다 🌿', tag: '#차분한대화형', type: 'rational' },
      { text: '웬만한 일은 크게 문제 삼지 않고 자연스럽게 넘어가는 편이다 🌊', tag: '#둥글게순리파', type: 'free_spirited' },
    ],
  },
  {
    id: 3,
    category: '1. 연락 & 소통 스타일',
    question: '애정 표현 방식 중 가장 중요하게 생각하는 것은?',
    options: [
      { text: '"사랑해", "보고 싶어" 같은 직접적인 말과 텍스트 표현 💬', tag: '#말로하는애정표현', type: 'passionate' },
      { text: '손잡기, 포옹 등 자연스러운 스킨십 🤝', tag: '#자연스러운스킨십', type: 'empathic' },
      { text: '바쁜 와중에도 시간 내어 챙겨주는 행동과 배려 🎁', tag: '#묵묵한행동배려', type: 'stable' },
    ],
  },

  // 2. 데이트 & 라이프스타일
  {
    id: 4,
    category: '2. 데이트 & 라이프스타일',
    question: '주말에 연인과 함께 보내고 싶은 이상적인 데이트는?',
    options: [
      { text: '핫플레이스, 맛집 탐방, 액티비티 등 활동적인 야외 데이트 🎡', tag: '#활동적핫플투어', type: 'passionate' },
      { text: '집에서 함께 요리하거나 OTT를 보며 쉬는 실내 데이트 🛋️', tag: '#아늑한홈데이트', type: 'empathic' },
      { text: '카페에서 책 읽거나 각자 할 일을 하면서 같은 공간에 있는 데이트 📚', tag: '#각자또같이데이트', type: 'independent' },
    ],
  },
  {
    id: 5,
    category: '2. 데이트 & 라이프스타일',
    question: '데이트 비용 분담에 대한 생각은?',
    options: [
      { text: '데이트 통장을 만들어 공동으로 관리하는 게 가장 합리적이다 💳', tag: '#합리적데이트통장', type: 'rational' },
      { text: '한 명이 밥을 사면 다른 한 명이 카페를 사는 식으로 번갈아 낸다 ☕', tag: '#자연스러운상호분담', type: 'stable' },
      { text: '수입이나 상황에 여유가 있는 쪽이 조금 더 부담해도 상관없다 🙆', tag: '#유연한비용부담', type: 'free_spirited' },
    ],
  },
  {
    id: 6,
    category: '2. 데이트 & 라이프스타일',
    question: '연인의 취미·여가 생활에 대한 나의 태도는?',
    options: [
      { text: '공통 취미를 만들어서 주말마다 함께 즐기고 싶다 🏸', tag: '#취미공유일체파', type: 'passionate' },
      { text: '서로의 개인 취미를 존중하고 각자의 시간을 보장해 주는 게 좋다 🎧', tag: '#개인취미존중러', type: 'independent' },
      { text: '상대방이 좋아한다면 나도 함께 배워보며 맞춰갈 의향이 있다 🎨', tag: '#맞춤형배려러', type: 'empathic' },
    ],
  },

  // 3. 인간관계 & 경계선
  {
    id: 7,
    category: '3. 인간관계 & 경계선',
    question: '연인의 이성 친구(남사친·여사친) 허용 범위는?',
    options: [
      { text: '단둘이 식사·술자리만 피한다면 단체 모임이나 연락은 괜찮다 👥', tag: '#선지키는모임허용', type: 'stable' },
      { text: '일적인 관계 외에 사적인 이성 친구 연락이나 만남은 불편하다 ⛔', tag: '#확실한경계주의', type: 'passionate' },
      { text: '서로 신뢰만 있다면 단둘이 만나더라도 크게 신경 쓰지 않는다 🕊️', tag: '#무한신뢰쿨러버', type: 'free_spirited' },
    ],
  },
  {
    id: 8,
    category: '3. 인간관계 & 경계선',
    question: '술자리 및 회식 문화에 대한 가치관은?',
    options: [
      { text: '함께 술 한잔 기울이며 대화하는 자리를 즐기는 편이다 🍻', tag: '#술자리대화러버', type: 'free_spirited' },
      { text: '가끔 분위기 맞추는 정도만 마시고 평소엔 술자리를 즐기지 않는다 🍹', tag: '#절제된술자리파', type: 'stable' },
      { text: '술을 거의 마시지 않으며, 연인도 잦은 술자리는 피했으면 좋겠다 🧃', tag: '#건전한논알콜선호', type: 'rational' },
    ],
  },
  {
    id: 9,
    category: '3. 인간관계 & 경계선',
    question: 'SNS(인스타그램 등) 연애 공개 여부는?',
    options: [
      { text: '프로필 사진이나 스토리 등으로 연애 중임을 자연스럽게 드러내고 싶다 📸', tag: '#당당한럽스타파', type: 'passionate' },
      { text: '서로 합의하에 가끔 기념일이나 여행 사진 정도만 올리는 게 좋다 🌅', tag: '#적당한기념일기록', type: 'stable' },
      { text: '사생활은 온라인에 굳이 공개하지 않고 둘만의 추억으로 남기고 싶다 🔒', tag: '#오프라인비공개파', type: 'independent' },
    ],
  },

  // 4. 연애 속도 & 미래관
  {
    id: 10,
    category: '4. 연애 속도 & 미래관',
    question: '연애를 시작할 때 가장 중요하게 보는 기준은?',
    options: [
      { text: '대화 코드와 유머 감각이 잘 통하는지 여부 💬', tag: '#티키타카대화코드', type: 'free_spirited' },
      { text: '외적 이상형과 첫인상에서 느껴지는 설렘 ✨', tag: '#첫인상심쿵설렘', type: 'passionate' },
      { text: '가치관, 생활 습관, 경제관념 등 현실적인 안정감 🏛️', tag: '#현실적가치관일치', type: 'rational' },
    ],
  },
  {
    id: 11,
    category: '4. 연애 속도 & 미래관',
    question: '현재 내가 생각하는 연애의 궁극적인 방향은?',
    options: [
      { text: '1~2년 내 결혼까지 진지하게 염두에 둔 진중한 만남 💍', tag: '#결혼전제진중파', type: 'stable' },
      { text: '당장 결혼보다는 서로 알아가며 깊고 안정적인 연애를 이어가는 것 🌿', tag: '#차근차근깊은연애', type: 'empathic' },
      { text: '부담 없이 설레고 즐거운 현재의 감정에 충실한 연애 🎈', tag: '#현재감정충실파', type: 'free_spirited' },
    ],
  },
  {
    id: 12,
    category: '4. 연애 속도 & 미래관',
    question: '기념일이나 이벤트에 대한 나의 성향은?',
    options: [
      { text: '100일, 생일, 크리스마스 등 주요 기념일은 꼭 챙겨야 의미가 있다 🎂', tag: '#기념일필수파', type: 'passionate' },
      { text: '거창한 이벤트보다 맛있는 식사나 작은 손편지 정도로 소소하게 챙긴다 💌', tag: '#소소한손편지감성', type: 'empathic' },
      { text: '날짜에 연연하기보다 평소 문득 생각날 때 챙겨주는 게 더 좋다 🎁', tag: '#일상속깜짝선물', type: 'independent' },
    ],
  },

  // 5. 갈등 & 가치관 디테일
  {
    id: 13,
    category: '5. 갈등 & 가치관 디테일',
    question: '연인의 흡연 여부에 대한 나의 기준은?',
    options: [
      { text: '반드시 비흡연자였으면 좋겠다 🚭', tag: '#단호한비흡연주의', type: 'rational' },
      { text: '전자담배 정도이거나 내 앞에서만 피우지 않으면 괜찮다 💨', tag: '#배려식흡연허용', type: 'stable' },
      { text: '흡연 여부는 연애 상대를 고르는 데 전혀 중요하지 않다 🍂', tag: '#흡연상관없음쿨러', type: 'free_spirited' },
    ],
  },
  {
    id: 14,
    category: '5. 갈등 & 가치관 디테일',
    question: '소비 습관 및 금전 가치관은 어떤 쪽에 가까운가?',
    options: [
      { text: '미래를 위해 저축과 재테크를 철저히 계획하는 편이다 📊', tag: '#철저한미래재테크', type: 'rational' },
      { text: '저축도 중요하지만 현재의 경험(여행, 맛집, 취미)에도 아낌없이 쓴다 ✈️', tag: '#경험투자욜로러', type: 'free_spirited' },
      { text: '큰 계획보다는 수입 범위 내에서 유연하게 소비하는 편이다 ⚖️', tag: '#유연한균형소비', type: 'stable' },
    ],
  },
  {
    id: 15,
    category: '5. 갈등 & 가치관 디테일',
    question: '힘든 일이 생겼을 때 연인에게 바라는 반응은?',
    options: [
      { text: '현실적인 해결책을 함께 고민해 주고 조언해 주는 것 💡', tag: '#현실적해결책지향', type: 'rational' },
      { text: '이유 불문 내 편이 되어 감정을 공감해 주고 위로해 주는 것 🧸', tag: '#무조건내편공감러', type: 'empathic' },
      { text: '해결책이나 위로보다 조용히 맛있는 걸 사주며 기분 전환을 시켜주는 것 🍰', tag: '#맛있는기분전환', type: 'stable' },
    ],
  },
];

// 6가지 연애 가치관 페르소나 결과 데이터
const RESULT_TYPES = {
  passionate: {
    typeKey: 'passionate',
    title: '직진 애정 불도저형',
    subtitle: '"사랑은 숨기는 게 아니야! 온 마음을 다해 아낌없이 표현하고 직진해요"',
    emoji: '🔥💖',
    desc: '수시로 주고받는 연락과 솔직한 애정 표현을 가장 중요하게 생각합니다. 갈등이 생기면 미루지 않고 즉시 대화로 풀어내며, 럽스타그램이나 당당한 공개 연애처럼 서로가 서로에게 1순위임을 온몸으로 확인받고 싶어 하는 열정적인 로맨티스트입니다.',
    recommendDate: '놀이공원, 핫플레이스 맛집 투어, 드라이브 등 열정 넘치는 활동형 데이트',
    charmPoint: '상대방을 불안하게 만들지 않는 확신에 찬 애정 표현과 든든한 직진 플러팅',
    bestMatch: '안정 지상주의 현실 안식처형 🏡',
    worstMatch: '스마트 존중 개인주의형 ☕',
  },
  stable: {
    typeKey: 'stable',
    title: '안정 지상주의 현실 안식처형',
    subtitle: '"흔들림 없는 신뢰와 차분한 일상 속에서 가장 깊은 사랑을 느껴요"',
    emoji: '🏡🌿',
    desc: '예측 가능하고 규칙적인 연락 루틴, 단단한 신뢰 관계를 최고의 가치로 여깁니다. 감정 기복이 적고 진중하여 연인에게 언제든 기댈 수 있는 든든한 나무가 되어주며, 먼 미래와 결혼까지 함께 걸어갈 수 있는 평생의 짝꿍을 찾습니다.',
    recommendDate: '고즈넉한 고궁 산책로 걷기, 조용한 근교 한옥 카페에서 차 한 잔',
    charmPoint: '한결같은 꾸준함과 신뢰감, 말보다 행동으로 증명하는 묵직한 배려심',
    bestMatch: '직진 애정 불도저형 🔥',
    worstMatch: '자연스러운 순리 욜로러 🌊',
  },
  independent: {
    typeKey: 'independent',
    title: '스마트 존중 개인주의형',
    subtitle: '"너는 너대로, 나는 나대로! 서로의 우주를 인정할 때 관계는 더 빛나요"',
    emoji: '☕🎧',
    desc: '연애 중에도 각자의 시간, 개인 취미, 일에 대한 몰입을 깊이 존중합니다. 지나친 구속이나 집착보다는 성숙한 거리두기 속에서 오는 편안함을 사랑하며, 같은 공간에서 각자 할 일을 하면서도 온기를 나눌 수 있는 산뜻한 연애를 지향합니다.',
    recommendDate: '채광 좋은 대형 북카페, 전시회 관람 후 각자의 감상 나누기',
    charmPoint: '상대를 숨 막히게 하지 않는 산뜻한 독립성과 성숙한 상호 존중 마인드',
    bestMatch: '자연스러운 순리 욜로러 🌊',
    worstMatch: '직진 애정 불도저형 🔥',
  },
  empathic: {
    typeKey: 'empathic',
    title: '공감 만렙 감성 힐러형',
    subtitle: '"내 편이 되어주는 따뜻한 말 한마디와 포근한 온기면 모든 게 충분해요"',
    emoji: '🧸💌',
    desc: '해결책보다는 "오늘 고생 많았어"라는 무조건적인 내 편 공감과 정서적 교감을 가장 소중히 여깁니다. 소소한 손편지, 다정한 스킨십, 둘만의 아늑한 홈데이트에서 큰 행복을 느끼며, 상대방의 작은 감정 변화까지 섬세하게 챙겨줍니다.',
    recommendDate: '집에서 함께 요리해 먹기, 빔프로젝터 켜두고 따뜻한 차 마시며 영화 보기',
    charmPoint: '상대방의 지친 영혼을 치유해 주는 따스한 공감력과 섬세한 감정 케어',
    bestMatch: '실속 명쾌 현실 플래너형 📋',
    worstMatch: '스마트 존중 개인주의형 ☕',
  },
  rational: {
    typeKey: 'rational',
    title: '실속 명쾌 현실 플래너형',
    subtitle: '"감정 소모보단 현명한 대화와 확실한 계획으로 함께 성장하고 싶어요"',
    emoji: '📋💡',
    desc: '감정적인 다툼보다는 차분한 이성적 조율을 선호하며, 데이트 통장이나 계획적 소비처럼 현실적이고 투명한 연애를 지향합니다. 흡연이나 금전관 등 기준이 명확하고 확고하여, 서로 좋은 영향을 주고받으며 함께 성장해 나가는 파트너십을 꿈꿉니다.',
    recommendDate: '동선 완벽한 힐링 드라이브 코스, 정갈한 솥밥 정식 & 깔끔한 티하우스',
    charmPoint: '문제 상황에서도 흔들리지 않는 현명한 판단력과 명쾌한 소통 방식',
    bestMatch: '공감 만렙 감성 힐러형 🧸',
    worstMatch: '자연스러운 순리 욜로러 🌊',
  },
  free_spirited: {
    typeKey: 'free_spirited',
    title: '자연스러운 순리 욜로러',
    subtitle: '"복잡한 규칙은 잊고, 지금 우리가 함께 있는 이 순간에 충실하자!"',
    emoji: '🌊🎈',
    desc: '사소한 규칙이나 계산에 얽매이지 않고 유쾌하고 자연스러운 연애를 즐깁니다. 유머 코드와 티키타카를 가장 중요하게 생각하며, 신뢰를 바탕으로 서로 쿨하게 자유를 주면서 "오늘 뭐 재밌는 거 없을까?"라며 즉흥적인 설렘을 만들어냅니다.',
    recommendDate: '발길 닿는 대로 떠나는 즉흥 밤바다 드라이브, 한강 피크닉 맥주 한잔',
    charmPoint: '함께 있으면 시간 가는 줄 모르는 유쾌한 텐션과 스트레스 없는 편안함',
    bestMatch: '스마트 존중 개인주의형 ☕',
    worstMatch: '안정 지상주의 현실 안식처형 🏡',
  },
};

const LoveValueTest = () => {
  const navi = useNavigate();

  // 화면 상태 ('intro' -> 'quiz' -> 'result')
  const [stage, setStage] = useState('intro');
  // 현재 몇 번째 질문인지 (0번 ~ 14번)
  const [currentIdx, setCurrentIdx] = useState(0);
  // 내가 고른 답변들을 순서대로 모아두는 배열
  const [answers, setAnswers] = useState([]);

  // 최종 계산된 결과 정보와 태그들
  const [resultInfo, setResultInfo] = useState(null);
  const [resultTags, setResultTags] = useState([]);

  // DB에서 불러온 이전 결과 저장 상태
  const [savedResult, setSavedResult] = useState(null);

  // 1. 페이지 로딩 시 최근 저장된 연애 가치관 결과 불러오기 (GET)
  useEffect(() => {
    const fetchLatestResult = async () => {
      try {
        // 내 회원번호 먼저 가져오기
        const seqRes = await Client.get('/api/chat/member-seq');
        const myMemberSeq = Number(seqRes.data);

        // 최근 결과 조회 GET 요청
        const res = await Client.get(`/api/event/love-value-test/latest?memberSeq=${myMemberSeq}`);
        if (res.data && res.data.resultType) {
          setSavedResult(res.data);
        }
      } catch (error) {
        console.log('이전 결과 조회 실패 또는 첫 테스트:', error);
      }
    };

    fetchLatestResult();
  }, []);

  // 이전 결과 바로보기 버튼 클릭
  const handleViewSavedResult = () => {
    if (!savedResult) return;
    const info = RESULT_TYPES[savedResult.resultType] || RESULT_TYPES.stable;
    setResultInfo(info);
    if (savedResult.tags) {
      setResultTags(savedResult.tags.split(','));
    }
    setStage('result');
  };

  // 테스트 시작 버튼 클릭
  const handleStart = () => {
    setAnswers([]);
    setCurrentIdx(0);
    setStage('quiz');
  };

  // 보기 버튼 클릭했을 때 실행되는 함수
  const handleSelectOption = async (option, optionIndex) => {
    // 1. 내가 방금 고른 답변을 배열에 추가 (몇 번 보기인지 번호도 같이 저장)
    const selectedItem = {
      type: option.type,
      tag: option.tag,
      choiceNo: optionIndex + 1, // 1번, 2번, 3번
    };
    const newAnswers = [...answers, selectedItem];
    setAnswers(newAnswers);

    // 2. 아직 마지막 문제(15번)가 아니면 다음 문제로 넘어감
    if (currentIdx + 1 < QUESTIONS.length) {
      setCurrentIdx(currentIdx + 1);
      return;
    }

    // 3. 마지막 문제를 풀었으면 점수 계산 시작!
    const scoreBoard = {
      passionate: 0,
      stable: 0,
      independent: 0,
      empathic: 0,
      rational: 0,
      free_spirited: 0,
    };

    const tagArray = [];
    const choiceNoArray = [];

    // 고른 15개 답변을 하나씩 꺼내서 점수 +1씩 더하기
    for (let i = 0; i < newAnswers.length; i++) {
      const item = newAnswers[i];
      scoreBoard[item.type] = scoreBoard[item.type] + 1;

      // 태그는 7개까지만 모으기
      if (tagArray.length < 7) {
        tagArray.push(item.tag);
      }
      choiceNoArray.push(item.choiceNo);
    }

    // 누가 제일 점수가 높은지 비교하기
    let bestType = 'stable';
    let maxScore = -1;
    const typeKeys = ['passionate', 'stable', 'independent', 'empathic', 'rational', 'free_spirited'];

    for (let i = 0; i < typeKeys.length; i++) {
      const key = typeKeys[i];
      if (scoreBoard[key] > maxScore) {
        maxScore = scoreBoard[key];
        bestType = key;
      }
    }

    const finalResult = RESULT_TYPES[bestType];
    setResultInfo(finalResult);
    setResultTags(tagArray);

    // 4. 백엔드(DB)로 결과 POST 전송하기
    try {
      // 내 회원번호(memberSeq) 먼저 가져오기
      const seqRes = await Client.get('/api/chat/member-seq');
      const myMemberSeq = Number(seqRes.data);

      // DB로 저장 요청 보내기 (POST)
      await Client.post('/api/event/love-value-test', {
        memberSeq: myMemberSeq,
        resultType: finalResult.typeKey,
        resultTitle: finalResult.title,
        resultEmoji: finalResult.emoji,
        tags: tagArray.join(','),             // "#칼답수시연락러,#당일즉시해결파,..."
        idealMatchDesc: finalResult.bestMatch,
        answers: choiceNoArray.join(','),     // "1,2,3,1,2,..."
      });
      console.log('연애 가치관 테스트 결과 DB 저장 성공!');
    } catch (error) {
      console.log('연애 가치관 DB 저장 실패:', error);
    }

    // 5. 결과 화면으로 이동
    setStage('result');
  };

  // 이전 질문으로 돌아가기
  const handlePrevQuestion = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
      setAnswers(answers.slice(0, answers.length - 1));
    } else {
      setStage('intro');
    }
  };

  const currentQ = QUESTIONS[currentIdx];
  const progressPercent = Math.round(((currentIdx + 1) / QUESTIONS.length) * 100);

  return (
    <div className={styles.container}>
      <div className={styles.bgGlow} />

      <div className={styles.card}>
        {/* 1. 시작 화면 */}
        {stage === 'intro' && (
          <div className={styles.introWrapper}>
            <div className={styles.introBadge}>💘 SILHOUETTE LOVE VALUE</div>
            <div className={styles.introIcon}>💌🌿💍</div>
            <h1 className={styles.introTitle}>나의 진짜 연애 가치관<br />심층 진단 테스트</h1>
            <p className={styles.introDesc}>
              연락 빈도, 갈등 해결, 데이트 비용, 미래관까지!<br />
              15가지 질문으로 알아보는 나의 연애 페르소나와<br />
              나와 꼭 맞는 찰떡 가치관 태그를 확인해보세요.
            </p>

            {/* 이전에 검사한 결과가 있을 경우 보여주는 미니 카드 */}
            {savedResult && (
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '16px',
                  padding: '16px 20px',
                  marginBottom: '10px',
                  width: '100%',
                  maxWidth: '380px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: '12px', color: 'var(--accent-pink)', fontWeight: 600 }}>
                  ✨ 최근 나의 가치관 진단 결과
                </span>
                <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
                  {savedResult.resultEmoji} {savedResult.resultTitle}
                </span>
                <button
                  type="button"
                  onClick={handleViewSavedResult}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#60a5fa',
                    fontSize: '13px',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    marginTop: '2px',
                  }}
                >
                  내 지난 결과 바로보기 →
                </button>
              </div>
            )}

            <button type="button" className={styles.primaryBtn} onClick={handleStart}>
              {savedResult ? '가치관 다시 진단하기 🔄' : '가치관 진단 시작하기 👉'}
            </button>
            <button type="button" className={styles.secondaryBtn} onClick={() => navi('/event')}>
              이벤트 목록으로 돌아가기
            </button>
          </div>
        )}

        {/* 2. 질문 화면 */}
        {stage === 'quiz' && (
          <div>
            <div className={styles.quizHeader}>
              <div className={styles.topRow}>
                <button type="button" className={styles.backBtn} onClick={handlePrevQuestion}>
                  ← 이전 질문
                </button>
                <div className={styles.stepCounter}>
                  Q{currentIdx + 1} / {QUESTIONS.length}
                </div>
              </div>

              <div className={styles.progressBarTrack}>
                <div className={styles.progressBarFill} style={{ width: `${progressPercent}%` }} />
              </div>
            </div>

            <div className={styles.questionBox}>
              <span className={styles.questionCategory}>{currentQ.category}</span>
              <h2 className={styles.questionTitle}>{currentQ.question}</h2>
            </div>

            <div className={styles.optionList}>
              {currentQ.options.map((opt, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={styles.optionBtn}
                  onClick={() => handleSelectOption(opt, idx)}
                >
                  <span>{opt.text}</span>
                  <span className={styles.optionArrow}>→</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 3. 결과 화면 */}
        {stage === 'result' && resultInfo && (
          <div className={styles.resultWrapper}>
            <div className={styles.resultHeader}>
              <span className={styles.resultPreBadge}>나의 연애 가치관 페르소나</span>
              <div className={styles.resultEmoji}>{resultInfo.emoji}</div>
              <h2 className={styles.resultTypeName}>{resultInfo.title}</h2>
              <p className={styles.resultSubtitle}>{resultInfo.subtitle}</p>
            </div>

            {/* 해시태그 목록 */}
            <div className={styles.tagSection}>
              <div className={styles.tagSectionTitle}># 나의 가치관 케미 태그</div>
              <div className={styles.tagList}>
                {resultTags.map((tag, idx) => (
                  <span key={idx} className={styles.customTag}>{tag}</span>
                ))}
              </div>
            </div>

            {/* 상세 설명 */}
            <div className={styles.descCard}>
              <div>
                <h4 className={styles.descItemTitle}>💡 가치관 성향 분석</h4>
                <p className={styles.descItemBody}>{resultInfo.desc}</p>
              </div>
              <div>
                <h4 className={styles.descItemTitle}>🎡 추천 데이트 코스</h4>
                <p className={styles.descItemBody}>{resultInfo.recommendDate}</p>
              </div>
              <div>
                <h4 className={styles.descItemTitle}>✨ 나의 핵심 매력 포인트</h4>
                <p className={styles.descItemBody}>{resultInfo.charmPoint}</p>
              </div>
            </div>

            {/* 궁합 */}
            <div className={styles.chemistryGrid}>
              <div className={styles.chemistryCard}>
                <span className={styles.chemLabel}>찰떡 가치관 짝꿍 💖</span>
                <span className={styles.chemValue}>{resultInfo.bestMatch}</span>
              </div>
              <div className={styles.chemistryCard}>
                <span className={styles.chemLabel}>조율이 필요한 짝꿍 ⚡</span>
                <span className={styles.chemValue}>{resultInfo.worstMatch}</span>
              </div>
            </div>

            <div className={styles.actionGroup}>
              <button type="button" className={styles.primaryBtn} onClick={handleStart}>
                다시 진단하기 🔄
              </button>
              <button type="button" className={styles.secondaryBtn} onClick={() => navi('/event')}>
                이벤트 목록으로 돌아가기 🎁
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoveValueTest;
