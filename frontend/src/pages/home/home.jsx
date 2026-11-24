import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/useAuthStore';
import styles from './home.module.css';
import {
  startIdealMatch,
  getIdealMatchStatus,
  cancelIdealMatch,
  getNearbyMembers
} from '../../api/matching';
import Client from '../../api/client';
import MemberProfileModal from '../memberProfileModal/memberProfileModal';
import { Client as StompClient } from '@stomp/stompjs';

// 커뮤니티 인기글 목데이터
const MOCK_POPULAR_POSTS = [
  { id: 1, title: '첫 만남 장소로 카페 vs 조용한 와인바 추천', comments: 14, time: '10분 전' },
  { id: 2, title: '실물 인증 통과 후기 (실제 만나보니 신뢰도 100%)', comments: 28, time: '35분 전' },
  { id: 3, title: '가치관 일치율 95% 나온 분과 첫 대화 나눠본 썰', comments: 19, time: '1시간 전' },
  { id: 4, title: 'AI 안전 도우미가 알려준 첫 만남 안전 수칙 3가지', comments: 8, time: '2시간 전' }
];

// 챗봇 추천 퀵 질문 칩
const CHATBOT_QUICK_CHIPS = [
  '📍 안전한 만남 장소 추천',
  '🛡️ 첫 만남 안전 수칙 TOP 3',
  '📱 연락처는 언제 교환하나요?',
  '🎁 QR 안심 인증 혜택'
];

