import Client from './client';

// 이상형 매칭 신청 → { status: 'MATCHED' | 'WAITING', partner_Seq, ideal_Matching_Seq, chat_Room_Seq, score }
// MATCHED면 채팅방이 이미 만들어져 있음 → /chatting/{chat_Room_Seq}로 이동
export const startIdealMatch = () => Client.post('/matching/ideal/start');

// 매칭 상태 확인 (대기 중일 때 주기적으로 호출) → status: 'WAITING' | 'MATCHED' | 'IDLE'(대기열에 없음)
export const getIdealMatchStatus = () => Client.get('/matching/ideal/status');

// 대기 취소
export const cancelIdealMatch = () => Client.post('/matching/ideal/cancel');

// 이상형 매칭 채팅방의 상대 프로필 (채팅창 사이드 표시용, 이상형 매칭 방이 아니면 404)
// → { nickname, age, mbti, job, introduction, hobby }
export const getIdealPartner = (chatRoomSeq) => Client.get(`/matching/ideal/room/${chatRoomSeq}/partner`);

// 내 주변 추천 (최대 10명, 같은 시·군·구 → 같은 시·도 순, 호출할 때마다 랜덤)
// → { myRegion: '서울 강남구' | null, members: [{ memberSeq, nickname, age, region, nearRank, introduction, mbti, job }] }
export const getNearbyMembers = () => Client.get('/matching/nearby');