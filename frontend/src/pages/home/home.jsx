import { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/useAuthStore';
import styles from './home.module.css';
import {
  startIdealMatch,
  getIdealMatchStatus,
  cancelIdealMatch,
  getNearbyMembers
} from '../../api/matching';
import Client from '../../api/client';
import { wsUrl } from '../../api/ws';
import MemberProfileModal from '../memberProfileModal/memberProfileModal';
import { Client as StompClient } from '@stomp/stompjs';

// 커뮤니티 인기글 목데이터
const MOCK_POPULAR_POSTS = [
  { id: 1, title: '첫 만남 장소로 카페 vs 조용한 와인바 추천', comments: 14, time: '10분 전' },
  { id: 2, title: '실물 인증 통과 후기 (실제 만나보니 신뢰도 100%)', comments: 28, time: '35분 전' },
  { id: 3, title: '가치관 일치율 95% 나온 분과 첫 대화 나눠본 썰', comments: 19, time: '1시간 전' },
  { id: 4, title: 'AI 안전 도우미가 알려준 첫 만남 안전 수칙 3가지', comments: 8, time: '2시간 전' }
];

// 히어로 인기 프로필 (임시 목데이터: 인기 프로필 기능 연동 전까지 사용)
const HERO_PROFILES = [
  {
    id: 1,
    name: '서연, 26세',
    badge: '인기 1위 · 서울 성수',
    job: '전시회 큐레이터 · INFP',
    img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=85'
  },
  {
    id: 2,
    name: '민준, 28세',
    badge: '인기 2위',
    job: '건축 디자이너 · INFJ',
    img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=85'
  },
  {
    id: 3,
    name: '지아, 25세',
    badge: '인기 3위',
    job: '플로리스트 · ENFP',
    img: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=85'
  }
];

// 챗봇 추천 퀵 질문 칩
const CHATBOT_QUICK_CHIPS = [
  '📍 강남 맛집 2곳 추천해 줘',
  '🍖 강남 고깃집 추천해 줘',
  '🐟 홍대 횟집 추천해 줘',
  '☕ 성수 데이트 장소 추천해 줘'
];

// 홈 화면
function Home() {
  const { token, id, role } = useAuthStore();
  const navi = useNavigate();

  const [stompClient, setStompClient] = useState(null);

  // 매칭 상태
  const [isBlindMatching, setIsBlindMatching] = useState(false);
  const [waitingBlindUsers, setWaitingBlindUsers] = useState(1004);
  const [isIdealMatching, setIsIdealMatching] = useState(false);
  const [waitingIdealUsers, setWaitingIdealUsers] = useState(556);

  // 주소지 기반 추천 목록
  const [locationProfiles, setLocationProfiles] = useState([]);
  const [myRegion, setMyRegion] = useState(null);
  const [isLocationLoading, setIsLocationLoading] = useState(true);

  // 친구 목록 및 채팅방 사이드바
  const [sidebarTab, setSidebarTab] = useState('friends');
  const [friendList, setFriendList] = useState([]);
  const [memberSeq, setMemberSeq] = useState(null);
  const [friendSearchKeyword, setFriendSearchKeyword] = useState('');
  const [myFriendKeyword, setMyFriendKeyword] = useState('');
  const [friendSearchMode, setFriendSearchMode] = useState('mine'); // 'mine' | 'add'
  const [friendSearchResults, setFriendSearchResults] = useState([]);
  const [friendSearchMessage, setFriendSearchMessage] = useState('');
  const [myRoomList, setMyRoomList] = useState([]);
  const [friendImageUrls, setFriendImageUrls] = useState({});
  const [profileTargetSeq, setProfileTargetSeq] = useState(null);   // 프로필 팝업으로 볼 회원 번호

  // 채팅방 만들기 / 받은 초대 (채팅방 목록 페이지에서 홈으로 이동)
  const [invitations, setInvitations] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [createKeyword, setCreateKeyword] = useState('');
  const [selectedMemberSeqs, setSelectedMemberSeqs] = useState([]);

  // AI 챗봇 상태
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: '안녕하세요! 실루엣 AI 챗봇입니다. 😊\n지역별 맛집과 데이트 장소를 추천해 드리고, 추천한 가게의 메뉴나 영업 정보에 관한 질문도 답변해 드릴게요. 다만 실시간 검색은 하지 않으므로 최신 정보는 방문 전에 확인해 주세요!',
      time: '방금 전'
    }
  ]);

  const messagesEndRef = useRef(null);

  // 실시간 매칭 오버레이 (경과 시간)
  const isMatchingNow = isBlindMatching || isIdealMatching;
  const [matchSeconds, setMatchSeconds] = useState(0);

  useEffect(() => {
    if (!isMatchingNow) {
      setMatchSeconds(0);
      return undefined;
    }
    const timer = setInterval(() => setMatchSeconds((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [isMatchingNow]);

  // 채팅방 안 읽은 메시지 합계
  const totalUnread = myRoomList.reduce((acc, room) => acc + (Number(room.unread_count) || 0), 0);

  useEffect(() => {
    if (!token) navi('/login');
  }, [token, navi]);

  // 친구 목록과 내가 참여 중인 채팅방 목록
  useEffect(() => {
    let cancelled = false;

    const loadSidebarLists = async () => {
      if (!token) {
        setFriendList([]);
        setMyRoomList([]);
        setInvitations([]);
        return;
      }

      const [friendsResult, roomsResult, invitationsResult] = await Promise.allSettled([
        Client.get('/api/chat/friends'),
        Client.get('/api/chat/rooms'),
        Client.get('/api/chat/invitations')
      ]);

      if (cancelled) return;

      if (friendsResult.status === 'fulfilled') {
        setFriendList(Array.isArray(friendsResult.value.data)
          ? friendsResult.value.data
          : []);
      } else {
        console.error('친구 목록을 불러오지 못했습니다.', friendsResult.reason);
        setFriendList([]);
      }

      if (roomsResult.status === 'fulfilled') {
        setMyRoomList(Array.isArray(roomsResult.value.data)
          ? roomsResult.value.data
          : []);
      } else {
        console.error('채팅방 목록을 불러오지 못했습니다.', roomsResult.reason);
        setMyRoomList([]);
      }

      if (invitationsResult.status === 'fulfilled') {
        setInvitations(Array.isArray(invitationsResult.value.data)
          ? invitationsResult.value.data
          : []);
      } else {
        console.error('초대 목록을 불러오지 못했습니다.', invitationsResult.reason);
        setInvitations([]);
      }
    };

    loadSidebarLists();

    return () => {
      cancelled = true;
    };
  }, [token]);

  // 채팅방 목록 새로고침
  const refreshRooms = useCallback(async () => {
    try {
      const response = await Client.get('/api/chat/rooms');
      setMyRoomList(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('채팅방 목록을 불러오지 못했습니다.', error);
    }
  }, []);

  // 받은 채팅 초대 목록 불러오기
  const fetchInvitations = useCallback(async () => {
    try {
      const response = await Client.get('/api/chat/invitations');
      setInvitations(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('초대 목록을 불러오지 못했습니다.', error);
    }
  }, []);

  // 내 회원 번호 가져오기
  useEffect(() => {
    if (!token) return;

    Client.get('/api/chat/member-seq')
      .then((response) => {
        setMemberSeq(Number(response.data));
      })
      .catch((error) => {
        console.error('회원 번호 조회 실패:', error);
      });
  }, [token]);

  // 친구 요청 수락 후 친구 목록 갱신
  useEffect(() => {
    const refreshFriends = async () => {
      if (!token) return;

      try {
        const response = await Client.get('/api/chat/friends');
        setFriendList(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('친구 목록 갱신 실패:', error);
      }
    };

    window.addEventListener('silhouette-friends-updated', refreshFriends);

    return () => {
      window.removeEventListener('silhouette-friends-updated', refreshFriends);
    };
  }, [token]);

  // 친구 목록 실시간 갱신 STOMP 연결
  useEffect(() => {
    if (!token || !memberSeq) return;

    const brokerURL = wsUrl('/chat');

    const client = new StompClient({
      brokerURL,
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      reconnectDelay: 5000,

      onConnect: () => {
        console.log('친구 목록 실시간 갱신 웹소켓 연결 성공');

        client.subscribe(`/sub/friends/${memberSeq}`, () => {
          window.dispatchEvent(new Event('silhouette-friends-updated'));
        });
      },

      onStompError: (frame) => {
        console.error('친구 목록 STOMP 오류:', frame.headers['message'], frame.body);
      },

      onWebSocketError: (error) => {
        console.error('친구 목록 WebSocket 오류:', error);
      }
    });

    client.activate();

    return () => {
      client.deactivate();
    };
  }, [token, memberSeq]);

  // 친구 프로필 이미지 불러오기
  useEffect(() => {
    let cancelled = false;
    const objectUrls = [];

    const loadFriendImages = async () => {
      if (!token) return;

      const imageEntries = await Promise.all(
        friendList.map(async (friend) => {
          const memberSeq = Number(friend.member_seq ?? friend.memberSeq);
          const imagePath = friend.profile_image || friend.profileImage;

          if (!imagePath) {
            return [memberSeq, null];
          }

          // GCS 등 외부 이미지 주소는 그대로 사용
          if (/^https?:\/\//i.test(imagePath)) {
            return [memberSeq, imagePath];
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

            return [memberSeq, imageUrl];
          } catch (error) {
            console.error(
              `${friend.nickname || friend.login_id} 프로필 이미지 로드 실패:`,
              error.response?.status,
              error
            );

            return [memberSeq, null];
          }
        })
      );

      if (!cancelled) {
        setFriendImageUrls(Object.fromEntries(imageEntries));
      }
    };

    loadFriendImages();

    return () => {
      cancelled = true;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [friendList, token]);

  // 실시간 접속 대기 인원 변동 시뮬레이션
  useEffect(() => {
    const interval = setInterval(() => {
      setWaitingBlindUsers((prev) => prev + Math.floor(Math.random() * 5) - 2);
      setWaitingIdealUsers((prev) => prev + Math.floor(Math.random() * 3) - 1);
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatOpen]);

  // 대기 중인지 확인
  const isIdealWaitingRef = useRef(false);

  // 블라인드 매칭 대기 중인지 확인
  const isBlindWaitingRef = useRef(false);

  // 이상형 매칭 성공
  const handleIdealMatched = useCallback((result) => {
    isIdealWaitingRef.current = false;
    setIsIdealMatching(false);
    navi(`/chatting/${result.chatRoomSeq}`);
  }, [navi]);

  // 이상형 매칭 신청
  const handleIdealStart = async () => {
    try {
      const { data } = await startIdealMatch();

      if (data.status === 'MATCHED') {
        handleIdealMatched(data);
      } else {
        isIdealWaitingRef.current = true;
        setIsIdealMatching(true);
      }
    } catch (error) {
      const message = error.response?.data || '매칭 신청 중 오류가 발생했어요.';
      alert(message);
    }
  };

  // 대기 중일 때 3초마다 매칭 여부 확인
  useEffect(() => {
    if (!isIdealMatching) return;

    let stopped = false;

    const timer = setInterval(async () => {
      try {
        const { data } = await getIdealMatchStatus();

        if (stopped) return;

        if (data.status === 'MATCHED') {
          stopped = true;
          clearInterval(timer);
          handleIdealMatched(data);
        } else if (data.status === 'IDLE') {
          // 대기열에서 빠짐 (오래 확인이 없어 서버가 정리한 경우)
          stopped = true;
          clearInterval(timer);
          isIdealWaitingRef.current = false;
          setIsIdealMatching(false);
          alert('연결이 오래 끊겨 매칭 대기가 취소됐어요. 다시 신청해 주세요.');
        }
      } catch {
        // 일시적인 오류는 다음 주기에 다시 확인
      }
    }, 3000);

    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [isIdealMatching, handleIdealMatched]);

  // 대기 중에 창을 닫거나 새로고침하면 대기 취소
  useEffect(() => {
    if (!isIdealMatching) return;

    const cancelOnUnload = () => {
      fetch(`${Client.defaults.baseURL}/matching/ideal/cancel`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('token')}`
        },
        keepalive: true
      });
    };

    window.addEventListener('beforeunload', cancelOnUnload);

    return () => window.removeEventListener('beforeunload', cancelOnUnload);
  }, [isIdealMatching]);

  // 대기 중에 다른 메뉴로 이동하면 대기 취소
  useEffect(() => {
    return () => {
      if (isIdealWaitingRef.current) {
        cancelIdealMatch().catch(() => { });
      }
    };
  }, []);

  // 이상형 매칭 대기 취소
  const handleIdealCancel = async () => {
    try {
      await cancelIdealMatch();

      isIdealWaitingRef.current = false;
      setIsIdealMatching(false);
    } catch (error) {
      if (error.response?.status === 409) {
        try {
          const { data } = await getIdealMatchStatus();

          if (data.status === 'MATCHED') {
            handleIdealMatched(data);
            return;
          }
        } catch {
          // 공통 처리로 넘어감
        }
      }

      isIdealWaitingRef.current = false;
      setIsIdealMatching(false);
      alert(error.response?.data || '취소 중 오류가 발생했어요.');
    }
  };

  // 블라인드 매칭 STOMP 연결
  useEffect(() => {
    if (!token) return;

    const brokerURL = wsUrl('/blind');

    const client = new StompClient({
      brokerURL: brokerURL,
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      reconnectDelay: 5000,
      debug: (str) => {
        console.log('[STOMP]:', str);
      },
      onConnect: () => {
        console.log('STOMP Connected to', brokerURL);

        if (id) {
          // 블라인드 매칭 결과 수신
          client.subscribe(`/sub/user/${id}/match`, (message) => {
            try {
              const response = JSON.parse(message.body);

              if (response.status === 'MATCHED' && response.roomSeq) {
                isBlindWaitingRef.current = false;
                setIsBlindMatching(false);
                navi(`/chat/${response.roomSeq}`);   // 블라인드 채팅방 (일반 채팅방 /chatting 아님)
              }
            } catch (err) {
              console.error('응답 메시지 파싱 에러:', err);
            }
          });

          // 웹소켓 재연결 시 대기 중이었다면 다시 매칭 요청
          if (isBlindWaitingRef.current) {
            client.publish({
              destination: '/pub/match/join',
              body: '{}'
            });
          }
        }
      },
      onStompError: (frame) => {
        console.error('STOMP Broker Error:', frame.headers['message'], frame.body);
      },
      onWebSocketError: (error) => {
        console.error('WebSocket Error:', error);
      }
    });

    client.activate();
    setStompClient(client);

    return () => {
      client.deactivate();
    };
  }, [token, id, navi]);

  // 블라인드 매칭 신청
  const handleBlindMatching = () => {
    isBlindWaitingRef.current = true;
    setIsBlindMatching(true);

    if (stompClient && stompClient.connected) {
      stompClient.publish({
        destination: '/pub/match/join',
        body: '{}'
      });
    } else {
      // 연결되면 onConnect에서 자동으로 매칭 요청
      console.warn('STOMP 소켓이 아직 연결되지 않았습니다. 연결 후 자동으로 매칭을 요청합니다.');
    }
  };

  // 블라인드 매칭 취소
  const handleCancelBlindMatching = () => {
    isBlindWaitingRef.current = false;
    setIsBlindMatching(false);

    if (stompClient && stompClient.connected) {
      stompClient.publish({
        destination: '/pub/match/cancel',
        body: '{}'
      });
    }
  };

  // 내 주변 추천 불러오기
  const fetchNearby = useCallback(async () => {
    try {
      const { data } = await getNearbyMembers();

      return {
        region: data.myRegion,
        members: data.members ?? []
      };
    } catch (error) {
      console.error('내 주변 추천 조회 실패:', error);

      return {
        region: null,
        members: []
      };
    }
  }, []);

  // 첫 화면 진입 시 주변 회원 조회
  useEffect(() => {
    if (!token) return;

    let ignore = false;

    fetchNearby().then(({ region, members }) => {
      if (ignore) return;

      setMyRegion(region);
      setLocationProfiles(members);
      setIsLocationLoading(false);
    });

    return () => {
      ignore = true;
    };
  }, [token, fetchNearby]);

  // 새로운 이웃 추천
  const handleShuffleLocation = async () => {
    setIsLocationLoading(true);

    const { region, members } = await fetchNearby();

    setMyRegion(region);
    setLocationProfiles(members);
    setIsLocationLoading(false);
  };

  // 친구가 아닌 회원을 로그인 아이디로 검색합니다.
  const searchNonFriends = async () => {
    if (!friendSearchKeyword.trim()) {
      setFriendSearchResults([]);
      setFriendSearchMessage('로그인 아이디를 입력해 주세요.');
      return;
    }
    try {
      const response = await Client.get('/api/chat/friends/search', {
        params: { keyword: friendSearchKeyword.trim() }
      });
      setFriendSearchResults(response.data || []);
      setFriendSearchMessage(response.data?.length ? '' : '친구 추가할 수 있는 회원이 없습니다.');
    } catch (error) {
      console.error('친구 검색 실패:', error);
      setFriendSearchMessage(error.response?.data || '회원 검색에 실패했습니다.');
    }
  };

  const addSearchedFriend = async (member) => {
    try {
      await Client.post('/api/chat/friends/request', {
        friend_member_seq: Number(member.member_seq)
      });
      setFriendSearchResults((prev) => prev.filter(
        (item) => Number(item.member_seq) !== Number(member.member_seq)
      ));
      setFriendSearchMessage(`${member.login_id}님에게 친구 요청을 보냈습니다.`);
    } catch (error) {
      alert(error.response?.data || '친구 요청을 보내지 못했습니다.');
    }
  };

  // 주변 회원에게 친구 요청 보내기
  const handleSendFriendRequest = async (memberSeq) => {
    try {
      await Client.post('/api/chat/friends/request', {
        friend_member_seq: memberSeq
      });

      alert('친구 요청을 보냈습니다.');
    } catch (error) {
      alert(error.response?.data || '친구 요청을 보내지 못했습니다.');
    }
  };

  // 채팅방에 초대할 친구 선택 및 취소
  const toggleCreateMember = (friendSeq) => {
    const seq = Number(friendSeq);

    setSelectedMemberSeqs((prev) => (
      prev.includes(seq) ? prev.filter((item) => item !== seq) : [...prev, seq]
    ));
  };

  // 채팅방 만들기 패널 닫기 + 입력값 초기화
  const closeCreatePanel = () => {
    setShowCreate(false);
    setRoomName('');
    setCreateKeyword('');
    setSelectedMemberSeqs([]);
  };

  // 채팅방 생성 및 친구 초대
  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      alert('채팅방 이름을 입력해주세요.');
      return;
    }

    if (selectedMemberSeqs.length === 0) {
      alert('초대할 친구를 선택해주세요.');
      return;
    }

    try {
      const response = await Client.post('/api/chat/room', {
        room_name: roomName.trim(),
        room_type: selectedMemberSeqs.length > 1 ? 'GROUP' : '1:1',
        invitee_seqs: selectedMemberSeqs
      });

      closeCreatePanel();
      navi(`/chatting/${response.data.chat_room_seq}`);
    } catch (error) {
      console.error('채팅방 생성 실패:', error);
      alert(error.response?.data || '채팅방 생성에 실패했습니다.');
    }
  };

  // 받은 채팅 초대 수락 및 거절
  const respondInvitation = async (invitation, accept) => {
    try {
      const url = `/api/chat/invite/${invitation.chat_invitation_seq}/${accept ? 'accept' : 'reject'}`;

      await Client.post(url);
      await fetchInvitations();

      if (accept) {
        await refreshRooms();
        navi(`/chatting/${invitation.chat_room_seq}`);
      }
    } catch (error) {
      console.error('초대 처리 실패:', error);
      alert(error.response?.data || '초대 처리에 실패했습니다.');
    }
  };

  // 채팅방 만들기에서 친구 닉네임/아이디로 거르기
  // 사이드바 '내 친구 검색': 이미 친구인 사람 중 닉네임/아이디로 필터링합니다.
  const filteredMyFriends = friendList.filter((friend) => {
    const keyword = friendSearchMode === 'mine' ? myFriendKeyword.trim().toLowerCase() : '';
    if (!keyword) return true;
    return (
      (friend.nickname || '').toLowerCase().includes(keyword) ||
      (friend.login_id || '').toLowerCase().includes(keyword)
    );
  });

  const filteredCreateFriends = friendList.filter((friend) => {
    const keyword = createKeyword.trim().toLowerCase();

    if (!keyword) return true;

    return (
      (friend.nickname || '').toLowerCase().includes(keyword) ||
      (friend.login_id || '').toLowerCase().includes(keyword)
    );
  });

  // AI 챗봇 메시지 전송
 
const handleSendChatMessage = async (textToSend) => {
  const text = typeof textToSend === 'string' ? textToSend : chatInput;

  if (!text.trim()) return;

  const userMessage = {
    id: Date.now(),
    sender: 'user',
    text: text.trim(),
    time: new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })
  };

  const conversation = chatMessages
    .slice(-20)
    .map((message) => {
      const speaker = message.sender === 'ai' ? '챗봇' : '사용자';
      return `${speaker}: ${message.text}`;
    })
    .join('\n');

  setChatMessages((prev) => [...prev, userMessage]);
  setChatInput('');

  try {
    const response = await Client.post('/api/chatbot/chat', {
      question: text.trim(),
      conversation: conversation
    });

    setChatMessages((prev) => [
      ...prev,
      {
        id: Date.now() + 1,
        sender: 'ai',
        text: response.data.answer,
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        })
      }
    ]);
  } catch (error) {
    console.error('챗봇 오류:', error);

    setChatMessages((prev) => [
      ...prev,
      {
        id: Date.now() + 1,
        sender: 'ai',
        text: '챗봇 연결에 실패했어요. 잠시 후 다시 시도해 주세요.',
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        })
      }
    ]);
  }
};


  return (
    <div className={styles.page}>
      {/* 1. 히어로: 로고가 먼저 뜨고 1초 뒤 인기 프로필 3장이 위에서 스르르 등장 */}
      <section className={styles.hero}>
        <div className={styles.heroStage}>
          <div className={styles.wordmarkWrap}>
            <h1 className={styles.heroWordmark}>Silhouette</h1>
          </div>

          <div className={styles.cardStage}>
            {HERO_PROFILES.map((p, i) => (
              <div
                key={p.id}
                className={`${styles.stackCard} ${[styles.cardFront, styles.cardMid, styles.cardBack][i]}`}
              >
                <img
                  src={p.img}
                  alt={p.name}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = `https://placehold.co/400x560/22201e/ffd34e?text=${encodeURIComponent(p.name)}`;
                  }}
                />
                <div className={styles.cardShade} />

                {i === 0 ? (
                  <>
                    <span className={styles.cardBadge}>{p.badge}</span>
                    <div className={styles.cardInfo}>
                      <div>
                        <p className={styles.cardName}>{p.name}</p>
                        <p className={styles.cardSub}>{p.job}</p>
                      </div>
                      <span className={styles.cardView}>VIEW</span>
                    </div>
                  </>
                ) : (
                  <div className={styles.cardInfoSmall}>
                    <span className={styles.cardRank}>TOP 0{i + 1}</span>
                    <p className={styles.cardNameSmall}>{p.name}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className={styles.ctaRow}>
          <button type="button" className={styles.ctaDark} onClick={handleBlindMatching}>
            <span className={`${styles.ctaDot} ${styles.ctaDotHoney}`} />
            <span>블라인드 랜덤 매칭 START</span>
            <span className={styles.ctaCountHoney}>{waitingBlindUsers.toLocaleString()}</span>
          </button>
          <button type="button" className={styles.ctaLight} onClick={handleIdealStart}>
            <span className={`${styles.ctaDot} ${styles.ctaDotInk}`} />
            <span>이상형 랜덤 매칭 START</span>
            <span className={styles.ctaCountSoft}>{waitingIdealUsers.toLocaleString()}</span>
          </button>
        </div>
      </section>

      {/* 실시간 매칭 오버레이 (취소하기 전까지 화면 고정) */}
      {isMatchingNow && (
        <div className={styles.matchOverlay}>
          <div className={styles.matchModal}>
            <div className={styles.lockBadge}>
              <span>LOCKED · LIVE MATCHING</span>
              <span>
                {String(Math.floor(matchSeconds / 60)).padStart(2, '0')}:{String(matchSeconds % 60).padStart(2, '0')}
              </span>
            </div>

            <h2 className={styles.matchModalTitle}>
              {isIdealMatching ? '이상형 랜덤 매칭 탐색 중' : '블라인드 랜덤 매칭 탐색 중'}
            </h2>
            <p className={styles.matchModalDesc}>
              {isIdealMatching
                ? '가치관이 잘 맞는 상대를 AI가 찾고 있습니다. 상대가 연결되면 자동으로 입장합니다.'
                : '외모와 조건 없이 대화로 연결됩니다. 상대가 연결되면 자동으로 입장합니다.'}
            </p>

            <div className={styles.radar}>
              <span className={styles.radarRing} />
              <span className={styles.radarRing} />
              <span className={styles.radarRing} />
              <div className={styles.radarCore}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className={styles.radarIcon}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <div className={styles.waitingLine}>
              <span>현재 실시간 대기 인원</span>
              <strong>{(isIdealMatching ? waitingIdealUsers : waitingBlindUsers).toLocaleString()}명</strong>
            </div>

            <button
              type="button"
              className={styles.matchCancel}
              onClick={isIdealMatching ? handleIdealCancel : handleCancelBlindMatching}
            >
              취소하기
            </button>
          </div>
        </div>
      )}

      {/* 상단 메뉴 바 (브라우저 양쪽 끝까지, 친구/채팅 도크 위) */}
      <nav className={styles.topNav}>
        {[['/', '홈'], ['/event', '이벤트'], ['/post', '게시판'], ['/live', '라이브']].map(([to, label]) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `${styles.topNavBtn} ${isActive ? styles.topNavActive : ''}`}
          >
            {label}
          </NavLink>
        ))}
        {role === 'ROLE_ADMIN' && (
          <NavLink to="/admin" className={styles.topNavBtn}>관리자</NavLink>
        )}
      </nav>

      {/* 2. 레이아웃: 내 주변 매칭 (3열) + 친구 도크/커뮤니티 */}
      <div className={styles.columns}>
        {/* 가운데: 내 주변 가까운 매칭 */}
        <section className={styles.centerCol}>
          <div className={styles.nearHeader}>
            <div>
              <span className={styles.eyebrow}>NEARBY DISCOVERY</span>
              <h2 className={styles.nearTitle}>내 주변 가까운 매칭</h2>
              <p className={styles.nearSub}>
                {myRegion
                  ? `회원님의 거주지(${myRegion}) 기준 같은 동네 우선 추천 (최대 10명)`
                  : '회원정보에 주소를 등록하면 가까운 이웃을 추천해드려요'}
              </p>
            </div>

            <button
              type="button"
              className={styles.shuffleBtn}
              onClick={handleShuffleLocation}
              disabled={isLocationLoading}
              title="다른 추천 프로필 보기"
            >
              {isLocationLoading ? '불러오는 중...' : '새로운 이웃 추천'}
            </button>
          </div>

          {!isLocationLoading && locationProfiles.length === 0 && (
            <p className={styles.locEmpty}>
              {myRegion
                ? '아직 근처에 추천할 회원이 없어요. 잠시 후 다시 확인해보세요!'
                : '주소 정보가 없어 추천할 수 없어요.'}
            </p>
          )}

          <div className={styles.nearGrid}>
            {locationProfiles.map((item) => {
              const photo = item.profileImage || item.profile_image || item.imageUrl || item.image_url;
              const hasPhoto = typeof photo === 'string' && /^https?:\/\//i.test(photo);

              return (
                <article key={item.memberSeq} className={styles.nearCard}>
                  <div className={styles.nearPhoto}>
                    {hasPhoto ? (
                      <img src={photo} alt={item.nickname} />
                    ) : (
                      <div className={styles.nearPhotoFallback}>{(item.nickname || '?').slice(0, 1)}</div>
                    )}
                    <div className={styles.nearShade} />

                    <div className={styles.nearBadges}>
                      <span className={styles.nearBadgeHoney}>
                        {item.nearRank === 1 ? '같은 동네' : '같은 지역'}
                      </span>
                      {item.mbti && <span className={styles.nearBadgeDark}>{item.mbti}</span>}
                    </div>

                    <div className={styles.nearName}>
                      <h3>
                        {item.nickname}, <span>{item.age}세</span>
                      </h3>
                      <p>{item.region}</p>
                    </div>
                  </div>

                  <div className={styles.nearBody}>
                    <p className={styles.nearIntro}>
                      {item.introduction || '아직 자기소개를 작성하지 않았어요.'}
                    </p>
                    <button
                      type="button"
                      className={styles.nearBtn}
                      onClick={() => handleSendFriendRequest(item.memberSeq)}
                    >
                      친구 요청
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* 오른쪽: 친구/채팅 도크 + 커뮤니티 인기글 */}
        <aside className={styles.rightCol}>
          <div className={styles.dockWrap}>
            <div className={styles.dockTabs}>
              <button
                type="button"
                className={`${styles.dockTab} ${sidebarTab === 'friends' ? styles.dockTabActive : ''}`}
                onClick={() => setSidebarTab('friends')}
              >
                친구 목록 ({friendList.length})
              </button>
              <button
                type="button"
                className={`${styles.dockTab} ${sidebarTab === 'rooms' ? styles.dockTabActive : ''}`}
                onClick={() => setSidebarTab('rooms')}
              >
                <span>채팅방</span>
                {totalUnread > 0 && <span className={styles.dockBadge}>{totalUnread}</span>}
              </button>
            </div>

            <div className={styles.dockBody}>
              <div className={styles.sidebarListBox}>
            {sidebarTab === 'friends' && (
              <>
                {/* 위쪽 고정 영역: 검색 2개 (내 친구 검색 / 아이디로 친구 추가 검색) */}
                <div className={styles.sidebarFixedTop}>
                  <h3 className={styles.sidebarListTitle}>
                    내 친구 <span className={styles.sidebarCount}>{friendList.length}</span>
                  </h3>

                  {/* 검색 방식 토글: 내 친구 검색 / 친구 추가 검색 */}
                  <div className={styles.searchModeToggle}>
                    <button
                      type="button"
                      className={`${styles.searchModeBtn} ${friendSearchMode === 'mine' ? styles.searchModeActive : ''}`}
                      onClick={() => setFriendSearchMode('mine')}
                    >
                      내 친구 검색
                    </button>
                    <button
                      type="button"
                      className={`${styles.searchModeBtn} ${friendSearchMode === 'add' ? styles.searchModeActive : ''}`}
                      onClick={() => setFriendSearchMode('add')}
                    >
                      친구 추가 검색
                    </button>
                  </div>

                  {friendSearchMode === 'mine' ? (
                    <div className={styles.sidebarSearchRow}>
                      <input
                        type="text"
                        className={styles.sidebarInput}
                        value={myFriendKeyword}
                        onChange={(e) => setMyFriendKeyword(e.target.value)}
                        placeholder="닉네임 또는 아이디로 내 친구 찾기"
                      />
                      {myFriendKeyword && (
                        <button
                          type="button"
                          className={styles.sidebarSmallBtn}
                          onClick={() => setMyFriendKeyword('')}
                        >
                          지우기
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className={styles.sidebarSearchRow}>
                      <input
                        type="text"
                        className={styles.sidebarInput}
                        value={friendSearchKeyword}
                        onChange={(e) => {
                          setFriendSearchKeyword(e.target.value);
                          if (!e.target.value.trim()) {
                            setFriendSearchResults([]);
                            setFriendSearchMessage('');
                          }
                        }}
                        onKeyDown={(e) => { if (e.key === 'Enter') searchNonFriends(); }}
                        placeholder="로그인 아이디로 친구 추가 검색"
                      />
                      <button type="button" className={styles.sidebarSmallBtn} onClick={searchNonFriends}>검색</button>
                    </div>
                  )}

                  {friendSearchMode === 'add' && friendSearchMessage && (
                    <p className={styles.sidebarEmpty}>{friendSearchMessage}</p>
                  )}

                  {friendSearchMode === 'add' && friendSearchResults.map((member) => (
                    <div key={member.member_seq} className={styles.sidebarPerson}>
                      <span className={styles.sidebarPersonName}>{member.nickname || member.login_id} ({member.login_id})</span>
                      <button type="button" className={styles.sidebarPrimaryBtn} onClick={() => addSearchedFriend(member)}>친구 추가</button>
                    </div>
                  ))}
                </div>

                {/* 아래 스크롤 영역: 내 친구 목록 (꽉 차면 스크롤) */}
                <div className={styles.sidebarScroll}>
                  {friendList.length === 0 && (
                    <p className={styles.sidebarEmpty}>등록된 친구가 없습니다.</p>
                  )}

                  {friendList.length > 0 && filteredMyFriends.length === 0 && (
                    <p className={styles.sidebarEmpty}>검색 결과가 없습니다.</p>
                  )}


                  {filteredMyFriends.map((friend) => {
                    const friendSeq = friend.member_seq ?? friend.memberSeq;
                    return (
                      <div
                        className={styles.sidebarPerson}
                        key={friendSeq ?? friend.login_id ?? friend.loginId}
                        onClick={() => setProfileTargetSeq(friendSeq)}
                        style={{ cursor: 'pointer' }}
                        title="프로필 보기"
                      >
                        {friendImageUrls[Number(friendSeq)] ? (
                          <img
                            src={friendImageUrls[Number(friendSeq)]}
                            alt=""
                            className={styles.sidebarAvatar}
                          />
                        ) : (
                          <div className={styles.sidebarAvatarFallback}>👤</div>
                        )}


                        <span className={styles.sidebarPersonName}>{friend.nickname || friend.login_id || friend.loginId}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {sidebarTab === 'rooms' && (
              <>
                <div className={`${styles.sidebarTitleRow} ${styles.sidebarFixedTop}`}>
                  <h3 className={styles.sidebarListTitle}>
                    내 채팅방 <span className={styles.sidebarCount}>{myRoomList.length}</span>
                  </h3>

                  <div className={styles.sidebarTitleActions}>
                    <button type="button" className={styles.sidebarSmallBtn} onClick={refreshRooms}>
                      새로고침
                    </button>
                    <button
                      type="button"
                      className={styles.sidebarPrimaryBtn}
                      onClick={() => (showCreate ? closeCreatePanel() : setShowCreate(true))}
                    >
                      {showCreate ? '닫기' : '+ 새 채팅방'}
                    </button>
                  </div>
                </div>

                {/* 아래 스크롤 영역: 채팅방 만들기 / 받은 초대 / 채팅방 목록 (꽉 차면 스크롤) */}
                <div className={styles.sidebarScroll}>
                {/* 새 채팅방 만들기 */}
                {showCreate && (
                  <div className={styles.createPanel}>
                    <label className={styles.createLabel}>채팅방 이름</label>
                    <input
                      type="text"
                      className={styles.sidebarInput}
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      placeholder="채팅방 이름을 입력하세요"
                    />

                    <label className={styles.createLabel}>
                      초대할 친구 ({selectedMemberSeqs.length}명 선택)
                    </label>
                    <input
                      type="text"
                      className={styles.sidebarInput}
                      value={createKeyword}
                      onChange={(e) => setCreateKeyword(e.target.value)}
                      placeholder="친구 닉네임 검색"
                    />

                    <div className={styles.createFriendList}>
                      {filteredCreateFriends.length === 0 ? (
                        <p className={styles.sidebarEmpty}>
                          {friendList.length === 0 ? '먼저 친구를 추가해 주세요.' : '검색 결과가 없습니다.'}
                        </p>
                      ) : (
                        filteredCreateFriends.map((friend) => {
                          const selected = selectedMemberSeqs.includes(Number(friend.member_seq));

                          return (
                            <button
                              type="button"
                              key={friend.member_seq}
                              className={`${styles.createFriendItem} ${selected ? styles.createFriendSelected : ''}`}
                              onClick={() => toggleCreateMember(friend.member_seq)}
                            >
                              {friendImageUrls[Number(friend.member_seq)] ? (
                                <img
                                  src={friendImageUrls[Number(friend.member_seq)]}
                                  alt=""
                                  className={styles.sidebarAvatar}
                                />
                              ) : (
                                <div className={styles.sidebarAvatarFallback}>{(friend.nickname || friend.login_id || '?').slice(0, 1)}</div>
                              )}

                              <span className={styles.sidebarPersonName}>{friend.nickname || friend.login_id}</span>
                              <span className={styles.createCheck}>{selected ? '✓' : ''}</span>
                            </button>
                          );
                        })
                      )}
                    </div>

                    <button type="button" className={styles.createSubmitBtn} onClick={handleCreateRoom}>
                      채팅방 생성 및 초대 보내기
                    </button>
                  </div>
                )}

                {/* 받은 채팅 초대 */}
                {invitations.length > 0 && (
                  <div className={styles.inviteSection}>
                    <h4 className={styles.inviteSectionTitle}>받은 채팅 초대</h4>

                    {invitations.map((invitation) => (
                      <div key={invitation.chat_invitation_seq} className={styles.inviteItem}>
                        <span className={styles.inviteText}>
                          {invitation.inviter_nick || '회원'}님이 {invitation.room_name || '채팅방'}에 초대했습니다.
                        </span>

                        <div className={styles.inviteActions}>
                          <button
                            type="button"
                            className={styles.sidebarPrimaryBtn}
                            onClick={() => respondInvitation(invitation, true)}
                          >
                            수락
                          </button>
                          <button
                            type="button"
                            className={styles.sidebarSmallBtn}
                            onClick={() => respondInvitation(invitation, false)}
                          >
                            거절
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {myRoomList.length === 0 && (
                  <p className={styles.sidebarEmpty}>참여 중인 채팅방이 없습니다.</p>
                )}

                {myRoomList.map((room) => (
                  <button
                    type="button"
                    className={styles.sidebarRoom}
                    key={room.chat_room_seq}
                    onClick={() => navi(`/chatting/${room.chat_room_seq}`)}
                  >
                    <div className={styles.sidebarRoomTop}>
                      <strong>{room.room_name || room.partner_nick || '채팅방'}</strong>

                      {room.unread_count > 0 && (
                        <span className={styles.sidebarUnread}>{room.unread_count}</span>
                      )}
                    </div>

                    <span>{room.last_message || '대화를 시작해보세요.'}</span>
                  </button>
                ))}
                </div>
              </>
            )}
          </div>
            </div>
          </div>

          <div className={styles.communityCard}>
            <div className={styles.communityHead}>
              <div>
                <span className={styles.eyebrow}>COMMUNITY</span>
                <h3 className={styles.communityTitle}>커뮤니티 인기글</h3>
              </div>
              <span className={styles.top4}>TOP 04</span>
            </div>

            <div className={styles.postList}>
              {MOCK_POPULAR_POSTS.map((post) => (
                <div key={post.id} className={styles.postItem} onClick={() => navi('/post')}>
                  <div className={styles.postRow}>
                    <span className={styles.postRank}>{String(post.id).padStart(2, '0')}</span>
                    <p className={styles.postItemTitle}>{post.title}</p>
                  </div>
                  <div className={styles.postItemMeta}>
                    <span>댓글 {post.comments}개</span>
                    <span>{post.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* 3. 오른쪽 하단 AI 맛집·데이트 추천 챗봇 */}
      <div
        className={`${styles.chatbotFab} ${isChatOpen ? styles.chatbotFabActive : ''}`}
        onClick={() => setIsChatOpen(!isChatOpen)}
        title="AI 맛집·데이트 추천 챗봇 열기"
      >
        <span className={styles.chatbotFabIcon}>{isChatOpen ? '✕' : 'AI'}</span>

        {!isChatOpen && (
          <span className={styles.chatbotFabBadge}>AI 추천</span>
        )}

        <span className={styles.chatbotOnlineDot}></span>
      </div>

      {isChatOpen && (
        <div className={styles.chatbotWindow}>
          <div className={styles.chatbotHeader}>
            <div className={styles.chatbotHeaderLeft}>
              <div className={styles.chatbotAvatar}>AI</div>

              <div>
                <h4 className={styles.chatbotTitle}>실루엣 AI 추천 도우미</h4>
                <span className={styles.chatbotStatus}>🟢 맛집·데이트 추천 상담</span>
              </div>
            </div>

            <button
              type="button"
              className={styles.chatbotCloseBtn}
              onClick={() => setIsChatOpen(false)}
            >
              ✕
            </button>
          </div>

          <div className={styles.quickChipsContainer}>
            {CHATBOT_QUICK_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                className={styles.quickChip}
                onClick={() => handleSendChatMessage(chip)}
              >
                {chip}
              </button>
            ))}
          </div>

          <div className={styles.chatbotMessages}>
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`${styles.chatBubbleRow} ${msg.sender === 'user' ? styles.userRow : styles.aiRow}`}
              >
                {msg.sender === 'ai' && (
                  <div className={styles.chatBotAvatarSmall}>AI</div>
                )}

                <div
                  className={`${styles.chatBubble} ${msg.sender === 'user' ? styles.userBubble : styles.aiBubble}`}
                >
                  <p className={styles.chatBubbleText}>{msg.text}</p>
                  <span className={styles.chatTime}>{msg.time}</span>
                </div>
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendChatMessage();
            }}
            className={styles.chatbotInputArea}
          >
            <input
              type="text"
              className={styles.chatbotInput}
              placeholder="지역과 먹고 싶은 음식 또는 궁금한 가게를 입력하세요..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              autoFocus
            />

            <button type="submit" className={styles.chatbotSendBtn} title="전송">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={styles.sendIcon}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* 친구 프로필 팝업 */}
      {profileTargetSeq && (
        <MemberProfileModal
          memberSeq={profileTargetSeq}
          onClose={() => setProfileTargetSeq(null)}
        />
      )}
    </div>
  );
}

export default Home;
