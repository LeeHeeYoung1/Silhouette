import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Client as StompClient } from '@stomp/stompjs';
import Client from '../../api/client';
import { getIdealPartner } from '../../api/matching';
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
  const [roomMembers, setRoomMembers] = useState([]);
  const [roomMemberImageUrls, setRoomMemberImageUrls] = useState({});
  const [inviteMessage, setInviteMessage] = useState('');
  const [roomName, setRoomName] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploadingVoice, setIsUploadingVoice] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // 매칭으로 연결된 방(이상형 / 블라인드 GO)이면 상대 프로필 (일반 채팅방이면 null → 사이드 패널 숨김)
  const [idealPartner, setIdealPartner] = useState(null);


  // 파일 및 사진 여러 개 전송 대기 상태
  const [pendingFiles, setPendingFiles] = useState([]);

  const stompClient = useRef(null);
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingStartRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  // 음성 메시지 재생 시간 표시
  const formatDuration = (value) => {
    const totalSeconds = Number(value || 0);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  };

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

  // 매칭 방인지 확인하고 상대 프로필 가져오기 (매칭 방이 아니면 404 → 패널 숨김)
  useEffect(() => {
    if (!token || !roomId) return;
    let ignore = false;

    getIdealPartner(roomId)
      .then(({ data }) => { if (!ignore) setIdealPartner(data); })
      .catch(() => { if (!ignore) setIdealPartner(null); });

    return () => { ignore = true; };
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
      brokerURL: 'ws://localhost/chat',

      connectHeaders: {
        Authorization: `Bearer ${token}`
      },

      reconnectDelay: 5000,

      onConnect: () => {
        if (!isActive) return;

        setIsConnected(true);

        client.subscribe(`/sub/chat/${roomId}`, (frame) => {
          console.log('실시간 메시지 수신:', frame.body);

          if (!isActive) return;

          const receivedData = JSON.parse(frame.body);

          // 다른 회원이 초대를 수락하면 참여자 목록을 다시 조회합니다.
          if (receivedData?.type === 'ROOM_MEMBERS_UPDATED') {
            Client.get(`/api/chat/room/${roomId}/members`)
              .then((response) => {
                if (isActive) {
                  setRoomMembers(response.data || []);
                }
              })
              .catch((error) => {
                console.error('참여 회원 목록 갱신 실패:', error);
              });

            return;
          }

          let newMessage = receivedData;
          let newAttachment = null;

          if (receivedData.message && receivedData.attachment) {
            newMessage = receivedData.message;
            newAttachment = receivedData.attachment;
          }

          const formattedMessage = {
            ...newMessage,
            attachment: newAttachment,
            isMine: Number(newMessage.sender_seq) === Number(memberSeq),
            content: newMessage.message_content,
            timestamp: formatTime(newMessage.created_at)
          };

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

        // 소켓 연결 직후에도 참여자 목록을 다시 조회해 연결 전 변경을 놓치지 않도록 합니다.
        Client.get(`/api/chat/room/${roomId}/members`)
          .then((response) => {
            if (isActive) {
              setRoomMembers(response.data || []);
            }
          })
          .catch((error) => {
            console.error('참여 회원 목록 초기 갱신 실패:', error);
          });

        Promise.all([
          Client.get(`/api/chat/messages/${roomId}`),
          Client.get(`/api/chat/messages/${roomId}/attachments`)
        ])
          .then(([messageResponse, attachmentResponse]) => {
            if (!isActive) return;

            const attachmentMap = new Map(
              attachmentResponse.data.map((attachment) => [
                Number(attachment.chat_message_seq),
                attachment
              ])
            );

            const loadedMessages = messageResponse.data.map((msg) => ({
              ...msg,
              attachment: attachmentMap.get(Number(msg.chat_message_seq)) || null,
              isMine: Number(msg.sender_seq) === Number(memberSeq),
              content: msg.message_content,
              timestamp: formatTime(msg.created_at)
            }));

            setMessages((prev) => {
              const combined = [...loadedMessages, ...prev];

              const uniqueMessages = combined.filter(
                (msg, index, self) =>
                  self.findIndex(
                    (item) =>
                      Number(item.chat_message_seq) ===
                      Number(msg.chat_message_seq)
                  ) === index
              );

              return uniqueMessages.sort(
                (a, b) =>
                  Number(a.chat_message_seq) -
                  Number(b.chat_message_seq)
              );
            });
          })
          .catch((error) => {
            console.error(
              '이전 대화 또는 첨부파일을 불러오지 못했습니다.',
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

  // 녹음 중인 시간 표시
  useEffect(() => {
    if (!isRecording) return;

    const timer = setInterval(() => {
      if (recordingStartRef.current) {
        setRecordingSeconds(
          Math.floor((Date.now() - recordingStartRef.current) / 1000)
        );
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isRecording]);

  // 녹음 중 컴포넌트가 종료되면 마이크 정리
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // 컴포넌트 종료 시 사진 미리보기 URL 정리
  useEffect(() => {
    return () => {
      pendingFiles.forEach((item) => {
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, [pendingFiles]);

  // 메시지 및 대기 파일 전송
  const sendMessage = async (e) => {
    e.preventDefault();

    if (!isConnected || !stompClient.current || isUploadingFile) {
      return;
    }

    if (inputMessage.trim()) {
      stompClient.current.publish({
        destination: '/pub/chat/send',
        body: JSON.stringify({
          chat_room_seq: Number(roomId),
          message_content: inputMessage.trim()
        })
      });

      setInputMessage('');
    }

    if (pendingFiles.length > 0) {
      await uploadChatAttachments();
    }
  };

  // 녹음한 음성 파일을 백엔드로 업로드
  const uploadVoiceMessage = async (audioBlob, duration) => {
    if (!audioBlob || audioBlob.size === 0) {
      alert('녹음된 음성이 없습니다.');
      return;
    }

    const formData = new FormData();
    formData.append('file', audioBlob, 'voice-message.webm');
    formData.append('duration', duration);

    setIsUploadingVoice(true);

    try {
      const response = await Client.post(
        `/api/chat/room/${roomId}/voice`,
        formData
      );

      const newMessage = response.data.message;
      const newAttachment = response.data.attachment;

      const formattedMessage = {
        ...newMessage,
        attachment: newAttachment,
        isMine: true,
        content: newMessage.message_content,
        timestamp: formatTime(newMessage.created_at)
      };

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
    } catch (error) {
      console.error('음성 메시지 업로드 실패:', error);
      alert(error.response?.data || '음성 메시지 업로드에 실패했습니다.');
    } finally {
      setIsUploadingVoice(false);
    }
  };

  // 파일 또는 사진 여러 개 선택 후 전송 대기 상태로 만들기
  const handleSelectAttachment = (files, type) => {
    if (!files || files.length === 0) return;

    const newFiles = [];

    Array.from(files).forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name}은(는) 10MB를 초과했습니다.`);
        return;
      }

      if (type === 'IMAGE' && !file.type.startsWith('image/')) {
        alert(`${file.name}은(는) 이미지 파일이 아닙니다.`);
        return;
      }

      const previewUrl = type === 'IMAGE'
        ? URL.createObjectURL(file)
        : null;

      newFiles.push({
        id: `${Date.now()}-${Math.random()}`,
        file: file,
        type: type,
        previewUrl: previewUrl
      });
    });

    setPendingFiles((prev) => [...prev, ...newFiles]);

    setShowUploadMenu(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  // 대기 중인 파일 또는 사진 개별 삭제
  const removePendingFile = (id) => {
    setPendingFiles((prev) => {
      const target = prev.find((item) => item.id === id);

      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }

      return prev.filter((item) => item.id !== id);
    });
  };

  // 대기 중인 파일과 사진 여러 개 업로드
  const uploadChatAttachments = async () => {
    if (pendingFiles.length === 0) return;

    setIsUploadingFile(true);

    try {
      for (const selectedFile of pendingFiles) {
        const formData = new FormData();
        formData.append('file', selectedFile.file);

        const uploadUrl = selectedFile.type === 'IMAGE'
          ? `/api/chat/room/${roomId}/image`
          : `/api/chat/room/${roomId}/file`;

        const response = await Client.post(uploadUrl, formData);

        const newMessage = response.data.message;
        const newAttachment = response.data.attachment;

        const formattedMessage = {
          ...newMessage,
          attachment: newAttachment,
          isMine: true,
          content: newMessage.message_content,
          timestamp: formatTime(newMessage.created_at)
        };

        setMessages((prev) => {
          const exists = prev.some(
            (item) =>
              Number(item.chat_message_seq) ===
              Number(newMessage.chat_message_seq)
          );

          if (exists) return prev;

          return [...prev, formattedMessage].sort(
            (a, b) =>
              Number(a.chat_message_seq) -
              Number(b.chat_message_seq)
          );
        });

        if (selectedFile.previewUrl) {
          URL.revokeObjectURL(selectedFile.previewUrl);
        }

        setPendingFiles((prev) =>
          prev.filter((item) => item.id !== selectedFile.id)
        );
      }

    } catch (error) {
      console.error('첨부파일 업로드 실패:', error);
      alert(error.response?.data || '첨부파일 업로드에 실패했습니다.');

    } finally {
      setIsUploadingFile(false);
    }
  };

  // 음성 녹음 시작
  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('현재 브라우저에서는 마이크를 사용할 수 없습니다.');
      return;
    }

    if (typeof MediaRecorder === 'undefined') {
      alert('현재 브라우저에서는 음성 녹음을 지원하지 않습니다.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true
      });

      mediaStreamRef.current = stream;
      audioChunksRef.current = [];

      let recorderOptions = {};

      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        recorderOptions.mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        recorderOptions.mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        recorderOptions.mimeType = 'audio/ogg;codecs=opus';
      }

      const recorder = new MediaRecorder(stream, recorderOptions);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onerror = (event) => {
        console.error('음성 녹음 오류:', event);
        alert('음성 녹음 중 오류가 발생했습니다.');
        stream.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;
        audioChunksRef.current = [];
        recordingStartRef.current = null;
        setIsRecording(false);
        setShowUploadMenu(false);
      };

      recordingStartRef.current = Date.now();
      setRecordingSeconds(0);
      setIsRecording(true);
      setShowUploadMenu(true);
      recorder.start();

    } catch (error) {
      console.error('마이크 접근 실패:', error);

      if (error.name === 'NotAllowedError') {
        alert('브라우저에서 마이크 사용을 허용해주세요.');
      } else {
        alert('마이크를 사용할 수 없습니다.');
      }
    }
  };

  // 음성 녹음 종료
  const stopRecording = () => {
    if (!mediaRecorderRef.current ||
      mediaRecorderRef.current.state === 'inactive') {
      return;
    }

    const duration = Math.max(
      1,
      Math.floor((Date.now() - recordingStartRef.current) / 1000)
    );

    const recorder = mediaRecorderRef.current;
    const stream = mediaStreamRef.current;

    recorder.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, {
        type: recorder.mimeType || 'audio/webm'
      });

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      mediaStreamRef.current = null;
      mediaRecorderRef.current = null;
      audioChunksRef.current = [];
      recordingStartRef.current = null;

      await uploadVoiceMessage(audioBlob, duration);
    };

    recorder.stop();
    setIsRecording(false);
    setShowUploadMenu(false);
  };

  // 채팅방 참여 회원 프로필 목록
  useEffect(() => {
    const loadRoomMembers = async () => {
      try {
        const response = await Client.get(`/api/chat/room/${roomId}/members`);
        setRoomMembers(response.data || []);
      } catch (error) {
        console.error('참여 회원 목록을 불러오지 못했습니다.', error);
        setRoomMembers([]);
      }
    };

    if (token && roomId) loadRoomMembers();
  }, [roomId, token]);
 
  // 프로필 이미지 불러오기
  useEffect(() => {
    let cancelled = false;
    const objectUrls = [];

    const loadProfileImages = async () => {
      if (!token) return;

      const imageEntries = await Promise.all(
        roomMembers.map(async (member) => {
          const memberSeqValue = Number(member.member_seq);
          const imagePath = member.profile_image;

          if (!imagePath) {
            return [memberSeqValue, null];
          }

          // 외부 이미지 주소는 그대로 사용
          if (/^https?:\/\//i.test(imagePath)) {
            return [memberSeqValue, imagePath];
          }

          try {
            const response = await Client.get(imagePath, {
              responseType: 'blob',
              headers: {
                Authorization: `Bearer ${token}`
              }
            });

            const imageUrl = URL.createObjectURL(response.data);
            objectUrls.push(imageUrl);

            return [memberSeqValue, imageUrl];
          } catch (error) {
            console.error(
              `${member.nickname || member.login_id} 프로필 이미지 로드 실패:`,
              error.response?.status,
              error
            );

            return [memberSeqValue, null];
          }
        })
      );

      if (!cancelled) {
        setRoomMemberImageUrls(Object.fromEntries(imageEntries));
      }
    };

    loadProfileImages();

    return () => {
      cancelled = true;
      objectUrls.forEach((imageUrl) => URL.revokeObjectURL(imageUrl));
    };
  }, [roomMembers, token]);


  // 회원 검색
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
      if (!response.data || response.data.length === 0) {
        setInviteMessage('내 친구목록에 없는 닉네임입니다.');
      } else {
        setInviteMessage('');
      }
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

  // 채팅방 삭제
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
    <div className={`${styles.silhouetteContainer} ${idealPartner ? styles.withPartnerPanel : ''}`}>
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
            {idealPartner?.nickname || roomName || '채팅방'}
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

              {roomMembers.map((member) => (
                <div className={styles.roomMemberItem} key={member.member_seq}>
                  {roomMemberImageUrls[Number(member.member_seq)] ? (
                    <img src={roomMemberImageUrls[Number(member.member_seq)]} alt="" className={styles.roomMemberAvatar} />
                  ) : (
                    <div className={styles.roomMemberAvatarFallback}>👤</div>
                  )}
                  <strong className={styles.roomMemberNickname}>
                    {member.nickname || member.login_id}
                    {Number(member.member_seq) === Number(memberSeq) && ' (나)'}
                  </strong>
                  {member.participant_role === 'OWNER' && (
                    <span className={styles.ownerBadge}>방장</span>
                  )}
                </div>
              ))}
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
                {!msg.isMine && (() => {
                  const sender = roomMembers.find(
                    (member) => Number(member.member_seq) === Number(msg.sender_seq)
                  );
                  return (
                    <div className={styles.senderProfile}>
                      {roomMemberImageUrls[Number(sender?.member_seq)] ? (
                        <img src={roomMemberImageUrls[Number(sender.member_seq)]} alt="" className={styles.senderAvatar} />
                      ) : (
                        <div className={styles.senderAvatarFallback}>👤</div>
                      )}
                      <span>{sender?.nickname || sender?.login_id || '상대방'}</span>
                    </div>
                  );
                })()}

                <div className={styles.messageLine}>
                  {msg.isMine && showTime && (
                    <span className={styles.timestamp}>
                      {msg.timestamp}
                    </span>
                  )}

                  <div className={styles.messageBubble}>
                    {msg.message_type === 'AUDIO' &&
                      msg.attachment?.file_url && (
                        <div className={styles.audioMessage}>
                          <audio
                            controls
                            preload="none"
                            src={msg.attachment.file_url}
                          />
                          <span>
                            {formatDuration(msg.attachment.duration)}
                          </span>
                        </div>
                      )}

                    {msg.message_type === 'FILE' &&
                      msg.attachment?.file_url && (
                        <div className={styles.fileMessage}>
                          <span>📎</span>

                          <a
                            href={msg.attachment.file_url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {msg.attachment.original_name}
                          </a>

                          <span>
                            ({(
                              Number(msg.attachment.file_size || 0) /
                              1024
                            ).toFixed(1)} KB)
                          </span>
                        </div>
                      )}

                    {msg.message_type === 'IMAGE' &&
                      msg.attachment?.file_url && (
                        <div className={styles.imageMessage}>
                          <img
                            src={msg.attachment.file_url}
                            alt={
                              msg.attachment.original_name ||
                              '채팅 사진'
                            }
                          />
                        </div>
                      )}

                    {msg.message_type !== 'AUDIO' &&
                      msg.message_type !== 'FILE' &&
                      msg.message_type !== 'IMAGE' &&
                      msg.content}
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
              onClick={() => {
                if (!isRecording) {
                  setShowUploadMenu((prev) => !prev);
                }
              }}
            >
              {showUploadMenu ? '×' : '+'}
            </button>

            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="어둠 속에 메시지를 남기세요..."
              className={styles.textInput}
              disabled={!isConnected}
            />

            <button
              type="submit"
              className={styles.sendButton}
              disabled={
                !isConnected ||
                isUploadingFile ||
                (!inputMessage.trim() && pendingFiles.length === 0)
              }
            >
              {isUploadingFile ? '업로드 중...' : '전송'}
            </button>
          </div>

          {/* 파일 선택 */}
          <input
            type="file"
            ref={fileInputRef}
            multiple
            style={{ display: 'none' }}
            onChange={(e) =>
              handleSelectAttachment(e.target.files, 'FILE')
            }
          />

          {/* 사진 선택 */}
          <input
            type="file"
            ref={imageInputRef}
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={(e) =>
              handleSelectAttachment(e.target.files, 'IMAGE')
            }
          />

          {/* 파일 및 사진 전송 대기 영역 */}
          {pendingFiles.length > 0 && (
            <div className={styles.pendingFiles}>
              {pendingFiles.map((item) => (
                <div key={item.id} className={styles.pendingItem}>

                  {item.type === 'IMAGE' ? (
                    <img
                      src={item.previewUrl}
                      alt="선택한 사진"
                      className={styles.pendingImage}
                    />
                  ) : (
                    <div className={styles.pendingFile}>
                      📎 {item.file.name}
                    </div>
                  )}

                  <button
                    type="button"
                    className={styles.pendingRemove}
                    onClick={() => removePendingFile(item.id)}
                    disabled={isUploadingFile}
                  >
                    ×
                  </button>

                </div>
              ))}
            </div>
          )}

          {/* 업로드 메뉴 */}
          {showUploadMenu && (
            <div className={styles.uploadMenu}>
              <button
                type="button"
                className={styles.uploadButton}
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingFile}
              >
                <span>📁</span>
                <span>파일</span>
              </button>

              <button
                type="button"
                className={styles.uploadButton}
                onClick={() => imageInputRef.current?.click()}
                disabled={isUploadingFile}
              >
                <span>🖼️</span>
                <span>사진</span>
              </button>

              <button
                type="button"
                className={`${styles.uploadButton} ${isRecording ? styles.recordingButton : ''
                  }`}
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isUploadingVoice}
              >
                <span>{isRecording ? '⏹️' : '🎙️'}</span>

                <span>
                  {isUploadingVoice
                    ? '업로드 중...'
                    : isRecording
                      ? `녹음 종료 ${formatDuration(recordingSeconds)}`
                      : '음성 녹음'}
                </span>
              </button>

              <button
                type="button"
                className={styles.uploadButton}
              >
                <span>🎬</span>
                <span>동영상</span>
              </button>
            </div>
          )}
        </form>

      </div>

      {/* 매칭 방(이상형 / 블라인드 GO)일 때만: 상대 프로필 사이드 패널 */}
      {idealPartner && (
        <aside className={styles.partnerPanel}>
          <div className={styles.partnerBadge}>
            {idealPartner.roomType === 'BLIND' ? '🎭 블라인드 매칭 · 서로 GO!' : '💖 이상형 매칭'}
          </div>

          <div className={styles.partnerAvatar}>👤</div>
          <h3 className={styles.partnerName}>{idealPartner.nickname}</h3>
          <p className={styles.partnerMeta}>
            {idealPartner.age}세
            {idealPartner.mbti && ` · ${idealPartner.mbti}`}
            {idealPartner.job && ` · ${idealPartner.job}`}
          </p>

          <div className={styles.partnerSection}>
            <span className={styles.partnerLabel}>자기소개</span>
            <p className={styles.partnerIntro}>
              {idealPartner.introduction || '아직 자기소개가 없어요.'}
            </p>
          </div>

          {idealPartner.hobby && (
            <div className={styles.partnerSection}>
              <span className={styles.partnerLabel}>취미</span>
              <div className={styles.partnerTags}>
                {idealPartner.hobby.split(',').filter(Boolean).map((hobby) => (
                  <span key={hobby} className={styles.partnerTag}>{hobby}</span>
                ))}
              </div>
            </div>
          )}
        </aside>
      )}
    </div>
  );
};

export default Chatting;
