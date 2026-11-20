import { useEffect, useRef, useState } from 'react';
import { Client as StompClient } from '@stomp/stompjs';
import useAuthStore from '../../stores/useAuthStore';
import styles from './live.module.css';

const CONTENT_MAX = 100;
const SEND_INTERVAL = 1000;

// 라이브 채팅 (들어온 시점 이후 메시지만 표시)
// onEnd(endedBy): 방송 종료(END) / onKicked(): 내가 강퇴됨 / onRoomUpdate(room): 방송 정보 수정
// onProfile(memberSeq): 닉네임 클릭 / onReport(chat): 채팅 신고 / onMessage(): 새 채팅 수신(안 읽음 표시용)
function LiveChat({ liveRoomSeq, myMemberSeq, onEnd, onKicked, onRoomUpdate, onProfile, onReport, onMessage }) {
  const token = useAuthStore((state) => state.token);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [hint, setHint] = useState('');
  const clientRef = useRef(null);
  const lastSentRef = useRef(0);
  const listRef = useRef(null);
  const handlersRef = useRef({});

  useEffect(() => {
    handlersRef.current = { onEnd, onKicked, onRoomUpdate, onMessage, myMemberSeq };
  }, [onEnd, onKicked, onRoomUpdate, onMessage, myMemberSeq]);

  useEffect(() => {
    const client = new StompClient({
      brokerURL: 'ws://localhost:80/live',
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true);
        client.subscribe(`/sub/live/${liveRoomSeq}`, (frame) => {
          const msg = JSON.parse(frame.body);
          const h = handlersRef.current;
          switch (msg.type) {
            case 'END':
              h.onEnd?.(msg.content);
              return;
            case 'KICKED':
              if (h.myMemberSeq != null && Number(msg.member_seq) === Number(h.myMemberSeq)) {
                h.onKicked?.();
              }
              return;
            case 'ROOM_UPDATE':
              h.onRoomUpdate?.(msg.room);
              return;
            case 'CHAT':
              h.onMessage?.();
              setMessages((prev) => [...prev.slice(-199), msg]);
              return;
            case 'SYSTEM':
              setMessages((prev) => [...prev.slice(-199), msg]);
              return;
            default:
          }
        });
      },
      onWebSocketClose: () => setConnected(false),
    });
    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [liveRoomSeq, token]);

  // 새 메시지가 오면 맨 아래로
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const send = () => {
    const content = input.trim();
    if (!content || !clientRef.current?.connected) return;
    const now = Date.now();
    if (now - lastSentRef.current < SEND_INTERVAL) {
      setHint('채팅은 1초에 한 번 보낼 수 있어요.');
      return;
    }
    lastSentRef.current = now;
    setHint('');

    clientRef.current.publish({
      destination: '/pub/live/chat',
      body: JSON.stringify({ live_room_seq: liveRoomSeq, content }),
    });
    setInput('');
  };

  return (
    <div className={styles.chat}>
      <ul className={styles.chatList} ref={listRef}>
        {messages.length === 0 && <li className={styles.chatSystem}>채팅을 시작해보세요.</li>}
        {messages.map((m, i) =>
          m.type === 'SYSTEM' ? (
            <li key={`s${i}`} className={styles.chatSystem}>{m.content}</li>
          ) : (
            <li key={m.live_chat_seq ?? `c${i}`} className={styles.chatItem}>
              {m.host_yn === 'Y' && <span className={styles.hostBadge}>방송자</span>}
              <button className={styles.chatNick} onClick={() => onProfile?.(m.member_seq)}>
                {m.nickname}
              </button>
              <span className={styles.chatContent}>{m.content}</span>
              {Number(m.member_seq) !== Number(myMemberSeq) && (
                <button
                  className={styles.chatReport}
                  onClick={() => onReport?.(m)}
                  title="채팅 신고"
                  aria-label="채팅 신고"
                >
                  🚩
                </button>
              )}
            </li>
          )
        )}
      </ul>
      {hint && <p className={styles.chatHint}>{hint}</p>}
      <div className={styles.chatInput}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) send();
          }}
          maxLength={CONTENT_MAX}
          placeholder={connected ? '채팅 입력 (100자 이내)' : '채팅 연결 중...'}
          disabled={!connected}
        />
        <button className={styles.primaryButton} onClick={send} disabled={!connected || !input.trim()}>
          전송
        </button>
      </div>
    </div>
  );
}

export default LiveChat;
