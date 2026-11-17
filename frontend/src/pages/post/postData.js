/* =========================================================
   실루엣 게시판(Post) 데이터 저장소 및 Mock Service
   - B001 자유 게시판 (자유, 연애고민, 데이트후기, 익명)
   - B002 공지 게시판 (공지사항, FAQ, Q&A)
   ========================================================= */

const STORAGE_KEY_POSTS = 'silhouette_posts';
const STORAGE_KEY_QNA = 'silhouette_qna';

const DEFAULT_POSTS = [
    {
        postSeq: 104,
        boardType: 'notice', // 'notice' | 'free'
        category: '공지',
        title: '[필독] 실루엣 커뮤니티 이용 규칙 및 클린 캠페인 안내',
        author: '운영자',
        memberSeq: 999,
        createdAt: '2026-11-16 09:00',
        viewCount: 1240,
        recommendCount: 156,
        commentCount: 8,
        content: `안녕하세요. 실루엣(Silhouette) 커뮤니티 운영팀입니다.\n\n모든 회원분들이 안전하고 쾌적하게 소통할 수 있도록 다음 규칙을 준수해 주시기 바랍니다.\n1. 타인에 대한 비방, 욕설, 차별적 언행 금지\n2. 상업적 광고 및 음란성 게시물 등록 금지\n3. 개인 연락처(전화번호, SNS 계정 등) 직접 노출 주의\n\n위반 시 관리자 심사(A001)에 의해 사전 경고 없이 게시물이 블라인드 처리되며, 서비스 이용이 제한될 수 있습니다.\n따뜻하고 존중하는 커뮤니티 문화를 함께 만들어가요!`,
        files: ['community_guide_v1.pdf'],
        comments: [
            {
                id: 1,
                author: '달빛소녀',
                createdAt: '2026-11-16 09:30',
                content: '공지 확인했습니다. 클린한 소통에 동참할게요!',
                replies: []
            }
        ]
    },
    {
        postSeq: 103,
        boardType: 'free',
        category: '연애고민',
        title: '첫 데이트 후 연락 텀이 길어지는 건 호감 신호가 아닐까요?',
        author: '설레는마음',
        memberSeq: 102,
        createdAt: '2026-11-16 11:20',
        viewCount: 312,
        recommendCount: 24,
        commentCount: 4,
        content: `지난 주말에 블라인드 매칭(MA001)으로 만나서 커피도 마시고 분위기는 정말 화기애애했거든요...\n근데 만난 이후로 카톡 답장이 2~3시간씩 걸리네요 ㅠㅠ\n바빠서 그런 걸까요, 아니면 마음이 식은 걸까요? 솔직한 조언 부탁드립니다.`,
        files: [],
        comments: [
            {
                id: 1,
                author: '연애박사99',
                createdAt: '2026-11-16 11:45',
                content: '상대방 직업 특성을 먼저 고려해보세요! 평일 낮엔 바쁠 수 있습니다.',
                replies: [
                    { id: 11, author: '설레는마음', createdAt: '2026-11-16 12:00', content: '아 그렇겠네요! 조금 여유를 가져볼게요 감사합니다.' }
                ]
            },
            {
                id: 2,
                author: '성수동러버',
                createdAt: '2026-11-16 12:10',
                content: '선톡으로 가볍게 주말 안부 물어보면서 반응을 체크해보시는 걸 추천드려요!',
                replies: []
            }
        ]
    },
    {
        postSeq: 102,
        boardType: 'free',
        category: '데이트후기',
        title: '성수동 와인바 데이트 성공 후기 남깁니다 🍷',
        author: '별빛밤하늘',
        memberSeq: 103,
        createdAt: '2026-11-15 22:15',
        viewCount: 520,
        recommendCount: 67,
        commentCount: 3,
        content: `실루엣 캘린더(M012)에 약속 잡아두고 다녀왔는데 분위기가 대박이었어요.\n조용한 재즈 음악 나오고 조명도 은은해서 대화 나누기에 완벽했습니다.\n이상형 체크리스트(M011) 호환도가 94% 나왔던 분이었는데 진짜 대화가 끊이질 않더라구요! 강력 추천합니다.`,
        files: ['winebar_review.jpg'],
        comments: [
            { id: 1, author: '치즈케익', createdAt: '2026-11-15 22:30', content: '혹시 와인바 이름 알 수 있을까요? ㅠㅠ', replies: [] }
        ]
    },
    {
        postSeq: 101,
        boardType: 'free',
        category: '익명',
        title: '솔직히 블라인드 음성 통화 기능 생겼으면 좋겠음',
        author: '익명',
        memberSeq: 104,
        createdAt: '2026-11-15 18:40',
        viewCount: 418,
        recommendCount: 52,
        commentCount: 5,
        content: `텍스트 채팅도 좋은데 3분 정도 가벼운 익명 음성 통화 기능이 있으면 목소리나 말투도 파악되고 훨씬 설렐 것 같지 않나요? 관리자님 검토 부탁드립니다 ㅎㅎ`,
        files: [],
        comments: [
            { id: 1, author: '익명', createdAt: '2026-11-15 19:00', content: '오 이거 진짜 좋은 아이디어네요 추천 누르고 갑니다.', replies: [] }
        ]
    },
    {
        postSeq: 100,
        boardType: 'free',
        category: '자유',
        title: '오늘 가입한 신규 회원입니다! 반가워요~',
        author: '뉴비러너',
        memberSeq: 105,
        createdAt: '2026-11-15 14:10',
        viewCount: 180,
        recommendCount: 15,
        commentCount: 2,
        content: `온보딩(M015) 취향 테스트 마치고 들어왔는데 UI가 너무 예쁘네요!\n좋은 인연 만났으면 좋겠습니다 잘 부탁드려요 :)`,
        files: [],
        comments: [
            { id: 1, author: '실루엣지킴이', createdAt: '2026-11-15 14:30', content: '환영합니다! 좋은 만남 있으시길 응원해요 ✨', replies: [] }
        ]
    }
];

