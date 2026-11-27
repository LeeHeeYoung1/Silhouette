import { useCallback, useEffect, useMemo, useState } from 'react';
import { Client as StompClient } from '@stomp/stompjs';
import useAuthStore from '../../stores/useAuthStore';
import Client from '../../api/client';
import { wsUrl } from '../../api/ws';
import { FriendChatContext } from './friendChatContext';

/* =========================================================
   친구 · 채팅 공유 상태 (레이아웃에서 한 번만 불러 모든 페이지가 같이 씀)
   - 홈 사이드바, 모든 페이지의 친구 · 채팅 팝업(FloatingDock), 홈 내 주변 매칭이 함께 사용
   - 친구 목록 · 내 채팅방 · 받은 초대 · 내 회원 번호 · 친구 프로필 이미지
   - 친구 요청 수락 시 STOMP(/sub/friends/{memberSeq})로 친구 목록 실시간 갱신
   ========================================================= */
export default function FriendChatProvider({ children }) {
  const token = useAuthStore((state) => state.token);

  const [friendList, setFriendList] = useState([]);
  const [myRoomList, setMyRoomList] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [memberSeq, setMemberSeq] = useState(null);
  const [friendImageUrls, setFriendImageUrls] = useState({});

  // 친구 목록과 내가 참여 중인 채팅방 목록, 받은 초대
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
        setFriendList(Array.isArray(friendsResult.value.data) ? friendsResult.value.data : []);
      } else {
        console.error('친구 목록을 불러오지 못했습니다.', friendsResult.reason);
        setFriendList([]);
      }

      if (roomsResult.status === 'fulfilled') {
        setMyRoomList(Array.isArray(roomsResult.value.data) ? roomsResult.value.data : []);
      } else {
        console.error('채팅방 목록을 불러오지 못했습니다.', roomsResult.reason);
        setMyRoomList([]);
      }

      if (invitationsResult.status === 'fulfilled') {
        setInvitations(Array.isArray(invitationsResult.value.data) ? invitationsResult.value.data : []);
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

    const client = new StompClient({
      brokerURL: wsUrl('/chat'),
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      reconnectDelay: 5000,

      onConnect: () => {
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
          const mSeq = Number(friend.member_seq ?? friend.memberSeq);
          const imagePath = friend.profile_image || friend.profileImage;

          if (!imagePath) {
            return [mSeq, null];
          }

          if (/^https?:\/\//i.test(imagePath)) {
            return [mSeq, imagePath];
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

            return [mSeq, imageUrl];
          } catch (error) {
            console.error(
              `${friend.nickname || friend.login_id} 프로필 이미지 로드 실패:`,
              error.response?.status,
              error
            );

            return [mSeq, null];
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

  // 채팅방 안 읽은 메시지 합계
  const totalUnread = myRoomList.reduce((acc, room) => acc + (Number(room.unread_count) || 0), 0);

  const value = useMemo(
    () => ({
      friendList,
      myRoomList,
      invitations,
      friendImageUrls,
      memberSeq,
      totalUnread,
      refreshRooms,
      fetchInvitations
    }),
    [friendList, myRoomList, invitations, friendImageUrls, memberSeq, totalUnread, refreshRooms, fetchInvitations]
  );

  return <FriendChatContext.Provider value={value}>{children}</FriendChatContext.Provider>;
}
