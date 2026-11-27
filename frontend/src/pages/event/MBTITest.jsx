import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Client from '../../api/client';
import styles from './MBTITest.module.css';

// 20개 연애 MBTI 질문 리스트 (E/I, S/N, T/F, J/P 각 5문항)
const QUESTIONS = [
  // ① 에너지 방향 (E vs I) — 5문항
  {
    id: 1,
    category: '① 에너지 방향 (E vs I)',
    question: '소개팅이나 첫 만남 자리에서 나의 모습은?',
    options: [
      { text: '어색한 침묵이 싫어서 먼저 질문을 던지며 분위기를 주도한다 🗣️', tag: '#대화주도인싸러', type: 'E' },
      { text: '상대방의 이야기를 경청하며 차분하게 리액션하는 편이다 🎧', tag: '#차분경청리액션러', type: 'I' },
    ],
  },
  {
    id: 2,
    category: '① 에너지 방향 (E vs I)',
    question: '평일 퇴근 후 에너지가 방전됐을 때 원하는 데이트는?',
    options: [
      { text: '연인과 맛있는 걸 먹으며 수다 떨면 오히려 스트레스가 풀린다 🍕', tag: '#수다충전외향파', type: 'E' },
      { text: '잠깐이라도 혼자 쉬거나 각자 조용히 힐링하는 시간이 필요하다 🛋️', tag: '#혼자충전내향파', type: 'I' },
    ],
  },
  {
    id: 3,
    category: '① 에너지 방향 (E vs I)',
    question: '연인의 친한 친구들과 함께 만나는 자리가 생긴다면?',
    options: [
      { text: '금방 친해져서 함께 어울리는 자리를 즐기는 편이다 🍻', tag: '#친구모임환영러', type: 'E' },
      { text: '반갑긴 하지만 기가 빨려서 단둘이 만나는 게 훨씬 편하다 🤐', tag: '#둘만의시간선호', type: 'I' },
    ],
  },
  {
    id: 4,
    category: '① 에너지 방향 (E vs I)',
    question: '호감 가는 사람이 생겼을 때 나의 표현 방식은?',
    options: [
      { text: '연락도 먼저 하고 호감을 숨기지 않고 적극적으로 다가간다 🏹', tag: '#직진적극플러팅', type: 'E' },
      { text: '속으로 조용히 지켜보며 상대방이 다가와 주길 기다리는 편이다 🔭', tag: '#조용한신중관찰러', type: 'I' },
    ],
  },
  {
    id: 5,
    category: '① 에너지 방향 (E vs I)',
    question: '주말에 핫플레이스나 축제처럼 사람이 많은 곳에 간다면?',
    options: [
      { text: '북적북적하고 활기찬 분위기가 신나고 데이트하는 기분이 난다 🎡', tag: '#활기찬축제러버', type: 'E' },
      { text: '사람에 치여서 금방 지치고 조용한 골목이나 카페로 피하고 싶다 🌿', tag: '#조용한골목러버', type: 'I' },
    ],
  },

  // ② 인식 방식 (S vs N) — 5문항
  {
    id: 6,
    category: '② 인식 방식 (S vs N)',
    question: '연인과 드라이브하며 풍경을 볼 때 주로 하는 생각은?',
    options: [
      { text: '"오늘 날씨 진짜 좋다, 저기 새로 생긴 카페 가볼까?" 🚗', tag: '#현실직관풍경러', type: 'S' },
      { text: '"우리가 만약 저런 바닷가 마을에 살면 어떤 기분일까?" 🌊', tag: '#상상력풍부몽상러', type: 'N' },
    ],
  },
  {
    id: 7,
    category: '② 인식 방식 (S vs N)',
    question: '선물을 고를 때 내가 더 중요하게 생각하는 기준은?',
    options: [
      { text: '상대방이 평소에 필요하다고 했던 실용적인 물건 🎁', tag: '#실용템최우선', type: 'S' },
      { text: '우리만의 의미나 스토리가 담긴 감성적인 선물 💌', tag: '#스토리의미부여', type: 'N' },
    ],
  },
  {
    id: 8,
    category: '② 인식 방식 (S vs N)',
    question: '연인과 대화할 때 더 흥미로운 주제는?',
    options: [
      { text: '오늘 있었던 일, 맛집, 운동, 재테크 등 현실적인 일상 이야기 ☕', tag: '#현실일상토크러', type: 'S' },
      { text: '가치관, 영화 해석, 미래의 꿈, "만약에~"로 시작하는 상상 토크 🌌', tag: '#만약에상상토크러', type: 'N' },
    ],
  },
  {
    id: 9,
    category: '② 인식 방식 (S vs N)',
    question: '연인이 뜬금없이 "만약 내가 갑자기 바퀴벌레로 변하면 어떡할 거야?"라고 묻는다면?',
    options: [
      { text: '"그런 일이 왜 일어나ㅋㅋ 현실적인 얘기를 해"라고 웃어넘긴다 😅', tag: '#현실팩폭쿨러', type: 'S' },
      { text: '"특수 제작한 유리관에 넣어서 끝까지 책임지고 키울게"라고 받아준다 🪳', tag: '#상상과몰입러', type: 'N' },
    ],
  },
  {
    id: 10,
    category: '② 인식 방식 (S vs N)',
    question: '데이트 후 집으로 돌아가는 길에 주로 떠오르는 생각은?',
    options: [
      { text: '오늘 먹었던 음식 맛, 갔던 장소의 분위기 등 구체적인 장면들 📸', tag: '#생생한오감기억', type: 'S' },
      { text: '오늘 나눈 대화의 여운과 앞으로 우리가 함께할 미래의 모습 💭', tag: '#대화여운미래지향', type: 'N' },
    ],
  },

  // ③ 판단 기준 (T vs F) — 5문항
  {
    id: 11,
    category: '③ 판단 기준 (T vs F)',
    question: '연인이 "나 오늘 회사에서 실수해서 너무 우울해"라고 말할 때 첫 반응은?',
    options: [
      { text: '"무슨 실수였는데? 수습은 잘 됐어?"라며 상황부터 파악한다 🔍', tag: '#해결책제시형', type: 'T' },
      { text: '"헐 많이 놀랐겠다ㅠㅠ 오늘 진짜 고생 많았어"라며 감정부터 다독인다 🥺', tag: '#무한감정공감러', type: 'F' },
    ],
  },
  {
    id: 12,
    category: '③ 판단 기준 (T vs F)',
    question: '다툼 후 사과할 때 더 진심이 느껴지는 방식은?',
    options: [
      { text: '무엇이 잘못됐는지 짚고 앞으로 어떻게 고칠지 약속하는 것 📝', tag: '#명확한개선약속', type: 'T' },
      { text: '내 서운했던 마음을 알아주고 따뜻하게 안아주는 것 🫂', tag: '#마음헤아림포옹', type: 'F' },
    ],
  },
  {
    id: 13,
    category: '③ 판단 기준 (T vs F)',
    question: '연인이 나의 새로운 스타일을 보고 솔직한 평가를 해줄 때?',
    options: [
      { text: '객관적이고 현실적인 피드백을 해주는 게 고맙다 💡', tag: '#솔직담백피드백파', type: 'T' },
      { text: '조금 아쉽더라도 내 기분을 배려해서 예쁘게 말해줬으면 좋겠다 🌸', tag: '#다정한기분배려파', type: 'F' },
    ],
  },
  {
    id: 14,
    category: '③ 판단 기준 (T vs F)',
    question: '연인이 약속 시간에 20분 늦었을 때 더 중요한 것은?',
    options: [
      { text: '왜 늦었는지 납득할 만한 이유와 다음부터 안 늦겠다는 대책 ⏱️', tag: '#납득할이유중시', type: 'T' },
      { text: '미안해하는 진심 어린 태도와 내 기다림을 알아주는 말 한마디 💐', tag: '#진심어린사과중시', type: 'F' },
    ],
  },
  {
    id: 15,
    category: '③ 판단 기준 (T vs F)',
    question: '연인에게 서운한 점을 말할 때 나의 화법은?',
    options: [
      { text: '논리적으로 어떤 행동이 왜 문제였는지 차분하게 설명한다 ⚖️', tag: '#논리정연소통러', type: 'T' },
      { text: '내가 그때 어떤 감정을 느꼈고 얼마나 속상했는지를 중심으로 말한다 💧', tag: '#감정솔직표현러', type: 'F' },
    ],
  },

  // ④ 생활 양식 (J vs P) — 5문항
  {
    id: 16,
    category: '④ 생활 양식 (J vs P)',
    question: '주말 데이트 코스를 짤 때 나의 스타일은?',
    options: [
      { text: '식당 웨이팅, 동선, 주차까지 미리 다 알아보고 예약해 둔다 🗺️', tag: '#철저한동선계획러', type: 'J' },
      { text: '큰 틀만 정해두고 그날 기분과 발길 닿는 대로 움직인다 🧭', tag: '#발길닿는대로즉흥파', type: 'P' },
    ],
  },
  {
    id: 17,
    category: '④ 생활 양식 (J vs P)',
    question: '연인과 1박 2일 여행을 떠날 때 짐 싸는 타이밍은?',
    options: [
      { text: '최소 2~3일 전에 체크리스트를 만들어 차근차근 챙겨둔다 📋', tag: '#미리미리체크리스트', type: 'J' },
      { text: '출발 전날 밤이나 당일 아침에 후다닥 챙겨도 충분하다 🎒', tag: '#스피드번개짐싸기', type: 'P' },
    ],
  },
  {
    id: 18,
    category: '④ 생활 양식 (J vs P)',
    question: '예약해 둔 맛집이 갑자기 임시 휴무라면 나의 반응은?',
    options: [
      { text: '당황스럽지만 미리 찾아둔 플랜 B 후보 식당으로 바로 이동한다 📱', tag: '#플랜B준비완료', type: 'J' },
      { text: '"오히려 좋아!" 하며 주변에서 맛있어 보이는 곳에 즉흥으로 들어간다 🍽️', tag: '#오히려좋아즉흥러', type: 'P' },
    ],
  },
  {
    id: 19,
    category: '④ 생활 양식 (J vs P)',
    question: '연인과 다음 주 데이트 약속을 잡을 때 선호하는 방식은?',
    options: [
      { text: '며칠 전부터 시간과 장소를 미리 확정해 두어야 마음이 편하다 🗓️', tag: '#약속확정안심파', type: 'J' },
      { text: '당일 컨디션이나 날씨를 보고 유동적으로 정하는 게 좋다 🌤️', tag: '#유동적기분파', type: 'P' },
    ],
  },
  {
    id: 20,
    category: '④ 생활 양식 (J vs P)',
    question: '연애 중 기념일이나 여행 예산을 관리하는 방식은?',
    options: [
      { text: '데이트 통장이나 예산을 미리 계획해서 체계적으로 사용한다 💳', tag: '#체계적예산관리', type: 'J' },
      { text: '그때그때 필요한 만큼 유연하게 쓰고 상황에 맞춰 조절한다 💸', tag: '#유연한상황조절러', type: 'P' },
    ],
  },
];

