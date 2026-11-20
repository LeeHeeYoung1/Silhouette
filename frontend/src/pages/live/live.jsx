import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import '@livekit/components-styles';
import useAuthStore from '../../stores/useAuthStore';
import { getLiveDetail, joinLive, startLive } from '../../api/live';
import { errorMessage } from './liveConstants';
import LiveLobby from './liveLobby';
import LiveRoom from './liveRoom';

function Live() {
  const id = useAuthStore((state) => state.id);
  const [conn, setConn] = useState(null); // { token, url, live_room_seq, my_member_seq, room }
  const [isHost, setIsHost] = useState(false);
  const [notice, setNotice] = useState('');

  // 로그인 안 했으면 로그인 페이지로
  if (!id) {
    return <Navigate to="/login" replace />;
  }

  // 방송 시작 (실패 시 throw → 폼에서 메시지 표시)
  const handleStart = async (body) => {
    const { data } = await startLive(body);
    let room = { ...body, live_room_seq: data.live_room_seq, host_seq: data.my_member_seq, host_login_id: id };
    try {
      room = (await getLiveDetail(data.live_room_seq)).data;
    } catch {
      // 상세 조회 실패해도 방송은 진행
    }
    setNotice('');
    setIsHost(true);
    setConn({ ...data, room });
  };

  const handleWatch = async (liveRoomSeq) => {
    try {
      const { data } = await joinLive(liveRoomSeq);
      setNotice('');
      setIsHost(false);
      setConn({ ...data, live_room_seq: data.room.live_room_seq });
    } catch (e) {
      setNotice(errorMessage(e, '방송에 입장하지 못했어요.'));
    }
  };

  const handleLeave = (text) => {
    setConn(null);
    setIsHost(false);
    setNotice(text);
  };

  if (!conn) {
    return <LiveLobby myId={id} notice={notice} onStart={handleStart} onWatch={handleWatch} />;
  }
  return <LiveRoom key={conn.live_room_seq} conn={conn} isHost={isHost} onLeave={handleLeave} />;
}

export default Live;
