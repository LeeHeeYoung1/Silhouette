import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Client from '../../api/client';
import styles from './foodTest.module.css';

// 15개 질문 리스트 (각 보기마다 type 하나, tag 하나만 지정)
const QUESTIONS = [
  {
    id: 1,
    question: '첫 만남 저녁 메뉴로 가장 끌리는 곳은?',
    options: [
      { text: '분위기 좋은 이탈리안 레스토랑에서 파스타와 와인 🍝', tag: '#와인파스타파', type: 'romantic' },
      { text: '어색함을 단번에 깨줄 든든한 고깃집이나 이자카야 🥩', tag: '#노포고깃집파', type: 'nopo' },
      { text: '부담 없이 가볍게 즐길 수 있는 감성 브런치 카페 🥐', tag: '#감성브런치러', type: 'sweet' },
    ],
  },
  {
    id: 2,
    question: 'SNS에서 핫한 맛집! 웨이팅은 어디까지 가능할까?',
    options: [
      { text: '맛있다면 1시간 이상 줄 서는 것도 데이트의 묘미! ⏳', tag: '#웨이팅불사러', type: 'trendy' },
      { text: '30분 이내라면 기다릴 수 있어, 그 이상은 패스 🕒', tag: '#실속웨이팅러', type: 'balancer' },
      { text: '웨이팅은 절대 사절! 무조건 예약되거나 바로 들어가는 곳으로 🏃', tag: '#예약필수파', type: 'balancer' },
    ],
  },
  {
    id: 3,
    question: '나의 매운맛 전투력은?',
    options: [
      { text: '엽떡 오리지널·불닭볶음면 거뜬! 스트레스는 매운맛으로 🔥', tag: '#맵부심최강자', type: 'nopo' },
      { text: '신라면 정도가 딱 맛있게 매워요 🌶️', tag: '#적당한맵기러', type: 'balancer' },
      { text: '매운 건 못 먹는 맵찔이, 순한 맛 최고 🍼', tag: '#순한맛지킴이', type: 'homecook' },
    ],
  },
  {
    id: 4,
    question: '연인과 함께하는 술자리 스타일은?',
    options: [
      { text: '분위기 있게 와인바나 칵테일바에서 한두 잔 🍷', tag: '#와인칵테일러', type: 'romantic' },
      { text: '노포 감성 포차에서 소주·맥주에 국물 안주 🍻', tag: '#노포감성미식가', type: 'nopo' },
      { text: '술보다는 맛있는 안주와 음료수! 논알콜 파 🥤', tag: '#달콤논알콜파', type: 'sweet' },
    ],
  },
  {
    id: 5,
    question: '식사 후 카페 타임, 나의 선택은?',
    options: [
      { text: '배불러도 디저트 배는 따로! 케이크·크로플 필수 🍰', tag: '#디저트배따로', type: 'trendy' },
      { text: '깔끔하게 아메리카노나 차 한 잔이면 충분해 ☕', tag: '#얼죽아깔끔파', type: 'balancer' },
      { text: '카페보다는 소화시킬 겸 산책이나 다른 놀거리로 이동 🚶', tag: '#산책활동파', type: 'sweet' },
    ],
  },
  {
    id: 6,
    question: '음식이 나왔을 때, 사진 촬영 스타일은?',
    options: [
      { text: '항공샷부터 감성 컷까지! 예쁘게 찍고 먹어야 직성이 풀려 📸', tag: '#감성인증샷장인', type: 'trendy' },
      { text: '딱 한두 장만 빠르게 찍고 바로 젓가락 들기 ⚡', tag: '#스피드한장러', type: 'balancer' },
      { text: '식기 전에 먹는 게 국룰, 사진은 패스 🥢', tag: '#본능적미식가', type: 'nopo' },
    ],
  },
  {
    id: 7,
    question: '호불호 갈리는 이국적 향신료(마라, 고수, 양꼬치 등)에 대한 생각은?',
    options: [
      { text: '없어서 못 먹지! 향신료 듬뿍 들어간 음식 극호 🌿', tag: '#향신료극호러버', type: 'trendy' },
      { text: '마라탕 정도는 괜찮은데 고수나 강한 향신료는 빼고 먹어 🙂', tag: '#적당한도전러', type: 'balancer' },
      { text: '익숙하고 무난한 한식·일식·양식이 제일 편해 🍚', tag: '#클래식입맛파', type: 'homecook' },
    ],
  },
  {
    id: 8,
    question: '날것(회, 육회, 간장게장, 굴 등) 취향은?',
    options: [
      { text: '회·육회·해산물이라면 자다가도 벌떡! 🍣', tag: '#해산물육회러버', type: 'nopo' },
      { text: '신선한 연어회나 육회 정도는 맛있게 먹어 🐟', tag: '#소프트날것파', type: 'romantic' },
      { text: '익히지 않은 날음식은 조금 부담스러워 🍳', tag: '#완벌익힘파', type: 'homecook' },
    ],
  },
  {
    id: 9,
    question: '데이트 메뉴를 고를 때 나의 스타일은?',
    options: [
      { text: '미리 맛집 리스트 3~4곳을 정리해서 제안하는 계획파 📋', tag: '#철두철미계획러', type: 'balancer' },
      { text: '"오늘 뭐 땡겨?" 서로 의견 나누며 즉흥적으로 결정 🤝', tag: '#소통형즉흥러', type: 'trendy' },
      { text: '상대가 먹고 싶은 거라면 뭐든 다 잘 먹는 편! 🙆', tag: '#취향맞춤천사', type: 'sweet' },
    ],
  },
  {
    id: 10,
    question: '주말에 연인과 식사할 때 더 선호하는 방식은?',
    options: [
      { text: '예쁘게 차려입고 밖에서 새로운 맛집 투어 🍽️', tag: '#주말핫플투어러', type: 'trendy' },
      { text: '집에서 편하게 배달 음식 시켜 먹으며 OTT 정주행 🛵', tag: '#배달OTT집콕파', type: 'homecook' },
      { text: '장 봐서 같이 요리해 먹는 홈쿡 데이트 👩‍🍳', tag: '#로맨틱홈쿡러', type: 'homecook' },
    ],
  },
  {
    id: 11,
    question: '기념일이 아닌 평범한 데이트, 식비에 대한 생각은?',
    options: [
      { text: '맛과 분위기만 좋다면 인당 4~5만 원 이상도 아깝지 않아 💎', tag: '#분위기투자파', type: 'romantic' },
      { text: '적당히 깔끔하고 가성비 좋은 1~2만 원대 맛집이 최고 👍', tag: '#가성비실속파', type: 'balancer' },
      { text: '평소는 소소하게 먹고, 특별한 날에 오마카세·파인다이닝으로 한 방! ✨', tag: '#강약조절미식파', type: 'romantic' },
    ],
  },
  {
    id: 12,
    question: '밤 11시, 연인이 "야식 먹을래?"라고 묻는다면?',
    options: [
      { text: '치킨? 떡볶이? 라면? 메뉴 고르기부터 신남 🍗', tag: '#야식열정만렙', type: 'nopo' },
      { text: '가볍게 과일이나 요거트 정도만 같이 먹을래 🍓', tag: '#가벼운야식러', type: 'homecook' },
      { text: '밤늦게 먹으면 속 불편해, 내일 맛있는 거 먹자! 🌙', tag: '#건강속편한파', type: 'balancer' },
    ],
  },
  {
    id: 13,
    question: '식사할 때 나는 어떤 타입?',
    options: [
      { text: '이야기하면서 천천히, 여유롭게 음미하며 먹어 🐢', tag: '#대화와여유러버', type: 'romantic' },
      { text: '맛있으면 텐션 업! 비교적 빠르고 복스럽게 먹는 편 🐇', tag: '#맛있으면광속먹방', type: 'nopo' },
      { text: '상대방 식사 속도에 자연스럽게 맞춰주는 편 ⚖️', tag: '#속도조절배려왕', type: 'sweet' },
    ],
  },
  {
    id: 14,
    question: '단짠·밸런스 취향! 더 포기할 수 없는 쪽은?',
    options: [
      { text: '뜨끈한 국물과 짭짤한 밥도둑 (찌개, 국밥, 전골) 🍲', tag: '#뜨끈한국물파', type: 'nopo' },
      { text: '바삭하고 고소한 구이·튀김류 (삼겹살, 치킨, 돈까스) 🍤', tag: '#고소바삭튀김러', type: 'trendy' },
      { text: '상큼하고 깔끔한 면·샐러드류 (파스타, 냉면, 포케) 🥗', tag: '#깔끔프레시러', type: 'romantic' },
    ],
  },
  {
    id: 15,
    question: '호불호 음식 끝판왕(민트초코, 하와이안 피자, 오이 등)에 대한 나의 태도는?',
    options: [
      { text: '뭐든 잘 먹는 편! 오히려 민초·파인애플 피자 환영 🍍', tag: '#호불호종결자', type: 'trendy' },
      { text: '딱 1~2개 빼고는 다 잘 먹어 (편식 거의 없음) 🥒', tag: '#무난한둥글러', type: 'sweet' },
      { text: '싫어하는 재료는 확실한 편, 주문할 때 미리 빼달라고 해 🙅', tag: '#확고한취향파', type: 'homecook' },
    ],
  },
];

