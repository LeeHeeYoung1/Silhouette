import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Client from '../../api/client';
import styles from './event.module.css';

const ProfileQuestModal = ({ isOpen, onClose, onRewardClaimed }) => {
  const navi = useNavigate();

  // 4대 미션 진행 상태
  const [questStatus, setQuestStatus] = useState({
    profile: false,
    food: false,
    value: false,
    mbti: false,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isRewardClaimed, setIsRewardClaimed] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let ignore = false;
    const checkStatus = async () => {
      setIsLoading(true);
      try {
        const { data: seq } = await Client.get('/api/chat/member-seq');
        const memberSeq = Number(seq);

        // 1. 프로필 온보딩 완료 여부
        let profileDone = false;
        try {
          const profileRes = await Client.get('/api/profile/status');
          profileDone = !!profileRes.data?.completed;
        } catch (e) {}

        // 2. 백엔드 DB에서 3종 테스트 완료 상태 및 보상 수령 여부 조회 (GET /api/event/quest-status)
        const questRes = await Client.get('/api/event/quest-status', {
          params: { memberSeq },
        });

        const { foodDone, loveValueDone, mbtiDone, rewardClaimed } = questRes.data || {};

        if (!ignore) {
          setQuestStatus({
            profile: profileDone,
            food: !!foodDone,
            value: !!loveValueDone,
            mbti: !!mbtiDone,
          });
          setIsRewardClaimed(!!rewardClaimed);
        }
      } catch (err) {
        console.log('퀘스트 상태 확인 에러:', err);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };

    checkStatus();
    return () => {
      ignore = true;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // 완료 개수 계산 (0 ~ 4)
  const completedCount = Object.values(questStatus).filter(Boolean).length;
  const isAllCleared = completedCount === 4;

  // 보상 수령 (이용권 1장 지급 - 백엔드 POST /api/event/all-tests-reward 연동)
  const handleClaimReward = async () => {
    if (!isAllCleared || isRewardClaimed) return;
    try {
      const { data: seq } = await Client.get('/api/chat/member-seq');
      const memberSeq = Number(seq);

      // 백엔드로 올클리어 보상 지급 요청
      const res = await Client.post('/api/event/all-tests-reward', { memberSeq });

      setIsRewardClaimed(true);
      alert(res.data?.message || '축하합니다! 무료 매칭 이용권 1장이 지급되었습니다.');

      if (onRewardClaimed) {
        onRewardClaimed();
      }
    } catch (e) {
      const msg = e.response?.data?.message || '이용권 지급 처리 중 오류가 발생했습니다.';
      alert(msg);
    }
  };

  const missions = [
    { title: '내 기본 프로필 정보 등록', done: questStatus.profile, link: '/onboarding' },
    { title: '첫 데이트 음식 취향 밸런스 완료', done: questStatus.food, link: '/event/food-test' },
    { title: '나의 연애 가치관 심층 진단 완료', done: questStatus.value, link: '/event/love-value-test' },
    { title: '실루엣 연애 스타일 MBTI 완료', done: questStatus.mbti, link: '/event/mbti-test' },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--cream, #fffdf6)',
          border: '1px solid var(--hairline, #e7e0ce)',
          borderRadius: '24px',
          padding: '32px 24px',
          maxWidth: '440px',
          width: '100%',
          color: 'var(--text-main, #fff)',
          boxShadow: 'var(--card-shadow, 0 20px 50px rgba(0,0,0,0.5))',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <span
            style={{
              display: 'inline-block',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.08em',
              color: '#22201e',
              background: '#ffd34e',
              border: 'none',
              padding: '5px 14px',
              borderRadius: '9999px',
              marginBottom: '10px',
            }}
          >
            PROFILE & QUEST PERK
          </span>
          <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 6px' }}>
            성향 테스트 올클리어 & 프로필 보상
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-sub, #a0a8c4)', margin: 0, lineHeight: 1.5 }}>
            프로필과 3종 테스트를 모두 완료하고<br />
            무료 매칭 이용권 1장을 받아가세요!
          </p>
        </div>

        {/* 진행률 게이지 바 */}
        <div style={{ marginBottom: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
            <span style={{ color: 'var(--text-sub, #c8d0e7)' }}>전체 퀘스트 달성률</span>
            <span style={{ color: '#22201e', fontWeight: 800 }}>
              {completedCount} / 4 완료 ({completedCount * 25}%)
            </span>
          </div>
          <div style={{ width: '100%', height: '8px', background: '#f7f3e6', borderRadius: '10px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${completedCount * 25}%`,
                height: '100%',
                background: '#22201e',
                borderRadius: '10px',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>

        {/* 4대 퀘스트 항목 리스트 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
          {missions.map((m, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: m.done ? '#fff1c2' : '#f7f3e6',
                border: '1px solid #e7e0ce',
                padding: '12px 16px',
                borderRadius: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 900,
                    background: m.done ? '#22201e' : '#ffffff',
                    color: m.done ? '#ffd34e' : 'transparent',
                    border: m.done ? '1.5px solid #22201e' : '1.5px solid #e7e0ce',
                    flexShrink: 0,
                  }}
                >
                  ✓
                </span>
                <span
                  style={{
                    fontSize: '13.5px',
                    fontWeight: 600,
                    color: '#22201e',
                    textDecoration: m.done ? 'line-through' : 'none',
                  }}
                >
                  {m.title}
                </span>
              </div>
              {!m.done && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navi(m.link);
                  }}
                  style={{
                    background: '#ffd34e',
                    color: '#22201e',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '4px 10px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  진행하기 →
                </button>
              )}
            </div>
          ))}
        </div>

        {/* 보상 수령 버튼 */}
        <button
          type="button"
          onClick={handleClaimReward}
          disabled={!isAllCleared || isRewardClaimed}
          className={styles.checkInBtn}
          style={{
            width: '100%',
            opacity: !isAllCleared || isRewardClaimed ? 0.6 : 1,
            cursor: isAllCleared && !isRewardClaimed ? 'pointer' : 'default',
          }}
        >
          {isRewardClaimed
            ? '보상 수령 완료'
            : isAllCleared
            ? '무료 매칭 이용권 1장 받기'
            : '모든 미션을 완료하면 활성화됩니다'}
        </button>

        <button
          type="button"
          onClick={onClose}
          style={{
            display: 'block',
            width: '100%',
            marginTop: '12px',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted, #8b95b8)',
            fontSize: '13px',
            cursor: 'pointer',
            textAlign: 'center',
          }}
        >
          닫기
        </button>
      </div>
    </div>
  );
};

export default ProfileQuestModal;
