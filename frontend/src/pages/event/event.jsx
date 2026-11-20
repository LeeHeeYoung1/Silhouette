import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/useAuthStore';
import { getMyMemberSeq, getWeeklyAttendance, checkInAttendance } from '../../api/attendance';
import styles from './event.module.css';

const Event = () => {
  const { token } = useAuthStore();
  const navi = useNavigate();

  // 활성 카테고리 탭 (all, attend, aiTest, styleTest, special)
  const [activeTab, setActiveTab] = useState('all');

  // 출석체크 상태 (서버 응답 AttendanceDTO 그대로 보관)
  const [memberSeq, setMemberSeq] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 모달/알림창 (테스트 클릭 시 바로가기 피드백)
  const [selectedEvent, setSelectedEvent] = useState(null);

  // 비로그인 시 로그인 페이지로
  useEffect(() => {
    if (!token) navi('/login');
  }, [token, navi]);

  // 1) 내 회원번호 조회 → 2) 이번 주 출석 현황 조회
  useEffect(() => {
    if (!token) return;
    let ignore = false;

    const load = async () => {
      setIsLoading(true);
      setErrorMsg('');
      try {
        const { data: seq } = await getMyMemberSeq();
        const mySeq = Number(seq);
        const { data } = await getWeeklyAttendance(mySeq);
        if (ignore) return;
        setMemberSeq(mySeq);
        setAttendance(data);
      } catch (error) {
        console.error('출석 현황 조회 실패:', error);
        if (!ignore) setErrorMsg('출석 정보를 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };

    load();
    return () => {
      ignore = true;
    };
  }, [token]);

  // 오늘 출석체크
  const handleCheckIn = async () => {
    if (!memberSeq || isChecking || attendance?.todayAttended) return;

    setIsChecking(true);
    try {
      const { data } = await checkInAttendance(memberSeq);
      setAttendance(data); // 서버가 갱신된 주간 현황을 그대로 돌려줌
      alert(`출석 완료! 🎉\n${data.todayRewardTitle ?? ''}`);
    } catch (error) {
      const message = error.response?.data?.message || '출석체크 중 오류가 발생했어요.';
      alert(message);
    } finally {
      setIsChecking(false);
    }
  };

  // 화면 표시용 값
  const isCheckedToday = attendance?.todayAttended ?? false;
  const streakDays = attendance?.currentStreak ?? 0;
  const mileage = attendance?.currentMileage ?? 0;
  const ticketCount = attendance?.currentTicket ?? 0;
  const weekDays = attendance?.weekDays ?? [];

  // 1. AI 기반 매력 & 분석 테스트 이벤트
  const aiTestEvents = [
    {
      id: 'ai-face-grade',
      category: 'aiTest',
      icon: '✨',
      badge: 'HOT',
      statusClass: styles.statusHot,
      title: 'AI 분위기 & 매력도 랭크 분석',
      desc: '실루엣 AI가 내 프로필 사진의 조화도와 고유한 분위기 키워드(청순/도회/댕댕/시크)를 정밀 분석합니다.',
      tags: ['#AI얼굴등급', '#분위기점수', '#매력포인트'],
      btnText: '내 매력 분석하기',
    },
    {
      id: 'ai-voice-tone',
      category: 'aiTest',
      icon: '🎙️',
      badge: 'NEW',
      statusClass: styles.statusNew,
      title: 'AI 목소리 온·습도 테스트',
      desc: '3초 음성 녹음으로 상대방의 심장을 두근거리게 만드는 내 목소리의 온도와 톤 매력 지수를 측정해보세요.',
      tags: ['#꿀보이스', '#음성설렘지수', '#첫인상목소리'],
      btnText: '목소리 진단하기',
    },
    {
      id: 'ai-first-impression',
      category: 'aiTest',
      icon: '🔮',
      badge: 'AI 추천',
      statusClass: styles.statusActive,
      title: '실루엣 첫인상 AI 가상 매칭',
      desc: '얼굴을 보기 전 실루엣과 분위기 데이터만으로 나와 케미스트리가 가장 폭발하는 이상형을 AI가 추천합니다.',
      tags: ['#케미99%', '#블라인드AI', '#운명적첫만남'],
      btnText: '블라인드 매칭 돌리기',
    },
  ];

  // 2. 나의 연애 성향 & 밸런스 테스트 (음식, 이상형, 연애스타일)
  const styleTestEvents = [
    {
      id: 'food-balance',
      category: 'styleTest',
      icon: '🍽️',
      badge: '필수 테스트',
      statusClass: styles.statusActive,
      title: '첫 데이트 음식 취향 밸런스 게임',
      desc: '파스타 & 와인 vs 삼겹살 & 소주? 나의 입맛 취향을 고르면 첫 데이트 맛집 코스와 궁합 상대가 매칭됩니다.',
      tags: ['#첫데이트메뉴', '#미식케미', '#맛집성향'],
      btnText: '음식 성향 고르기',
    },
    {
      id: 'ideal-type-check',
      category: 'styleTest',
      icon: '💘',
      badge: '인기 1위',
      statusClass: styles.statusHot,
      title: '나의 진짜 이상형 가치관 진단',
      desc: '연락 빈도, 갈등 해결 방식, 데이트 주기 등 내가 가장 중요하게 생각하는 5가지 연애 가치관을 정리합니다.',
      tags: ['#이상형필터', '#가치관일치', '#연애우선순위'],
      btnText: '이상형 진단하기',
    },
    {
      id: 'dating-mbti',
      category: 'styleTest',
      icon: '🧩',
      badge: 'NEW',
      statusClass: styles.statusNew,
      title: '실루엣 연애 스타일 MBTI',
      desc: '소개팅에서 나의 연애 페르소나는? 직진 플러팅형부터 신중한 안식처형까지 나의 연애 유형을 확인하세요.',
      tags: ['#연애MBTI', '#플러팅유형', '#소개팅궁합'],
      btnText: '연애 유형 찾기',
    },
  ];

  // 3. 소개팅 어플 스페셜 프로모션 이벤트
  const specialEvents = [
    {
      id: 'blind-vote',
      category: 'special',
      icon: '👑',
      badge: '진행중',
      statusClass: styles.statusHot,
      title: '이번 주의 설레는 실루엣 블라인드 투표',
      desc: '베일에 싸인 실루엣 중 가장 호감 가는 실루엣에 투표하세요! 투표자 전원에게 블라인드 매칭 1회권 지급.',
      tags: ['#실루엣투표', '#이용권100%지급', '#주간투표'],
      btnText: '투표하고 이용권받기',
    },
    {
      id: 'coffee-voucher',
      category: 'special',
      icon: '☕',
      badge: '매주 추첨',
      statusClass: styles.statusActive,
      title: '첫 만남 응원! 스타벅스 데이트권 추첨',
      desc: '블라인드 매칭 성사 후 첫 대화를 나눈 커플 중 매주 100쌍에게 달콤한 스타벅스 아메리카노 2잔 쿠폰을 드립니다.',
      tags: ['#첫만남선물', '#데이트지원', '#스타벅스커플권'],
      btnText: '이벤트 응모하기',
    },
    {
      id: 'invite-friends',
      category: 'special',
      icon: '🎁',
      badge: '상시 혜택',
      statusClass: styles.statusNew,
      title: '친구 초대하고 더블 하트 받기',
      desc: '친구에게 내 초대 코드를 공유하고 친구가 가입하면 둘 다 무료 대화 하트 10개와 이상형 매칭권을 받습니다.',
      tags: ['#하트10개', '#무제한초대', '#친구와함께'],
      btnText: '초대 코드 복사',
    },
  ];

  // 탭 필터링 로직
  const allEvents = [...aiTestEvents, ...styleTestEvents, ...specialEvents];
  const filteredEvents =
    activeTab === 'all'
      ? allEvents
      : activeTab === 'attend'
      ? []
      : allEvents.filter((item) => item.category === activeTab);

  return (
    <div className={styles.container}>
      {/* 1. 상단 히어로 배너 */}
      <section className={styles.heroBanner}>
        <div className={styles.heroContent}>
          <div className={styles.badge}>
            <span>✨ SILHOUETTE EVENT & PERKS</span>
          </div>
          <h1 className={styles.heroTitle}>
            인연을 더 가깝게 만드는 <br />
            <span className={styles.titleHighlight}>실루엣 이벤트 & 혜택 센터</span>
          </h1>
          <p className={styles.heroDesc}>
            매일 출석체크로 하트를 모으고, AI 매력도 분석 및 취향 밸런스 테스트로 나만의 특별한 인연을 찾아보세요.
          </p>
        </div>

        <div className={styles.heroStats}>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>연속 출석</span>
            <span className={`${styles.statValue} ${styles.statPink}`}>{streakDays}일째 🔥</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>보유 마일리지</span>
            <span className={styles.statValue}>🪙 {mileage.toLocaleString()}M</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>매칭 이용권</span>
            <span className={styles.statValue}>🎫 {ticketCount}장</span>
          </div>
        </div>
      </section>

      {/* 2. 카테고리 탭 네비게이션 */}
      <nav className={styles.tabBar} aria-label="이벤트 카테고리">
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'all' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('all')}
        >
          🌟 전체 이벤트
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'attend' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('attend')}
        >
          📅 일일 출석체크
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'aiTest' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('aiTest')}
        >
          🤖 AI 매력 분석
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'styleTest' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('styleTest')}
        >
          💘 연애 성향 테스트
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'special' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('special')}
        >
          🎁 데이트 & 스페셜
        </button>
      </nav>

      {/* 3. 출석체크 스페셜 카드 (전체 탭 또는 출석체크 탭 선택 시 노출) */}
      {(activeTab === 'all' || activeTab === 'attend') && (
        <section className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleGroup}>
              <h2 className={styles.sectionTitle}>
                <span>📅 일일 출석체크 & 혜택 충전</span>
              </h2>
              <span className={styles.sectionSubtitle}>매일 00:00(자정) 갱신 · 연속 출석 시 보너스 마일리지 및 이용권 지급</span>
            </div>
          </div>

          <div className={styles.attendCard}>
            <div className={styles.attendLeft}>
              <div className={styles.attendTitleRow}>
                <span className={styles.attendCalendarTag}>이번 주 출석 현황</span>
                <span style={{ fontSize: '13px', color: 'var(--text-sub)' }}>
                  연속 <b>{streakDays}일</b> 출석 달성 중!
                </span>
              </div>

              {/* 주간 7일 스탬프 */}
              <div className={styles.weekStampRow}>
                {weekDays.map((item, idx) => {
                  const attended = item.attended ?? item.done;
                  const isToday = item.today ?? item.isToday;
                  const dayName = item.dayOfWeek ?? item.day;
                  const dateText = item.dateLabel ?? item.date;

                  return (
                    <div
                      key={idx}
                      className={`
                        ${styles.weekStampItem}
                        ${attended ? styles.stampDone : ''}
                        ${isToday ? styles.stampTodayActive : ''}
                      `}
                      style={{ position: 'relative' }}
                    >
                      {item.bonusBadge && (
                        <span
                          style={{
                            position: 'absolute',
                            top: '-8px',
                            right: '-4px',
                            background: 'linear-gradient(135deg, #f43f5e, #fb7185)',
                            color: '#fff',
                            fontSize: '9px',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: '8px',
                            boxShadow: '0 2px 6px rgba(244, 63, 94, 0.4)',
                          }}
                        >
                          {item.bonusBadge}
                        </span>
                      )}
                      <span className={styles.weekDayText}>{dayName}</span>
                      <span className={styles.stampIcon}>
                        {attended ? '💖' : isToday ? '✨' : '·'}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{dateText}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={styles.attendRight}>
              <div className={styles.attendRewardInfo}>
                오늘의 출석 혜택 <br />
                <span style={{ color: 'var(--accent-pink)' }}>
                  {attendance?.todayRewardTitle || '10 마일리지 🪙'}
                </span>
              </div>
              <span className={styles.attendRewardSub}>
                {attendance?.todayRewardSub || '연속 3일 +20M · 5일 +30M · 7일 이용권 1회'}
              </span>
              <button
                type="button"
                className={styles.checkInBtn}
                onClick={handleCheckIn}
                disabled={isCheckedToday || isChecking || isLoading}
              >
                {isCheckedToday
                  ? '오늘 출석 완료! 💖'
                  : isChecking
                  ? '출석 처리 중...'
                  : '오늘의 출석체크 ✨'}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 4. AI 매력 & 성향 & 스페셜 이벤트 카드 목록 */}
      {filteredEvents.length > 0 && (
        <section className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleGroup}>
              <h2 className={styles.sectionTitle}>
                <span>
                  {activeTab === 'all'
                    ? '🎉 참여 가능한 인기 이벤트'
                    : activeTab === 'aiTest'
                    ? '🤖 AI 기반 매력 & 분석 테스트'
                    : activeTab === 'styleTest'
                    ? '💘 나의 연애 성향 & 밸런스 테스트'
                    : '🎁 특별 혜택 & 프로모션'}
                </span>
              </h2>
              <span className={styles.sectionSubtitle}>
                테스트를 완료하거나 이벤트에 참여하면 프로필 뱃지와 매칭 혜택이 지급됩니다.
              </span>
            </div>
          </div>

          <div className={styles.cardGrid}>
            {filteredEvents.map((item) => (
              <div key={item.id} className={styles.eventCard}>
                <div className={styles.cardTop}>
                  <div className={styles.cardIcon}>{item.icon}</div>
                  <span className={`${styles.statusPill} ${item.statusClass}`}>{item.badge}</span>
                </div>

                <div className={styles.cardBody}>
                  <h3 className={styles.cardTitle}>{item.title}</h3>
                  <p className={styles.cardDesc}>{item.desc}</p>
                  <div className={styles.rewardTagGroup}>
                    {item.tags.map((tag, tIdx) => (
                      <span key={tIdx} className={styles.rewardTag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  className={styles.cardActionBtn}
                  onClick={() => setSelectedEvent(item)}
                >
                  <span>{item.btnText}</span>
                  <span>→</span>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. 간단한 이벤트 상세 바로가기 안내 토스트/모달 알림 */}
      {selectedEvent && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setSelectedEvent(null)}
        >
          <div
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              borderRadius: '24px',
              padding: '32px',
              maxWidth: '440px',
              width: '100%',
              boxShadow: 'var(--glass-reflect), 0 20px 50px rgba(0,0,0,0.5)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: '42px' }}>{selectedEvent.icon}</div>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>
              {selectedEvent.title}
            </h3>
            <p style={{ fontSize: '13.5px', color: 'var(--text-sub)', lineHeight: 1.6 }}>
              {selectedEvent.desc}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {selectedEvent.tags.map((tag, i) => (
                <span key={i} className={styles.rewardTag}>
                  {tag}
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                className={styles.checkInBtn}
                style={{ flex: 1 }}
                onClick={() => {
                  if (selectedEvent.id === 'food-balance') {
                    navi('/event/food-test');
                    setSelectedEvent(null);
                  } else {
                    alert(`[${selectedEvent.title}] 기능으로 연결됩니다! 💖`);
                    setSelectedEvent(null);
                  }
                }}
              >
                지금 참여하기 ✨
              </button>
              <button
                type="button"
                className={styles.tabBtn}
                onClick={() => setSelectedEvent(null)}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Event;
