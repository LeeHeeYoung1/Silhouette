import Client from './client';

// 방송 중인 목록
export const getLiveList = () => Client.get('/live/list');

// 방송 시작 → { live_Seq, token, url }
export const startLive = (title) => Client.post('/live/start', { title });

// 시청 입장 → { token, url }
export const watchLive = (liveSeq) => Client.get(`/live/${liveSeq}/token`);

// 방송 종료
export const endLive = () => Client.post('/live/end');