// 6가지 결과 데이터
const RESULT_TYPES = {
  romantic: {
    typeKey: 'romantic',
    title: '분위기 지상주의 로맨틱 고메',
    subtitle: '"맛도 중요하지만, 식탁에 흐르는 공기와 무드가 제일 설레요"',
    emoji: '🍷✨',
    desc: '조용한 조명, 감미로운 음악, 예쁜 플레이팅과 함께하는 식사를 사랑하는 로맨티스트입니다.',
    recommendMenu: '트러플 파스타와 와인 한잔, 은은한 조명의 비스트로',
    dateTip: '서로의 하루를 묻고 아이컨택을 나누며 여유롭게 템포를 맞춰보세요.',
    bestMatch: '핫플 웨이팅 열정 트렌드세터 📸',
    worstMatch: '노포 감성 소울푸드 마스터 🥩',
  },
  nopo: {
    typeKey: 'nopo',
    title: '노포 감성 소울푸드 마스터',
    subtitle: '"겉치레보단 찐맛집과 시원한 술 한 잔에 털털한 대화가 최고!"',
    emoji: '🥩🍻',
    desc: '어색한 정적을 단번에 날려버릴 고깃집이나 정겨운 노포 포차를 사랑하는 미식가입니다.',
    recommendMenu: '육즙 가득 삼겹살에 된장찌개, 칼칼한 닭볶음탕 노포 골목',
    dateTip: '맛있게 고기를 구워주거나 자연스럽게 챙겨주며 호감을 쌓아보세요.',
    bestMatch: '달콤 포근 힐링 홈쿡러 👩‍🍳',
    worstMatch: '분위기 지상주의 로맨틱 고메 🍷',
  },
  trendy: {
    typeKey: 'trendy',
    title: '핫플 웨이팅 열정 트렌드세터',
    subtitle: '"인스타 핫플·신상 맛집 정복! 줄 서는 시간조차 설레는 데이트"',
    emoji: '📸⏳',
    desc: 'SNS 피드를 달구는 트렌디한 맛집과 색다른 요리에 진심인 얼리어답터입니다.',
    recommendMenu: '감성 퓨전 레스토랑, 비주얼 폭발 크로플 디저트 카페',
    dateTip: '기다리는 시간 동안 인생네컷을 찍거나 재미있는 밸런스 질문을 나눠보세요.',
    bestMatch: '분위기 지상주의 로맨틱 고메 🍷',
    worstMatch: '실속 만점 가성비 밸런서 📋',
  },
  balancer: {
    typeKey: 'balancer',
    title: '실속 만점 가성비 밸런서',
    subtitle: '"무리한 웨이팅은 NO! 깔끔하고 맛 보장된 실패 없는 맛집 플래너"',
    emoji: '📋👍',
    desc: '합리적인 가격과 확실한 맛, 깔끔한 동선까지 고려하는 똑똑한 데이트 기획자입니다.',
    recommendMenu: '정갈한 일식 덮밥·초밥 전문점 또는 솥밥 정식 한상',
    dateTip: '미리 준비한 2~3곳의 선택지를 주며 상대의 취향을 물어보면 호감도 급상승!',
    bestMatch: '다정다감 배려왕 스위트 미식러 🙆',
    worstMatch: '핫플 웨이팅 열정 트렌드세터 📸',
  },
  homecook: {
    typeKey: 'homecook',
    title: '달콤 포근 힐링 홈쿡러',
    subtitle: '"복잡한 밖보다는 둘만의 아늑한 공간에서 맛있는 홈메이드 한 끼"',
    emoji: '👩‍🍳🛵',
    desc: '시끌벅적한 곳보다는 집에서 배달 음식을 시켜 OTT를 보거나, 함께 요리해 먹는 편안한 연애를 좋아합니다.',
    recommendMenu: '함께 장봐서 만드는 파스타, 포근한 동네 디저트 베이커리',
    dateTip: '상대방이 좋아하는 간식을 기억해두었다가 깜짝 선물로 건네보세요.',
    bestMatch: '노포 감성 소울푸드 마스터 🥩',
    worstMatch: '핫플 웨이팅 열정 트렌드세터 📸',
  },
  sweet: {
    typeKey: 'sweet',
    title: '다정다감 배려왕 스위트 미식러',
    subtitle: '"내가 뭘 먹느냐보다, 네가 맛있게 먹는 미소를 보는 게 더 행복해"',
    emoji: '🙆🍰',
    desc: '상대방의 입맛과 식사 속도, 못 먹는 음식까지 세심하게 배려하는 1등 데이트 짝꿍입니다.',
    recommendMenu: '대화하기 편한 감성 브런치 식당, 뷰 좋은 티하우스',
    dateTip: '배려하느라 내 의견을 숨기기보단 "나도 이거 좋아해!"라며 공감해보세요.',
    bestMatch: '실속 만점 가성비 밸런서 📋',
    worstMatch: '모든 유형과 두루두루 잘 맞아요! 💖',
  },
};

