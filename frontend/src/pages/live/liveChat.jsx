import { useEffect, useRef, useState } from 'react';
import { Client as StompClient } from '@stomp/stompjs';
import useAuthStore from '../../stores/useAuthStore';
import styles from './live.module.css';

const CONTENT_MAX = 100;
const SEND_INTERVAL = 1000;

// 라이브 채팅 (들어온 시점 이후 메시지만 표시)
// onEnd(endedBy): 방송 종료(END) 수신 시 호출
function LiveChat({ liveRoomSeq, onEnd }) {
  const token = useAuthStore((state) => state.token);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const clientRef = useRef(null);
  const lastSentRef = useRef(0);
  const listRef = useRef(null);
  const onEndRef = useRef(onEnd);

  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);

  useEffect(() => {
    const client = new StompClient({
      brokerURL: 'ws://localhost:80/live',
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true);
        client.subscribe(`/sub/live/${liveRoomSeq}`, (frame) => {
          const msg = JSON.parse(frame.body);
          if (msg.type === 'END') {
            onEndRef.current?.(msg.content);
            return;
          }
          if (msg.type === 'CHAT' || msg.type === 'SYSTEM') {
            setMessages((prev) => [...prev.slice(-199), msg]);
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
    if (now - lastSentRef.current < SEND_INTERVAL) return; // 서버도 1초 제한
    lastSentRef.current = now;

    clientRef.current.publish({
      destination: '/pub/live/chat',
      body: JSON.stringify({ live_room_seq: liveRoomSeq, content }),
    });
    setInput('');
  };

  return (
    <div className={styles.chat}>
      <ul className={styles.chatList} ref={listRef}>
        {messages.map((m, i) =>
          m.type === 'SYSTEM' ? (
            <li key={i} className={styles.chatSystem}>{m.content}</li>
          ) : (
            <li key={m.live_chat_seq ?? i}>
              {m.host_yn === 'Y' && <span className={styles.hostBadge}>방송자</span>}
              <strong>{m.nickname}</strong> {m.content}
            </li>
          )
        )}
      </ul>
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
        <button onClick={send} disabled={!connected}>전송</button>
      </div>
    </div>
  );
}

export default LiveChat;
