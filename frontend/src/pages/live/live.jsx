import { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import { DisconnectReason } from 'livekit-client';
import '@livekit/components-styles';
import useAuthStore from '../../stores/useAuthStore';
import { getLiveList, startLive, joinLive, endLive } from '../../api/live';
import LiveChat from './liveChat';
import styles from './live.module.css';

// 서버 에러 → 화면에 보여줄 메시지
const errorMessage = (e, fallback) => {
  if (e.response?.status === 401) return '로그인이 만료됐어요. 다시 로그인해주세요.';
  const data = e.response?.data;
  return typeof data === 'string' && data ? data : fallback;
};

function Live() {
  const id = useAuthStore((state) => state.id);
  const [conn, setConn] = useState(null); // { token, url, live_room_seq? }
  const [isHost, setIsHost] = useState(false);
  const [title, setTitle] = useState('');
  const [lives, setLives] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadList = useCallback(async () => {
    try {
      const { data } = await getLiveList();
      setLives(data);
    } catch (e) {
      setError(errorMessage(e, '방송 목록을 불러오지 못했어요.'));
    }
  }, []);

  // 로비에 있을 때 목록 불러오기 (처음 들어왔을 때 + 방송에서 나왔을 때)
  useEffect(() => {
    if (id && !conn) loadList();
  }, [id, conn, loadList]);

  // 로그인 안 했으면 로그인 페이지로
  if (!id) {
    return <Navigate to="/login" replace />;
  }

  const handleStart = async () => {
    setError('');
    if (!title.trim()) {
      setError('방송 제목을 입력해주세요.');
      return;
    }
    try {
      const { data } = await startLive({ title: title.trim() });
      setIsHost(true);
      setNotice('');
      setConn(data);
    } catch (e) {
      setError(errorMessage(e, '방송을 시작하지 못했어요.'));
    }
  };

  const handleWatch = async (liveSeq) => {
    setError('');
    try {
      const { data } = await joinLive(liveSeq);
      setIsHost(false);
      setNotice('');
      setConn({ ...data, live_room_seq: data.room.live_room_seq });
    } catch (e) {
      setError(errorMessage(e, '방송에 입장하지 못했어요.'));
      loadList(); // 이미 끝난 방송일 수 있으니 목록 새로고침
    }
  };

  // 방송 화면에서 나갔을 때 (방송자면 종료 기록)
  const handleDisconnected = async (reason) => {
    // END 메시지보다 LiveKit 연결 해제가 먼저 올 수 있어서 사유로도 안내
    if (!isHost && reason === DisconnectReason.ROOM_DELETED) {
      setNotice((prev) => prev || '방송이 종료되었어요.');
    } else if (!isHost && reason === DisconnectReason.PARTICIPANT_REMOVED) {
      setNotice('방송자에 의해 퇴장되었어요.');
    }
    if (isHost) {
      try {
        await endLive(conn.live_room_seq);
      } catch {
        // 실패해도 다음 방송 시작 때 정리됨
      }
    }
    setConn(null);
    setIsHost(false);
  };

  // 채팅으로 END 수신 (방송자 종료 / 연결 끊김 / 관리자 종료)
  const handleEnd = (endedBy) => {
    if (!isHost) {
      setNotice(endedBy === 'ADMIN' ? '운영 정책에 따라 방송이 종료되었어요.' : '방송이 종료되었어요.');
    }
    setConn(null);
    setIsHost(false);
  };

  if (!conn) {
    return (
      <div className={styles.lobby}>
        <h2>라이브 방송</h2>
        <p>{id} 님으로 입장합니다</p>

        <div className={styles.buttons}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="방송 제목 (30자 이내)"
            maxLength={30}
          />
          <button onClick={handleStart}>📡 방송하기</button>
        </div>

        {notice && <p className={styles.notice}>{notice}</p>}
        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.listHeader}>
          <h3>지금 방송 중</h3>
          <button onClick={loadList}>새로고침</button>
        </div>

        {lives.length === 0 ? (
          <p className={styles.empty}>진행 중인 방송이 없어요.</p>
        ) : (
          <ul className={styles.list}>
            {lives.map((live) => (
              <li key={live.live_room_seq} className={styles.item}>
                <div className={styles.info}>
                  <strong>{live.title}</strong>
                  <span>
                    {live.host_nickname || live.host_login_id} · 👀 {live.viewer_count} ·{' '}
                    {new Date(live.started_at).toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    시작
                  </span>
                </div>
                {live.host_login_id === id ? (
                  <span className={styles.mine}>내 방송</span>
                ) : (
                  <button onClick={() => handleWatch(live.live_room_seq)}>👀 시청하기</button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className={styles.room}>
      <div className={styles.roomLayout}>
        <div className={styles.video}>
          <LiveKitRoom
            serverUrl={conn.url}
            token={conn.token}
            connect={true}
            video={isHost}
            audio={isHost}
            onDisconnected={handleDisconnected}
            data-lk-theme="default"
            style={{ height: '100%' }}
          >
            <VideoConference />
          </LiveKitRoom>
        </div>
        <LiveChat liveRoomSeq={conn.live_room_seq} onEnd={handleEnd} />
      </div>
    </div>
  );
}

export default Live;