import Client from './client';

// 이상형 매칭 신청 → { status: 'MATCHED' | 'WAITING', partner_Seq, ideal_Matching_Seq, chat_Room_Seq, score }
export const startIdealMatch = () => Client.post('/matching/ideal/start');

// 매칭 상태 확인 (대기 중일 때 주기적으로 호출)
export const getIdealMatchStatus = () => Client.get('/matching/ideal/status');

// 대기 취소
export const cancelIdealMatch = () => Client.post('/matching/ideal/cancel');

// 매칭 종료 (채팅방 나가기)
export const endIdealMatch = (chatRoomSeq) => Client.post(`/matching/ideal/end/${chatRoomSeq}`);

// 내 주변 추천 (최대 10명, 같은 시·군·구 → 같은 시·도 순, 호출할 때마다 랜덤)
// → { myRegion: '서울 강남구' | null, members: [{ memberSeq, nickname, age, region, nearRank, introduction, mbti, job }] }
export const getNearbyMembers = () => Client.get('/matching/nearby');