// 16가지 연애 MBTI 페르소나 결과 데이터
const RESULT_TYPES = {
  ENFP: {
    mbti: 'ENFP',
    title: '재기발랄 직진 스파크러',
    subtitle: '"너랑 함께라면 매일이 축제! 사랑에 올인하는 순정파 에너자이저"',
    emoji: '⚡🎈',
    desc: '풍부한 상상력과 넘치는 애정 표현으로 연인을 항상 웃게 만드는 연애계의 비타민입니다. 즉흥적이고 로맨틱한 서프라이즈를 즐기며, 좋아하는 사람에게 온 마음을 다해 직진합니다.',
    recommendDate: '놀이공원 데이트, 글램핑 & 모닥불 불멍 토크',
    charmPoint: '지루할 틈 없는 댕댕이 매력과 영혼을 녹이는 다정한 리액션',
    bestMatch: 'INFJ, INTJ 🕯️',
    worstMatch: 'ISTJ, ESTJ 📋',
  },
  ENFJ: {
    mbti: 'ENFJ',
    title: '다정다감 플랜 케어러',
    subtitle: '"내 사람의 행복이 곧 나의 행복! 든든하게 이끌어주는 연애 멘토"',
    emoji: '💖🌟',
    desc: '상대방의 기분과 성장을 세심하게 살피며 미래를 함께 그려나가는 따뜻한 리더형 연인입니다. 완벽한 데이트 플랜과 넘치는 공감으로 상대에게 깊은 정서적 안정감을 선물합니다.',
    recommendDate: '야경이 한눈에 보이는 루프탑 다이닝, 감성 뮤지컬 관람',
    charmPoint: '상대의 자존감을 200% 북돋아 주는 특급 칭찬과 든든한 챙김',
    bestMatch: 'INFP, ISFP 🧸',
    worstMatch: 'ISTP, INTP 🏍️',
  },
  ENTP: {
    mbti: 'ENTP',
    title: '위트 폭발 티키타카 마스터',
    subtitle: '"말 한마디에도 빵 터지는 케미! 뇌섹미 넘치는 유쾌한 장난꾸러기"',
    emoji: '🎤💡',
    desc: '빠른 두뇌 회전과 독보적인 유머 감각으로 끝없는 대화의 재미를 이끌어냅니다. 솔직하고 쿨한 성격으로 밀당 없이 직진하며, 서로 지적 자극을 주고받는 연애를 선호합니다.',
    recommendDate: '방탈출 카페, 이색 토론형 전시회 & 힙한 펍 맥주 한잔',
    charmPoint: '어색할 틈 없는 티키타카 입담과 예측 불가능한 반전 매력',
    bestMatch: 'INFJ, INTJ 🕯️',
    worstMatch: 'ISFJ, ESFJ ☕',
  },
  ENTJ: {
    mbti: 'ENTJ',
    title: '카리스마 미래 디렉터',
    subtitle: '"함께 더 멋진 미래로! 동반 성장을 꿈꾸는 갓생 연애 파트너"',
    emoji: '👑📊',
    desc: '확실한 주관과 야망을 지닌 리더형 연인입니다. 낭비 없는 효율적인 데이트 코스를 계획하며, 서로에게 긍정적인 동기부여가 되어주는 단단하고 생산적인 연애를 지향합니다.',
    recommendDate: '전망 좋은 파인다이닝, 드라이브 후 인생 설계 토크',
    charmPoint: '망설임 없는 확신과 결단력, 내 사람만을 위한 든든한 쉴드',
    bestMatch: 'INFP, INTP 🧸',
    worstMatch: 'ISFP, ESFP 🎨',
  },
  ESFP: {
    mbti: 'ESFP',
    title: '텐션 만렙 비타민 엔터테이너',
    subtitle: '"오늘이 가장 젊은 날! 인생의 매 순간을 낭만으로 채우는 사랑둥이"',
    emoji: '🎉🥂',
    desc: '함께 있으면 세상의 모든 우울함이 날아갈 듯한 밝은 에너지를 발산합니다. 오감으로 즐기는 맛있는 음식과 핫플레이스를 사랑하며, 애정 표현도 화끈하고 아낌없이 쏟아붓습니다.',
    recommendDate: '뮤직 페스티벌, 성수동 신상 핫플 팝업 & 맛집 투어',
    charmPoint: '보고만 있어도 기분 좋아지는 무한 긍정 미소와 순수한 애교',
    bestMatch: 'ISFJ, ISTJ ☕',
    worstMatch: 'INTJ, ENTJ ♟️',
  },
  ESFJ: {
    mbti: 'ESFJ',
    title: '센스 만점 다정 배려왕',
    subtitle: '"네 취향은 이미 다 외웠어! 연인의 일상을 세심하게 감싸주는 천사"',
    emoji: '🎁🍰',
    desc: '기념일 챙기기, 음식 취향 기억하기, 주변 사람들에게 자랑하기 등 연인에 대한 관심도가 최상위입니다. 안정적이고 조화로운 관계를 지향하며 상대에게 아낌없는 사랑을 베풉니다.',
    recommendDate: '예쁜 정원이 있는 브런치 카페, 아기자기한 공방 원데이 클래스',
    charmPoint: '사소한 것도 놓치지 않는 특급 눈치와 감동적인 맞춤형 챙김',
    bestMatch: 'ISFP, ISTP 🎨',
    worstMatch: 'ENTP, INTP 🎤',
  },
  ESTP: {
    mbti: 'ESTP',
    title: '짜릿한 모험 직진 플러팅러',
    subtitle: '"밀당은 체질 아님! 뒤돌아보지 않고 즉흥의 스릴을 즐기는 직진남녀"',
    emoji: '🏎️🔥',
    desc: '솔직하고 뒤끝 없는 성격으로 답답한 것을 싫어합니다. 활동적이고 스릴 넘치는 데이트를 좋아하며, 마음에 드는 상대에게는 거침없는 플러팅과 행동력으로 심장을 뛰게 만듭니다.',
    recommendDate: '서핑, 실내 클라이밍, 야간 한강 드라이브 & 즉흥 야식',
    charmPoint: '자신감 넘치는 당당함과 쿨하고 뒤끝 없는 쿨워터 향 매력',
    bestMatch: 'ISFJ, ISTJ ☕',
    worstMatch: 'INFP, ENFP 🧸',
  },
  ESTJ: {
    mbti: 'ESTJ',
    title: '믿음직한 현실 기둥 든든러',
    subtitle: '"말보단 책임감과 행동으로! 어떤 비바람에도 흔들리지 않는 든든한 나무"',
    emoji: '🏛️💼',
    desc: '약속과 시간 약속을 철저히 지키며 신뢰를 최우선으로 생각합니다. 현실적인 조언과 안정적인 경제관념으로 연인에게 든든한 울타리가 되어주며, 듬직하고 진중한 사랑을 키워갑니다.',
    recommendDate: '동선 완벽한 힐링 코스, 정갈한 한정식 & 산책 코스',
    charmPoint: '불안감을 주지 않는 확실한 책임감과 듬직한 현실 수호력',
    bestMatch: 'ISFP, INTP 🎨',
    worstMatch: 'ENFP, INFP ⚡',
  },
  INFP: {
    mbti: 'INFP',
    title: '낭만 가득 감성 몽상가',
    subtitle: '"소설 속 한 장면 같은 운명을 꿈꿔요. 영혼의 교감을 나누는 순수 감성러"',
    emoji: '🧸🌙',
    desc: '마음의 문을 열기까지 시간은 걸리지만, 한 번 사랑에 빠지면 깊고 헌신적인 사랑을 바칩니다. 손편지, 감성적인 음악, 둘만의 의미 있는 추억에 진심인 동화 같은 로맨티스트입니다.',
    recommendDate: '독립서점 탐방, 감성 LP바 데이트, 밤하늘 별 보기',
    charmPoint: '상대방의 마음을 깊이 헤아리는 다정한 감수성과 순수한 진심',
    bestMatch: 'ENFJ, ENTJ 💖',
    worstMatch: 'ESTP, ESTJ 🏎️',
  },
  INFJ: {
    mbti: 'INFJ',
    title: '깊은 울림 힐링 안식처',
    subtitle: '"말하지 않아도 네 맘이 느껴져. 지친 영혼을 포근히 안아주는 쉼터"',
    emoji: '🕯️🌿',
    desc: '직관력이 뛰어나 연인의 표정 하나로 기분을 알아차립니다. 가벼운 만남보다는 내면의 가치관과 인생관이 통하는 깊이 있는 소울메이트 관계를 추구합니다.',
    recommendDate: '조용한 미술관 관람, 고즈넉한 숲길 걷기 & 심야 심층 토크',
    charmPoint: '어떤 고민도 편안하게 털어놓게 만드는 마법 같은 포용력과 통찰력',
    bestMatch: 'ENFP, ENTP ⚡',
    worstMatch: 'ESTP, ESFP 🏎️',
  },
  INTP: {
    mbti: 'INTP',
    title: '엉뚱 호기심 미식 탐구러',
    subtitle: '"너라는 미지의 우주를 연구 중이야! 엉뚱하지만 사랑스러운 뇌섹러"',
    emoji: '🔭🧩',
    desc: '연애할 때도 나만의 독창적인 논리와 엉뚱한 매력을 보여줍니다. 감정 과잉보다는 차분하고 이성적인 대화를 즐기며, 좋아하는 사람에 한해서는 끊임없이 질문을 쏟아내는 관찰자입니다.',
    recommendDate: '과학관이나 천문대 관람, 아늑한 만화카페 & 보드게임 데이트',
    charmPoint: '서투르지만 진심 어린 순수한 애정 표현과 지적인 팩트 케어',
    bestMatch: 'ENTJ, ESTJ 👑',
    worstMatch: 'ESFJ, ENFJ 🎁',
  },
  INTJ: {
    mbti: 'INTJ',
    title: '스마트 신중 완벽 플래너',
    subtitle: '"내 인생 계획의 유일한 변수는 너야. 완벽한 사람 곁에 선 완벽한 짝꿍"',
    emoji: '♟️📖',
    desc: '감정에 휩쓸리지 않고 신중하게 마음을 열며, 한 번 믿음을 주면 절대 배신하지 않는 확고한 순정파입니다. 연인의 발전을 조용히 지지해주며 낭비 없는 스마트한 데이트를 설계합니다.',
    recommendDate: '조용한 재즈바, 사전 예약 필수인 히든 레스토랑 코스',
    charmPoint: '빈틈없는 지적인 매력과 오직 내 연인에게만 보여주는 무장해제 미소',
    bestMatch: 'ENFP, ENTP ⚡',
    worstMatch: 'ESFP, ESFJ 🎉',
  },
  ISFP: {
    mbti: 'ISFP',
    title: '평온 나긋 포근 힐러',
    subtitle: '"다투지 말고 사이좋게! 소소한 일상 속 소확행을 그리는 온화한 힐러"',
    emoji: '🎨🛋️',
    desc: '갈등을 싫어하며 배려심이 몸에 밴 다정한 성품을 지녔습니다. 거창한 계획 없이도 둘이 함께 맛있는 걸 먹고 누워있는 것만으로도 행복해하는 포근하고 편안한 연애의 정석입니다.',
    recommendDate: '집콕 넷플릭스 정주행 & 배달 맛집, 한적한 피크닉 데이트',
    charmPoint: '상대방의 취향을 스펀지처럼 맞춰주는 온화한 수용력과 다정함',
    bestMatch: 'ESFJ, ESTJ 🎁',
    worstMatch: 'ENTJ, INTJ 👑',
  },
  ISFJ: {
    mbti: 'ISFJ',
    title: '한결같은 헌신 수호천사',
    subtitle: '"언제나 네 곁에 있을게. 변함없는 온도로 지켜주는 사랑의 수호신"',
    emoji: '☕🤍',
    desc: '묵묵히 연인의 필요를 챙겨주고 배려하는 헌신의 아이콘입니다. 관계의 안정과 예의를 중요시하며, 작은 약속도 칼같이 지켜 연인에게 최고의 신뢰를 안겨줍니다.',
    recommendDate: '아늑한 동네 단골 식당, 정갈한 디저트 카페 & 손잡고 동네 산책',
    charmPoint: '한결같은 다정함과 연인을 위해 준비해 오는 세심한 보조 배터리 같은 케어',
    bestMatch: 'ESFP, ESTP 🎉',
    worstMatch: 'ENTP, ENFP 🎤',
  },
  ISTP: {
    mbti: 'ISTP',
    title: '쿨하고 담백한 마이웨이러',
    subtitle: '"말보단 행동! 구속 없이 산뜻하게, 그러나 묵묵히 지켜주는 츤데레"',
    emoji: '🏍️🛠️',
    desc: '밀당이나 감정 소모를 극도로 싫어하는 담백한 현실주의자입니다. 겉은 무심해 보이지만 연인이 곤란할 때 척척 해결해 주는 행동파이며, 각자의 자유를 온전히 보장해 줍니다.',
    recommendDate: '드라이브, 볼링이나 양궁 카페, 캐주얼한 고깃집 맥주',
    charmPoint: '쓸데없는 참견 없는 쿨한 자유도와 은근히 챙겨주는 츤데레 모먼트',
    bestMatch: 'ESFJ, ESTJ 🎁',
    worstMatch: 'ENFJ, INFJ 💖',
  },
  ISTJ: {
    mbti: 'ISTJ',
    title: '원칙과 신뢰의 정석 FM러',
    subtitle: '"약속은 반드시 지킨다. 시작부터 끝까지 거짓 없는 진실된 정석 연애"',
    emoji: '📋🔒',
    desc: '시간 약속, 데이트 예산, 상호 존중 등 기본에 충실한 연애를 합니다. 가벼운 연애보단 오래갈 수 있는 진지한 관계를 선호하며, 연인에게 흔들림 없는 안식처가 되어줍니다.',
    recommendDate: '예약된 정갈한 일식 코스, 조용한 박물관이나 식물원 산책',
    charmPoint: '불안할 틈을 주지 않는 투명한 일상 공유와 철저한 신뢰감',
    bestMatch: 'ESFP, ESTP 🎉',
    worstMatch: 'ENFP, INFP ⚡',
  },
};

