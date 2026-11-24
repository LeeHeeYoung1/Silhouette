import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../../stores/useAuthStore';
import { adminEndLive, doneLiveReport, getLiveReports } from '../../api/live';
import { REPORT_REASONS, errorMessage } from './liveConstants';
import styles from './live.module.css';

const PAGE_SIZE = 20;
const reasonLabel = (v) => REPORT_REASONS.find((r) => r.value === v)?.label ?? v;

// 관리자: 라이브 신고 목록 → 처리 완료 / 방송 강제 종료
function LiveAdmin() {
  const id = useAuthStore((state) => state.id);
  const [status, setStatus] = useState('WAIT');
  const [page, setPage] = useState(1);
  const [version, setVersion] = useState(0);
  const [items, setItems] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    getLiveReports({ status: status || undefined, page })
      .then(({ data }) => {
        if (ignore) return;
        setItems((prev) => (page === 1 ? data : [...prev, ...data]));
        setHasMore(data.length === PAGE_SIZE);
        setError('');
      })
      .catch((e) => !ignore && setError(errorMessage(e, '신고 목록을 불러오지 못했어요.')));
    return () => {
      ignore = true;
    };
  }, [status, page, version]);

  if (!id) return <Navigate to="/login" replace />;

  const reload = () => {
    setPage(1);
    setVersion((v) => v + 1);
  };

  const done = async (r) => {
    try {
      await doneLiveReport(r.liveReportSeq);
      reload();
    } catch (e) {
      setError(errorMessage(e, '처리하지 못했어요.'));
    }
  };

  const forceEnd = async (r) => {
    const reason = window.prompt(`"${r.roomTitle}" 방송을 강제 종료할까요?\n종료 사유를 입력해주세요.`);
    if (reason === null) return;
    try {
      await adminEndLive(r.liveRoomSeq, reason.trim() || null);
      reload();
    } catch (e) {
      setError(errorMessage(e, '종료하지 못했어요.'));
    }
  };

  return (
    <div className={styles.lobby}>
      <div className={styles.lobbyHeader}>
        <h2>라이브 신고 관리</h2>
      </div>
      <div className={styles.categoryTabs}>
        {[
          ['WAIT', '처리 대기'],
          ['DONE', '처리 완료'],
          ['', '전체'],
        ].map(([v, label]) => (
          <button
            key={label}
            className={status === v ? styles.tabActive : styles.tab}
            onClick={() => {
              setStatus(v);
              setPage(1);
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {error && <p className={styles.error}>{error}</p>}
      {items.length === 0 && !error && <div className={styles.empty}>신고가 없어요.</div>}

      <ul className={styles.reportList}>
        {items.map((r) => (
          <li key={r.liveReportSeq} className={styles.reportItem}>
            <div className={styles.reportHead}>
              <span className={styles.tag}>{r.liveChatSeq ? '채팅 신고' : '방송 신고'}</span>
              <strong>{reasonLabel(r.reason)}</strong>
              <small className={styles.muted}>
                {new Date(r.createdAt).toLocaleString('ko-KR')} · 신고자 {r.reporterNickname}
              </small>
            </div>
            <div>
              방송: <strong>{r.roomTitle}</strong> ({r.hostNickname}){' '}
              <span className={r.roomStatus === 'LIVE' ? styles.liveBadge : styles.tag}>
                {r.roomStatus === 'LIVE' ? 'LIVE' : '종료'}
              </span>
            </div>
            {r.liveChatSeq && (
              <p className={styles.quote}>
                <strong>{r.chatMemberNickname}</strong> {r.chatContent ?? '(삭제된 채팅)'}
              </p>
            )}
            {r.detail && <p className={styles.muted}>사유: {r.detail}</p>}
            {r.status === 'WAIT' && (
              <div className={styles.lobbyActions}>
                <button className={styles.ghostButton} onClick={() => done(r)}>처리 완료</button>
                {r.roomStatus === 'LIVE' && (
                  <button className={styles.dangerButton} onClick={() => forceEnd(r)}>방송 강제 종료</button>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
      {hasMore && (
        <button className={styles.ghostButton} onClick={() => setPage((p) => p + 1)}>더 보기</button>
      )}
    </div>
  );
}

export default LiveAdmin;