// 공통 매칭 카드 컴포넌트
function MatchCard({
  isIdeal,
  badgeText,
  title,
  desc,
  waitingLabel,
  waitingCount,
  isMatching,
  onStart,
  onCancel,
  btnSubtitle,
  guideContent,
  searchingTitle,
  searchingSubtitle,
  icon
}) {
  return (
    <div className={`${styles.matchCardWrapper} ${isIdeal ? styles.idealTheme : ''}`}>
      <div className={styles.cardHeader}>
        <span className={isIdeal ? styles.idealBadge : styles.blindBadge}>{badgeText}</span>
        <h3 className={styles.cardHeaderTitle}>{title}</h3>
        <p className={styles.cardHeaderDesc}>{desc}</p>
      </div>

      <div className={styles.ambientLight1}></div>
      <div className={styles.ambientLight2}></div>

      <div className={styles.blindMatchContent}>
        {!isMatching ? (
          <div className={styles.matchStandby}>
            <div className={styles.waitingBadge}>
              <span className={styles.waitingPulseDot}></span>
              <span className={styles.waitingText}>
                {waitingLabel} <b>{waitingCount.toLocaleString()}</b>명
              </span>
            </div>

            <div className={styles.startBtnContainer} onClick={onStart}>
              <div className={styles.startBtnPulse}></div>
              <button type="button" className={styles.startBtn}>
                <span className={styles.startTitle}>START</span>
                <span className={styles.startSubtitle}>{btnSubtitle}</span>
              </button>
            </div>

            {guideContent}
          </div>
        ) : (
          <div className={styles.matchSearching}>
            <div className={styles.radarWrapper}>
              <div className={styles.radarWave1}></div>
              <div className={styles.radarWave2}></div>
              <div className={styles.radarWave3}></div>
              <div className={styles.radarCenterCore}>{icon}</div>
            </div>

            <h3 className={styles.searchingTitle}>{searchingTitle}</h3>
            <p className={styles.searchingSubtitle}>{searchingSubtitle}</p>

            <button type="button" onClick={onCancel} className={styles.cancelBtn}>
              취소하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// 홈 화면
function Home() {
  const { token, id } = useAuthStore();
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
  const [friendSearchResults, setFriendSearchResults] = useState([]);
  const [friendSearchMessage, setFriendSearchMessage] = useState('');
  const [myRoomList, setMyRoomList] = useState([]);
  const [friendImageUrls, setFriendImageUrls] = useState({});
  const [profileTargetSeq, setProfileTargetSeq] = useState(null);   // 프로필 팝업으로 볼 회원 번호

  // AI 챗봇 상태
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: '안녕하세요! 실루엣 AI 안전 도우미입니다. 🛡️\n안전한 만남 장소, 데이트 매너, 안심 수칙 등 무엇이든 물어보세요!',
      time: '방금 전'
    }
  ]);

  const messagesEndRef = useRef(null);

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
        return;
      }

      const [friendsResult, roomsResult] = await Promise.allSettled([
        Client.get('/api/chat/friends'),
        Client.get('/api/chat/rooms')
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
    };

    loadSidebarLists();

    return () => {
      cancelled = true;
    };
  }, [token]);

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

  const wsHost = window.location.hostname || 'localhost';
  const wsPort = window.location.port === '5173'
    ? ':80'
    : (window.location.port ? `:${window.location.port}` : '');

  const brokerURL = `ws://${wsHost}${wsPort}/chat`;

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
          const memberSeq = Number(friend.member_seq);
          const imagePath = friend.profile_image;

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
    navi(`/chatting/${result.chat_Room_Seq}`);
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
          stopped = true;
          clearInterval(timer);
          isIdealWaitingRef.current = false;
          setIsIdealMatching(false);
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

    const wsHost = window.location.hostname || 'localhost';
    const wsPort = window.location.port === '5173'
      ? ':80'
      : (window.location.port ? `:${window.location.port}` : '');

    const brokerURL = `ws://${wsHost}${wsPort}/blind`;

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
                navi(`/chatting/${response.roomSeq}`);
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

  // AI 챗봇 메시지 전송
  const handleSendChatMessage = (textToSend) => {
    const text = typeof textToSend === 'string' ? textToSend : chatInput;

    if (!text.trim()) return;

    const time = new Date().toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    setChatMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: 'user',
        text: text.trim(),
        time
      }
    ]);

    if (typeof textToSend !== 'string') {
      setChatInput('');
    }

    setTimeout(() => {
      let reply = `✨ 실루엣 AI: "${text.trim()}"에 대해 안내드립니다. 첫 만남에서는 서로의 안전과 존중을 최우선으로 고려해주세요.`;
      const q = text.toLowerCase();

      if (q.includes('장소') || q.includes('카페') || q.includes('어디') || q.includes('추천')) {
        reply = '💡 [AI 추천 만남 장소]\n유동인구가 많고 조용한 프랜차이즈 북카페나 오픈형 라운지를 추천드려요. 이동이 편리한 지하철역 인근 공공장소가 가장 안전합니다.';
      } else if (q.includes('주의') || q.includes('안전') || q.includes('조심') || q.includes('수칙')) {
        reply = '🛡️ [첫 만남 안심 수칙 TOP 3]\n1. 첫 만남은 낮이나 초저녁 공공장소에서 진행하기\n2. 개인 연락처는 대화방에서 신뢰가 쌓인 후 공유하기\n3. 만남 장소와 귀가 시간을 지인에게 미리 공유하기';
      } else if (q.includes('연락처') || q.includes('번호') || q.includes('카톡')) {
        reply = '📱 [연락처 공유 가이드]\n실루엣 앱 내 안심 채팅방에서 충분히 대화를 나눈 뒤, 첫 대면 만남 이후에 연락처를 교환하는 것을 강력히 권장합니다.';
      } else if (q.includes('인증') || q.includes('qr') || q.includes('실물') || q.includes('혜택')) {
        reply = '🎉 [실물 및 QR 인증 혜택]\nAI 얼굴 실물 인증을 완료하시면 신뢰도 배지가 부여되며, 실제 만남 시 QR 인증을 완료하면 무료 대화권 5장이 즉시 지급됩니다!';
      }

      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: reply,
          time
        }
      ]);
    }, 350);
  };

  // 홈 화면 UI
  return (
    <div className={styles.container}>
      {/* 1. 상단: 실시간 매칭 모드 */}
      <section className={styles.topSection}>
        <div className={styles.topHeader}>
          <div className={styles.topTitleGroup}>
            <div className={styles.topBadge}>✨ 실시간 랜덤 매칭</div>
            <h2 className={styles.topTitle}>
              매칭 모드 <span className={styles.topTitleHighlight}>선택</span>
            </h2>
            <p className={styles.topDesc}>
              원하는 방식으로 인연을 찾아보세요. 조건 없는 블라인드 대화와 맞춤형 이상형 매칭을 지원합니다.
            </p>
          </div>

          <div className={styles.refreshInfo}>
            <span className={styles.pulseGreenDot}></span>
            <span>실시간 매칭 가동 중</span>
          </div>
        </div>

        <div className={styles.matchSplitGrid}>
          {/* 블라인드 매칭 */}
          <MatchCard
            isIdeal={false}
            badgeText="🎭 블라인드 매칭"
            title="블라인드 랜덤 매칭"
            desc="외모와 조건 없이, 오직 목소리와 대화로 통하는 인연"
            waitingLabel="현재 접속자"
            waitingCount={waitingBlindUsers}
            isMatching={isBlindMatching}
            onStart={handleBlindMatching}
            onCancel={handleCancelBlindMatching}
            btnSubtitle="BLIND MATCH"
            guideContent={
              <p className={styles.matchGuide}>
                커튼 너머의 실루엣처럼,<br />얼굴 없는 진실된 대화를 시작해보세요.
              </p>
            }
            searchingTitle="블라인드 상대를 찾는 중..."
            searchingSubtitle="잠시만 기다려주세요"
            icon={
              <svg className={styles.radarSearchIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />

          {/* 이상형 매칭 */}
          <MatchCard
            isIdeal={true}
            badgeText="💖 이상형 매칭"
            title="이상형 랜덤 매칭"
            desc="나의 가치관과 이상형 설정을 기반으로 최적의 상대 매칭"
            waitingLabel="이상형 매칭"
            waitingCount={waitingIdealUsers}
            isMatching={isIdealMatching}
            onStart={handleIdealStart}
            onCancel={handleIdealCancel}
            btnSubtitle="IDEAL MATCH"
            guideContent={
              <div className={styles.idealKeywords}>
                <span>#가치관 90%↑</span>
                <span>#관심사 일치</span>
                <span>#AI 맞춤추천</span>
              </div>
            }
            searchingTitle="취향 저격 이상형을 찾는 중..."
            searchingSubtitle="가치관 및 프로필 데이터 매칭 중"
            icon={
              <svg className={styles.radarSearchIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            }
          />
        </div>
      </section>

      {/* 2. 메인 레이아웃 */}
      <div className={styles.mainLayout}>
        {/* 왼쪽: 주소지 기반 위치 추천 */}
        <section className={styles.leftSection}>
          <div className={styles.locationSection}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleGroup}>
                <h3 className={styles.sectionTitle}>
                  <span>📍 내 주변 가까운 매칭</span>
                </h3>

                <span className={styles.sectionSub}>
                  {myRegion
                    ? `회원님의 거주지(${myRegion}) 기준 같은 동네 우선 추천 (최대 10명)`
                    : '회원정보에 주소를 등록하면 가까운 이웃을 추천해드려요'}
                </span>
              </div>

              <button
                type="button"
                className={styles.randomShuffleBtn}
                onClick={handleShuffleLocation}
                disabled={isLocationLoading}
                title="다른 추천 프로필 보기"
              >
                {isLocationLoading ? '불러오는 중...' : '🔄 새로운 이웃 추천'}
              </button>
            </div>

            {!isLocationLoading && locationProfiles.length === 0 && (
              <p className={styles.locEmpty}>
                {myRegion
                  ? '아직 근처에 추천할 회원이 없어요. 잠시 후 다시 확인해보세요!'
                  : '주소 정보가 없어 추천할 수 없어요.'}
              </p>
            )}

            <div className={styles.locationCardGrid}>
              {locationProfiles.map((item) => (
                <div key={item.memberSeq} className={styles.locCard}>
                  <div className={styles.locCardImage}>
                    <div className={styles.locAvatar}>👥</div>
                    <span className={styles.distBadge}>
                      {item.nearRank === 1 ? '같은 동네' : '같은 지역'}
                    </span>
                  </div>

                  <div className={styles.locCardInfo}>
                    <div className={styles.locMeta}>
                      <span>{item.nickname}</span>
                      <span>·</span>
                      <span>{item.age}세</span>

                      {item.mbti && (
                        <>
                          <span>·</span>
                          <span>{item.mbti}</span>
                        </>
                      )}
                    </div>

                    <span className={styles.locAddress}>{item.region}</span>

                    <p className={styles.locIntro}>
                      {item.introduction || '아직 자기소개를 작성하지 않았어요.'}
                    </p>

                    <button
                      type="button"
                      className={styles.locBtn}
                      onClick={() => handleSendFriendRequest(item.memberSeq)}
                    >
                      친구 요청
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 오른쪽: 친구/채팅방 사이드바와 이벤트 배너 */}

        <aside className={styles.rightSection}>
          <div className={styles.chatFriendSidebar}>
            <div className={styles.sidebarTabButtons}>
              <button
                type="button"
                className={`${styles.sidebarTabButton} ${sidebarTab === 'friends' ? styles.sidebarTabActive : ''}`}
                onClick={() => setSidebarTab('friends')}
              >
                친구 목록
              </button>

              <button
                type="button"
                className={`${styles.sidebarTabButton} ${sidebarTab === 'rooms' ? styles.sidebarTabActive : ''}`}
                onClick={() => setSidebarTab('rooms')}
              >
                채팅방
              </button>
            </div>

            <div className={styles.sidebarListBox}>
              {sidebarTab === 'friends' && (
                <>
                  <h3 className={styles.sidebarListTitle}>내 친구</h3>
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                    <input
                      type="text"
                      value={friendSearchKeyword}
                      onChange={(e) => setFriendSearchKeyword(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') searchNonFriends(); }}
                      placeholder="로그인 아이디로 친구 검색"
                      style={{ minWidth: 0, flex: 1, padding: '8px', borderRadius: '8px' }}
                    />
                    <button type="button" onClick={searchNonFriends}>검색</button>
                  </div>
                  {friendSearchMessage && <p className={styles.sidebarEmpty}>{friendSearchMessage}</p>}
                  {friendSearchResults.map((member) => (
                    <div key={member.member_seq} className={styles.sidebarPerson}>
                      <span>{member.nickname || member.login_id} ({member.login_id})</span>
                      <button type="button" onClick={() => addSearchedFriend(member)}>친구 추가</button>
                    </div>
                  ))}


                  {friendList.length === 0 && (
                    <p className={styles.sidebarEmpty}>등록된 친구가 없습니다.</p>
                  )}

                  {friendList.map((friend) => (
                    <div
                      className={styles.sidebarPerson}
                      key={friend.member_seq}
                      onClick={() => setProfileTargetSeq(friend.member_seq)}
                      style={{ cursor: 'pointer' }}
                      title="프로필 보기"
                    >
                      {friendImageUrls[Number(friend.member_seq)] ? (
                        <img
                          src={friendImageUrls[Number(friend.member_seq)]}
                          alt=""
                          className={styles.sidebarAvatar}
                        />
                      ) : (
                        <div className={styles.sidebarAvatarFallback}>👤</div>
                      )}

                      <span>{friend.nickname || friend.login_id}</span>
                    </div>
                  ))}
                </>
              )}

              {sidebarTab === 'rooms' && (
                <>
                  <h3 className={styles.sidebarListTitle}>내 채팅방</h3>

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
                      <strong>{room.room_name || room.partner_nick || '채팅방'}</strong>
                      <span>{room.last_message || '대화를 시작해보세요.'}</span>
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>

          <div
            className={styles.eventBannerCard}
            onClick={() => navi('/event')}
          >
            <span className={styles.eventBannerBadge}>DAILY ATTENDANCE</span>
            <h4 className={styles.eventBannerTitle}>📅 매일 출석체크 & 혜택 충전</h4>

            <span className={styles.eventBannerBadge}>SPECIAL EVENT</span>
            <h4 className={styles.eventBannerTitle}>🎁 얼굴 실물 인증 이벤트</h4>

            <p className={styles.eventBannerDesc}>
              매일 출석체크하고 마일리지와<br />
              <strong>무료 매칭 이용권</strong>을 받아보세요!
            </p>

            <div className={styles.eventBannerFooter}>
              <span>출석체크 하러가기</span>
              <span>→</span>
            </div>
          </div>

          <div className={styles.sideBox}>
            <h3 className={styles.sideBoxTitle}>
              <span>🔥 커뮤니티 인기글</span>
            </h3>

            <div className={styles.postList}>
              {MOCK_POPULAR_POSTS.map((post) => (
                <div key={post.id} className={styles.postItem}>
                  <div className={styles.postItemTitle}>{post.title}</div>

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

      {/* 3. 오른쪽 하단 AI 안전 도우미 챗봇 */}
      <div
        className={`${styles.chatbotFab} ${isChatOpen ? styles.chatbotFabActive : ''}`}
        onClick={() => setIsChatOpen(!isChatOpen)}
        title="AI 안전 도우미 챗봇 열기"
      >
        <span className={styles.chatbotFabIcon}>{isChatOpen ? '✕' : '🤖'}</span>

        {!isChatOpen && (
          <span className={styles.chatbotFabBadge}>AI 안전</span>
        )}

        <span className={styles.chatbotOnlineDot}></span>
      </div>

      {isChatOpen && (
        <div className={styles.chatbotWindow}>
          <div className={styles.chatbotHeader}>
            <div className={styles.chatbotHeaderLeft}>
              <div className={styles.chatbotAvatar}>🤖</div>

              <div>
                <h4 className={styles.chatbotTitle}>실루엣 AI 안전 도우미</h4>
                <span className={styles.chatbotStatus}>🟢 실시간 안전 가이드 가동 중</span>
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
                  <div className={styles.chatBotAvatarSmall}>🤖</div>
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
              placeholder="궁금한 안전 매너나 만남 팁을 입력하세요..."
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