const MBTITest = () => {
  const navi = useNavigate();

  // 화면 상태 ('intro' -> 'quiz' -> 'result')
  const [stage, setStage] = useState('intro');
  // 현재 몇 번째 질문인지 (0번 ~ 19번)
  const [currentIdx, setCurrentIdx] = useState(0);
  // 내가 고른 답변들을 순서대로 모아두는 배열
  const [answers, setAnswers] = useState([]);

  // 최종 계산된 결과 정보와 태그들
  const [resultInfo, setResultInfo] = useState(null);
  const [resultTags, setResultTags] = useState([]);

  // DB에서 불러온 이전 MBTI 결과 저장 상태
  const [savedResult, setSavedResult] = useState(null);

  // 1. 페이지 로딩 시 최근 저장된 MBTI 결과 불러오기 (GET)
  useEffect(() => {
    const fetchLatestResult = async () => {
      try {
        // 내 회원번호 먼저 가져오기
        const seqRes = await Client.get('/api/chat/member-seq');
        const myMemberSeq = Number(seqRes.data);

        // 최근 결과 조회 GET 요청
        const res = await Client.get(`/api/event/mbti-test/latest?memberSeq=${myMemberSeq}`);
        if (res.data && res.data.mbtiType) {
          setSavedResult(res.data);
        }
      } catch (error) {
        console.log('이전 MBTI 결과 조회 실패 또는 첫 테스트:', error);
      }
    };

    fetchLatestResult();
  }, []);

  // 이전 결과 바로보기 버튼 클릭
  const handleViewSavedResult = () => {
    if (!savedResult) return;
    const info = RESULT_TYPES[savedResult.mbtiType] || RESULT_TYPES.ENFP;
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
      type: option.type, // 'E', 'I', 'S', 'N', 'T', 'F', 'J', 'P'
      tag: option.tag,
      choiceNo: optionIndex + 1, // 1번, 2번
    };
    const newAnswers = [...answers, selectedItem];
    setAnswers(newAnswers);

    // 2. 아직 마지막 문제(20번)가 아니면 다음 문제로 넘어감
    if (currentIdx + 1 < QUESTIONS.length) {
      setCurrentIdx(currentIdx + 1);
      return;
    }

    // 3. 마지막 문제를 풀었으면 점수 계산 시작!
    const scoreBoard = {
      E: 0,
      I: 0,
      S: 0,
      N: 0,
      T: 0,
      F: 0,
      J: 0,
      P: 0,
    };

    const tagArray = [];
    const choiceNoArray = [];

    // 고른 20개 답변을 하나씩 꺼내서 점수 +1씩 더하기
    for (let i = 0; i < newAnswers.length; i++) {
      const item = newAnswers[i];
      scoreBoard[item.type] = scoreBoard[item.type] + 1;

      // 태그는 7개까지만 모으기
      if (tagArray.length < 7) {
        tagArray.push(item.tag);
      }
      choiceNoArray.push(item.choiceNo);
    }

    // E vs I, S vs N, T vs F, J vs P 판정하기
    const eOrI = scoreBoard.E >= scoreBoard.I ? 'E' : 'I';
    const sOrN = scoreBoard.S >= scoreBoard.N ? 'S' : 'N';
    const tOrF = scoreBoard.T >= scoreBoard.F ? 'T' : 'F';
    const jOrP = scoreBoard.J >= scoreBoard.P ? 'J' : 'P';
    const finalMbti = eOrI + sOrN + tOrF + jOrP;

    const finalResult = RESULT_TYPES[finalMbti] || RESULT_TYPES.ENFP;
    setResultInfo(finalResult);
    setResultTags(tagArray);

    // 4. 백엔드(DB)로 결과 POST 전송하기
    try {
      // 내 회원번호(memberSeq) 먼저 가져오기
      const seqRes = await Client.get('/api/chat/member-seq');
      const myMemberSeq = Number(seqRes.data);

      // DB로 저장 요청 보내기 (백엔드 MBTITestResultDTO 변수명에 맞춤)
      await Client.post('/api/event/mbti-test', {
        memberSeq: myMemberSeq,
        mbtiType: finalResult.mbti,
        resultTitle: finalResult.title,
        resultEmoji: finalResult.emoji,
        tags: tagArray.join(','),
        bestMatchMbti: finalResult.bestMatch,
        matchDesc: finalResult.desc,
        answers: choiceNoArray.join(','),
      });
      console.log('MBTI 연애 스타일 DB 저장 성공!');
    } catch (error) {
      console.log('MBTI 테스트 DB 저장 실패:', error);
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
            <div className={styles.introBadge}>SILHOUETTE DATING MBTI</div>
            <h1 className={styles.introTitle}>실루엣 연애 스타일<br />16 MBTI 진단 테스트</h1>
            <p className={styles.introDesc}>
              첫 만남 텐션부터 감정 공감, 갈등 해결, 데이트 계획까지!<br />
              20가지 질문으로 알아보는 나의 연애 페르소나와<br />
              나만의 매력 넘치는 연애 케미 태그를 확인해보세요.
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
                  최근 나의 연애 MBTI 진단 결과
                </span>
                <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--ink)' }}>
                  [{savedResult.mbtiType}] {savedResult.resultTitle}
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
              {savedResult ? '연애 MBTI 다시 진단하기 🔄' : '연애 MBTI 진단 시작하기 👉'}
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
              <span className={styles.resultPreBadge}>나의 연애 페르소나 MBTI</span>
              <div className={styles.resultEmoji}>{resultInfo.emoji}</div>
              <div>
                <span className={styles.resultMbtiCode}>{resultInfo.mbti}</span>
              </div>
              <h2 className={styles.resultTypeName}>{resultInfo.title}</h2>
              <p className={styles.resultSubtitle}>{resultInfo.subtitle}</p>
            </div>

            {/* 해시태그 목록 */}
            <div className={styles.tagSection}>
              <div className={styles.tagSectionTitle}># 나의 연애 스타일 태그</div>
              <div className={styles.tagList}>
                {resultTags.map((tag, idx) => (
                  <span key={idx} className={styles.customTag}>{tag}</span>
                ))}
              </div>
            </div>

            {/* 상세 설명 */}
            <div className={styles.descCard}>
              <div>
                <h4 className={styles.descItemTitle}>💡 연애 스타일 심층 분석</h4>
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
                <span className={styles.chemLabel}>환상의 찰떡 궁합 💖</span>
                <span className={styles.chemValue}>{resultInfo.bestMatch}</span>
              </div>
              <div className={styles.chemistryCard}>
                <span className={styles.chemLabel}>조율이 필요한 궁합 ⚡</span>
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

export default MBTITest;
