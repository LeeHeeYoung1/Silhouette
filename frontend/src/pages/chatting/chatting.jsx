import React, { useState, useEffect, useRef } from 'react';
import styles from './chatting.module.css';

const Chatting = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef(null);
  const messagesEndRef = useRef(null);

  // 자동 스크롤
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Spring Boot 웹소켓 엔드포인트에 맞게 URL 수정 필요
    ws.current = new WebSocket('ws://localhost:8080/ws/chat');

    ws.current.onopen = () => {
      setIsConnected(true);
      console.log('Silhouette 서버에 연결되었습니다.');
    };

    ws.current.onmessage = (event) => {
      const newMessage = JSON.parse(event.data);
      setMessages((prev) => [...prev, newMessage]);
    };

    ws.current.onclose = () => {
      setIsConnected(false);
      console.log('Silhouette 서버와 연결이 끊어졌습니다.');
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  const sendMessage = (e) => {
    e.preventDefault();
    if (inputMessage.trim() && isConnected) {
      const messageData = {
        sender: '나', // 실제 구현 시 JWT 토큰 등에서 추출한 유저 정보 사용
        content: inputMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      ws.current.send(JSON.stringify(messageData));
      
      // 내 메시지는 서버를 거치지 않고 바로 화면에 표시 (UX 향상)
      setMessages((prev) => [...prev, { ...messageData, isMine: true }]);
      setInputMessage('');
    }
  };

  return (
    <div className={styles.silhouetteContainer}>
      <div className={styles.chatWrapper}>
        <header className={styles.chatHeader}>
          <h1 className={styles.title}>Silhouette</h1>
          <span className={isConnected ? styles.statusOnline : styles.statusOffline}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </header>

        <div className={styles.messageDisplay}>
          {messages.map((msg, index) => (
            <div 
              key={index} 
              className={`${styles.messageWrapper} ${msg.isMine ? styles.myMessage : styles.otherMessage}`}
            >
              {!msg.isMine && <span className={styles.sender}>{msg.sender}</span>}
              <div className={styles.messageBubble}>
                {msg.content}
              </div>
              <span className={styles.timestamp}>{msg.timestamp}</span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className={styles.inputArea}>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="어둠 속에 메시지를 남기세요..."
            className={styles.textInput}
            disabled={!isConnected}
          />
          <button type="submit" className={styles.sendButton} disabled={!isConnected}>
            전송
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chatting;