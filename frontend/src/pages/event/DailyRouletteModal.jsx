import React, { useState, useEffect } from 'react';
import Client from '../../api/client';
import styles from './event.module.css';

// 룰렛 칸 6개 데이터 (백엔드 보상: 10, 20, 30, 50, 100M과 100% 일치)
const ROULETTE_SECTORS = [
  { reward: 10, label: '10M', color: '#ffd34e' },
  { reward: 30, label: '30M', color: '#22201e' },
  { reward: 20, label: '20M', color: '#ffe074' },
  { reward: 50, label: '50M', color: '#383531' },
  { reward: 10, label: '10M', color: '#ffd34e' },
  { reward: 100, label: '100M', color: '#22201e' },
];

const DailyRouletteModal = ({ isOpen, onClose, onRewardClaimed }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotationDeg, setRotationDeg] = useState(0);
  const [hasPlayedToday, setHasPlayedToday] = useState(false);
  const [winResult, setWinResult] = useState(null);

  // 오늘 이미 참여했는지 로컬 날짜 체크
  useEffect(() => {
    if (!isOpen) return;
    const today = new Date().toISOString().slice(0, 10);
    const lastPlayed = localStorage.getItem('last_roulette_date');
    if (lastPlayed === today) {
      setHasPlayedToday(true);
      const savedResult = localStorage.getItem('last_roulette_result');
      if (savedResult) {
        try {
          setWinResult(JSON.parse(savedResult));
        } catch (e) {}
      }
    } else {
      setHasPlayedToday(false);
      setWinResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 룰렛 돌리기 (백엔드 POST /api/event/roulette 실제 연동)
  const handleSpin = async () => {
    if (isSpinning || hasPlayedToday) return;

    setIsSpinning(true);
    setWinResult(null);

    try {
      // 1. 내 회원번호 가져오기
      const { data: memberSeq } = await Client.get('/api/chat/member-seq');

      // 2. 백엔드에서 룰렛 당첨 추첨 및 DB 마일리지 적립 (POST)
      const res = await Client.post('/api/event/roulette', {
        memberSeq: Number(memberSeq),
      });

      const { rewardMileage, fortune } = res.data;

      // 3. 당첨된 마일리지에 해당하는 룰렛 칸 찾기
      const matchedIndices = ROULETTE_SECTORS
        .map((sec, idx) => (sec.reward === rewardMileage ? idx : -1))
        .filter((idx) => idx !== -1);
      const prizeIndex =
        matchedIndices.length > 0
          ? matchedIndices[Math.floor(Math.random() * matchedIndices.length)]
          : 0;

      // 4. 각도 계산 (5바퀴 1800도 + 당첨 칸을 12시 핀 위치로 회전)
      const sectorAngle = 360 / ROULETTE_SECTORS.length;
      const centerAngle = prizeIndex * sectorAngle + sectorAngle / 2;
      const targetDeg = 1800 + (360 - centerAngle);
      setRotationDeg(targetDeg);

      // 5. 3.5초 회전 연출 후 결과 표시
      setTimeout(() => {
        setIsSpinning(false);
        const selected = {
          reward: rewardMileage,
          label: `${rewardMileage}M`,
          fortune: fortune,
        };
        setWinResult(selected);

        // 오늘 날짜 및 결과 저장
        const today = new Date().toISOString().slice(0, 10);
        localStorage.setItem('last_roulette_date', today);
        localStorage.setItem('last_roulette_result', JSON.stringify(selected));
        setHasPlayedToday(true);

        if (onRewardClaimed) onRewardClaimed(rewardMileage);
      }, 3500);
    } catch (error) {
      setIsSpinning(false);
      const msg = error.response?.data?.message || '오늘의 행운 룰렛은 이미 참여했습니다!';
      alert(msg);
      setHasPlayedToday(true);
    }
  };

  // SVG 원형 휠 파라미터 (지름 280, 중심 140, 140, 반지름 130)
  const cx = 140;
  const cy = 140;
  const radius = 130;
  const textRadius = 86;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
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
          maxWidth: '430px',
          width: '100%',
          textAlign: 'center',
          color: 'var(--text-main, #fff)',
          boxShadow: 'var(--card-shadow, 0 20px 50px rgba(0,0,0,0.5))',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
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
          DAILY LUCKY ROULETTE
        </span>

        <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 6px' }}>
          오늘의 연애운 & 럭키 룰렛
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-sub, #a0a8c4)', margin: '0 0 20px', lineHeight: 1.5 }}>
          매일 1회! 꽝 없이 100% 당첨되는 마일리지와<br />
          오늘의 심쿵 연애운 포춘을 받아가세요.
        </p>

        {/* 룰렛 래퍼 */}
        <div style={{ position: 'relative', width: '280px', height: '280px', margin: '0 auto 20px' }}>
          {/* 상단 화살표 핀 (12시 방향 고정) */}
          <div
            style={{
              position: 'absolute',
              top: '-10px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 10,
              width: 0,
              height: 0,
              borderLeft: '13px solid transparent',
              borderRight: '13px solid transparent',
              borderTop: '22px solid #22201e',
              filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.6))',
            }}
          />

          {/* 회전하는 SVG 룰렛 판 */}
          <svg
            width="280"
            height="280"
            viewBox="0 0 280 280"
            style={{
              transform: `rotate(${rotationDeg}deg)`,
              transition: isSpinning ? 'transform 3.5s cubic-bezier(0.15, 0.9, 0.2, 1)' : 'none',
              filter: 'drop-shadow(0 10px 25px rgba(0,0,0,0.45))',
            }}
          >
            {/* 6개 피자 조각 섹터 */}
            {ROULETTE_SECTORS.map((sector, idx) => {
              const startAngle = idx * 60;
              const endAngle = (idx + 1) * 60;
              const midAngle = startAngle + 30;

              // 호 좌표 계산 (12시 기준 시계방향)
              const startRad = (startAngle * Math.PI) / 180;
              const endRad = (endAngle * Math.PI) / 180;
              const midRad = (midAngle * Math.PI) / 180;

              const x1 = cx + radius * Math.sin(startRad);
              const y1 = cy - radius * Math.cos(startRad);
              const x2 = cx + radius * Math.sin(endRad);
              const y2 = cy - radius * Math.cos(endRad);

              // 텍스트 위치 (중심 각도 방향으로 radius 86)
              const tx = cx + textRadius * Math.sin(midRad);
              const ty = cy - textRadius * Math.cos(midRad);

              return (
                <g key={idx}>
                  {/* 부채꼴 조각 */}
                  <path
                    d={`M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`}
                    fill={sector.color}
                    stroke="rgba(255, 255, 255, 0.35)"
                    strokeWidth="1.5"
                  />
                  {/* 마일리지 텍스트 */}
                  <text
                    x={tx}
                    y={ty}
                    transform={`rotate(${midAngle}, ${tx}, ${ty})`}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#ffffff"
                    fontSize="16px"
                    fontWeight="900"
                    style={{
                      textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {sector.label}
                  </text>
                </g>
              );
            })}

            {/* 바깥쪽 원형 테두리 */}
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke="#22201e"
              strokeWidth="5"
            />
          </svg>

          {/* 중앙 중심축 버튼 (회전하지 않고 항상 바로 서있음) */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '74px',
              height: '74px',
              borderRadius: '50%',
              background: '#22201e',
              border: '3px solid #ffd34e',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
              zIndex: 5,
              pointerEvents: 'none',
            }}
          >
            <span style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.65)' }}>DAILY</span>
            <span style={{ fontSize: '13px', fontWeight: 900, color: '#ffd34e', marginTop: '1px' }}>LUCKY</span>
          </div>
        </div>

        {/* 당첨 결과창 */}
        {winResult && (
          <div
            style={{
              background: '#f7f3e6',
              border: '1px solid #e7e0ce',
              padding: '16px',
              borderRadius: '16px',
              marginBottom: '18px',
              animation: 'fadeIn 0.3s ease',
            }}
          >
            <div style={{ color: '#22201e', fontWeight: 800, fontSize: '18px', marginBottom: '6px' }}>
              {winResult.label} 보너스 획득!
            </div>
            <p style={{ fontSize: '13px', margin: 0, color: 'var(--text-sub, #5c5549)', lineHeight: 1.5 }}>
              <strong>오늘의 연애운:</strong><br />
              {winResult.fortune}
            </p>
          </div>
        )}

        {/* 룰렛 돌리기 버튼 */}
        <button
          type="button"
          onClick={handleSpin}
          disabled={isSpinning || hasPlayedToday}
          className={styles.checkInBtn}
          style={{
            width: '100%',
            opacity: hasPlayedToday ? 0.6 : 1,
            cursor: hasPlayedToday ? 'default' : 'pointer',
          }}
        >
          {isSpinning
            ? '행운의 룰렛 회전 중...'
            : hasPlayedToday
            ? '오늘 참여 완료 (내일 다시 돌리기)'
            : '룰렛 힘차게 돌리기'}
        </button>

        <button
          type="button"
          onClick={onClose}
          style={{
            marginTop: '12px',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted, #8b95b8)',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          닫기
        </button>
      </div>
    </div>
  );
};

export default DailyRouletteModal;
