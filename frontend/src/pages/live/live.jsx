import { useState } from 'react';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import '@livekit/components-styles';
import Client from '../../api/client';
import styles from './live.module.css';

// TODO: 팀 백엔드 포트 통일되면 client.js baseURL로 변경
const API_URL = 'http://localhost:8081/api/live-test/token';

function Live() {
  const [conn, setConn] = useState(null); // { token, url }
  const [room, setRoom] = useState('test');
  const [identity, setIdentity] = useState('user' + Math.floor(Math.random() * 1000));
  const [isHost, setIsHost] = useState(false);
  const [error, setError] = useState('');

  const join = async (host) => {
    setError('');
    try {
      const res = await Client.get(API_URL, { params: { room, identity, host } });
      setIsHost(host);
      setConn(res.data);
    } catch (e) {
      console.error(e);
      setError('토큰 발급 실패: 백엔드 서버(8081)가 켜져 있는지 확인하세요.');
    }
  };

  if (!conn) {
    return (
      <div className={styles.lobby}>
        <h2>라이브 방송 테스트</h2>
        <label>
          방 이름
          <input value={room} onChange={(e) => setRoom(e.target.value)} />
        </label>
        <label>
          닉네임
          <input value={identity} onChange={(e) => setIdentity(e.target.value)} />
        </label>
        <div className={styles.buttons}>
          <button onClick={() => join(true)}>📡 방송하기</button>
          <button onClick={() => join(false)}>👀 시청하기</button>
        </div>
        {error && <p className={styles.error}>{error}</p>}
      </div>
    );
  }

  return (
    <div className={styles.room}>
      <LiveKitRoom
        serverUrl={conn.url}
        token={conn.token}
        connect={true}
        video={isHost}
        audio={isHost}
        onDisconnected={() => setConn(null)}
        data-lk-theme="default"
        style={{ height: '100%' }}
      >
        <VideoConference />
      </LiveKitRoom>
    </div>
  );
}

export default Live;