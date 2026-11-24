import Client from './client';

// 방송 중 목록 { keyword, category, page }
export const getLiveList = (params) => Client.get('/api/live', { params });

// 방송 상세
export const getLiveDetail = (liveRoomSeq) => Client.get(`/api/live/${liveRoomSeq}`);

// 방송 시작 { title, description, category, hashtags, thumbnailUrl } → { liveRoomSeq, token, url }
export const startLive = (body) => Client.post('/api/live', body);

// 시청 입장 → { token, url, room }
export const joinLive = (liveRoomSeq) => Client.post(`/api/live/${liveRoomSeq}/join`);

// 방송 종료 (방송자)
export const endLive = (liveRoomSeq) => Client.post(`/api/live/${liveRoomSeq}/end`);

// 방송 정보 수정 (방송자) { title, description, category, hashtags, thumbnailUrl }
export const updateLive = (liveRoomSeq, body) => Client.put(`/api/live/${liveRoomSeq}`, body);

// 현재 시청자 목록 (방송자)
export const getViewers = (liveRoomSeq) => Client.get(`/api/live/${liveRoomSeq}/viewers`);

// 강퇴 (이번 방송만)
export const kickViewer = (liveRoomSeq, memberSeq) =>
  Client.post(`/api/live/${liveRoomSeq}/kick/${memberSeq}`);

// 차단 (내 모든 방송) / 해제 / 목록
export const banMember = (memberSeq) => Client.post(`/api/live/ban/${memberSeq}`);
export const unbanMember = (memberSeq) => Client.delete(`/api/live/ban/${memberSeq}`);
export const getBans = () => Client.get('/api/live/ban');

// 신고 { liveChatSeq(채팅 신고일 때만), reason: ADULT|ABUSE|SPAM|ETC, detail }
export const reportLive = (liveRoomSeq, body) => Client.post(`/api/live/${liveRoomSeq}/report`, body);

// 썸네일 업로드 (jpg/png/webp, 5MB 이하) → { thumbnailUrl }
export const uploadThumbnail = (file) => {
  const form = new FormData();
  form.append('file', file);
  return Client.post('/api/upload/thumbnail', form);
};

// ----- 관리자 -----

// 방송 강제 종료
export const adminEndLive = (liveRoomSeq, endReason) =>
  Client.post(`/api/admin/live/${liveRoomSeq}/end`, { endReason: endReason });

// 신고 목록 { status: WAIT|DONE, page }
export const getLiveReports = (params) => Client.get('/api/admin/live/report', { params });

// 신고 처리 완료
export const doneLiveReport = (liveReportSeq) =>
  Client.post(`/api/admin/live/report/${liveReportSeq}/done`);

// 프로필 모달용
export const getProfile = (memberSeq) => Client.get(`/api/live/member/${memberSeq}`);
