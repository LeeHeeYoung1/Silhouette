import React, { useState, useEffect, useRef } from 'react';
import styles from './MatchQueueOverlay.module.css';

// SVG 아이콘 모음 (의존성 없는 인라인 렌더링)
const IconDice = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="18" height="18" x="3" y="3" rx="4" />
    <circle cx="8" cy="8" r="1.2" fill="currentColor" />
    <circle cx="16" cy="8" r="1.2" fill="currentColor" />
    <circle cx="8" cy="16" r="1.2" fill="currentColor" />
    <circle cx="16" cy="16" r="1.2" fill="currentColor" />
    <circle cx="12" cy="12" r="1.2" fill="currentColor" />
  </svg>
);

const IconMinimize = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="4 14 10 14 10 20" />
    <polyline points="20 10 14 10 14 4" />
    <line x1="14" x2="21" y1="10" y2="3" />
    <line x1="3" x2="10" y1="21" y2="14" />
  </svg>
);

const IconHelp = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <path d="M12 17h.01" />
  </svg>
);

const IconClose = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" x2="6" y1="6" y2="18" />
    <line x1="6" x2="18" y1="6" y2="18" />
  </svg>
);

const IconList = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="10" x2="21" y1="6" y2="6" />
    <line x1="10" x2="21" y1="12" y2="12" />
    <line x1="10" x2="21" y1="18" y2="18" />
    <path d="M4 6h1v4" />
    <path d="M4 10h2" />
    <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
  </svg>
);

