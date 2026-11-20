import { useEffect, useState } from 'react';
import Client from '../../api/client';
import { getBans, getProfile, reportLive, unbanMember } from '../../api/live';
import { REPORT_REASONS, errorMessage } from './liveConstants';
import styles from './live.module.css';

// 공통 모달 틀 (바깥 클릭·ESC로 닫기)
export function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog">
        <div className={styles.modalHeader}>
          <h3>{title}</h3>
          <button className={styles.iconButton} onClick={onClose} aria-label="닫기">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// 신고 (target.chat이 있으면 채팅 신고, 없으면 방송 신고)
export function ReportModal({ liveRoomSeq, chat, onClose }) {
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (!reason) return setError('신고 사유를 선택해주세요.');
    if (reason === 'ETC' && !detail.trim()) return setError('기타 사유를 입력해주세요.');
    setSending(true);
    try {
      await reportLive(liveRoomSeq, {
        live_chat_seq: chat?.live_chat_seq ?? null,
        reason,
        detail: detail.trim() || null,
      });
      setDone(true);
    } catch (e) {
      setError(errorMessage(e, '신고하지 못했어요.'));
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal title={chat ? '채팅 신고' : '방송 신고'} onClose={onClose}>
      {done ? (
        <>
          <p>신고가 접수됐어요. 운영자가 확인 후 조치할게요.</p>
          <button className={styles.primaryButton} onClick={onClose}>확인</button>
        </>
      ) : (
        <>
          {chat && (
            <p className={styles.quote}>
              <strong>{chat.nickname}</strong> {chat.content}
            </p>
          )}
          <div className={styles.radioGroup}>
            {REPORT_REASONS.map((r) => (
              <label key={r.value}>
                <input
                  type="radio"
                  name="reason"
                  value={r.value}
                  checked={reason === r.value}
                  onChange={() => setReason(r.value)}
                />
                {r.label}
              </label>
            ))}
          </div>
          <textarea
            className={styles.textarea}
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            maxLength={150}
            placeholder={reason === 'ETC' ? '신고 사유를 입력해주세요. (필수)' : '추가 내용 (선택)'}
          />
          {error && <p className={styles.error}>{error}</p>}
          <button className={styles.primaryButton} onClick={submit} disabled={sending}>
            신고하기
          </button>
        </>
      )}
    </Modal>
  );
}

// 프로필 + 연락 보내기 (기존 채팅방 생성 API 재사용)
export function ProfileModal({ memberSeq, myMemberSeq, onClose }) {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let ignore = false;
    getProfile(memberSeq)
      .then(({ data }) => !ignore && setProfile(data))
      .catch((e) => !ignore && setError(errorMessage(e, '프로필을 불러오지 못했어요.')));
    return () => {
      ignore = true;
    };
  }, [memberSeq]);

  const contact = async () => {
    try {
      const { data } = await Client.post('/api/chat/room', {
        room_name: `${profile.nickname}님과의 대화`,
        room_type: '1:1',
        invitee_seqs: [profile.member_seq],
      });
      // 방송이 끊기지 않도록 새 탭에서 열기
      window.open(`/chatting/${data.chat_room_seq}`, '_blank');
      setMessage('연락을 보냈어요. 상대가 수락하면 대화할 수 있어요.');
    } catch (e) {
      setMessage(errorMessage(e, '연락을 보내지 못했어요.'));
    }
  };

  const rows = profile
    ? [
        ['성별', profile.gender],
        ['MBTI', profile.mbti],
        ['키', profile.height ? `${profile.height}cm` : null],
        ['음주', profile.drinking],
        ['흡연', profile.smoking],
        ['종교', profile.religion],
      ].filter(([, v]) => v)
    : [];

  return (
    <Modal title="프로필" onClose={onClose}>
      {error && <p className={styles.error}>{error}</p>}
      {!profile && !error && <p className={styles.muted}>불러오는 중...</p>}
      {profile && (
        <>
          <div className={styles.profileHead}>
            <img src="/silhouette_man_cutout.png" alt="" className={styles.avatar} />
            <strong>{profile.nickname}</strong>
          </div>
          {rows.length > 0 ? (
            <dl className={styles.profileRows}>
              {rows.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className={styles.muted}>등록된 프로필 정보가 없어요.</p>
          )}
          {message && <p className={styles.notice}>{message}</p>}
          {Number(profile.member_seq) !== Number(myMemberSeq) && (
            <button className={styles.primaryButton} onClick={contact}>💌 연락 보내기</button>
          )}
        </>
      )}
    </Modal>
  );
}

// 방송자용 차단 목록 + 해제
export function BanListModal({ onClose }) {
  const [bans, setBans] = useState(null);
  const [error, setError] = useState('');

  const load = () =>
    getBans()
      .then(({ data }) => setBans(data))
      .catch((e) => setError(errorMessage(e, '차단 목록을 불러오지 못했어요.')));

  useEffect(() => {
    let ignore = false;
    getBans()
      .then(({ data }) => !ignore && setBans(data))
      .catch((e) => !ignore && setError(errorMessage(e, '차단 목록을 불러오지 못했어요.')));
    return () => {
      ignore = true;
    };
  }, []);

  const unban = async (b) => {
    if (!window.confirm(`${b.nickname}님의 차단을 해제할까요?`)) return;
    try {
      await unbanMember(b.member_seq);
      load();
    } catch (e) {
      setError(errorMessage(e, '차단을 해제하지 못했어요.'));
    }
  };

  return (
    <Modal title="내 차단 목록" onClose={onClose}>
      {error && <p className={styles.error}>{error}</p>}
      {bans && bans.length === 0 && <p className={styles.muted}>차단한 회원이 없어요.</p>}
      {bans && bans.length > 0 && (
        <ul className={styles.simpleList}>
          {bans.map((b) => (
            <li key={b.member_seq}>
              <span>
                {b.nickname || b.login_id}
                <small className={styles.muted}>
                  {' '}· {new Date(b.banned_at).toLocaleDateString('ko-KR')}
                </small>
              </span>
              <button className={styles.ghostButton} onClick={() => unban(b)}>해제</button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
