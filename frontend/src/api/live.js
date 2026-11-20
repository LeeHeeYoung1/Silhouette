import Client from './client';

// 방송 중 목록 { keyword, category, page }
export const getLiveList = (params) => Client.get('/api/live', { params });

// 방송 상세
export const getLiveDetail = (liveRoomSeq) => Client.get(`/api/live/${liveRoomSeq}`);

// 방송 시작 { title, description, category, hashtags, thumbnail_url } → { live_room_seq, token, url }
export const startLive = (body) => Client.post('/api/live', body);

// 시청 입장 → { token, url, room }
export const joinLive = (liveRoomSeq) => Client.post(`/api/live/${liveRoomSeq}/join`);

// 방송 종료 (방송자)
export const endLive = (liveRoomSeq) => Client.post(`/api/live/${liveRoomSeq}/end`);
