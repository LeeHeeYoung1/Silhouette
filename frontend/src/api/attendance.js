import Client from './client';

// 내 회원 번호 조회 (채팅에서 쓰는 API 재사용)
export const getMyMemberSeq = () => Client.get('/api/chat/member-seq');

// 이번 주 출석 현황
// → { weekDays: [{ dayOfWeek, dateLabel, fullDate, attended, today, bonusBadge }],
//     currentStreak, todayAttended, todayRewardTitle, todayRewardSub, currentMileage, currentTicket }
export const getWeeklyAttendance = (memberSeq) =>
  Client.get('/api/attendance/weekly', { params: { memberSeq } });

// 오늘 출석체크 → 응답 형식은 getWeeklyAttendance와 같음
// 이미 출석했으면 400 { message: '오늘은 이미 출석체크를 완료했습니다.' }
export const checkInAttendance = (memberSeq) =>
  Client.post('/api/attendance/check', { memberSeq });