const FoodTest = () => {
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

  // DB에서 불러온 이전 음식 성향 결과 저장 상태
  const [savedResult, setSavedResult] = useState(null);

  // 1. 페이지 로딩 시 최근 저장된 음식 취향 결과 불러오기 (GET)
  useEffect(() => {
    const fetchLatestResult = async () => {
      try {
        const seqRes = await Client.get('/api/chat/member-seq');
        const myMemberSeq = Number(seqRes.data);

        const res = await Client.get(`/api/event/food-test/latest?memberSeq=${myMemberSeq}`);
        if (res.data && res.data.resultType) {
          setSavedResult(res.data);
        }
      } catch (error) {
        console.log('이전 음식 취향 결과 조회 실패 또는 첫 테스트:', error);
      }
    };

    fetchLatestResult();
  }, []);

  // 이전 결과 바로보기 버튼 클릭
  const handleViewSavedResult = () => {
    if (!savedResult) return;
    const info = RESULT_TYPES[savedResult.resultType] || RESULT_TYPES.romantic;
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
      romantic: 0,
      nopo: 0,
      trendy: 0,
      balancer: 0,
      homecook: 0,
      sweet: 0,
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
    let bestType = 'romantic';
    let maxScore = -1;
    const typeKeys = ['romantic', 'nopo', 'trendy', 'balancer', 'homecook', 'sweet'];

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

      // DB로 저장 요청 보내기
      await Client.post('/api/event/food-test', {
        memberSeq: myMemberSeq,
        resultType: finalResult.typeKey,
        resultTitle: finalResult.title,
        resultEmoji: finalResult.emoji,
        tags: tagArray.join(','),             // "#와인파스타파,#웨이팅불사러,..."
        recommendMenu: finalResult.recommendMenu,
        answers: choiceNoArray.join(','),     // "1,2,3,1,2,..."
      });
    } catch (error) {
      console.log('DB 저장 실패:', error);
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
            <div className={styles.introBadge}>SILHOUETTE FOOD BALANCE</div>
            <h1 className={styles.introTitle}>첫 데이트 음식 취향<br />밸런스 게임</h1>
            <p className={styles.introDesc}>
              15가지 질문으로 알아보는 나의 데이트 미식 성향과<br />
              첫 만남 찰떡 케미 해시태그를 확인해보세요.
            </p>

            {/* 이전에 검사한 결과가 있을 경우 보여주는 미니 카드 */}
            {savedResult && (
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--hairline)',
                  borderRadius: '20px',
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
                <span style={{ fontSize: '12px', color: 'var(--text-sub)', fontWeight: 700 }}>
                  최근 나의 음식 취향 진단 결과
                </span>
                <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--ink)' }}>
                  {savedResult.resultTitle}
                </span>
                <button
                  type="button"
                  onClick={handleViewSavedResult}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--ink)',
                    fontSize: '13px',
                    fontWeight: 700,
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
              {savedResult ? '음식 성향 다시 고르기 🔄' : '테스트 시작하기 👉'}
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
              <span className={styles.resultPreBadge}>나의 첫 데이트 미식 페르소나</span>
              <div className={styles.resultEmoji}>{resultInfo.emoji}</div>
              <h2 className={styles.resultTypeName}>{resultInfo.title}</h2>
              <p className={styles.resultSubtitle}>{resultInfo.subtitle}</p>
            </div>

            {/* 해시태그 목록 */}
            <div className={styles.tagSection}>
              <div className={styles.tagSectionTitle}># 나의 음식 케미 태그</div>
              <div className={styles.tagList}>
                {resultTags.map((tag, idx) => (
                  <span key={idx} className={styles.customTag}>{tag}</span>
                ))}
              </div>
            </div>

            {/* 상세 설명 */}
            <div className={styles.descCard}>
              <div>
                <h4 className={styles.descItemTitle}>💡 미식 성향 분석</h4>
                <p className={styles.descItemBody}>{resultInfo.desc}</p>
              </div>
              <div>
                <h4 className={styles.descItemTitle}>🍽️ 첫 데이트 추천 코스</h4>
                <p className={styles.descItemBody}>{resultInfo.recommendMenu}</p>
              </div>
              <div>
                <h4 className={styles.descItemTitle}>💌 첫 만남 심쿵 팁</h4>
                <p className={styles.descItemBody}>{resultInfo.dateTip}</p>
              </div>
            </div>

            {/* 궁합 */}
            <div className={styles.chemistryGrid}>
              <div className={styles.chemistryCard}>
                <span className={styles.chemLabel}>찰떡 데이트 짝꿍 💖</span>
                <span className={styles.chemValue}>{resultInfo.bestMatch}</span>
              </div>
              <div className={styles.chemistryCard}>
                <span className={styles.chemLabel}>조율이 필요한 짝꿍 ⚡</span>
                <span className={styles.chemValue}>{resultInfo.worstMatch}</span>
              </div>
            </div>

            <div className={styles.actionGroup}>
              <button type="button" className={styles.primaryBtn} onClick={handleStart}>
                다시 테스트하기 🔄
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

export default FoodTest