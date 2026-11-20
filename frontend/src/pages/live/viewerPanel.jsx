import { useCallback, useEffect, useState } from 'react';
import { getViewers, kickViewer, banMember } from '../../api/live';
import styles from './live.module.css';

const REFRESH_INTERVAL = 10000;

// 방송자 화면: 현재 시청자 목록 + 강퇴·차단
function ViewerPanel({ liveRoomSeq, onProfile }) {
  const [viewers, setViewers] = useState([]);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await getViewers(liveRoomSeq);
      setViewers(data);
    } catch {
      // 방송 종료 직후 등은 무시
    }
  }, [liveRoomSeq]);

  useEffect(() => {
    const first = setTimeout(load, 0);
    const timer = setInterval(load, REFRESH_INTERVAL);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [load]);

  const act = async (fn, confirmText) => {
    if (!window.confirm(confirmText)) return;
    try {
      const { data } = await fn();
      setMessage(data);
    } catch (e) {
      const data = e.response?.data;
      setMessage(typeof data === 'string' && data ? data : '처리하지 못했어요.');
    }
    load();
  };

  return (
    <div className={styles.viewerPanel}>
      <div className={styles.listHeader}>
        <strong>시청자 {viewers.length}명</strong>
        <button className={styles.iconButton} onClick={load} title="새로고침">↻</button>
      </div>
      {message && <p className={styles.notice}>{message}</p>}
      {viewers.length === 0 && <p className={styles.muted}>아직 시청자가 없어요.</p>}
      <ul>
        {viewers.map((v) => (
          <li key={v.member_seq}>
            <button className={styles.chatNick} onClick={() => onProfile?.(v.member_seq)}>
              {v.nickname || v.login_id}
            </button>
            <button
              className={styles.ghostButton}
              onClick={() =>
                act(() => kickViewer(liveRoomSeq, v.member_seq),
                  `${v.nickname}님을 이번 방송에서 강퇴할까요?`)
              }
            >
              강퇴
            </button>
            <button
              className={styles.dangerButton}
              onClick={() =>
                act(() => banMember(v.member_seq),
                  `${v.nickname}님을 차단할까요? 내 모든 방송에 입장할 수 없어요.`)
              }
            >
              차단
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ViewerPanel;
