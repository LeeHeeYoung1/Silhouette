import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/useAuthStore';
import styles from './home.module.css';
import { startIdealMatch, getIdealMatchStatus, cancelIdealMatch } from '../../api/matching';

// 주소지 기반 위치 랜덤 리스팅 매칭 풀 데이터
const INITIAL_LOCATION_PROFILES = [
  { id: 101, name: '하은', age: 27, address: '서울 강남구 역삼동', distance: '0.8km', intro: '퇴근 후 가볍게 치맥 하거나 산책할 친구 찾아요 🍺' },
  { id: 102, name: '도윤', age: 29, address: '서울 강남구 신사동', distance: '1.5km', intro: '새로 생긴 맛집 탐방과 드립 커피를 좋아합니다 ☕' },
  { id: 103, name: '유진', age: 26, address: '서울 서초구 양재동', distance: '2.1km', intro: '주말마다 양재천에서 러닝해요. 밝고 건강한 분 환영해요 🏃‍♀️' },
  { id: 104, name: '준서', age: 30, address: '서울 강남구 논현동', distance: '1.2km', intro: '서로의 일상을 편안하게 털어놓을 수 있는 따뜻한 인연을 기다려요' },
  { id: 105, name: '채원', age: 24, address: '서울 강남구 대치동', distance: '2.8km', intro: '인디 음악 & 재즈 페스티벌 좋아하시는 분 계신가요? 🎶' },
  { id: 106, name: '수현', age: 28, address: '서울 서초구 반포동', distance: '3.4km', intro: '반포 한강공원에서 야경 보며 맥주 한 캔 하는 여유를 즐겨요' }
];

// 커뮤니티 인기글 목데이터
const MOCK_POPULAR_POSTS = [
  { id: 1, title: '첫 만남 장소로 카페 vs 조용한 와인바 추천', comments: 14, time: '10분 전' },
  { id: 2, title: '실물 인증 통과 후기 (실제 만나보니 신뢰도 100%)', comments: 28, time: '35분 전' },
  { id: 3, title: '가치관 일치율 95% 나온 분과 첫 대화 나눠본 썰', comments: 19, time: '1시간 전' },
  { id: 4, title: 'AI 안전 도우미가 알려준 첫 만남 안전 수칙 3가지', comments: 8, time: '2시간 전' }
];

// 챗봇 추천 퀵 질문 칩
const CHATBOT_QUICK_CHIPS = [
  '📍 안전한 만남 장소 추천',
  '🛡️ 첫 만남 안전 수칙 TOP 3',
  '📱 연락처는 언제 교환하나요?',
  '🎁 QR 안심 인증 혜택'
];

