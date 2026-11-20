import { useCallback, useEffect, useRef, useState } from 'react';
import { LiveKitRoom } from '@livekit/components-react';
import { DisconnectReason } from 'livekit-client';
import { endLive, getLiveDetail, updateLive } from '../../api/live';
import { categoryLabel } from './liveConstants';
import { HostStage, ViewerStage } from './liveStage';
import LiveChat from './liveChat';
import LiveForm from './liveForm';
import ViewerPanel from './viewerPanel';
import { BanListModal, ProfileModal, ReportModal } from './liveModals';
import styles from './live.module.css';

const DETAIL_REFRESH = 15000;

// 방송 화면 (방송자·시청자 공용, 방송자에게만 수정·종료·시청자 패널)
// onLeave(notice): 방송 화면을 떠날 때 (로비에 보여줄 안내 문구)
function LiveRoom({ conn, isHost, onLeave }) {
  const liveRoomSeq = conn.live_room_seq;
  const [room, setRoom] = useState(conn.room ?? {});
  const [chatOpen, setChatOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [modal, setModal] = useState(null); // { type: 'edit'|'report'|'profile'|'bans', ... }
  const leftRef = useRef(false);

  // 한 번만 떠나기 (END 메시지와 LiveKit 연결 해제가 둘 다 올 수 있음)
  const leave = useCallback(
    (notice) => {
      if (leftRef.current) return;
      leftRef.current = true;
      onLeave(notice);
    },
    [onLeave]
  );

  // 시청자 수 등 주기적으로 갱신
  useEffect(() => {
    const timer = setInterval(() => {
      getLiveDetail(liveRoomSeq)
        .then(({ data }) => setRoom((prev) => ({ ...prev, ...data })))
        .catch(() => {});
    }, DETAIL_REFRESH);
    return () => clearInterval(timer);
  }, [liveRoomSeq]);

  const handleDisconnected = async (reason) => {
    if (isHost) {
      try {
        await endLive(liveRoomSeq);
      } catch {
        // 실패해도 스케줄러가 30초 뒤 정리
      }
      leave('');
      return;
    }
    if (reason === DisconnectReason.ROOM_DELETED) leave('방송이 종료되었어요.');
    else if (reason === DisconnectReason.PARTICIPANT_REMOVED) leave('방송자에 의해 퇴장되었어요.');
    else if (reason === DisconnectReason.CLIENT_INITIATED) leave('');
    else leave('연결이 끊겼어요. 다시 입장해주세요.');
  };

  const handleEndClick = async () => {
    if (!window.confirm('방송을 종료할까요?')) return;
    try {
      await endLive(liveRoomSeq);
    } catch {
      // 이미 종료된 경우 등
    }
    leave('방송을 종료했어요.');
  };

  // END 수신 (HOST / TIMEOUT / ADMIN)
  const handleEnd = (endedBy) => {
    leave(endedBy === 'ADMIN' ? '운영 정책에 따라 방송이 종료되었어요.' : '방송이 종료되었어요.');
  };

  const handleChatMessage = useCallback(() => {
    setUnread((n) => n + 1);
  }, []);

  const toggleChat = () => {
    setChatOpen((open) => !open);
    setUnread(0);
  };

  const hostName = room.host_nickname || room.host_login_id || '방송자';

  return (
    <LiveKitRoom
      serverUrl={conn.url}
      token={conn.token}
      connect={true}
      video={false}
      audio={false}
      options={{ adaptiveStream: true, dynacast: true }}
      onDisconnected={handleDisconnected}
      className={styles.roomWrap}
    >
      <header className={styles.roomHeader}>
        <div className={styles.roomInfo}>
          <div className={styles.roomTitleRow}>
            <span className={styles.liveBadge}>LIVE</span>
            <h2>{room.title}</h2>
          </div>
          <div className={styles.roomMeta}>
            <button
              className={styles.linkButton}
              onClick={() => setModal({ type: 'profile', memberSeq: room.host_seq })}
            >
              {hostName}
            </button>
            <span>· {categoryLabel(room.category)}</span>
            {room.viewer_count != null && <span>· 👀 {room.viewer_count}</span>}
            {(room.hashtags ?? []).map((t) => (
              <span key={t} className={styles.tag}>#{t}</span>
            ))}
          </div>
        </div>
        <div className={styles.roomActions}>
          <button className={styles.ghostButton} onClick={toggleChat}>
            💬 채팅 {chatOpen ? '닫기' : unread > 0 ? `(${unread > 99 ? '99+' : unread})` : ''}
          </button>
          {isHost ? (
            <>
              <button className={styles.ghostButton} onClick={() => setModal({ type: 'edit' })}>수정</button>
              <button className={styles.ghostButton} onClick={() => setModal({ type: 'bans' })}>차단 목록</button>
              <button className={styles.dangerButton} onClick={handleEndClick}>방송 종료</button>
            </>
          ) : (
            <>
              <button className={styles.ghostButton} onClick={() => setModal({ type: 'report' })}>🚩 신고</button>
              <button className={styles.ghostButton} onClick={() => leave('')}>나가기</button>
            </>
          )}
        </div>
      </header>

      {/* 채팅을 열면 영상 축소 + 채팅창, 닫으면 영상 풀커버 */}
      <div className={styles.roomBody}>
        <div className={styles.stageArea}>
          {isHost ? (
            <HostStage nickname={hostName} />
          ) : (
            <ViewerStage hostSeq={room.host_seq} nickname={hostName} />
          )}
        </div>

        {/* 채팅은 닫혀 있어도 연결 유지 (END·KICKED 수신, 입장 이후 메시지 보존) */}
        <aside className={chatOpen ? styles.side : styles.sideHidden}>
          {isHost && (
            <ViewerPanel
              liveRoomSeq={liveRoomSeq}
              onProfile={(memberSeq) => setModal({ type: 'profile', memberSeq })}
            />
          )}
          <LiveChat
            liveRoomSeq={liveRoomSeq}
            myMemberSeq={conn.my_member_seq}
            onEnd={handleEnd}
            onKicked={() => leave('방송자에 의해 퇴장되었어요.')}
            onRoomUpdate={(updated) => setRoom((prev) => ({ ...prev, ...updated }))}
            onProfile={(memberSeq) => setModal({ type: 'profile', memberSeq })}
            onReport={(chat) => setModal({ type: 'report', chat })}
            onMessage={chatOpen ? undefined : handleChatMessage}
          />
        </aside>
      </div>

      {modal?.type === 'edit' && (
        <LiveForm
          initial={room}
          onClose={() => setModal(null)}
          onSubmit={async (body) => {
            const { data } = await updateLive(liveRoomSeq, body);
            setRoom((prev) => ({ ...prev, ...data }));
            setModal(null);
          }}
        />
      )}
      {modal?.type === 'report' && (
        <ReportModal liveRoomSeq={liveRoomSeq} chat={modal.chat} onClose={() => setModal(null)} />
      )}
      {modal?.type === 'profile' && (
        <ProfileModal
          memberSeq={modal.memberSeq}
          myMemberSeq={conn.my_member_seq}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === 'bans' && <BanListModal onClose={() => setModal(null)} />}
    </LiveKitRoom>
  );
}

export default LiveRoom;
