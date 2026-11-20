// 라이브 공통 상수·유틸

export const CATEGORIES = [
  { value: 'TALK', label: '토크' },
  { value: 'MUKBANG', label: '먹방' },
  { value: 'MUSIC', label: '음악' },
  { value: 'TRAVEL', label: '여행' },
  { value: 'STUDY', label: '공부' },
  { value: 'ETC', label: '기타' },
];

export const categoryLabel = (value) =>
  CATEGORIES.find((c) => c.value === value)?.label ?? '기타';

export const REPORT_REASONS = [
  { value: 'ADULT', label: '음란·선정적' },
  { value: 'ABUSE', label: '욕설·비방' },
  { value: 'SPAM', label: '스팸·홍보' },
  { value: 'ETC', label: '기타 (직접 입력)' },
];

export const TITLE_MAX = 30;
export const DESCRIPTION_MAX = 300;
export const HASHTAG_MAX_COUNT = 5;
export const HASHTAG_MAX_LENGTH = 10;
export const THUMBNAIL_MAX_SIZE = 5 * 1024 * 1024;
export const THUMBNAIL_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// 서버 에러 → 화면 메시지 (서버가 문자열 메시지를 보내면 그대로 사용)
export const errorMessage = (e, fallback) => {
  if (e?.response?.status === 401) return '로그인이 만료됐어요. 다시 로그인해주세요.';
  const data = e?.response?.data;
  return typeof data === 'string' && data ? data : fallback;
};

// "#여행, 맛집 #서울" → ['여행', '맛집', '서울']
export const parseHashtags = (text) => [
  ...new Set(
    text
      .split(/[\s,#]+/)
      .map((t) => t.trim())
      .filter(Boolean)
  ),
];
