import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/useAuthStore';
import Client from '../../api/client';
import { getMyMemberSeq, getWeeklyAttendance, checkInAttendance } from '../../api/attendance';
import DailyRouletteModal from './DailyRouletteModal';
import ProfileQuestModal from './ProfileQuestModal';
import PageHero from '../../components/PageHero/PageHero';
import styles from './event.module.css';

const Event = () => {
  const { token } = useAuthStore();
  const navi = useNavigate();

  // 활성 카테고리 탭 (all, attend, styleTest, special)
  const [activeTab, setActiveTab] = useState('all');

  // 출석체크 상태 (서버 응답 AttendanceDTO 그대로 보관)
  const [memberSeq, setMemberSeq] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 특별 혜택 모달 제어
  const [isRouletteOpen, setIsRouletteOpen] = useState(false);
  const [isQuestOpen, setIsQuestOpen] = useState(false);

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
      setAttendance(data);
      alert(`출석 완료! 🎉\n${data.todayRewardTitle ?? ''}`);
    } catch (error) {
      const message = error.response?.data?.message || '출석체크 중 오류가 발생했어요.';
      alert(message);
    } finally {
      setIsChecking(false);
    }
  };

  // 첫 블라인드 채팅 보너스 수령 및 매칭 이동 (백엔드 POST /api/event/first-chat-reward 연동)
  const handleFirstBlindChat = async () => {
    if (!memberSeq) {
      navi('/chattingRoomList');
      return;
    }

    try {
      // 1. 첫 블라인드 채팅 완주 보너스 수령 요청
      const res = await Client.post('/api/event/first-chat-reward', { memberSeq });

      // 보상 수령 성공 시 알림 & 상단 마일리지 실시간 동기화
      alert(res.data?.message || '첫 블라인드 채팅 완주 보너스 50M이 지급되었습니다!');
      getWeeklyAttendance(memberSeq)
        .then(({ data }) => setAttendance(data))
        .catch(() => {});
    } catch (error) {
      const msg = error.response?.data?.message;
      if (msg === 'NO_CHAT_HISTORY') {
        // 아직 완주 이력이 없는 경우
        alert('블라인드 대화를 마치고 서로 호감을 선택하면 축하 마일리지 50M이 지급됩니다! 매칭 화면으로 이동합니다');
      } else if (msg) {
        // 이미 보상을 수령한 경우
        alert(`${msg}\n블라인드 채팅 화면으로 이동합니다`);
      }
      navi('/chattingRoomList');
    }
  };

  // 이벤트 카드 버튼 클릭 시 바로가기 또는 모달 열기
  const handleEventAction = (item) => {
    switch (item.id) {
      case 'food-balance':
        navi('/event/food-test');
        break;
      case 'ideal-type-check':
        navi('/event/love-value-test');
        break;
      case 'dating-mbti':
        navi('/event/mbti-test');
        break;
      case 'first-blind-chat':
        handleFirstBlindChat();
        break;
      case 'daily-roulette':
        setIsRouletteOpen(true);
        break;
      case 'profile-complete':
        setIsQuestOpen(true);
        break;

        // [권형석] E001 외모 등급 테스트 - 페이지 이동 (시작)
      case 'beauty-test':
        navi('/event/beauty-test');
        break;
      // [권형석] E001 외모 등급 테스트 - 페이지 이동 (끝)
      default:
        break;
    }
  };

  // 화면 표시용 값
  const isCheckedToday = attendance?.todayAttended ?? false;
  const streakDays = attendance?.currentStreak ?? 0;
  const mileage = attendance?.currentMileage ?? 0;
  const ticketCount = attendance?.currentTicket ?? 0;
  const weekDays = attendance?.weekDays ?? [];

  // 나의 연애 성향 & 밸런스 테스트 (음식, 가치관, MBTI)
  const styleTestEvents = [
    {
      id: 'food-balance',
      category: 'styleTest',
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
      badge: 'NEW',
      statusClass: styles.statusNew,
      title: '실루엣 연애 스타일 MBTI',
      desc: '소개팅에서 나의 연애 페르소나는? 직진 플러팅형부터 신중한 안식처형까지 나의 연애 유형을 확인하세요.',
      tags: ['#연애MBTI', '#플러팅유형', '#소개팅궁합'],
      btnText: '연애 유형 찾기',
    },
  ];

  // 소개팅 어플 스페셜 프로모션 이벤트 (실제 기능 연동형)
  const specialEvents = [
    {
      id: 'first-blind-chat',
      category: 'special',
      badge: '진행중',
      statusClass: styles.statusHot,
      title: '첫 블라인드 채팅 완주 보너스',
      desc: '블라인드 랜덤 매칭 후 시간제한 대화를 마치고 서로 호감을 선택하면 축하 마일리지 50M을 즉시 지급합니다.',
      tags: ['#블라인드채팅', '#50M즉시지급', '#첫인연응원'],
      btnText: '블라인드 매칭 시작',
    },
    {
      id: 'daily-roulette',
      category: 'special',
      badge: '매일 1회',
      statusClass: styles.statusActive,
      title: '오늘의 연애운 & 럭키 마일리지 룰렛',
      desc: '출석체크만으론 아쉽다면? 하루 한 번 행운의 룰렛을 돌리고 오늘의 연애운과 최대 100M 보너스를 받아가세요!',
      tags: ['#최대100M', '#오늘의연애운', '#꽝없는룰렛'],
      btnText: '행운 룰렛 돌리기',
    },
    {
      id: 'profile-complete',
      category: 'special',
      badge: '상시 혜택',
      statusClass: styles.statusNew,
      title: '성향 테스트 올클리어 & 프로필 완성 보상',
      desc: '음식·가치관·MBTI 3가지 테스트와 프로필 정보를 모두 완성하면 무료 매칭 이용권 1장을 즉시 지급합니다.',
      tags: ['#이용권1장지급', '#3종테스트완주', '#매칭률UP'],
      btnText: '내 프로필 확인하기',
    },
  ];


    /* ==========================================================================
     [권형석] E001 외모 등급 테스트 - 이벤트 카드 추가 (시작)
     ========================================================================== */
  const beautyTestEvents = [
    {
      id: 'beauty-test',
      category: 'styleTest',
      badge: 'AI 분석',
      statusClass: styles.statusNew,
      title: 'AI 외모 등급 테스트',
      desc: '본인 사진 1~4장을 올리면 AI가 모든 사진을 분석해 평균 점수와 등급을 알려드려요. 사진은 저장되지 않아요.',
      tags: ['#AI외모분석', '#사진저장안함', '#주1회참여'],
      btnText: '외모 등급 확인하기',
    },
  ];
  /* [권형석] E001 외모 등급 테스트 - 이벤트 카드 추가 (끝) */


  // 탭 필터링 로직
   // [권형석] E001 외모 등급 테스트 - 카드 목록에 추가 (시작)
  const allEvents = [...styleTestEvents, ...beautyTestEvents, ...specialEvents];
  // [권형석] E001 외모 등급 테스트 - 카드 목록에 추가 (끝)
  const filteredEvents =
    activeTab === 'all'
      ? allEvents
      : activeTab === 'attend'
      ? []
      : allEvents.filter((item) => item.category === activeTab);

  return (
    <div className={styles.container}>
      {/* 1. 상단 히어로 (라이브·게시판과 같은 허니 옐로 띠) + 내 혜택 현황 */}
      <PageHero
        eyebrow="EVENT & PERKS"
        title="이벤트 & 혜택"
        description="매일 출석체크로 마일리지를 모으고, 연애 성향·취향 테스트로 나만의 인연을 찾아보세요."
        wordmark="EVENT"
      >
        <div className={styles.heroStats}>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>연속 출석</span>
            <span className={styles.statValue}>{streakDays}일째</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>보유 마일리지</span>
            <span className={styles.statValue}>{mileage.toLocaleString()}M</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>매칭 이용권</span>
            <span className={styles.statValue}>{ticketCount}장</span>
          </div>
        </div>
      </PageHero>

      {/* 2. 카테고리 탭 네비게이션 */}
      <nav className={styles.tabBar} aria-label="이벤트 카테고리">
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'all' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('all')}
        >
          전체 이벤트
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'attend' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('attend')}
        >
          일일 출석체크
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'styleTest' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('styleTest')}
        >
          연애 성향 테스트
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'special' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('special')}
        >
          특별 혜택 & 프로모션
        </button>
      </nav>

      {/* 3. 출석체크 스페셜 카드 (전체 탭 또는 출석체크 탭 선택 시 노출) */}
      {(activeTab === 'all' || activeTab === 'attend') && (
        <section className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleGroup}>
              <h2 className={styles.sectionTitle}>
                <span>일일 출석체크 & 혜택 충전</span>
              </h2>
              <span className={styles.sectionSubtitle}>매일 00:00(자정) 갱신 · 연속 출석 시 보너스 마일리지 및 이용권 지급</span>
            </div>
          </div>

          {errorMsg && (
            <p style={{ color: 'var(--error)', fontSize: '13px', marginBottom: '8px' }}>{errorMsg}</p>
          )}
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
                {weekDays.map((item, idx) => (
                  <div
                    key={idx}
                    className={`
                      ${styles.weekStampItem}
                      ${item.attended ? styles.stampDone : ''}
                      ${item.today ? styles.stampTodayActive : ''}
                    `}
                    style={{ position: 'relative' }}
                  >
                    {item.bonusBadge && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '-4px',
                          background: 'var(--ink)',
                          color: 'var(--honey)',
                          fontSize: '9px',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '9999px',
                          boxShadow: '0 2px 6px rgba(34, 32, 30, 0.2)',
                        }}
                      >
                        {item.bonusBadge}
                      </span>
                    )}
                    <span className={styles.weekDayText}>{item.dayOfWeek}</span>
                    <span className={styles.stampIcon}>
                      {item.attended ? '✓' : item.today ? '●' : '·'}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{item.dateLabel}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.attendRight}>
              <div className={styles.attendRewardInfo}>
                오늘의 출석 혜택 <br />
                <span style={{ color: 'var(--accent-pink)' }}>
                  {(attendance?.todayRewardTitle || '10 마일리지').replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim()}
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
                  ? '오늘 출석 완료'
                  : isChecking
                  ? '출석 처리 중...'
                  : '오늘의 출석체크'}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 4. 연애 성향 & 스페셜 이벤트 카드 목록 */}
      {filteredEvents.length > 0 && (
        <section className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleGroup}>
              <h2 className={styles.sectionTitle}>
                <span>
                  {activeTab === 'all'
                    ? '참여 가능한 인기 이벤트'
                    : activeTab === 'styleTest'
                    ? '나의 연애 성향 & 밸런스 테스트'
                    : '특별 혜택 & 프로모션'}
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
                  onClick={() => handleEventAction(item)}
                >
                  <span>{item.btnText}</span>
                  <span>→</span>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. 행운의 룰렛 모달 */}
      <DailyRouletteModal
        isOpen={isRouletteOpen}
        onClose={() => setIsRouletteOpen(false)}
        onRewardClaimed={() => {
          if (memberSeq) {
            getWeeklyAttendance(memberSeq)
              .then(({ data }) => setAttendance(data))
              .catch(() => {});
          }
        }}
      />

      {/* 6. 프로필 완성 퀘스트 모달 */}
      <ProfileQuestModal
        isOpen={isQuestOpen}
        onClose={() => setIsQuestOpen(false)}
        onRewardClaimed={() => {
          if (memberSeq) {
            getWeeklyAttendance(memberSeq)
              .then(({ data }) => setAttendance(data))
              .catch(() => {});
          }
        }}
      />
    </div>
  );
};

export default Event;
