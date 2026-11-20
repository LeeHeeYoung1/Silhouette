import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import useAuthStore from '../../stores/useAuthStore';
import styles from './blindChatting.module.css';

const BlindChatting = () => {
    const { roomSeq } = useParams(); // URL에서 방 번호 추출 (/chat/:roomSeq)
    const navi = useNavigate();
    const { token, id } = useAuthStore();
    const [stompClient, setStompClient] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const messageEndRef = useRef(null);

    // 메시지 수신 시 스크롤 최하단 이동
    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (!token || !roomSeq) return;

        // 접속 호스트 자동 감지 및 포트 대응
        const wsHost = window.location.hostname || 'localhost';
        const wsPort = window.location.port === '5173' ? ':80' : (window.location.port ? `:${window.location.port}` : '');
        const brokerURL = `ws://${wsHost}${wsPort}/blind`;

        const client = new Client({
            brokerURL: brokerURL,
            connectHeaders: { Authorization: `Bearer ${token}` },
            reconnectDelay: 5000,
            onConnect: () => {
                setIsConnected(true);
                // 이 방 번호 전용 채널 구독
                client.subscribe(`/sub/blind/chat/${roomSeq}`, (msg) => {
                    try {
                        const newMessage = JSON.parse(msg.body);
                        setMessages((prev) => [...prev, newMessage]);
                    } catch (e) {
                        console.error('메시지 파싱 실패:', e);
                    }
                });
            },
            onDisconnect: () => {
                setIsConnected(false);
            },
            onStompError: (frame) => {
                console.error('STOMP Error:', frame);
            }
        });

        client.activate();
        setStompClient(client);

        return () => {
            client.deactivate();
        };
    }, [token, roomSeq]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!input.trim() || !stompClient?.connected) return;

        stompClient.publish({
            destination: `/pub/blind/chat/${roomSeq}`,
            body: JSON.stringify({
                blindChatRoomSeq: Number(roomSeq),
                senderId: id, 
                msgType: 'TEXT',
                content: input.trim(),
                filteredYn: 'N',
            }),
        });
        setInput('');
    };

    return (
        <div className={styles.container}>
            <div className={styles.chatWrapper}>
                {/* 상단 헤더 */}
                <div className={styles.chatHeader}>
                    <div className={styles.headerLeft}>
                        <button type="button" onClick={() => navi('/')} className={styles.backBtn} title="홈으로 이동">
                            ←
                        </button>
                        <h3 className={styles.title}>
                            🎭 블라인드 대화방
                        </h3>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className={styles.timerBadge}>⏳ 10분 대화</span>
                        <div className={styles.onlineBadge}>
                            <span className={styles.pulseDot}></span>
                            <span>{isConnected ? '연결됨' : '연결 중...'}</span>
                        </div>
                    </div>
                </div>

                {/* 메시지 영역 */}
                <div className={styles.messageArea}>
                    {messages.length === 0 ? (
                        <div className={styles.emptyNotice}>
                            매칭된 상대와 익명 대화를 시작해보세요! 💬<br />
                            서로의 실루엣 너머 솔직하고 따뜻한 대화를 나눠보세요.
                        </div>
                    ) : (
                        messages.map((m, idx) => {
                            const isMine = m.senderId ? m.senderId === id : false;
                            return (
                                <div
                                    key={m.blindChatMessageSeq ?? idx}
                                    className={`${styles.messageRow} ${isMine ? styles.myMessageRow : styles.otherMessageRow}`}
                                >
                                    <span className={styles.senderName}>
                                        {isMine ? '나' : '상대방 (익명)'}
                                    </span>
                                    <div className={`${styles.bubble} ${isMine ? styles.myBubble : styles.otherBubble}`}>
                                        {m.content}
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messageEndRef} />
                </div>

                {/* 입력 폼 */}
                <form onSubmit={handleSend} className={styles.inputArea}>
                    <input
                        className={styles.chatInput}
                        placeholder={isConnected ? "따뜻한 첫 인사를 건네보세요..." : "채팅 서버 연결 중..."}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={!isConnected}
                        autoFocus
                    />
                    <button type="submit" className={styles.sendBtn} disabled={!isConnected || !input.trim()}>
                        전송
                    </button>
                </form>
            </div>
        </div>
    );
};

export default BlindChatting;
