import { useState } from 'react';
import styles from './event.module.css';

const Event = () => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1; // 1-12
  const todayDate = today.getDate(); // 1-31

  // 출석체크 상태 (임시 상태 - 추후 API 연동 용이)
  const [isCheckedToday, setIsCheckedToday] = useState(false);
  const [streakDays, setStreakDays] = useState(5);
  const [totalDays, setTotalDays] = useState(12);

  // 이번 달 일수 계산 (28~31)
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth - 1, 1).getDay(); // 0(일) ~ 6(토)

  // 샘플 출석 완료 날짜 목록 (1일부터 오늘 이전까지 며칠 출석한 상태 시뮬레이션)
  const [checkedDays, setCheckedDays] = useState([1, 2, 4, 5, 8, 9, 10, 11, 12, 15, 16, 17]);

  const handleCheckIn = () => {
    if (isCheckedToday) return;
    setIsCheckedToday(true);
    setStreakDays((prev) => prev + 1);
    setTotalDays((prev) => prev + 1);
    setCheckedDays((prev) => [...prev, todayDate]);
  };

  // 달력 그리드 칸 생성 (빈 앞 칸 + 일자들)
  const calendarCells = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarCells.push({ day: null, key: `empty-${i}` });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push({
      day: d,
      key: `day-${d}`,
      isCompleted: checkedDays.includes(d),
      isToday: d === todayDate,
    });
  }

  // 연속 출석 마일스톤 리워드
  const streakRewards = [
    { days: 3, title: '3일 연속 출석', desc: '채팅 대화 하트 3개', icon: '💌', status: 'done' },
    { days: 7, title: '7일 연속 출석', desc: '프로필 24시간 부스터권', icon: '🚀', status: streakDays >= 7 ? 'ready' : 'locked' },
    { days: 14, title: '14일 연속 출석', desc: '이상형 1회 무료 매칭권', icon: '✨', status: streakDays >= 14 ? 'ready' : 'locked' },
    { days: 30, title: '한 달 개근 완주', desc: '프리미엄 블라인드 패키지', icon: '👑', status: streakDays >= 30 ? 'ready' : 'locked' },
  ];

  return (
    <div className={styles.container}>
      {/* 1. 상단 히어로 헤더 카드 */}
      <section className={styles.heroCard}>
        <div className={styles.heroContent}>
          <div className={styles.eventBadge}>
            <span>🎁 DAILY ATTENDANCE</span>
          </div>
          <h1 className={styles.heroTitle}>
            매일매일 설레는 <span className={styles.titleHighlight}>출석체크</span>
          </h1>
          <p className={styles.heroDesc}>
            하루 한 번 실루엣을 방문하고, 새로운 인연과 이어질 하트와 특별한 혜택을 받아보세요.
          </p>
        </div>

        <div className={styles.statSummaryGroup}>
          <div className={styles.statSummaryBox}>
            <span className={styles.statLabel}>연속 출석</span>
            <span className={`${styles.statValue} ${styles.statHighlight}`}>
              {streakDays}일째 🔥
            </span>
          </div>
          <div className={styles.statSummaryBox}>
            <span className={styles.statLabel}>이번 달 출석</span>
            <span className={styles.statValue}>
              {totalDays} / {daysInMonth}일
            </span>
          </div>
        </div>
      </section>

      {/* 2. 메인 2단 그리드 (좌: 출석 캘린더 | 우: 연속 출석 리워드) */}
      <div className={styles.mainGrid}>
        
        {/* 좌측: 출석 스탬프 캘린더 */}
        <section className={styles.glassCard}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span>📅 {currentYear}년 {currentMonth}월 출석판</span>
            </h2>
            <span className={styles.sectionSub}>매일 자정(00:00) 갱신</span>
          </div>

          <div className={styles.calendarMonthBar}>
            <span className={styles.monthNavTitle}>
              {currentYear}년 {currentMonth}월
            </span>
            <div className={styles.monthNavBtns}>
              <button type="button" className={styles.navArrowBtn} aria-label="이전 달">
                ‹
              </button>
              <button type="button" className={styles.navArrowBtn} aria-label="다음 달">
                ›
              </button>
            </div>
          </div>

          {/* 요일 헤더 */}
          <div className={styles.weekDaysHeader}>
            <span className={styles.weekSun}>일</span>
            <span>월</span>
            <span>화</span>
            <span>수</span>
            <span>목</span>
            <span>금</span>
            <span className={styles.weekSat}>토</span>
          </div>

          {/* 스탬프 그리드 */}
          <div className={styles.stampGrid}>
            {calendarCells.map((item) => {
              if (!item.day) {
                return <div key={item.key} className={`${styles.stampCell} ${styles.stampEmpty}`} />;
              }

              const isCompleted = item.isCompleted;
              const isToday = item.isToday;

              return (
                <div
                  key={item.key}
                  className={`
                    ${styles.stampCell} 
                    ${isCompleted ? styles.stampCompleted : ''} 
                    ${isToday ? styles.stampToday : ''}
                  `}
                >
                  <span className={styles.stampDayNumber}>{item.day}</span>
                  <span className={styles.stampIcon}>
                    {isCompleted ? '💖' : isToday ? '✨' : '·'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* 메인 출석체크 버튼 */}
          <div className={styles.ctaArea}>
            <button
              type="button"
              className={styles.checkInMainBtn}
              onClick={handleCheckIn}
              disabled={isCheckedToday}
            >
              {isCheckedToday ? '오늘 출석체크 완료! 💖' : '오늘의 출석체크 하기 ✨'}
            </button>
            <span className={styles.ctaHint}>
              {isCheckedToday
                ? '내일 자정(00:00)에 새로운 출석체크가 열립니다.'
                : '지금 출석하면 오늘의 하트 1개가 즉시 지급됩니다!'}
            </span>
          </div>
        </section>

        {/* 우측: 연속 출석 리워드 & 이벤트 안내 */}
        <section className={styles.glassCard}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span>🏆 연속 출석 보너스</span>
            </h2>
            <span className={styles.sectionSub}>달성 시 자동 지급</span>
          </div>

          <div className={styles.rewardList}>
            {streakRewards.map((reward) => (
              <div key={reward.days} className={styles.rewardItem}>
                <div className={styles.rewardLeft}>
                  <div className={styles.rewardBadgeCircle}>{reward.icon}</div>
                  <div className={styles.rewardTextGroup}>
                    <span className={styles.rewardTitle}>{reward.title}</span>
                    <span className={styles.rewardDesc}>{reward.desc}</span>
                  </div>
                </div>

                {reward.status === 'done' ? (
                  <span className={`${styles.rewardClaimStatus} ${styles.claimDone}`}>
                    ✓ 수령완료
                  </span>
                ) : reward.status === 'ready' ? (
                  <button type="button" className={`${styles.rewardClaimStatus} ${styles.claimReady}`}>
                    받기
                  </button>
                ) : (
                  <span className={`${styles.rewardClaimStatus} ${styles.claimLocked}`}>
                    D-{Math.max(0, reward.days - streakDays)}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* 하단 유의사항 */}
          <div className={styles.noticeCard}>
            <h3 className={styles.noticeTitle}>
              <span>💡 출석체크 유의사항</span>
            </h3>
            <ul className={styles.noticeList}>
              <li>출석체크는 매일 00:00 ~ 23:59(KST) 기준으로 1일 1회 가능합니다.</li>
              <li>지급된 하트 및 이벤트 쿠폰은 [마이페이지]에서 즉시 확인하실 수 있습니다.</li>
              <li>연속 출석이 끊길 경우 연속 출석 일수가 1일로 리셋됩니다.</li>
            </ul>
          </div>
        </section>

      </div>
    </div>
  );
};

export default Event;
