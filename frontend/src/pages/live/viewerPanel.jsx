import { useCallback, useEffect, useState } from 'react';
import { getViewers, kickViewer, banMember, getKicked, unkickViewer } from '../../api/live';
import styles from './live.module.css';

const REFRESH_INTERVAL = 10000;

// 방송자 화면: 현재 시청자 목록 + 강퇴·차단 / 강퇴 목록 + 강퇴 취소
function ViewerPanel({ liveRoomSeq, onProfile }) {
  const [tab, setTab] = useState('viewers'); // 'viewers' | 'kicked'
  const [viewers, setViewers] = useState([]);
  const [kicked, setKicked] = useState([]);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    try {
      const [v, k] = await Promise.all([getViewers(liveRoomSeq), getKicked(liveRoomSeq)]);
      setViewers(v.data);
      setKicked(k.data);
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
        <div>
          <button
            className={tab === 'viewers' ? styles.primaryButton : styles.ghostButton}
            onClick={() => setTab('viewers')}
          >
            시청자 {viewers.length}명
          </button>
          <button
            className={tab === 'kicked' ? styles.primaryButton : styles.ghostButton}
            onClick={() => setTab('kicked')}
          >
            강퇴 {kicked.length}명
          </button>
        </div>
        <button className={styles.iconButton} onClick={load} title="새로고침">↻</button>
      </div>
      {message && <p className={styles.notice}>{message}</p>}

      {tab === 'viewers' && (
        <>
          {viewers.length === 0 && <p className={styles.muted}>아직 시청자가 없어요.</p>}
          <ul>
            {viewers.map((v) => (
              <li key={v.memberSeq}>
                <button className={styles.chatNick} onClick={() => onProfile?.(v.memberSeq)}>
                  {v.nickname || v.loginId}
                </button>
                <button
                  className={styles.ghostButton}
                  onClick={() =>
                    act(() => kickViewer(liveRoomSeq, v.memberSeq),
                      `${v.nickname}님을 이번 방송에서 강퇴할까요?`)
                  }
                >
                  강퇴
                </button>
                <button
                  className={styles.dangerButton}
                  onClick={() =>
                    act(() => banMember(v.memberSeq),
                      `${v.nickname}님을 차단할까요? 내 모든 방송에 입장할 수 없어요.`)
                  }
                >
                  차단
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {tab === 'kicked' && (
        <>
          {kicked.length === 0 && <p className={styles.muted}>이번 방송에서 강퇴한 회원이 없어요.</p>}
          <ul>
            {kicked.map((k) => (
              <li key={k.memberSeq}>
                <button className={styles.chatNick} onClick={() => onProfile?.(k.memberSeq)}>
                  {k.nickname || k.loginId}
                  {k.kickedAt && (
                    <small className={styles.muted}>
                      {' '}· {new Date(k.kickedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    </small>
                  )}
                </button>
                <button
                  className={styles.ghostButton}
                  onClick={() =>
                    act(() => unkickViewer(liveRoomSeq, k.memberSeq),
                      `${k.nickname}님의 강퇴를 취소할까요? 이번 방송에 다시 들어올 수 있어요.`)
                  }
                >
                  강퇴 취소
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default ViewerPanel;
