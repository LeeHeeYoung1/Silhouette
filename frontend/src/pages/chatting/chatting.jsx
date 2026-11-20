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
  const [showMenu, setShowMenu] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [members, setMembers] = useState([]);
  const [inviteMessage, setInviteMessage] = useState('');
  const [roomName, setRoomName] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [showUploadMenu, setShowUploadMenu] = useState(false);

  const stompClient = useRef(null);
  const messagesEndRef = useRef(null);

  // 시간 표시
  const formatTime = (value) => {
    if (!value) return '';

    return new Date(value).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 같은 시간인지 확인
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

  // 채팅방 이름 가져오기
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

  // 내 회원 번호 가져오기
  useEffect(() => {
    const getMyMemberSeq = async () => {
      try {
        const response = await Client.get('/api/chat/member-seq');
        setMemberSeq(Number(response.data));
      } catch (error) {
        console.error('회원 정보를 가져오지 못했습니다.', error);
      }
    };

    if (token) {
      getMyMemberSeq();
    }
  }, [token]);

  // 실시간 채팅 연결 + 이전 메시지 불러오기
  useEffect(() => {
    if (!roomId || !token || !memberSeq) return;

    let isActive = true;

    setMessages([]);
    setIsConnected(false);

    const client = new StompClient({
      brokerURL: 'ws://localhost:80/chat',

      connectHeaders: {
        Authorization: `Bearer ${token}`
      },

      reconnectDelay: 5000,

      onConnect: () => {
        if (!isActive) return;

        setIsConnected(true);

        // 현재 채팅방 구독
        client.subscribe(`/sub/chat/${roomId}`, (frame) => {
          console.log('실시간 메시지 수신:', frame.body);

          if (!isActive) return;

          const newMessage = JSON.parse(frame.body);

          const formattedMessage = {
            ...newMessage,
            isMine: Number(newMessage.sender_seq) === Number(memberSeq),
            content: newMessage.message_content,
            timestamp: formatTime(newMessage.created_at)
          };

          // 실시간으로 받은 메시지 화면에 추가
          setMessages((prev) => {
            const exists = prev.some(
              (item) =>
                Number(item.chat_message_seq) ===
                Number(newMessage.chat_message_seq)
            );

            if (exists) {
              return prev;
            }

            return [...prev, formattedMessage].sort(
              (a, b) =>
                Number(a.chat_message_seq) -
                Number(b.chat_message_seq)
            );
          });
        });

        // 구독한 다음 이전 메시지 가져오기
        Client.get(`/api/chat/messages/${roomId}`)
          .then((response) => {
            if (!isActive) return;

            const loadedMessages = response.data.map((msg) => ({
              ...msg,
              isMine: Number(msg.sender_seq) === Number(memberSeq),
              content: msg.message_content,
              timestamp: formatTime(msg.created_at)
            }));

            // 이전 대화와 실시간 메시지 합치기
            setMessages((prev) => {
              const combined = [...loadedMessages, ...prev];

              // 중복 메시지 제거
              const uniqueMessages = combined.filter(
                (msg, index, self) =>
                  self.findIndex(
                    (item) =>
                      Number(item.chat_message_seq) ===
                      Number(msg.chat_message_seq)
                  ) === index
              );

              // 메시지 번호 순서대로 정렬
              return uniqueMessages.sort(
                (a, b) =>
                  Number(a.chat_message_seq) -
                  Number(b.chat_message_seq)
              );
            });
          })
          .catch((error) => {
            console.error(
              '이전 대화 내용을 불러오지 못했습니다.',
              error
            );
          });
      },

      onStompError: (frame) => {
        console.error(
          'STOMP 오류:',
          frame.headers?.message,
          frame.body
        );

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

    // 채팅방을 나가거나 컴포넌트가 종료되면 연결 해제
    return () => {
      isActive = false;
      setIsConnected(false);

      client.deactivate();
      stompClient.current = null;
    };
  }, [roomId, token, memberSeq]);

  // 새 메시지가 오면 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  }, [messages]);

  // 메시지 전송
  const sendMessage = (e) => {
    e.preventDefault();

    if (!inputMessage.trim() || !isConnected || !stompClient.current) {
      return;
    }

    stompClient.current.publish({
      destination: '/pub/chat/send',
      body: JSON.stringify({
        chat_room_seq: Number(roomId),
        message_content: inputMessage.trim()
      })
    });

    setInputMessage('');
  };

  // 회원 검색
  // 닉네임으로 회원 검색
  const searchMembers = async () => {
    if (!keyword.trim()) {
      setMembers([]);
      setInviteMessage('');
      return;
    }

    try {
      const response = await Client.get('/api/chat/members', {
        params: {
          keyword: keyword.trim()
        }
      });

      setMembers(response.data);
      setInviteMessage('');
    } catch (error) {
      console.error('회원 검색 실패:', error);
      setInviteMessage('회원 검색에 실패했습니다.');
    }
  };

  // 회원 초대
  const inviteMember = async (member) => {
    try {
      await Client.post('/api/chat/invite', {
        chat_room_seq: Number(roomId),
        invitee_seq: member.member_seq
      });

      setInviteMessage(
        `${member.nickname || member.login_id}님에게 초대를 보냈습니다.`
      );

      setMembers((prev) =>
        prev.filter(
          (item) => item.member_seq !== member.member_seq
        )
      );
    } catch (error) {
      setInviteMessage(
        error.response?.data || '초대에 실패했습니다.'
      );
    }
  };

  // 채팅방 나가기
  const leaveRoom = async () => {
    const confirmed = window.confirm(
      '채팅방에서 나가시겠습니까?'
    );

    if (!confirmed) return;

    try {
      await Client.post(`/api/chat/room/${roomId}/leave`);

      alert('채팅방에서 나왔습니다.');

      navigate('/chattingRoomList');
    } catch (error) {
      alert(
        error.response?.data || '채팅방 나가기에 실패했습니다.'
      );
    }
  };

  // 방장 여부 확인
  useEffect(() => {
    const checkOwner = async () => {
      try {
        const response = await Client.get(
          `/api/chat/room/${roomId}/owner`
        );

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

  // 채팅방 삭제: 방장만 가능
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
      alert(
        error.response?.data || '채팅방 삭제에 실패했습니다.'
      );
    }
  };

  return (
    <div className={styles.silhouetteContainer}>
      <div className={styles.chatWrapper}>

        {/* 채팅방 헤더 */}
        <header className={styles.chatHeader}>
          <button
            type="button"
            onClick={() => navigate('/chattingRoomList')}
            className={styles.backButton}
          >
            ←
          </button>

          <h1 className={styles.title}>
            {roomName || '채팅방'}
          </h1>

          <div className={styles.headerRight}>
            <span
              className={
                isConnected
                  ? styles.statusOnline
                  : styles.statusOffline
              }
            >
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>

            <button
              type="button"
              className={styles.menuButton}
              onClick={() => {
                setShowMenu((prev) => !prev);
                setShowInvite(false);
              }}
            >
              ☰
            </button>
          </div>
        </header>

        {/* 오른쪽 사이드 메뉴 */}
        {showMenu && (
          <div className={styles.menuPanel}>

            <div className={styles.menuActions}>
              <button
                type="button"
                className={styles.menuActionButton}
                onClick={() => setShowInvite((prev) => !prev)}
              >
                <span>＋</span>
                {showInvite ? '초대 닫기' : '사람 초대'}
              </button>

              <button
                type="button"
                className={styles.menuActionButton}
                onClick={leaveRoom}
              >
                <span>↪</span>
                채팅방 나가기
              </button>

              {isOwner && (
                <button
                  type="button"
                  className={`${styles.menuActionButton} ${styles.deleteButton}`}
                  onClick={deleteRoom}
                >
                  <span>⌫</span>
                  채팅방 삭제
                </button>
              )}
            </div>

            {/* 회원 초대 */}
            {showInvite && (
              <div className={styles.invitePanel}>
                <div className={styles.inviteSearch}>
                  <input
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        searchMembers();
                      }
                    }}
                    placeholder="닉네임 검색"
                  />

                  <button
                    type="button"
                    onClick={searchMembers}
                  >
                    검색
                  </button>
                </div>

                {inviteMessage && (
                  <p className={styles.inviteMessage}>
                    {inviteMessage}
                  </p>
                )}

                {members.map((member) => (
                  <div
                    key={member.member_seq}
                    className={styles.searchMember}
                  >
                    <span>
                      {member.nickname || member.login_id}
                      ({member.login_id})
                    </span>

                    <button
                      type="button"
                      onClick={() => inviteMember(member)}
                    >
                      초대
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 참여 회원 프로필 영역 */}
            <div className={styles.roomMembers}>
              <h3>참여 중인 회원</h3>

              <div className={styles.memberProfilePlaceholder}>
                <div className={styles.profileAvatarPlaceholder}>
                  <span>👤</span>
                </div>

                <div className={styles.profileInfoPlaceholder}>
                  <strong>회원 프로필 영역</strong>
                  <span>프로필 정보가 여기에 표시됩니다.</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* 메시지 목록 */}
        <div className={styles.messageDisplay}>
          {messages.map((msg, index) => {
            const nextMessage = messages[index + 1];

            const showTime =
              !nextMessage ||
              Number(msg.sender_seq) !==
              Number(nextMessage.sender_seq) ||
              !isSameMinute(msg, nextMessage);

            return (
              <div
                key={msg.chat_message_seq || index}
                className={`${styles.messageWrapper} ${msg.isMine
                  ? styles.myMessage
                  : styles.otherMessage
                  }`}
              >
                {!msg.isMine && (
                  <span className={styles.sender}>
                    상대방
                  </span>
                )}

                <div className={styles.messageLine}>
                  {msg.isMine && showTime && (
                    <span className={styles.timestamp}>
                      {msg.timestamp}
                    </span>
                  )}

                  <div className={styles.messageBubble}>
                    {msg.content}
                  </div>

                  {!msg.isMine && showTime && (
                    <span className={styles.timestamp}>
                      {msg.timestamp}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>

        {/* 메시지 입력 */}
        <form
          onSubmit={sendMessage}
          className={styles.inputArea}
        >
          <div className={styles.inputRow}>
            <button
              type="button"
              className={styles.addButton}
              onClick={() => setShowUploadMenu((prev) => !prev)}
            >
              {showUploadMenu ? '×' : '+'}
            </button>

            <input
              type="text"
              value={inputMessage}
              onChange={(e) =>
                setInputMessage(e.target.value)
              }
              placeholder="어둠 속에 메시지를 남기세요..."
              className={styles.textInput}
              disabled={!isConnected}
            />

            <button
              type="submit"
              className={styles.sendButton}
              disabled={!isConnected}
            >
              전송
            </button>
          </div>

          {showUploadMenu && (
            <div className={styles.uploadMenu}>
              <button type="button" className={styles.uploadButton}>
                <span>📁</span>
                <span>파일</span>
              </button>

              <button type="button" className={styles.uploadButton}>
                <span>🎙️</span>
                <span>음성 녹음</span>
              </button>

              <button type="button" className={styles.uploadButton}>
                <span>🎬</span>
                <span>동영상</span>
              </button>
            </div>
          )}
        </form>

      </div>
    </div>
  );
};

export default Chatting;