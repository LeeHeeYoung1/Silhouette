import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './foodTest.module.css';

// 15개 질문 및 선택지 데이터
const QUESTIONS = [
  {
    id: 1,
    question: '첫 만남 저녁 메뉴로 가장 끌리는 곳은?',
    options: [
      {
        text: '분위기 좋은 이탈리안 레스토랑에서 파스타와 와인 🍝',
        tag: '#와인파스타파',
        scores: { romantic: 3, trendy: 1 },
      },
      {
        text: '어색함을 단번에 깨줄 든든한 고깃집이나 이자카야 🥩',
        tag: '#노포고깃집파',
        scores: { nopo: 3, balancer: 1 },
      },
      {
        text: '부담 없이 가볍게 즐길 수 있는 감성 브런치 카페 🥐',
        tag: '#감성브런치러',
        scores: { sweet: 2, homecook: 2 },
      },
    ],
  },
  {
    id: 2,
    question: 'SNS에서 핫한 맛집! 웨이팅은 어디까지 가능할까?',
    options: [
      {
        text: '맛있다면 1시간 이상 줄 서는 것도 데이트의 묘미! ⏳',
        tag: '#웨이팅불사러',
        scores: { trendy: 3, romantic: 1 },
      },
      {
        text: '30분 이내라면 기다릴 수 있어, 그 이상은 패스 🕒',
        tag: '#실속웨이팅러',
        scores: { balancer: 3, sweet: 1 },
      },
      {
        text: '웨이팅은 절대 사절! 무조건 예약되거나 바로 들어가는 곳으로 🏃',
        tag: '#예약필수파',
        scores: { balancer: 2, nopo: 2 },
      },
    ],
  },
  {
    id: 3,
    question: '나의 매운맛 전투력은?',
    options: [
      {
        text: '엽떡 오리지널·불닭볶음면 거뜬! 스트레스는 매운맛으로 🔥',
        tag: '#맵부심최강자',
        scores: { nopo: 2, trendy: 2 },
      },
      {
        text: '신라면 정도가 딱 맛있게 매워요 🌶️',
        tag: '#적당한맵기러',
        scores: { balancer: 2, sweet: 2 },
      },
      {
        text: '매운 건 못 먹는 맵찔이, 순한 맛 최고 🍼',
        tag: '#순한맛지킴이',
        scores: { homecook: 2, sweet: 2 },
      },
    ],
  },
  {
    id: 4,
    question: '연인과 함께하는 술자리 스타일은?',
    options: [
      {
        text: '분위기 있게 와인바나 칵테일바에서 한두 잔 🍷',
        tag: '#와인칵테일러',
        scores: { romantic: 3, trendy: 1 },
      },
      {
        text: '노포 감성 포차에서 소주·맥주에 국물 안주 🍻',
        tag: '#노포감성미식가',
        scores: { nopo: 3, balancer: 1 },
      },
      {
        text: '술보다는 맛있는 안주와 음료수! 논알콜 파 🥤',
        tag: '#달콤논알콜파',
        scores: { sweet: 2, homecook: 2 },
      },
    ],
  },
  {
    id: 5,
    question: '식사 후 카페 타임, 나의 선택은?',
    options: [
      {
        text: '배불러도 디저트 배는 따로! 케이크·크로플 필수 🍰',
        tag: '#디저트배따로',
        scores: { romantic: 2, trendy: 2 },
      },
      {
        text: '깔끔하게 아메리카노나 차 한 잔이면 충분해 ☕',
        tag: '#얼죽아깔끔파',
        scores: { balancer: 3, nopo: 1 },
      },
      {
        text: '카페보다는 소화시킬 겸 산책이나 다른 놀거리로 이동 🚶',
        tag: '#산책활동파',
        scores: { sweet: 2, nopo: 1 },
      },
    ],
  },
  {
    id: 6,
    question: '음식이 나왔을 때, 사진 촬영 스타일은?',
    options: [
      {
        text: '항공샷부터 감성 컷까지! 예쁘게 찍고 먹어야 직성이 풀려 📸',
        tag: '#감성인증샷장인',
        scores: { trendy: 3, romantic: 1 },
      },
      {
        text: '딱 한두 장만 빠르게 찍고 바로 젓가락 들기 ⚡',
        tag: '#스피드한장러',
        scores: { balancer: 2, sweet: 2 },
      },
      {
        text: '식기 전에 먹는 게 국룰, 사진은 패스 🥢',
        tag: '#본능적미식가',
        scores: { nopo: 3, homecook: 1 },
      },
    ],
  },
  {
    id: 7,
    question: '호불호 갈리는 이국적 향신료(마라, 고수, 양꼬치 등)에 대한 생각은?',
    options: [
      {
        text: '없어서 못 먹지! 향신료 듬뿍 들어간 음식 극호 🌿',
        tag: '#향신료극호러버',
        scores: { trendy: 3, nopo: 1 },
      },
      {
        text: '마라탕 정도는 괜찮은데 고수나 강한 향신료는 빼고 먹어 🙂',
        tag: '#적당한도전러',
        scores: { balancer: 2, sweet: 2 },
      },
      {
        text: '익숙하고 무난한 한식·일식·양식이 제일 편해 🍚',
        tag: '#클래식입맛파',
        scores: { homecook: 2, balancer: 2 },
      },
    ],
  },
  {
    id: 8,
    question: '날것(회, 육회, 간장게장, 굴 등) 취향은?',
    options: [
      {
        text: '회·육회·해산물이라면 자다가도 벌떡! 🍣',
        tag: '#해산물육회러버',
        scores: { nopo: 2, romantic: 2 },
      },
      {
        text: '신선한 연어회나 육회 정도는 맛있게 먹어 🐟',
        tag: '#소프트날것파',
        scores: { balancer: 2, sweet: 2 },
      },
      {
        text: '익히지 않은 날음식은 조금 부담스러워 🍳',
        tag: '#완벌익힘파',
        scores: { homecook: 3, sweet: 1 },
      },
    ],
  },
  {
    id: 9,
    question: '데이트 메뉴를 고를 때 나의 스타일은?',
    options: [
      {
        text: '미리 맛집 리스트 3~4곳을 정리해서 제안하는 계획파 📋',
        tag: '#철두철미계획러',
        scores: { balancer: 3, romantic: 1 },
      },
      {
        text: '"오늘 뭐 땡겨?" 서로 의견 나누며 즉흥적으로 결정 🤝',
        tag: '#소통형즉흥러',
        scores: { trendy: 2, nopo: 2 },
      },
      {
        text: '상대가 먹고 싶은 거라면 뭐든 다 잘 먹는 편! 🙆',
        tag: '#취향맞춤천사',
        scores: { sweet: 3, homecook: 1 },
      },
    ],
  },
  {
    id: 10,
    question: '주말에 연인과 식사할 때 더 선호하는 방식은?',
    options: [
      {
        text: '예쁘게 차려입고 밖에서 새로운 맛집 투어 🍽️',
        tag: '#주말핫플투어러',
        scores: { romantic: 2, trendy: 3 },
      },
      {
        text: '집에서 편하게 배달 음식 시켜 먹으며 OTT 정주행 🛵',
        tag: '#배달OTT집콕파',
        scores: { homecook: 2, nopo: 2 },
      },
      {
        text: '장 봐서 같이 요리해 먹는 홈쿡 데이트 👩‍🍳',
        tag: '#로맨틱홈쿡러',
        scores: { homecook: 3, sweet: 2 },
      },
    ],
  },
  {
    id: 11,
    question: '기념일이 아닌 평범한 데이트, 식비에 대한 생각은?',
    options: [
      {
        text: '맛과 분위기만 좋다면 인당 4~5만 원 이상도 아깝지 않아 💎',
        tag: '#분위기투자파',
        scores: { romantic: 3, trendy: 1 },
      },
      {
        text: '적당히 깔끔하고 가성비 좋은 1~2만 원대 맛집이 최고 👍',
        tag: '#가성비실속파',
        scores: { balancer: 3, homecook: 1 },
      },
      {
        text: '평소는 소소하게 먹고, 특별한 날에 오마카세·파인다이닝으로 한 방! ✨',
        tag: '#강약조절미식파',
        scores: { romantic: 2, balancer: 2 },
      },
    ],
  },
  {
    id: 12,
    question: '밤 11시, 연인이 "야식 먹을래?"라고 묻는다면?',
    options: [
      {
        text: '치킨? 떡볶이? 라면? 메뉴 고르기부터 신남 🍗',
        tag: '#야식열정만렙',
        scores: { nopo: 3, trendy: 1 },
      },
      {
        text: '가볍게 과일이나 요거트 정도만 같이 먹을래 🍓',
        tag: '#가벼운야식러',
        scores: { sweet: 2, homecook: 2 },
      },
      {
        text: '밤늦게 먹으면 속 불편해, 내일 맛있는 거 먹자! 🌙',
        tag: '#건강속편한파',
        scores: { balancer: 3, sweet: 1 },
      },
    ],
  },
  {
    id: 13,
    question: '식사할 때 나는 어떤 타입?',
    options: [
      {
        text: '이야기하면서 천천히, 여유롭게 음미하며 먹어 🐢',
        tag: '#대화와여유러버',
        scores: { romantic: 3, sweet: 1 },
      },
      {
        text: '맛있으면 텐션 업! 비교적 빠르고 복스럽게 먹는 편 🐇',
        tag: '#맛있으면광속먹방',
        scores: { nopo: 2, trendy: 2 },
      },
      {
        text: '상대방 식사 속도에 자연스럽게 맞춰주는 편 ⚖️',
        tag: '#속도조절배려왕',
        scores: { sweet: 3, balancer: 1 },
      },
    ],
  },
  {
    id: 14,
    question: '단짠·밸런스 취향! 더 포기할 수 없는 쪽은?',
    options: [
      {
        text: '뜨끈한 국물과 짭짤한 밥도둑 (찌개, 국밥, 전골) 🍲',
        tag: '#뜨끈한국물파',
        scores: { nopo: 3, homecook: 1 },
      },
      {
        text: '바삭하고 고소한 구이·튀김류 (삼겹살, 치킨, 돈까스) 🍤',
        tag: '#고소바삭튀김러',
        scores: { balancer: 2, trendy: 2 },
      },
      {
        text: '상큼하고 깔끔한 면·샐러드류 (파스타, 냉면, 포케) 🥗',
        tag: '#깔끔프레시러',
        scores: { romantic: 2, sweet: 2 },
      },
    ],
  },
  {
    id: 15,
    question: '호불호 음식 끝판왕(민트초코, 하와이안 피자, 오이 등)에 대한 나의 태도는?',
    options: [
      {
        text: '뭐든 잘 먹는 편! 오히려 민초·파인애플 피자 환영 🍍',
        tag: '#호불호종결자',
        scores: { trendy: 2, nopo: 2 },
      },
      {
        text: '딱 1~2개 빼고는 다 잘 먹어 (편식 거의 없음) 🥒',
        tag: '#무난한둥글러',
        scores: { sweet: 2, balancer: 2 },
      },
      {
        text: '싫어하는 재료는 확실한 편, 주문할 때 미리 빼달라고 해 🙅',
        tag: '#확고한취향파',
        scores: { romantic: 2, homecook: 2 },
      },
    ],
  },
];

