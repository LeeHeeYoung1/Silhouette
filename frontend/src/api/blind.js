import Client from './client';

// 블라인드 채팅방 상태
// → { roomSeq, mySlot, phase: 'CHAT' | 'VOTE' | 'DONE', remainingSeconds, voteRemainingSeconds,
//     timeLimitMin, myVote, result: 'CONTINUED' | 'ENDED' | null, endReason, linkedChatRoomSeq }
export const getBlindRoom = (roomSeq) => Client.get(`/api/blind/room/${roomSeq}`);

// 이전 메시지 → [{ blindChatMessageSeq, senderSlot, content, sentAt }]
export const getBlindMessages = (roomSeq) => Client.get(`/api/blind/room/${roomSeq}/messages`);

// 메시지 전송 (대화 시간 안에만)
// aiReplySuggestionSeq: AI 추천을 골라서 보낸 경우 그 추천 번호 (고쳐서 보내도 됨)
export const sendBlindMessage = (roomSeq, content, aiReplySuggestionSeq = null) =>
  Client.post(`/api/blind/room/${roomSeq}/messages`, { content, aiReplySuggestionSeq });

// GO / STOP (투표 시간 안에만)
export const voteBlind = (roomSeq, vote) => Client.post(`/api/blind/room/${roomSeq}/vote`, { vote });

// 대화 중 나가기 (= STOP)
export const leaveBlind = (roomSeq) => Client.post(`/api/blind/room/${roomSeq}/leave`);

// ===== AI 추천답변 (고스트채팅) =====

// AI 추천 사용 가능 여부 → { available } (서버에 API 키가 없으면 false)
export const getBlindAiStatus = () => Client.get('/api/blind/ai/status');

// 상대의 마지막 메시지에 대한 답장 추천 3개 → [{ aiReplySuggestionSeq, tone, text, triggerMessageSeq }]
export const getBlindSuggestions = (roomSeq) => Client.post(`/api/blind/room/${roomSeq}/suggestions`);
