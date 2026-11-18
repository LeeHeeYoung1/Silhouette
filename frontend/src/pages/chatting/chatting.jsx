import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Client as StompClient } from '@stomp/stompjs';
import Client from '../../api/client';
import useAuthStore from '../../stores/useAuthStore';
import styles from './chatting.module.css';

const Chatting = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);

  const [memberSeq, setMemberSeq] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [members, setMembers] = useState([]);
  const [inviteMessage, setInviteMessage] = useState('');
  const [roomName, setRoomName] = useState('');
  const stompClient = useRef(null);
  const messagesEndRef = useRef(null);
  const [isOwner, setIsOwner] = useState(false);

  const formatTime = (value) => {
    if (!value) return '';
    return new Date(value).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isSameMinute = (prev, current) => {
  if (!prev || !current) return false;

  const prevDate = new Date(prev.created_at);
  const currentDate = new Date(current.created_at);

  return (
    prevDate.getFullYear() === currentDate.getFullYear() &&
    prevDate.getMonth() === currentDate.getMonth() &&
    prevDate.getDate() === currentDate.getDate() &&
    prevDate.getHours() === currentDate.getHours() &&
    prevDate.getMinutes() === currentDate.getMinutes()
  );
};

  // 채팅방 목록에서 현재 방 번호에 해당하는 실제 방 이름 가져오기
  useEffect(() => {
    const fetchRoomName = async () => {
      try {
        const response = await Client.get('/api/chat/rooms');
        const room = response.data.find(
          (item) => Number(item.chat_room_seq) === Number(roomId)
        );

        if (room && room.room_name) {
          setRoomName(room.room_name);
        } else {
          setRoomName('채팅방');
        }
      } catch (error) {
        console.error('채팅방 이름을 불러오지 못했습니다.', error);
        setRoomName('채팅방');
      }
    };

    if (token && roomId) {
      fetchRoomName();
    }
  }, [roomId, token]);

  useEffect(() => {
    const getMyMemberSeq = async () => {
      try {
        const response = await Client.get('/api/chat/member-seq');
        setMemberSeq(Number(response.data));
      } catch (error) {
        console.error('회원 정보를 가져오지 못했습니다.', error);
      }
    };

    if (token) getMyMemberSeq();
  }, [token]);

  useEffect(() => {
    const fetchPreviousMessages = async () => {
      try {
        const response = await Client.get(`/api/chat/messages/${roomId}`);
        const loadedMessages = response.data.map((msg) => ({
          ...msg,
          isMine: Number(msg.sender_seq) === Number(memberSeq),
          content: msg.message_content,
          timestamp: formatTime(msg.created_at)
        }));
        setMessages(loadedMessages);
      } catch (error) {
        console.error('이전 대화 내용을 불러오지 못했습니다.', error);
      }
    };

    if (roomId && memberSeq) fetchPreviousMessages();
  }, [roomId, memberSeq]);

  useEffect(() => {
    if (!roomId || !token || !memberSeq) return;

    const client = new StompClient({
      brokerURL: 'ws://localhost:80/chat',
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      reconnectDelay: 5000,
      onConnect: () => {
        setIsConnected(true);
        client.subscribe(`/sub/chat/${roomId}`, (frame) => {
          const newMessage = JSON.parse(frame.body);
          setMessages((prev) => {
            if (prev.some((item) => item.chat_message_seq === newMessage.chat_message_seq)) {
              return prev;
            }
            return [...prev, {
              ...newMessage,
              isMine: Number(newMessage.sender_seq) === Number(memberSeq),
              content: newMessage.message_content,
              timestamp: formatTime(newMessage.created_at)
            }];
          });
        });
      },
      onStompError: (frame) => {
        console.error('STOMP 오류:', frame.headers?.message, frame.body);
        setIsConnected(false);
      },
      onWebSocketError: (error) => {
        console.error('웹소켓 오류:', error);
        setIsConnected(false);
      },
      onWebSocketClose: () => {
        setIsConnected(false);
      }
    });

    stompClient.current = client;
    client.activate();

    return () => {
      setIsConnected(false);
      client.deactivate();
      stompClient.current = null;
    };
  }, [roomId, token, memberSeq]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();

    if (!inputMessage.trim() || !isConnected || !stompClient.current) return;

    stompClient.current.publish({
      destination: '/pub/chat/send',
      body: JSON.stringify({
        chat_room_seq: Number(roomId),
        message_content: inputMessage.trim()
      })
    });

    setInputMessage('');
  };

  const searchMembers = async () => {
    if (!keyword.trim()) {
      setMembers([]);
      return;
    }

    try {
      const response = await Client.get('/api/chat/members', {
        params: { keyword: keyword.trim() }
      });
      setMembers(response.data);
    } catch (error) {
      console.error('회원 검색 실패:', error);
      setInviteMessage('회원 검색에 실패했습니다.');
    }
  };

  const inviteMember = async (member) => {
    try {
      await Client.post('/api/chat/invite', {
        chat_room_seq: Number(roomId),
        invitee_seq: member.member_seq
      });
      setInviteMessage(`${member.nickname || member.login_id}님에게 초대를 보냈습니다.`);
      setMembers((prev) => prev.filter((item) => item.member_seq !== member.member_seq));
    } catch (error) {
      setInviteMessage(error.response?.data || '초대에 실패했습니다.');
    }
  };

  const leaveRoom = async () => {
    const confirmed = window.confirm('정말 채팅방에서 나가시겠습니까?');
    if (!confirmed) return;

    try {
      await Client.post(`/api/chat/room/${roomId}/leave`);
      navigate('/chattingRoomList');
    } catch (error) {
      alert(error.response?.data || '채팅방 나가기에 실패했습니다.');
    }
  };

  useEffect(() => {
    const checkOwner = async () => {
      try {
        const response = await Client.get(`/api/chat/room/${roomId}/owner`);
        setIsOwner(response.data);
      } catch (error) {
        console.error('방장 확인 실패:', error);
        setIsOwner(false);
      }
    };

    if (token && roomId) {
      checkOwner();
    }
  }, [roomId, token]);

  const deleteRoom = async () => {
    const confirmed = window.confirm(
      '채팅방을 삭제하시겠습니까?\n삭제하면 모든 참여자의 채팅방 목록에서 사라집니다.'
    );

    if (!confirmed) return;

    try {
      await Client.post(`/api/chat/room/${roomId}/delete`);
      alert('채팅방이 삭제되었습니다.');
      navigate('/chattingRoomList');
    } catch (error) {
      alert(error.response?.data || '채팅방 삭제에 실패했습니다.');
    }
  };

  return (
    <div className={styles.silhouetteContainer}>
      <div className={styles.chatWrapper}>
        <header className={styles.chatHeader}>
          <button onClick={() => navigate('/chattingRoomList')} className={styles.backButton}>
            ← 목록
          </button>
          <h1 className={styles.title}>{roomName || '채팅방'}</h1>
          <span className={isConnected ? styles.statusOnline : styles.statusOffline}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </header>

        <div style={{ display: 'flex', gap: '8px', padding: '10px 16px', borderBottom: '1px solid #222' }}>
          <button type="button" onClick={() => setShowInvite((prev) => !prev)}>
            {showInvite ? '초대 닫기' : '+ 사람 초대'}
          </button>

          <button type="button" onClick={leaveRoom}>
            채팅방 나가기
          </button>

          {isOwner && (
            <button type="button" onClick={deleteRoom}>
              채팅방 삭제
            </button>
          )}
        </div>

        {showInvite && (
          <div style={{ padding: '12px 16px', background: '#181818', color: '#ddd' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') searchMembers();
                }}
                placeholder="닉네임 또는 아이디 검색"
                style={{ flex: 1, minWidth: 0, padding: '8px' }}
              />
              <button type="button" onClick={searchMembers}>검색</button>
            </div>
            {inviteMessage && <p>{inviteMessage}</p>}
            {members.map((member) => (
              <div key={member.member_seq} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span>{member.nickname || member.login_id} ({member.login_id})</span>
                <button type="button" onClick={() => inviteMember(member)}>초대</button>
              </div>
            ))}
          </div>
        )}

        <div className={styles.messageDisplay}>
         {messages.map((msg, index) => {
  const nextMessage = messages[index + 1];

  const showTime =
    !nextMessage ||
    Number(msg.sender_seq) !== Number(nextMessage.sender_seq) ||
    !isSameMinute(msg, nextMessage);

  return (
    <div
      key={msg.chat_message_seq || index}
      className={`${styles.messageWrapper} ${msg.isMine ? styles.myMessage : styles.otherMessage}`}
    >
      {!msg.isMine && <span className={styles.sender}>상대방</span>}

      <div className={styles.messageLine}>
        {msg.isMine && showTime && (
          <span className={styles.timestamp}>{msg.timestamp}</span>
        )}

        <div className={styles.messageBubble}>{msg.content}</div>

        {!msg.isMine && showTime && (
          <span className={styles.timestamp}>{msg.timestamp}</span>
        )}
      </div>
    </div>
  );
})}
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