// 결과 유형 정의 (6가지 미식 페르소나)
const RESULT_TYPES = {
  romantic: {
    typeKey: 'romantic',
    title: '분위기 지상주의 로맨틱 고메',
    subtitle: '"맛도 중요하지만, 식탁에 흐르는 공기와 무드가 제일 설레요"',
    emoji: '🍷✨',
    desc: '조용한 조명, 감미로운 음악, 예쁜 플레이팅과 함께하는 식사를 사랑하는 로맨티스트입니다. 특별한 첫 만남일수록 와인 페어링이나 이탈리안 레스토랑처럼 둘만의 대화에 온전히 몰입할 수 있는 분위기를 가장 중요하게 생각합니다.',
    recommendMenu: '트러플 파스타와 내추럴 와인 한잔, 은은한 조명의 비스트로',
    dateTip: '서로의 하루를 묻고 아이컨택을 나누며 여유롭게 템포를 맞춰보세요.',
    bestMatch: '핫플 웨이팅 열정 트렌드세터 📸',
    worstMatch: '노포 감성 소울푸드 마스터 🥩',
  },
  nopo: {
    typeKey: 'nopo',
    title: '노포 감성 소울푸드 마스터',
    subtitle: '"두꺼운 겉치레보단 찐맛집과 시원한 술 한 잔에 털털한 대화가 최고!"',
    emoji: '🥩🍻',
    desc: '어색한 정적을 단번에 날려버릴 지글지글 고깃집이나 정겨운 노포 포차를 사랑하는 털털한 미식가입니다. 맛있는 음식 앞에서 리액션이 크고 복스럽게 먹는 스타일이라 함께 있는 사람까지 기분 좋게 만드는 마성의 매력을 가졌습니다.',
    recommendMenu: '육즙 가득 삼겹살에 된장찌개, 칼칼한 닭볶음탕 노포 골목',
    dateTip: '맛있게 고기를 구워주거나 쌈을 건네며 자연스러운 스킨십을 유도해보세요.',
    bestMatch: '달콤 포근 힐링 홈쿡러 👩‍🍳',
    worstMatch: '분위기 지상주의 로맨틱 고메 🍷',
  },
  trendy: {
    typeKey: 'trendy',
    title: '핫플 웨이팅 열정 트렌드세터',
    subtitle: '"인스타 핫플·신상 맛집 정복! 줄 서는 시간조차 설레는 데이트 코스"',
    emoji: '📸⏳',
    desc: 'SNS 피드를 달구는 트렌디한 맛집과 이국적인 퓨전 요리에 누구보다 진심인 얼리어답터입니다. 예쁜 사진 한 장과 색다른 미식 경험으로 데이트를 풍성하게 채우며, 연인에게 늘 새로운 즐거움을 선물합니다.',
    recommendMenu: '감성 퓨전 아시안 팝업, 비주얼 폭발 크로플 디저트 카페',
    dateTip: '기다리는 시간 동안 웨이팅 인생네컷을 찍거나 재미있는 질문을 나눠보세요.',
    bestMatch: '분위기 지상주의 로맨틱 고메 🍷',
    worstMatch: '실속 만점 가성비 밸런서 📋',
  },
  balancer: {
    typeKey: 'balancer',
    title: '실속 만점 가성비 밸런서',
    subtitle: '"무리한 웨이팅은 NO! 깔끔하고 맛 보장된 실패 없는 맛집 플래너"',
    emoji: '📋👍',
    desc: '합리적인 가격과 확실한 퀄리티, 깔끔한 동선까지 고려하는 똑똑한 데이트 기획자입니다. 상대방이 불편하지 않도록 미리 예약하거나 웨이팅 30분 이내의 알짜배기 맛집을 준비해 안정감 있는 데이트를 이끕니다.',
    recommendMenu: '정갈한 일식 스시 오마카세(캐주얼) 또는 솥밥 정식 한상',
    dateTip: '미리 준비한 2~3곳의 선택지를 주며 상대의 취향을 물어보면 호감도 급상승!',
    bestMatch: '다정다감 배려왕 스위트 미식러 🙆',
    worstMatch: '핫플 웨이팅 열정 트렌드세터 📸',
  },
  homecook: {
    typeKey: 'homecook',
    title: '달콤 포근 힐링 홈쿡러',
    subtitle: '"복잡한 밖보다는 둘만의 아늑한 공간에서 맛있는 홈메이드 한 끼"',
    emoji: '👩‍🍳🛵',
    desc: '시끌벅적한 번화가보다는 집에서 배달 음식을 나눠 먹으며 OTT를 보거나, 마트에서 함께 장을 봐 요리해 먹는 편안한 연애를 지향합니다. 소소하지만 확실한 행복을 아는 따뜻한 온도의 미식 파트너입니다.',
    recommendMenu: '함께 장봐서 만드는 봉골레 파스타, 포근한 디저트 베이커리',
    dateTip: '좋아하는 간식 취향을 기억해두었다가 서프라이즈로 건네보세요.',
    bestMatch: '노포 감성 소울푸드 마스터 🥩',
    worstMatch: '핫플 웨이팅 열정 트렌드세터 📸',
  },
  sweet: {
    typeKey: 'sweet',
    title: '다정다감 배려왕 스위트 미식러',
    subtitle: '"내가 뭘 먹느냐보다, 네가 맛있게 먹는 미소를 보는 게 더 행복해"',
    emoji: '🙆🍰',
    desc: '상대방의 입맛과 식사 속도, 못 먹는 음식까지 세심하게 배려하는 1등 데이트 짝꿍입니다. 어떤 메뉴를 골라도 맛있게 호응해주며 달콤한 디저트나 차 한 잔과 함께 다정하게 이야기를 경청해줍니다.',
    recommendMenu: '대화하기 편한 감성 브런치 룸 식당, 뷰 좋은 루프탑 티하우스',
    dateTip: '배려하느라 내 의견을 숨기기보단 "나도 이거 좋아해!"라며 적극적으로 공감해보세요.',
    bestMatch: '실속 만점 가성비 밸런서 📋',
    worstMatch: '모든 유형과 두루두루 잘 맞아요! 💖',
  },
};