// 공통 매칭 카드 컴포넌트 (중복 제거)
function MatchCard({
  isIdeal,
  badgeText,
  title,
  desc,
  waitingLabel,
  waitingCount,
  isMatching,
  onStart,
  onCancel,
  btnSubtitle,
  guideContent,
  searchingTitle,
  searchingSubtitle,
  icon
}) {
  return (
    <div className={`${styles.matchCardWrapper} ${isIdeal ? styles.idealTheme : ''}`}>
      <div className={styles.cardHeader}>
        <span className={isIdeal ? styles.idealBadge : styles.blindBadge}>{badgeText}</span>
        <h3 className={styles.cardHeaderTitle}>{title}</h3>
        <p className={styles.cardHeaderDesc}>{desc}</p>
      </div>

      <div className={styles.ambientLight1}></div>
      <div className={styles.ambientLight2}></div>

      <div className={styles.blindMatchContent}>
        {!isMatching ? (
          <div className={styles.matchStandby}>
            <div className={styles.waitingBadge}>
              <span className={styles.waitingPulseDot}></span>
              <span className={styles.waitingText}>
                {waitingLabel} <b>{waitingCount.toLocaleString()}</b>명
              </span>
            </div>

            <div className={styles.startBtnContainer} onClick={onStart}>
              <div className={styles.startBtnPulse}></div>
              <button type="button" className={styles.startBtn}>
                <span className={styles.startTitle}>START</span>
                <span className={styles.startSubtitle}>{btnSubtitle}</span>
              </button>
            </div>

            {guideContent}
          </div>
        ) : (
          <div className={styles.matchSearching}>
            <div className={styles.radarWrapper}>
              <div className={styles.radarWave1}></div>
              <div className={styles.radarWave2}></div>
              <div className={styles.radarWave3}></div>
              <div className={styles.radarCenterCore}>{icon}</div>
            </div>

            <h3 className={styles.searchingTitle}>{searchingTitle}</h3>
            <p className={styles.searchingSubtitle}>{searchingSubtitle}</p>

            <button type="button" onClick={onCancel} className={styles.cancelBtn}>
              취소하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Home() {
  const navigate = useNavigate();
  const { token } = useAuthStore();

  // 매칭 상태
  const [isBlindMatching, setIsBlindMatching] = useState(false);
  const [waitingBlindUsers, setWaitingBlindUsers] = useState(1243);
  const [isIdealMatching, setIsIdealMatching] = useState(false);
  const [waitingIdealUsers, setWaitingIdealUsers] = useState(856);

  // 주소지 기반 추천 목록
  const [locationProfiles, setLocationProfiles] = useState(INITIAL_LOCATION_PROFILES);

  // AI 챗봇 상태
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: '안녕하세요! 실루엣 AI 안전 도우미입니다. 🛡️\n안전한 만남 장소, 데이트 매너, 안심 수칙 등 무엇이든 물어보세요!',
      time: '방금 전'
    }
  ]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!token) navigate('/login');
  }, [token, navigate]);

  // 실시간 접속 대기 인원 변동 시뮬레이션
  useEffect(() => {
    const interval = setInterval(() => {
      setWaitingBlindUsers((prev) => prev + Math.floor(Math.random() * 5) - 2);
      setWaitingIdealUsers((prev) => prev + Math.floor(Math.random() * 3) - 1);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatOpen]);

  // 이상형 매칭 성공 처리 (채팅 화면이 생기면 결과 화면으로 바꿀 예정)
  const handleIdealMatched = useCallback((result) => {
    setIsIdealMatching(false);
    alert(`💖 매칭 성공!\n상대 회원: ${result.partner_Seq}번\n상호 점수: ${result.score}점\n채팅방: ${result.chat_Room_Seq}번`);
  }, []);

  // 이상형 매칭 신청
  const handleIdealStart = async () => {
    try {
      const { data } = await startIdealMatch();

      if (data.status === 'MATCHED') {
        handleIdealMatched(data);      // 조건 맞는 상대가 이미 기다리고 있었음
      } else {
        setIsIdealMatching(true);      // WAITING → 검색 중 화면
      }
    } catch (error) {
      // 서버가 보낸 메시지 (예: "프로필과 이상형을 먼저 입력해주세요.")
      const message = error.response?.data || '매칭 신청 중 오류가 발생했어요.';
      alert(message);
    }
  };

  // 대기 중일 때 3초마다 매칭 여부 확인
  useEffect(() => {
    if (!isIdealMatching) return;

    let stopped = false;   // 화면을 벗어난 뒤 늦게 도착한 응답 무시용

    const timer = setInterval(async () => {
      try {
        const { data } = await getIdealMatchStatus();
        if (!stopped && data.status === 'MATCHED') {
          stopped = true;
          clearInterval(timer);
          handleIdealMatched(data);
        }
      } catch {
        // 일시적인 오류는 무시하고 다음 주기에 다시 확인
      }
    }, 3000);

    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [isIdealMatching, handleIdealMatched]);

  // 이상형 매칭 대기 취소
  const handleIdealCancel = async () => {
    try {
      await cancelIdealMatch();
      setIsIdealMatching(false);
    } catch (error) {
      // 409: 취소를 누르는 순간 이미 매칭됨 → 매칭 결과를 보여줌
      if (error.response?.status === 409) {
        try {
          const { data } = await getIdealMatchStatus();
          if (data.status === 'MATCHED') {
            handleIdealMatched(data);
            return;
          }
        } catch {
          // 아래 공통 처리로 넘어감
        }
      }
      setIsIdealMatching(false);
      alert(error.response?.data || '취소 중 오류가 발생했어요.');
    }
  };

  const handleShuffleLocation = () => {
    setLocationProfiles((prev) => [...prev].sort(() => Math.random() - 0.5));
  };

  const handleSendChatMessage = (textToSend) => {
    const text = typeof textToSend === 'string' ? textToSend : chatInput;
    if (!text.trim()) return;

    const time = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    setChatMessages((prev) => [...prev, { id: Date.now(), sender: 'user', text: text.trim(), time }]);
    if (typeof textToSend !== 'string') setChatInput('');

    setTimeout(() => {
      let reply = `✨ 실루엣 AI: "${text.trim()}"에 대해 안내드립니다. 첫 만남에서는 서로의 안전과 존중을 최우선으로 고려해주세요.`;
      const q = text.toLowerCase();

      if (q.includes('장소') || q.includes('카페') || q.includes('어디') || q.includes('추천')) {
        reply = '💡 [AI 추천 만남 장소]\n유동인구가 많고 조용한 프랜차이즈 북카페나 오픈형 라운지를 추천드려요. 이동이 편리한 지하철역 인근 공공장소가 가장 안전합니다.';
      } else if (q.includes('주의') || q.includes('안전') || q.includes('조심') || q.includes('수칙')) {
        reply = '🛡️ [첫 만남 안심 수칙 TOP 3]\n1. 첫 만남은 낮이나 초저녁 공공장소에서 진행하기\n2. 개인 연락처는 대화방에서 신뢰가 쌓인 후 공유하기\n3. 만남 장소와 귀가 시간을 지인에게 미리 공유하기';
      } else if (q.includes('연락처') || q.includes('번호') || q.includes('카톡')) {
        reply = '📱 [연락처 공유 가이드]\n실루엣 앱 내 안심 채팅방에서 충분히 대화를 나눈 뒤, 첫 대면 만남 이후에 연락처를 교환하는 것을 강력히 권장합니다.';
      } else if (q.includes('인증') || q.includes('qr') || q.includes('실물') || q.includes('혜택')) {
        reply = '🎉 [실물 및 QR 인증 혜택]\nAI 얼굴 실물 인증을 완료하시면 신뢰도 배지가 부여되며, 실제 만남 시 QR 인증을 완료하면 무료 대화권 5장이 즉시 지급됩니다!';
      }

      setChatMessages((prev) => [...prev, { id: Date.now() + 1, sender: 'ai', text: reply, time }]);
    }, 350);
  };

  return (
    <div className={styles.container}>
      {/* 1. 상단: 실시간 매칭 모드 (좌: 블라인드 / 우: 이상형) */}
      <section className={styles.topSection}>
        <div className={styles.topHeader}>
          <div className={styles.topTitleGroup}>
            <div className={styles.topBadge}>✨ 실시간 랜덤 매칭</div>
            <h2 className={styles.topTitle}>
              매칭 모드 <span className={styles.topTitleHighlight}>선택</span>
            </h2>
            <p className={styles.topDesc}>
              원하는 방식으로 인연을 찾아보세요. 조건 없는 블라인드 대화와 맞춤형 이상형 매칭을 지원합니다.
            </p>
          </div>
          <div className={styles.refreshInfo}>
            <span className={styles.pulseGreenDot}></span>
            <span>실시간 매칭 가동 중</span>
          </div>
        </div>

        <div className={styles.matchSplitGrid}>
          {/* 좌측: 블라인드 매칭 */}
          <MatchCard
            isIdeal={false}
            badgeText="🎭 블라인드 매칭"
            title="블라인드 랜덤 매칭"
            desc="외모와 조건 없이, 오직 목소리와 대화로 통하는 인연"
            waitingLabel="현재"
            waitingCount={waitingBlindUsers}
            isMatching={isBlindMatching}
            onStart={() => setIsBlindMatching(true)}
            onCancel={() => setIsBlindMatching(false)}
            btnSubtitle="BLIND MATCH"
            guideContent={
              <p className={styles.matchGuide}>
                선입견 없는 진솔한 대화를<br />지금 바로 시작해보세요.
              </p>
            }
            searchingTitle="블라인드 상대를 찾는 중..."
            searchingSubtitle="잠시만 기다려주세요"
            icon={
              <svg className={styles.radarSearchIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />

          {/* 우측: 이상형 매칭 */}
          <MatchCard
            isIdeal={true}
            badgeText="💖 이상형 매칭"
            title="이상형 랜덤 매칭"
            desc="나의 가치관과 이상형 설정을 기반으로 최적의 상대 매칭"
            waitingLabel="이상형 매칭 풀"
            waitingCount={waitingIdealUsers}
            isMatching={isIdealMatching}
            onStart={handleIdealStart}
            onCancel={handleIdealCancel}
            btnSubtitle="IDEAL MATCH"
            guideContent={
              <div className={styles.idealKeywords}>
                <span>#가치관 90%↑</span>
                <span>#관심사 일치</span>
                <span>#AI 맞춤추천</span>
              </div>
            }
            searchingTitle="취향 저격 이상형을 찾는 중..."
            searchingSubtitle="가치관 및 프로필 데이터 매칭 중"
            icon={
              <svg className={styles.radarSearchIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            }
          />
        </div>
      </section>

      {/* 2. 메인 레이아웃 (주소지 기반 매칭 & 사이드바) */}
      <div className={styles.mainLayout}>
        {/* 왼쪽 섹션: 주소지 기반 위치 추천 */}
        <section className={styles.leftSection}>
          <div className={styles.locationSection}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleGroup}>
                <h3 className={styles.sectionTitle}>
                  <span>📍 내 주변 가까운 매칭</span>
                </h3>
                <span className={styles.sectionSub}>
                  회원님의 거주지(서울 강남구) 주변 실시간 위치 기반 랜덤 리스팅
                </span>
              </div>
              <button
                type="button"
                className={styles.randomShuffleBtn}
                onClick={handleShuffleLocation}
                title="다른 추천 프로필 보기"
              >
                🔄 새로운 이웃 추천
              </button>
            </div>

            <div className={styles.locationCardGrid}>
              {locationProfiles.map((item) => (
                <div key={item.id} className={styles.locCard}>
                  <div className={styles.locCardImage}>
                    <div className={styles.locAvatar}>👥</div>
                    <span className={styles.distBadge}>{item.distance}</span>
                  </div>

                  <div className={styles.locCardInfo}>
                    <div className={styles.locMeta}>
                      <span>{item.name}</span>
                      <span>·</span>
                      <span>{item.age}세</span>
                    </div>
                    <span className={styles.locAddress}>{item.address}</span>
                    <p className={styles.locIntro}>{item.intro}</p>

                    <button
                      type="button"
                      className={styles.locBtn}
                      onClick={() => alert(`${item.name}님에게 대화 신청을 보냈습니다 💌`)}
                    >
                      대화 신청
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 오른쪽 섹션: 이벤트 배너 & 커뮤니티 */}
        <aside className={styles.rightSection}>
          <div
            className={styles.eventBannerCard}
            onClick={() => alert('🎉 얼굴 실물 인증을 완료하시면 무료 대화권 5장이 즉시 지급됩니다!')}
          >
            <span className={styles.eventBannerBadge}>SPECIAL EVENT</span>
            <h4 className={styles.eventBannerTitle}>🎁 얼굴 실물 인증 이벤트</h4>
            <p className={styles.eventBannerDesc}>
              지금 바로 AI 실물 인증 완료하고,<br />
              <strong>무료 대화권 5장</strong> 즉시 받아보세요!
            </p>
            <div className={styles.eventBannerFooter}>
              <span>자세히 보기</span>
              <span>→</span>
            </div>
          </div>

          <div className={styles.sideBox}>
            <h3 className={styles.sideBoxTitle}>
              <span>🔥 커뮤니티 인기글</span>
            </h3>
            <div className={styles.postList}>
              {MOCK_POPULAR_POSTS.map((post) => (
                <div key={post.id} className={styles.postItem}>
                  <div className={styles.postItemTitle}>{post.title}</div>
                  <div className={styles.postItemMeta}>
                    <span>댓글 {post.comments}개</span>
                    <span>{post.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* 3. 오른쪽 하단 플로팅 AI 안전 도우미 챗봇 */}
      <div
        className={`${styles.chatbotFab} ${isChatOpen ? styles.chatbotFabActive : ''}`}
        onClick={() => setIsChatOpen(!isChatOpen)}
        title="AI 안전 도우미 챗봇 열기"
      >
        <span className={styles.chatbotFabIcon}>{isChatOpen ? '✕' : '🤖'}</span>
        {!isChatOpen && <span className={styles.chatbotFabBadge}>AI 안전</span>}
        <span className={styles.chatbotOnlineDot}></span>
      </div>

      {isChatOpen && (
        <div className={styles.chatbotWindow}>
          <div className={styles.chatbotHeader}>
            <div className={styles.chatbotHeaderLeft}>
              <div className={styles.chatbotAvatar}>🤖</div>
              <div>
                <h4 className={styles.chatbotTitle}>실루엣 AI 안전 도우미</h4>
                <span className={styles.chatbotStatus}>🟢 실시간 안전 가이드 가동 중</span>
              </div>
            </div>
            <button
              type="button"
              className={styles.chatbotCloseBtn}
              onClick={() => setIsChatOpen(false)}
            >
              ✕
            </button>
          </div>

          <div className={styles.quickChipsContainer}>
            {CHATBOT_QUICK_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                className={styles.quickChip}
                onClick={() => handleSendChatMessage(chip)}
              >
                {chip}
              </button>
            ))}
          </div>

          <div className={styles.chatbotMessages}>
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`${styles.chatBubbleRow} ${
                  msg.sender === 'user' ? styles.userRow : styles.aiRow
                }`}
              >
                {msg.sender === 'ai' && <div className={styles.chatBotAvatarSmall}>🤖</div>}
                <div
                  className={`${styles.chatBubble} ${
                    msg.sender === 'user' ? styles.userBubble : styles.aiBubble
                  }`}
                >
                  <p className={styles.chatBubbleText}>{msg.text}</p>
                  <span className={styles.chatTime}>{msg.time}</span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendChatMessage();
            }}
            className={styles.chatbotInputArea}
          >
            <input
              type="text"
              className={styles.chatbotInput}
              placeholder="궁금한 안전 매너나 만남 팁을 입력하세요..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              autoFocus
            />
            <button type="submit" className={styles.chatbotSendBtn} title="전송">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={styles.sendIcon}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default Home;
