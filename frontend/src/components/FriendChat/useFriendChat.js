import { useContext } from 'react';
import { FriendChatContext } from './friendChatContext';

/* 친구 목록 · 채팅방 · 초대 · 친구 프로필 이미지 공유 상태
   { friendList, myRoomList, invitations, friendImageUrls, memberSeq, totalUnread, refreshRooms, fetchInvitations } */
export default function useFriendChat() {
  const value = useContext(FriendChatContext);
  if (!value) {
    throw new Error('useFriendChat은 FriendChatProvider 안에서만 쓸 수 있어요.');
  }
  return value;
}