const FoodTest = () => {
  const navi = useNavigate();

  // 화면 단계: 'intro' | 'quiz' | 'loading' | 'result'
  const [stage, setStage] = useState('intro');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState([]); // 선택한 option 객체들 저장
  const [copied, setCopied] = useState(false);

  // 테스트 시작
  const handleStart = () => {
    setAnswers([]);
    setCurrentIdx(0);
    setStage('quiz');
  };

  // 답변 선택
  const handleSelectOption = (option) => {
    const nextAnswers = [...answers, option];
    setAnswers(nextAnswers);

    if (currentIdx + 1 < QUESTIONS.length) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      // 마지막 문제 완료 -> 분석 로딩 화면
      setStage('loading');
      setTimeout(() => {
        setStage('result');
      }, 1200);
    }
  };

  // 이전 질문으로 이동
  const handlePrevQuestion = () => {
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
      setAnswers((prev) => prev.slice(0, prev.length - 1));
    } else {
      setStage('intro');
    }
  };

  // 결과 계산 로직 (점수 합산 후 최다 득점 페르소나 도출)
  const calculateResult = () => {
    const scores = {
      romantic: 0,
      nopo: 0,
      trendy: 0,
      balancer: 0,
      homecook: 0,
      sweet: 0,
    };

    answers.forEach((opt) => {
      if (opt && opt.scores) {
        Object.entries(opt.scores).forEach(([key, val]) => {
          if (scores[key] !== undefined) {
            scores[key] += val;
          }
        });
      }
    });

    // 최고 점수 유형 찾기
    let bestKey = 'romantic';
    let maxScore = -1;
    Object.entries(scores).forEach(([key, val]) => {
      if (val > maxScore) {
        maxScore = val;
        bestKey = key;
      }
    });

    // 유저가 선택한 옵션들 중 대표 해시태그 5~7개 추출
    const tags = answers
      .filter((opt) => opt && opt.tag)
      .map((opt) => opt.tag)
      .slice(0, 7);

    return {
      typeInfo: RESULT_TYPES[bestKey] || RESULT_TYPES.romantic,
      tags,
    };
  };

  // 링크 복사
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentQ = QUESTIONS[currentIdx];
  const progressPercent = Math.round(((currentIdx + 1) / QUESTIONS.length) * 100);

  return (
    <div className={styles.container}>
      <div className={styles.bgGlow} />

      <div className={styles.card}>
        {/* ==================== 1. 시작 화면 ==================== */}
        {stage === 'intro' && (
          <div className={styles.introWrapper}>
            <div className={styles.introBadge}>🍽️ SILHOUETTE FOOD BALANCE</div>
            <div className={styles.introIcon}>🍝🥩🥐</div>
            <h1 className={styles.introTitle}>첫 데이트 음식 취향<br />밸런스 게임</h1>
            <p className={styles.introDesc}>
              첫 만남 메뉴부터 웨이팅, 맵기, 단짠 밸런스까지!<br />
              15가지 질문으로 알아보는 나의 데이트 미식 페르소나와<br />
              첫 만남 찰떡 케미 해시태그를 확인해보세요.
            </p>

            <div className={styles.introMeta}>
              <span>총 15문항</span>
              <span>•</span>
              <span>약 2~3분 소요</span>
              <span>•</span>
              <span>취향 매칭 분석</span>
            </div>

            <button type="button" className={styles.primaryBtn} onClick={handleStart}>
              <span>테스트 시작하기</span>
              <span>👉</span>
            </button>

            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => navi('/event')}
            >
              이벤트 목록으로 돌아가기
            </button>
          </div>
        )}

        {/* ==================== 2. 질문 진행 화면 ==================== */}
        {stage === 'quiz' && currentQ && (
          <div>
            <div className={styles.quizHeader}>
              <div className={styles.topRow}>
                <button type="button" className={styles.backBtn} onClick={handlePrevQuestion}>
                  <span>←</span>
                  <span>{currentIdx === 0 ? '처음으로' : '이전 질문'}</span>
                </button>
                <div className={styles.stepCounter}>
                  Q{currentIdx + 1} <span className={styles.stepTotal}>/ {QUESTIONS.length}</span>
                </div>
              </div>

              {/* 진행률 바 */}
              <div className={styles.progressBarTrack}>
                <div
                  className={styles.progressBarFill}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* 질문 카드 */}
            <div className={styles.questionBox} key={currentQ.id}>
              <h2 className={styles.questionTitle}>{currentQ.question}</h2>
            </div>

            {/* 선택지 리스트 */}
            <div className={styles.optionList}>
              {currentQ.options.map((opt, oIdx) => (
                <button
                  key={oIdx}
                  type="button"
                  className={styles.optionBtn}
                  onClick={() => handleSelectOption(opt)}
                >
                  <span>{opt.text}</span>
                  <span className={styles.optionArrow}>→</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ==================== 3. 분석 중 로딩 화면 ==================== */}
        {stage === 'loading' && (
          <div className={styles.loadingWrapper}>
            <div className={styles.loadingSpinner}>🔮</div>
            <h3 className={styles.loadingTitle}>미식 페르소나 분석 중...</h3>
            <p className={styles.loadingSubtitle}>
              선택하신 답변을 바탕으로 첫 만남 궁합과 취향 태그를 계산하고 있어요.
            </p>
          </div>
        )}

        {/* ==================== 4. 결과 화면 ==================== */}
        {stage === 'result' && (() => {
          const { typeInfo, tags } = calculateResult();

          return (
            <div className={styles.resultWrapper}>
              <div className={styles.resultHeader}>
                <span className={styles.resultPreBadge}>나의 첫 데이트 미식 페르소나</span>
                <div className={styles.resultEmoji}>{typeInfo.emoji}</div>
                <h2 className={styles.resultTypeName}>{typeInfo.title}</h2>
                <p className={styles.resultSubtitle}>{typeInfo.subtitle}</p>
              </div>

              {/* 나의 선택 기반 동적 해시태그 */}
              <div className={styles.tagSection}>
                <div className={styles.tagSectionTitle}># MY FOOD CHEMISTRY TAGS</div>
                <div className={styles.tagList}>
                  {tags.map((t, idx) => (
                    <span key={idx} className={styles.customTag}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* 상세 분석 내용 */}
              <div className={styles.descCard}>
                <div>
                  <h4 className={styles.descItemTitle}>💡 미식 성향 분석</h4>
                  <p className={styles.descItemBody}>{typeInfo.desc}</p>
                </div>
                <div>
                  <h4 className={styles.descItemTitle}>🍽️ 첫 데이트 추천 코스</h4>
                  <p className={styles.descItemBody}>{typeInfo.recommendMenu}</p>
                </div>
                <div>
                  <h4 className={styles.descItemTitle}>💌 첫 만남 심쿵 팁</h4>
                  <p className={styles.descItemBody}>{typeInfo.dateTip}</p>
                </div>
              </div>

              {/* 찰떡 & 주의 궁합 */}
              <div className={styles.chemistryGrid}>
                <div className={styles.chemistryCard}>
                  <span className={styles.chemLabel}>찰떡 데이트 짝꿍 💖</span>
                  <span className={styles.chemValue}>{typeInfo.bestMatch}</span>
                </div>
                <div className={styles.chemistryCard}>
                  <span className={styles.chemLabel}>조율이 필요한 짝꿍 ⚡</span>
                  <span className={styles.chemValue}>{typeInfo.worstMatch}</span>
                </div>
              </div>

              {/* 하단 액션 버튼 */}
              <div className={styles.actionGroup}>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={handleStart}
                >
                  <span>다시 테스트하기 🔄</span>
                </button>

                <button
                  type="button"
                  className={styles.shareBtn}
                  onClick={handleCopyLink}
                >
                  <span>테스트 공유하기 🔗</span>
                </button>
                {copied && <div className={styles.copiedToast}>링크가 클립보드에 복사되었습니다! 🎉</div>}

                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => navi('/event')}
                >
                  다른 이벤트 보러가기 🎁
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default FoodTest;
