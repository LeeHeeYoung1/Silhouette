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

  // 블라인드 랜덤 릴 상태
  const [serialCode, setSerialCode] = useState('#0742');
  const [reelOffset, setReelOffset] = useState(0);
  const [isDiceShaking, setIsDiceShaking] = useState(false);
  const [shuffleClicks, setShuffleClicks] = useState(0);

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
  const reelTrackRef = useRef(null);

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

  // 1. 블라인드 매칭 대기 중: 지속적인 미스터리 릴 회전 & 시리얼 번호 스크램블링
  useEffect(() => {
    if (!isBlindMatching) return;

    // 시리얼 번호 실시간 스크램블 효과
    const scrambleInterval = setInterval(() => {
      const rand = '#' + String(Math.floor(100 + Math.random() * 899)).padStart(4, '0');
      setSerialCode(rand);
    }, 120);

    // 릴 카드 주기적 좌우 회전 효과
    const reelTimer = setInterval(() => {
      const randomShift = -((Math.floor(Math.random() * 12) + 6) * 86 - 140);
      setReelOffset(randomShift);
    }, 3200);

    return () => {
      clearInterval(scrambleInterval);
      clearInterval(reelTimer);
    };
  }, [isBlindMatching]);

  // 2. AI 이상형 매칭 대기 중: 가중치 점수 및 랭킹 순위 실시간 변동(스왑 애니메이션)
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

  // 블라인드 주사위 흔들기(대기 풀 섞기)
  const handleShufflePool = () => {
    setIsDiceShaking(true);
    setTimeout(() => setIsDiceShaking(false), 500);
    setShuffleClicks((prev) => prev + 1);

    const randomShift = -((Math.floor(Math.random() * 14) + 4) * 86 - 140);
    setReelOffset(randomShift);
    showToast(`대기 풀을 다시 섞었어요! (셔플 ${shuffleClicks + 1}회)`);
  };

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
        <div className={styles.overlay}>
          <div className={styles.modalBox}>
            {/* =========================================================
                블라인드 매칭 큐: 100% 랜덤 미스터리 릴 & 셔플 주사위
                ========================================================= */}
            {isBlindMatching && (
              <div className={styles.blindSearchCard}>
                {/* 상단 릴 스테이지 */}
                <div className={styles.blindStageSurface}>
                  <div className={styles.stageTopRow}>
                    <div className={styles.liveTagPill}>
                      <span className={styles.livePulseDot} />
                      <span className={styles.liveTagText}>100% RANDOM REEL</span>
                    </div>
                    <div className={styles.timerAndMinRow}>
                      <span className={styles.elapsedTimer}>{formatTime(matchSeconds)}</span>
                      <button
                        type="button"
                        className={styles.minimizeBtn}
                        onClick={() => {
                          setIsMinimized(true);
                          showToast('우측 하단에서 100% 랜덤 매칭 큐가 계속 돌아갑니다.');
                        }}
                        title="둘러보며 대기하기"
                      >
                        <IconMinimize className={styles.iconSm} />
                      </button>
                    </div>
                  </div>

                  <div className={styles.titleScrambleRow}>
                    <div>
                      <p className={styles.queueCountMeta}>
                        실시간 대기 풀 <strong className={styles.highlightHoney}>{waitingBlindUsers.toLocaleString()}</strong>명
                      </p>
                      <h3 className={styles.blindHeading}>누구와 연결될지 아무도 몰라요</h3>
                    </div>
                    <span className={styles.serialBadge}>{serialCode}</span>
                  </div>
                  <p className={styles.blindSub}>조건과 필터를 모두 끄고 완전한 우연으로 상대를 매칭하는 중</p>

                  {/* 수평 미스터리 랜덤 릴 */}
                  <div className={styles.reelStage}>
                    {/* 상단 타겟 포인터 */}
                    <div className={`${styles.reelPointer} ${styles.pointerTick}`}>
                      <span className={styles.pointerArrow} />
                    </div>
                    <div className={styles.reelCenterFrame} />

                    <div className={styles.reelMask}>
                      <div
                        ref={reelTrackRef}
                        className={styles.reelTrack}
                        style={{
                          transform: `translateX(${reelOffset}px)`,
                          transition: 'transform 2.2s cubic-bezier(0.12, 0.8, 0.2, 1)'
                        }}
                      >
                        {Array.from({ length: 26 }).map((_, idx) => (
                          <div key={idx} className={styles.mysteryCard}>
                            <span className={styles.mysteryCardIconWrap}>
                              <IconHelp className={styles.iconMd} />
                            </span>
                            <span className={styles.mysteryCardCode}>
                              {`#${String(100 + idx * 37).slice(0, 4)}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 하단 진행 바 */}
                  <div className={styles.progressBarTrack}>
                    <div
                      className={styles.progressBarFillBlind}
                      style={{ width: `${Math.min(98, 20 + (matchSeconds % 35) * 2.3)}%` }}
                    />
                  </div>
                </div>

                {/* 하단 셔플 주사위 & 컨트롤 */}
                <div className={styles.blindFooter}>
                  <div className={styles.pillBadgeRow}>
                    <span className={styles.dimPill}>조건 0개</span>
                    <span className={styles.dimPill}>완전 블라인드</span>
                    <span className={styles.honeyPill}>100% 랜덤</span>
                  </div>

                  <button
                    type="button"
                    className={styles.shuffleActionBtn}
                    onClick={handleShufflePool}
                  >
                    <div className={styles.shuffleBtnLeft}>
                      <span className={`${styles.diceIconBox} ${isDiceShaking ? styles.diceShaking : ''}`}>
                        <IconDice className={styles.iconMd} />
                      </span>
                      <div className={styles.shuffleBtnTexts}>
                        <p className={styles.shuffleMainText}>대기 풀 한 번 더 섞기</p>
                        <p className={styles.shuffleSubText}>
                          {shuffleClicks > 0 ? `셔플 ${shuffleClicks}회 완료! 무작위로 다시 섞였어요` : '눌러서 우연의 확률을 흔들어 보세요'}
                        </p>
                      </div>
                    </div>
                    <span className={styles.shuffleTag}>SHUFFLE</span>
                  </button>

                  <div className={styles.dualModalBtns}>
                    <button
                      type="button"
                      className={styles.btnSecondary}
                      onClick={() => {
                        setIsMinimized(true);
                        showToast('우측 하단에서 매칭 큐가 계속 진행됩니다.');
                      }}
                    >
                      둘러보며 대기하기
                    </button>
                    <button type="button" className={styles.btnCancelText} onClick={onCancel}>
                      매칭 취소
                    </button>
                  </div>
                </div>
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