export const FAQ_LIST = [
    {
        id: 1,
        question: '블라인드 채팅(C001)은 어떻게 진행되나요?',
        answer: '블라인드 랜덤 매칭(MA001) 성사 시 서로의 프로필 사진이 가려진 상태로 시간제한 대화가 시작됩니다. 제한 시간 종료 후 양쪽 모두 [Go]를 선택하면 프로필이 공개되며 실시간 채팅(C002)으로 전환됩니다.'
    },
    {
        id: 2,
        question: '이상형 체크리스트(M011)는 어디에 반영되나요?',
        answer: '마이페이지에서 설정하신 나이대, 지역, MBTI, 연애 스타일 등의 조건은 메인 화면의 [오늘의 추천 프로필] 및 위치 기반 알고리즘 매칭(MA002) 호환도 계산에 자동으로 반영됩니다.'
    },
    {
        id: 3,
        question: '채팅 이용권(P001)과 마일리지(P002)는 어떻게 충전 및 사용하나요?',
        answer: '마이페이지의 [결제 내역 관리] 또는 결제 화면에서 이용권을 구매하실 수 있으며, 출석체크(E003) 및 이벤트로 획득한 마일리지는 결제 시 현금처럼 차감하여 사용하실 수 있습니다.'
    },
    {
        id: 4,
        question: '비매너 회원을 차단하거나 신고(M013)하면 어떻게 처리되나요?',
        answer: '차단 시 상대방과의 모든 채팅, 매칭, 프로필 열람이 즉시 상호 차단됩니다. 신고 접수 건은 관리자 심사(A001)를 거쳐 경고 및 서비스 영구 이용 제한 조치가 이루어집니다.'
    }
];

const DEFAULT_QNA = [
    {
        postSeq: 1,
        category: '결제/이용권',
        title: '채팅 이용권 결제 후 미지급 문의드립니다.',
        author: '권형석',
        memberSeq: 1,
        createdAt: '2026-11-16 10:15',
        isSecret: true,
        status: '답변완료',
        content: '어제 오후 2시경 카카오페이로 10회 패키지를 결제했는데 아직 잔여량이 갱신되지 않았습니다. 확인 부탁드립니다.',
        answer: '안녕하세요 고객님, 실루엣 고객센터입니다. PG사 승인 대기 지연으로 확인되어 즉시 10회권 정상 수동 지급 처리 도와드렸습니다. 이용에 불편을 드려 죄송합니다.'
    },
    {
        postSeq: 2,
        category: '계정/인증',
        title: '휴대전화 번호 변경 시 본인인증 재진행 관련 문의',
        author: '달빛소녀',
        memberSeq: 2,
        createdAt: '2026-11-15 16:40',
        isSecret: false,
        status: '답변완료',
        content: '마이페이지 개인정보 수정에서 번호를 바꿀 때 인증번호가 안 올 때는 어떻게 해야 하나요?',
        answer: '통신사 스팸 차단 서비스가 활성화되어 있는 경우 인증 SMS가 수신되지 않을 수 있습니다. 1588 번호 차단 해제 후 재시도 부탁드립니다.'
    },
    {
        postSeq: 3,
        category: '매칭/시스템',
        title: '알고리즘 매칭 거리 기준 범위가 궁금합니다.',
        author: '초보매칭러',
        memberSeq: 3,
        createdAt: '2026-11-16 13:00',
        isSecret: false,
        status: '답변대기',
        content: '주소지 기반으로 매칭될 때 반경 몇 km까지 회원들이 검색되는지 알 수 있나요?',
        answer: null
    }
];

// 로컬스토리지 헬퍼
export function getStoredPosts() {
    try {
        const item = localStorage.getItem(STORAGE_KEY_POSTS);
        if (!item) {
            localStorage.setItem(STORAGE_KEY_POSTS, JSON.stringify(DEFAULT_POSTS));
            return DEFAULT_POSTS;
        }
        return JSON.parse(item);
    } catch {
        return DEFAULT_POSTS;
    }
}

export function saveStoredPosts(posts) {
    try {
        localStorage.setItem(STORAGE_KEY_POSTS, JSON.stringify(posts));
    } catch (e) {
        console.error(e);
    }
}

export function getStoredQna() {
    try {
        const item = localStorage.getItem(STORAGE_KEY_QNA);
        if (!item) {
            localStorage.setItem(STORAGE_KEY_QNA, JSON.stringify(DEFAULT_QNA));
            return DEFAULT_QNA;
        }
        return JSON.parse(item);
    } catch {
        return DEFAULT_QNA;
    }
}

export function saveStoredQna(qna) {
    try {
        localStorage.setItem(STORAGE_KEY_QNA, JSON.stringify(qna));
    } catch (e) {
        console.error(e);
    }
}