export default function MatchQueueOverlay({
  isBlindMatching,
  isIdealMatching,
  matchSeconds,
  waitingBlindUsers,
  waitingIdealUsers,
  onCancel
}) {
  // 모달 상태: false(기본 모달 열림) | true(우측 하단 미니 플로팅 알약으로 최소화)
  const [isMinimized, setIsMinimized] = useState(false);

  // 블라인드 3D 회전 카드 컬러 팔레트 (Uiverse ilkhoeri 10색)
  const BLIND_CARDS = [
    '142, 249, 252',
    '142, 252, 204',
    '142, 252, 157',
    '215, 252, 142',
    '252, 252, 142',
    '252, 208, 142',
    '252, 142, 142',
    '252, 142, 239',
    '204, 142, 252',
    '142, 202, 252'
  ];

  // AI 이상형 실시간 랭킹 보드 상태
  const [rankingPhase, setRankingPhase] = useState('SCORING'); // 'SCORING' | 'RE-RANKING' | 'TOP 1 SURGE'
  const [rankingItems, setRankingItems] = useState([
    { id: 'b1', alias: '후보 #204', mbti: 'INTJ', region: '마포구', dist: '2.4km', score: 86, isWinner: false, eliminated: false },
    { id: 'b2', alias: '후보 #418', mbti: 'ENTP', region: '서초구', dist: '3.1km', score: 84, isWinner: false, eliminated: false },
    { id: 'b3', alias: '후보 #129', mbti: 'ISFP', region: '성동구', dist: '1.2km', score: 82, isWinner: false, eliminated: false },
    { id: 'winner', alias: '후보 #087', mbti: 'ENFP', region: '용산구', dist: '1.5km', score: 91, isWinner: true, eliminated: false },
    { id: 'b4', alias: '후보 #511', mbti: 'INFP', region: '광진구', dist: '1.9km', score: 78, isWinner: false, eliminated: false }
  ]);

  // 가중치 칩 활성 상태
  const [boostChips, setBoostChips] = useState({
    values: true,
    region: true,
    tempo: false,
    nonsmoke: false
  });

  const [toastText, setToastText] = useState('');

  // 시간 포맷 (00:00)
  const formatTime = (sec) => {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  const showToast = (msg) => {
    setToastText(msg);
    setTimeout(() => setToastText(''), 2500);
  };

  // AI 이상형 매칭 대기 중: 가중치 점수 및 랭킹 순위 실시간 변동(스왑 애니메이션)
  useEffect(() => {
    if (!isIdealMatching) return;

    const rankCycleTimer = setInterval(() => {
      setRankingItems((prev) => {
        return prev.map((item) => {
          const delta = (Math.floor(Math.random() * 7) - 3); // -3 ~ +3
          const base = item.isWinner ? 94 : 82;
          const newScore = Math.min(99, Math.max(70, base + delta));
          return { ...item, score: newScore };
        });
      });

      const phases = ['SCORING', 'RE-RANKING', 'COMPARING'];
      setRankingPhase(phases[Math.floor(Math.random() * phases.length)]);
    }, 2800);

    return () => clearInterval(rankCycleTimer);
  }, [isIdealMatching]);

  // 가중치 칩 클릭
  const toggleChip = (key, label) => {
    setBoostChips((prev) => {
      const next = !prev[key];
      if (next) showToast(`✓ '${label}' 가중치 반영`);
      return { ...prev, [key]: next };
    });

    // 칩 누를 때 즉시 점수 재계산 펄스
    setRankingItems((prev) =>
      prev.map((item) => {
        const bonus = Math.floor(Math.random() * 4);
        return { ...item, score: Math.min(99, item.score + bonus) };
      })
    );
  };

  // 점수 기준 정렬된 랭킹 아이템
  const sortedRanking = [...rankingItems].sort((a, b) => b.score - a.score);

  return (
    <>
      {/* 1. 메인 모달 오버레이 (최소화 상태가 아닐 때 렌더링) */}
      {!isMinimized && (
        <div className={`${styles.overlay} ${isBlindMatching ? styles.overlayBlind : ''}`}>
          <div className={`${styles.modalBox} ${isBlindMatching ? styles.modalBoxBlind : ''}`}>
            {/* =========================================================
                블라인드 매칭 큐: SUTERA 스타일 아키텍처 다이어그램 + 중앙 홀로그램 카드
                ========================================================= */}
            {isBlindMatching && (
              <div className={styles.suteraContainer}>
                {/* 1) 시작 인트로: Silhouette 메인 로고 스플래시 (1.6초 후 페이드 아웃) */}
                <div className={styles.suteraIntroOverlay} aria-hidden="true">
                  <div className={styles.suteraIntroCenter}>
                    <h2 className={styles.suteraIntroLogo}>Silhouette</h2>
                    <p className={styles.suteraIntroSub}>실시간 블라인드 매칭 엔진 가동 중</p>
                  </div>
                  <div className={styles.suteraIntroBottom}>
                    <span className={styles.suteraIntroPct}>매칭 알고리즘 트리 초기화 100%</span>
                    <div className={styles.suteraIntroBar}>
                      <div className={styles.suteraIntroBarFill} />
                    </div>
                  </div>
                </div>

                {/* 2) 배경 테크니컬 그리드 & 십자(+) 마커 */}
                <div className={styles.suteraGridBg} aria-hidden="true">
                  <span className={`${styles.suteraCross} ${styles.cross1}`}>+</span>
                  <span className={`${styles.suteraCross} ${styles.cross2}`}>+</span>
                  <span className={`${styles.suteraCross} ${styles.cross3}`}>+</span>
                  <span className={`${styles.suteraCross} ${styles.cross4}`}>+</span>
                  <span className={`${styles.suteraCross} ${styles.cross5}`}>+</span>
                  <span className={`${styles.suteraCross} ${styles.cross6}`}>+</span>
                </div>

                {/* 3) 메인 스테이지 */}
                <div className={styles.suteraStage}>
                  {/* 상단 헤더 바 */}
                  <header className={styles.suteraTopBar}>
                    <div className={styles.suteraTopLeft}>
                      <span className={styles.suteraBrandMini}>SILHOUETTE // 실시간 매칭</span>
                    </div>
                    <div className={styles.suteraTopCenter}>
                      <span className={styles.suteraTopBox}>블라인드 매칭 프로토콜</span>
                    </div>
                    <div className={styles.suteraTopRight}>
                      <span>실시간 대기 인원 · {waitingBlindUsers.toLocaleString()}명</span>
                      <span className={styles.suteraTimerMono}>경과 {formatTime(matchSeconds)}</span>
                    </div>
                  </header>

                  {/* 좌상단 대형 헤드라인 */}
                  <div className={styles.suteraHeroTitle}>
                    <h3>DESTINY,</h3>
                    <h3>BY DESIGN.</h3>
                  </div>

                  {/* 중앙: 홀로그램 매칭 카드 + 3방향 트리 리더 라인 & 한글 알고리즘 설명 */}
                  <div className={styles.suteraCenterArea}>
                    {/* SVG 꺾은선 트리 커넥터 */}
                    <svg
                      className={styles.suteraSvgLines}
                      viewBox="0 0 900 440"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                    >
                      {/* Top-Right Branch */}
                      <polyline
                        className={styles.suteraLinePath}
                        points="460,82 515,42 640,42"
                      />
                      <rect x="456" y="78" width="7" height="7" className={styles.suteraNodeAnchor} />

                      {/* Left Branch */}
                      <polyline
                        className={styles.suteraLinePath}
                        points="350,185 280,145 190,145"
                      />
                      <rect x="346" y="181" width="7" height="7" className={styles.suteraNodeAnchor} />

                      {/* Bottom-Left Branch */}
                      <polyline
                        className={styles.suteraLinePath}
                        points="415,358 345,398 245,398"
                      />
                      <rect x="411" y="354" width="7" height="7" className={styles.suteraNodeAnchor} />
                    </svg>

                    {/* 노드 1 (Top-Right): 무편견 블라인드 필터 */}
                    <div className={`${styles.suteraCallout} ${styles.calloutTopRight}`}>
                      <p className={styles.calloutTitle}>무편견 블라인드 매칭</p>
                      <p className={styles.calloutDesc}>
                        외모와 조건에 대한 선입견을 모두 지우고 오직 대화의 결만으로 상대를 연결합니다
                      </p>
                    </div>

                    {/* 노드 2 (Mid-Left): 실시간 STOMP 큐 */}
                    <div className={`${styles.suteraCallout} ${styles.calloutMidLeft}`}>
                      <p className={styles.calloutTitle}>실시간 STOMP 대기열</p>
                      <p className={styles.calloutDesc}>
                        현재 접속 중인 대기 풀에서 웹소켓 채널을 통해 가장 빠른 상대를 즉시 매칭합니다
                      </p>
                    </div>

                    {/* 노드 3 (Bottom-Left): 단계적 프로필 공개 */}
                    <div className={`${styles.suteraCallout} ${styles.calloutBottomLeft}`}>
                      <p className={styles.calloutTitle}>단계적 실루엣 공개</p>
                      <p className={styles.calloutDesc}>
                        대화가 이어지고 서로의 호감과 신뢰가 쌓일수록 프로필과 사진이 서서히 열립니다
                      </p>
                    </div>

                    {/* 중앙 오브제 (돌 대신 들어간 이쁜 홀로그램 프리즘 카드 + 픽셀 스캔 효과) */}
                    <div className={styles.suteraCardFloatWrap}>
                      <div className={styles.suteraHoloCard}>
                        <div className={styles.suteraCardGlow} />
                        <div className={styles.suteraCardInnerBorder}>
                          <div className={styles.suteraCardTopMeta}>
                            <span>실루엣 // #01</span>
                            <span>100% 블라인드</span>
                          </div>

                          <div className={styles.suteraCardEmblem}>
                            <div className={styles.suteraCardRingOuter} />
                            <div className={styles.suteraCardRingInner} />
                            <span className={styles.suteraCardS}>S</span>
                          </div>

                          <div className={styles.suteraCardBottomMeta}>
                            <span className={styles.suteraCardStatusDot} />
                            <span>대화 상대 탐색 중...</span>
                          </div>
                        </div>

                        {/* 영상 속 돌 위를 스캔하던 반투명 글래스 픽셀 타일 효과 */}
                        <span className={`${styles.suteraScanTile} ${styles.tile1}`} />
                        <span className={`${styles.suteraScanTile} ${styles.tile2}`} />
                        <span className={`${styles.suteraScanTile} ${styles.tile3}`} />
                      </div>
                    </div>
                  </div>

                  {/* 우하단: 매칭 알고리즘 안내 박스 */}
                  <div className={styles.suteraAlgoPanel}>
                    <div className={styles.algoBanner}>
                      <span>실루엣 블라인드 매칭 알고리즘</span>
                    </div>
                    <div className={styles.algoDescBox}>
                      <p>
                        실루엣의 블라인드 매칭 엔진은 사진과 스펙 필터를 잠시 꺼두고, 실시간 STOMP
                        웹소켓 대기열에서 지금 바로 대화할 수 있는 두 사람을 1:1 익명 채팅방으로
                        즉시 연결합니다.
                      </p>
                    </div>
                    <div className={styles.algoTagsRow}>
                      <span>무조건·무필터</span>
                      <span>실시간 웹소켓</span>
                      <span>1:1 익명 대화</span>
                    </div>
                  </div>
                </div>

                {/* 4) 하단 고정 버튼 2개: 둘러보며 대기하기 & 매칭 취소 */}
                <footer className={styles.suteraFooter}>
                  <button
                    type="button"
                    className={styles.suteraWaitBtn}
                    onClick={() => {
                      setIsMinimized(true);
                      showToast('우측 하단에서 매칭 큐가 계속 진행됩니다.');
                    }}
                  >
                    둘러보며 대기하기
                  </button>
                  <button
                    type="button"
                    className={styles.suteraCancelBtn}
                    onClick={onCancel}
                  >
                    매칭 취소
                  </button>
                </footer>
              </div>
            )}

            {/* =========================================================
                AI 이상형 매칭 큐: 실시간 랭킹 보드 & 순위 변동 스왑
                ========================================================= */}
            {isIdealMatching && (
              <div className={styles.idealSearchCard}>
                <div className={styles.rankingStageBg}>
                  <div className={styles.stageTopRow}>
                    <div className={styles.liveTagPillWhite}>
                      <span className={styles.livePulseDotIndigo} />
                      <span className={styles.liveTagTextDark}>AI TOP-1 SHORTLIST</span>
                    </div>
                    <div className={styles.timerAndMinRow}>
                      <span className={styles.elapsedTimerDark}>{formatTime(matchSeconds)}</span>
                      <button
                        type="button"
                        className={styles.minimizeBtnLight}
                        onClick={() => {
                          setIsMinimized(true);
                          showToast('AI 후보 리스팅 · TOP 1 선별이 계속 진행됩니다.');
                        }}
                        title="둘러보며 대기하기"
                      >
                        <IconMinimize className={styles.iconSm} />
                      </button>
                    </div>
                  </div>

                  <div className={styles.titleScrambleRow}>
                    <div>
                      <h3 className={styles.idealHeadingDark}>이상형 후보 5명 실시간 채점 중</h3>
                      <p className={styles.idealSubDark}>
                        전체 <strong className={styles.highlightInk}>{waitingIdealUsers.toLocaleString()}</strong>명 중 상위 리스트 정렬 중
                      </p>
                    </div>
                    <span className={styles.rankingPhaseBadge}>
                      {rankingPhase}
                    </span>
                  </div>

                  {/* 실시간 순위 변동 리스트 스테이지 (스왑 애니메이션) */}
                  <div className={styles.rankingContainer}>
                    {sortedRanking.map((item, rankIdx) => {
                      const isTop = rankIdx === 0;
                      return (
                        <div
                          key={item.id}
                          className={`${styles.rankRow} ${isTop ? styles.rankRowTop : ''}`}
                          style={{
                            transform: `translateY(${rankIdx * 50}px)`,
                            zIndex: 10 - rankIdx
                          }}
                        >
                          <div className={styles.rankRowLeft}>
                            <span className={`${styles.rankNum} ${isTop ? styles.rankNumTop : ''}`}>
                              {`#${rankIdx + 1}`}
                            </span>
                            <div className={styles.rankAvatar}>
                              <img
                                src={item.isWinner ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80' : 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80'}
                                alt="후보"
                                className={styles.rankAvatarImg}
                              />
                            </div>
                            <div className={styles.rankInfo}>
                              <p className={styles.rankName}>
                                {item.alias}
                                <span className={styles.rankMbti}>{item.mbti}</span>
                              </p>
                              <p className={styles.rankMeta}>{item.region} · {item.dist}</p>
                            </div>
                          </div>

                          <div className={styles.rankRowRight}>
                            <div className={styles.rankMiniBarBack}>
                              <div
                                className={`${styles.rankMiniBarFill} ${isTop ? styles.rankMiniBarFillTop : ''}`}
                                style={{ width: `${item.score}%` }}
                              />
                            </div>
                            <span className={styles.rankScore}>{item.score}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 하단: 가중치 조건 칩 & 3단계 트래커 */}
                <div className={styles.idealFooter}>
                  <div className={styles.weightsHeaderRow}>
                    <span className={styles.weightsSubTitle}>SCORING WEIGHTS</span>
                    <span className={styles.weightsHint}>눌러서 순위 가중치 반영</span>
                  </div>

                  <div className={styles.boostChipsWrap}>
                    <button
                      type="button"
                      className={`${styles.chipBtn} ${boostChips.values ? styles.chipActive : styles.chipInactive}`}
                      onClick={() => toggleChip('values', '가치관 90%↑')}
                    >
                      {boostChips.values ? '✦ 가치관 90%↑' : '+ 가치관 90%↑'}
                    </button>
                    <button
                      type="button"
                      className={`${styles.chipBtn} ${boostChips.region ? styles.chipActive : styles.chipInactive}`}
                      onClick={() => toggleChip('region', '같은 생활권')}
                    >
                      {boostChips.region ? '✦ 같은 생활권' : '+ 같은 생활권'}
                    </button>
                    <button
                      type="button"
                      className={`${styles.chipBtn} ${boostChips.tempo ? styles.chipActive : styles.chipInactive}`}
                      onClick={() => toggleChip('tempo', '빠른 답장 템포')}
                    >
                      {boostChips.tempo ? '✦ 빠른 답장 템포' : '+ 빠른 답장 템포'}
                    </button>
                    <button
                      type="button"
                      className={`${styles.chipBtn} ${boostChips.nonsmoke ? styles.chipActive : styles.chipInactive}`}
                      onClick={() => toggleChip('nonsmoke', '비흡연 선호')}
                    >
                      {boostChips.nonsmoke ? '✦ 비흡연 선호' : '+ 비흡연 선호'}
                    </button>
                  </div>

                  {/* 3단계 도트 트래커 */}
                  <div className={styles.rankingStepTrack}>
                    <span className={styles.stepActive}>● 후보 리스팅</span>
                    <span className={styles.stepArrow}>→</span>
                    <span className={matchSeconds >= 2 ? styles.stepActive : styles.stepInactive}>
                      {matchSeconds >= 2 ? '●' : '○'} 점수 순위화
                    </span>
                    <span className={styles.stepArrow}>→</span>
                    <span className={matchSeconds >= 4 ? styles.stepActive : styles.stepInactive}>
                      {matchSeconds >= 4 ? '●' : '○'} TOP 1 선발
                    </span>
                  </div>

                  <div className={styles.dualModalBtns}>
                    <button
                      type="button"
                      className={styles.btnSecondaryLight}
                      onClick={() => {
                        setIsMinimized(true);
                        showToast('AI 후보 리스팅이 계속 진행됩니다.');
                      }}
                    >
                      둘러보며 대기하기
                    </button>
                    <button type="button" className={styles.btnCancelTextDark} onClick={onCancel}>
                      매칭 취소
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. 백그라운드 둘러보기 플로팅 미니 알약 바 (isMinimized 일 때 우측 하단 노출) */}
      {isMinimized && (
        <div className={`${styles.floatingPill} ${isBlindMatching ? styles.floatingPillDark : styles.floatingPillLight}`}>
          <button
            type="button"
            className={styles.floatingPillBody}
            onClick={() => setIsMinimized(false)}
          >
            <span className={`${styles.floatingSpinIconBox} ${isBlindMatching ? styles.spinHoney : styles.spinIndigo}`}>
              {isBlindMatching ? <IconDice className={styles.iconSm} /> : <IconList className={styles.iconSm} />}
            </span>
            <div className={styles.floatingPillTexts}>
              <p className={styles.floatingPillTitle}>
                {isBlindMatching ? '100% 랜덤 매칭 뽑는 중' : 'AI 후보 리스팅 · TOP 1 선별 중'}
              </p>
              <p className={styles.floatingPillSub}>
                경과 <strong>{formatTime(matchSeconds)}</strong> · 클릭해 열기
              </p>
            </div>
          </button>
          <button
            type="button"
            className={styles.floatingCloseBtn}
            onClick={onCancel}
            title="매칭 취소"
          >
            <IconClose className={styles.iconXs} />
          </button>
        </div>
      )}

      {/* 3. 토스트 알림 */}
      {toastText && (
        <div className={styles.toastWrap}>
          <span className={styles.toastDot} />
          <span>{toastText}</span>
        </div>
      )}
    </>
  );
}
