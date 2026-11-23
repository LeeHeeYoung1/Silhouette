import Client from './client';

// 블라인드 채팅방 상태
// → { roomSeq, mySlot, phase: 'CHAT' | 'VOTE' | 'DONE', remainingSeconds, voteRemainingSeconds,
//     timeLimitMin, myVote, result: 'CONTINUED' | 'ENDED' | null, endReason, linkedChatRoomSeq }
export const getBlindRoom = (roomSeq) => Client.get(`/api/blind/room/${roomSeq}`);

// 이전 메시지 → [{ blindChatMessageSeq, senderSlot, content, sentAt }]
export const getBlindMessages = (roomSeq) => Client.get(`/api/blind/room/${roomSeq}/messages`);

// 메시지 전송 (대화 시간 안에만)
export const sendBlindMessage = (roomSeq, content) =>
  Client.post(`/api/blind/room/${roomSeq}/messages`, { content });

// GO / STOP (투표 시간 안에만)
export const voteBlind = (roomSeq, vote) => Client.post(`/api/blind/room/${roomSeq}/vote`, { vote });

// 대화 중 나가기 (= STOP)
export const leaveBlind = (roomSeq) => Client.post(`/api/blind/room/${roomSeq}/leave`);
