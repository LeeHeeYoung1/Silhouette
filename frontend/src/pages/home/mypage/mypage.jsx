import { useState } from 'react';
import './mypage.module.css';

/* =========================================================
   실루엣 마이페이지 (M005 ~ M015)
   - 지금은 데이터가 비어 있는 상태(빈 화면)로만 동작
   - 나중에 서버 API 연결 시 TODO 표시된 곳에서 fetch 로 채우면 됨
   ========================================================= */

// 왼쪽 메뉴 목록 (id 는 아래 VIEWS 의 키와 같아야 함)
const MENU_MAIN = [
    { id: 'dashboard', icon: 'fa-chart-pie', label: '마이 대시보드' },
    { id: 'ideal', icon: 'fa-heart-circle-check', label: '나의 이상형 & 취향', code: 'M011' },
    { id: 'bookmarks', icon: 'fa-bookmark', label: '북마크한 인연', code: 'M008' },
    { id: 'chat', icon: 'fa-comments', label: '내 채팅방 목록', code: 'M009' },
    { id: 'calendar', icon: 'fa-calendar-check', label: '데이트 캘린더', code: 'M012' },
    { id: 'posts', icon: 'fa-pen-to-square', label: '내가 쓴 게시글', code: 'M014' },
];
const MENU_ACCOUNT = [
    { id: 'payment', icon: 'fa-credit-card', label: '결제 내역 관리', code: 'M010' },
    { id: 'blocks', icon: 'fa-shield-halved', label: '차단 및 신고 내역', code: 'M013' },
    { id: 'editProfile', icon: 'fa-user-gear', label: '개인정보 수정', code: 'M006' },
];

// 사진이 없을 때 쓰는 기본 아바타
const DEFAULT_AVATAR =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' +
            '<rect width="100" height="100" fill="#1f1c35"/>' +
            '<circle cx="50" cy="38" r="18" fill="#a855f7" opacity="0.6"/>' +
            '<path d="M18 88c4-18 18-28 32-28s28 10 32 28z" fill="#a855f7" opacity="0.6"/></svg>'
    );

const WEEK = ['일', '월', '화', '수', '목', '금', '토'];
const pad = (n) => String(n).padStart(2, '0');
const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/* ---------- 공통 작은 컴포넌트 ---------- */

function EmptyState({ icon, text }) {
    return (
        <div className="empty-state">
            <i className={icon}></i>
            {text}
        </div>
    );
}

function PageHeader({ icon, title, desc, children }) {
    return (
        <div className="page-header">
            <div>
                <h1 className="page-title">
                    <i className={`fa-solid ${icon} page-title-icon`}></i> {title}
                </h1>
                <p className="page-subdesc">{desc}</p>
            </div>
            {children}
        </div>
    );
}

function EmptyTable({ headers, emptyText }) {
    return (
        <div className="web-table-wrap">
            <table className="custom-table">
                <thead>
                    <tr>
                        {headers.map((h) => (
                            <th key={h}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    <tr className="empty-row">
                        <td colSpan={headers.length}>{emptyText}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}

function ScheduleCard({ schedule, showDate, onDelete }) {
    return (
        <div className="sched-card">
            <span className="sched-card-title">{schedule.title}</span>
            <span className="sched-card-meta">
                <i className="fa-regular fa-clock"></i>
                {showDate && `${schedule.startAt.slice(5, 10).replace('-', '/')} `}
                {schedule.startAt.slice(11, 16)}
                {schedule.memo && ` · ${schedule.memo}`}
            </span>
            {onDelete && (
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button className="btn-table-action danger" onClick={onDelete}>
                        삭제
                    </button>
                </div>
            )}
        </div>
    );
}

/* ---------- 마이페이지 본체 ---------- */

function MyPage() {
    // 화면 전환
    const [view, setView] = useState('dashboard');

    // 회원 정보 (TODO: 로그인 회원 정보 API 로 채우기)
    const [member] = useState({
        nickname: '',
        name: '',
        loginId: '',
        birth: '',
        phone: '',
        email: '',
        address: '',
        joinDate: '',
        ticket: null,
        mileage: null,
    });
    const [avatar, setAvatar] = useState(DEFAULT_AVATAR);

    // 일정 데이터 (SCHEDULE 테이블 구조): { id, title, startAt: 'YYYY-MM-DDTHH:mm', memo }
    // TODO: useEffect 에서 /api/schedules 로 불러오기
    const [schedules, setSchedules] = useState([]);

    // 캘린더 상태
    const today = new Date();
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0 = 1월
    const [selectedKey, setSelectedKey] = useState(toKey(today));

    // 일정 등록 모달
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState({ title: '', startAt: '', memo: '' });

    // 토스트
    const [toast, setToast] = useState('');
    const showToast = (msg) => {
        setToast(msg);
        clearTimeout(window.__mpToastTimer);
        window.__mpToastTimer = setTimeout(() => setToast(''), 2500);
    };

    // 회원 탈퇴
    const [withdrawCheck, setWithdrawCheck] = useState(false);
    const [withdrawPw, setWithdrawPw] = useState('');

    const switchView = (id) => {
        setView(id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    /* ----- 캘린더 계산 ----- */
    const schedulesOf = (key) =>
        schedules
            .filter((s) => s.startAt.slice(0, 10) === key)
            .sort((a, b) => a.startAt.localeCompare(b.startAt));

    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const lastDate = new Date(viewYear, viewMonth + 1, 0).getDate();
    const todayKey = toKey(today);

    const moveMonth = (diff) => {
        let y = viewYear;
        let m = viewMonth + diff;
        if (m < 0) { m = 11; y--; }
        if (m > 11) { m = 0; y++; }
        setViewYear(y);
        setViewMonth(m);
    };

    const nowKey = `${todayKey}T${pad(today.getHours())}:${pad(today.getMinutes())}`;
    const upcoming = schedules
        .filter((s) => s.startAt >= nowKey)
        .sort((a, b) => a.startAt.localeCompare(b.startAt))
        .slice(0, 2);

    const [, selM, selD] = selectedKey.split('-');
    const selectedList = schedulesOf(selectedKey);

    const openScheduleModal = () => {
        setForm({ title: '', startAt: `${selectedKey}T12:00`, memo: '' });
        setModalOpen(true);
    };

    const saveSchedule = () => {
        if (!form.title.trim() || !form.startAt) {
            alert('일정 제목과 날짜를 입력해 주세요.');
            return;
        }
        // TODO: 서버 연동 시 POST /api/schedules 성공 후 아래 실행
        setSchedules((prev) => [...prev, { id: Date.now(), ...form, title: form.title.trim() }]);
        const key = form.startAt.slice(0, 10);
        setSelectedKey(key);
        setViewYear(Number(key.slice(0, 4)));
        setViewMonth(Number(key.slice(5, 7)) - 1);
        setModalOpen(false);
        showToast('새 일정이 등록되었습니다.');
    };

    const deleteSchedule = (id) => {
        if (!window.confirm('이 일정을 삭제하시겠습니까?')) return;
        // TODO: 서버 연동 시 DELETE /api/schedules/{id}
        setSchedules((prev) => prev.filter((s) => s.id !== id));
    };

    /* ----- 기타 이벤트 ----- */
    const handleAvatar = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            setAvatar(evt.target.result);
            showToast('새 사진이 선택되었습니다. (미리보기)');
        };
        reader.readAsDataURL(file);
    };

    const handleWithdraw = () => {
        if (!withdrawCheck) { alert('유의사항 확인 및 탈퇴 동의에 체크해 주세요.'); return; }
        if (!withdrawPw) { alert('비밀번호를 입력해 주세요.'); return; }
        if (window.confirm('정말로 탈퇴하시겠습니까? 보유 자산은 즉시 소멸됩니다.')) {
            // TODO: 회원 탈퇴 API 연결
        }
    };

    const confirmLogout = () => {
        if (window.confirm('실루엣에서 로그아웃 하시겠습니까?')) {
            // TODO: 로그아웃 API 연결
        }
    };

    const dash = (v) => (v === null || v === '' || v === undefined ? '-' : v);

    const lnbItem = (m) => (
        <a key={m.id} className={`lnb-item ${view === m.id ? 'active' : ''}`} onClick={() => switchView(m.id)}>
            <div className="lnb-item-left">
                <i className={`fa-solid ${m.icon}`}></i>
                <span>{m.label}</span>
            </div>
            {m.code && <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{m.code}</span>}
        </a>
    );

    return (
        <div className="mypage">
            {/* ===== 1. 상단 GNB ===== */}
            <header className="gnb">
                <div className="gnb-inner">
                    <div className="gnb-left">
                        <a className="logo" onClick={() => switchView('dashboard')}>
                            <div className="logo-icon"><i className="fa-solid fa-moon"></i></div>
                            <span>SILHOUETTE</span>
                        </a>
                        <nav className="gnb-nav">
                            <a className="nav-link">메인 홈</a>
                            <a className="nav-link">매칭 찾기</a>
                            <a className="nav-link" onClick={() => switchView('chat')}>실시간 채팅</a>
                            <a className="nav-link" onClick={() => switchView('posts')}>자유 게시판</a>
                            <a className="nav-link">이벤트</a>
                        </nav>
                    </div>

                    <div className="gnb-right">
                        <div className="asset-chip" onClick={() => switchView('payment')}>
                            <i className="fa-solid fa-ticket" style={{ color: '#a855f7' }}></i>
                            <span>이용권</span>
                            <span className="val">{dash(member.ticket)}</span>
                        </div>
                        <div className="asset-chip" onClick={() => switchView('payment')}>
                            <i className="fa-solid fa-coins" style={{ color: '#ec4899' }}></i>
                            <span>마일리지</span>
                            <span className="val">{dash(member.mileage)}</span>
                        </div>
                        <div className="user-top-btn" onClick={() => switchView('dashboard')}>
                            <img src={avatar} alt="프로필" className="mini-avatar" />
                            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{member.nickname || '회원'} 님</span>
                        </div>
                        <button className="btn-secondary" style={{ padding: '8px 14px' }} onClick={confirmLogout}>
                            <i className="fa-solid fa-arrow-right-from-bracket"></i> 로그아웃
                        </button>
                    </div>
                </div>
            </header>

            {/* ===== 2. 본문 (사이드바 + 컨텐츠) ===== */}
            <main className="main-wrapper">
                <aside className="sidebar">
                    <div className="profile-sidecard">
                        <div className="avatar-wrap">
                            <img src={avatar} alt="아바타" className="avatar-img" />
                        </div>
                        <div className="side-nick">{member.nickname || '닉네임'}</div>
                        <div className="side-subinfo">-</div>
                        <div className="side-badges"></div>
                        <div className="side-asset-box">
                            <div className="side-asset-item" onClick={() => switchView('payment')} style={{ cursor: 'pointer' }}>
                                <span className="side-asset-label">채팅 이용권</span>
                                <span className="side-asset-val" style={{ color: '#c084fc' }}>{dash(member.ticket)}</span>
                            </div>
                            <div className="side-asset-item" onClick={() => switchView('payment')} style={{ cursor: 'pointer' }}>
                                <span className="side-asset-label">보유 마일리지</span>
                                <span className="side-asset-val" style={{ color: '#f472b6' }}>{dash(member.mileage)}</span>
                            </div>
                        </div>
                    </div>

                    <nav className="lnb-menu">
                        <div className="lnb-group-title">MY Silhouette</div>
                        {MENU_MAIN.map(lnbItem)}
                        <div className="lnb-group-title" style={{ marginTop: 10 }}>계정 및 보안 관리</div>
                        {MENU_ACCOUNT.map(lnbItem)}
                        <a className={`lnb-item ${view === 'withdraw' ? 'active' : ''}`} onClick={() => switchView('withdraw')}>
                            <div className="lnb-item-left" style={{ color: '#f87171' }}>
                                <i className="fa-solid fa-user-xmark"></i>
                                <span>회원 탈퇴</span>
                            </div>
                            <span style={{ fontSize: '0.72rem', color: '#f87171' }}>M007</span>
                        </a>
                    </nav>
                </aside>

                <section className="main-content">
                    {/* [뷰 1] 대시보드 */}
                    {view === 'dashboard' && (
                        <div className="view-section active">
                            <PageHeader icon="fa-id-card" title="마이페이지 기본 정보 (M005)" desc="회원님의 기본 등록 정보와 활동 현황을 한눈에 확인합니다.">
                                <button className="btn-secondary" onClick={() => switchView('editProfile')}>
                                    <i className="fa-solid fa-pen"></i> 개인정보 수정
                                </button>
                            </PageHeader>

                            <div className="dash-grid" style={{ marginTop: 20 }}>
                                <div className="dash-card col-span-2">
                                    <div className="card-header">
                                        <div className="card-title"><i className="fa-solid fa-circle-user"></i> 등록된 회원 상세 정보</div>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>가입 일자: {dash(member.joinDate)}</span>
                                    </div>
                                    <div className="info-table">
                                        <div className="info-cell"><div className="cell-label">회원 이름 / 성별</div><div className="cell-value">{dash(member.name)}</div></div>
                                        <div className="info-cell"><div className="cell-label">생년월일 / 나이</div><div className="cell-value">{dash(member.birth)}</div></div>
                                        <div className="info-cell"><div className="cell-label">아이디</div><div className="cell-value">{dash(member.loginId)}</div></div>
                                        <div className="info-cell"><div className="cell-label">비밀번호</div><div className="cell-value">•••••••• (보안 마스킹)</div></div>
                                        <div className="info-cell"><div className="cell-label">휴대전화 번호</div><div className="cell-value">{dash(member.phone)}</div></div>
                                        <div className="info-cell"><div className="cell-label">이메일 주소</div><div className="cell-value">{dash(member.email)}</div></div>
                                        <div className="info-cell full"><div className="cell-label">거주 주소지</div><div className="cell-value">{dash(member.address)}</div></div>
                                    </div>
                                </div>

                                <div className="dash-card">
                                    <div className="card-header">
                                        <div className="card-title"><i className="fa-solid fa-heart-pulse"></i> 이상형 체크리스트 (M011)</div>
                                        <button className="card-link" onClick={() => switchView('ideal')}>설정 변경 <i className="fa-solid fa-chevron-right"></i></button>
                                    </div>
                                    <EmptyState icon="fa-solid fa-heart-circle-plus" text="아직 등록된 이상형이 없습니다." />
                                </div>

                                <div className="dash-card">
                                    <div className="card-header">
                                        <div className="card-title"><i className="fa-solid fa-calendar-day"></i> 다가오는 일정 (M012)</div>
                                        <button className="card-link" onClick={() => switchView('calendar')}>전체 캘린더 <i className="fa-solid fa-chevron-right"></i></button>
                                    </div>
                                    <div className="schedule-side-list">
                                        {upcoming.length
                                            ? upcoming.map((s) => <ScheduleCard key={s.id} schedule={s} showDate />)
                                            : <EmptyState icon="fa-regular fa-calendar" text="다가오는 일정이 없습니다." />}
                                    </div>
                                </div>

                                <div className="dash-card col-span-2">
                                    <div className="card-header">
                                        <div className="card-title"><i className="fa-solid fa-bookmark"></i> 최근 북마크한 인연 (M008)</div>
                                        <button className="card-link" onClick={() => switchView('bookmarks')}>북마크 전체보기 <i className="fa-solid fa-chevron-right"></i></button>
                                    </div>
                                    <EmptyState icon="fa-regular fa-bookmark" text="북마크한 인연이 없습니다." />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* [뷰 2] 이상형 */}
                    {view === 'ideal' && (
                        <div className="view-section active">
                            <PageHeader icon="fa-sliders" title="나의 이상형 & 취향 체크리스트 (M011, M015)" desc="설정하신 이성 체크리스트는 알고리즘 매칭(MA002)과 오늘의 추천에 반영됩니다." />
                            <div className="dash-card" style={{ marginTop: 20 }}>
                                <div className="form-grid-web">
                                    <div className="form-group-web"><label className="web-label">희망 연령대</label><input type="text" className="web-input" placeholder="예: 26세 ~ 31세" /></div>
                                    <div className="form-group-web"><label className="web-label">희망 거주 지역</label><input type="text" className="web-input" placeholder="예: 서울, 경기" /></div>
                                    <div className="form-group-web"><label className="web-label">선호 MBTI 유형 (다중 선택)</label><input type="text" className="web-input" placeholder="예: ENFJ, INFJ" /></div>
                                    <div className="form-group-web"><label className="web-label">선호 직업군</label><input type="text" className="web-input" placeholder="예: IT/개발, 디자인" /></div>
                                    <div className="form-group-web full">
                                        <label className="web-label">데이트 스타일 및 연애 가치관 태그 (M015 온보딩 연계)</label>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 6 }}>
                                            <span className="badge-pill pink" style={{ padding: '6px 14px', fontSize: '0.85rem', cursor: 'pointer' }}>+ 취향 키워드 추가</span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ marginTop: 28, display: 'flex', justifyContent: 'flex-end' }}>
                                    <button className="btn-primary-gradient">체크리스트 저장하기</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* [뷰 3] 북마크 */}
                    {view === 'bookmarks' && (
                        <div className="view-section active">
                            <PageHeader icon="fa-bookmark" title="북마크한 프로필 (M008)" desc="관심 프로필로 저장해 둔 인연 목록입니다." />
                            <div style={{ marginTop: 20 }}>
                                <EmptyState icon="fa-regular fa-bookmark" text="북마크한 인연이 없습니다." />
                            </div>
                        </div>
                    )}

                    {/* [뷰 4] 채팅방 목록 */}
                    {view === 'chat' && (
                        <div className="view-section active">
                            <PageHeader icon="fa-comments" title="내 채팅방 목록 (M009)" desc="참여 중인 블라인드 채팅(C001), 1:1 실시간 채팅(C002) 방 목록입니다." />
                            <div className="chat-web-list" style={{ marginTop: 20 }}>
                                <EmptyState icon="fa-regular fa-comments" text="참여 중인 채팅방이 없습니다." />
                            </div>
                        </div>
                    )}

                    {/* [뷰 5] 캘린더 */}
                    {view === 'calendar' && (
                        <div className="view-section active">
                            <PageHeader icon="fa-calendar-days" title="내 일정 캘린더 (M012)" desc="약속된 데이트 일정 및 중요한 이벤트를 등록하고 관리합니다.">
                                <button className="btn-primary-gradient" onClick={openScheduleModal}>
                                    <i className="fa-solid fa-plus"></i> 새 일정 등록
                                </button>
                            </PageHeader>

                            <div className="dash-card" style={{ marginTop: 20 }}>
                                <div className="cal-container">
                                    <div className="cal-box">
                                        <div className="cal-header-bar">
                                            <button className="btn-secondary" style={{ padding: '4px 10px' }} onClick={() => moveMonth(-1)}><i className="fa-solid fa-chevron-left"></i></button>
                                            <span className="cal-title-txt">{viewYear}년 {viewMonth + 1}월</span>
                                            <button className="btn-secondary" style={{ padding: '4px 10px' }} onClick={() => moveMonth(1)}><i className="fa-solid fa-chevron-right"></i></button>
                                        </div>
                                        <div className="cal-grid-web">
                                            {WEEK.map((w) => <div key={w} className="cal-th">{w}</div>)}
                                            {Array.from({ length: firstDay }, (_, i) => <div key={`e${i}`} className="cal-td empty"></div>)}
                                            {Array.from({ length: lastDate }, (_, i) => {
                                                const d = i + 1;
                                                const key = `${viewYear}-${pad(viewMonth + 1)}-${pad(d)}`;
                                                const dow = (firstDay + i) % 7;
                                                const cls = ['cal-td'];
                                                if (dow === 0) cls.push('sun');
                                                if (dow === 6) cls.push('sat');
                                                if (key === todayKey) cls.push('today');
                                                if (key === selectedKey) cls.push('active');
                                                if (schedulesOf(key).length) cls.push('has-dot');
                                                return (
                                                    <div key={key} className={cls.join(' ')} onClick={() => setSelectedKey(key)}>{d}</div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 style={{ fontSize: '1rem', marginBottom: 14, fontWeight: 700 }}>
                                            {Number(selM)}월 {Number(selD)}일{selectedKey === todayKey ? ' (오늘)' : ''} 등록 일정
                                        </h3>
                                        <div className="schedule-side-list">
                                            {selectedList.length
                                                ? selectedList.map((s) => <ScheduleCard key={s.id} schedule={s} onDelete={() => deleteSchedule(s.id)} />)
                                                : <EmptyState icon="fa-regular fa-calendar" text="등록된 일정이 없습니다." />}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* [뷰 6] 내가 쓴 글 */}
                    {view === 'posts' && (
                        <div className="view-section active">
                            <PageHeader icon="fa-file-pen" title="내가 쓴 글 (M014)" desc="자유 게시판(B001)에 본인이 작성한 게시글을 모아서 조회하고 관리합니다." />
                            <div className="dash-card" style={{ marginTop: 20 }}>
                                <EmptyTable headers={['카테고리', '제목', '작성일시', '조회수', '추천수', '관리']} emptyText="작성한 게시글이 없습니다." />
                            </div>
                        </div>
                    )}

                    {/* [뷰 7] 결제 내역 */}
                    {view === 'payment' && (
                        <div className="view-section active">
                            <PageHeader icon="fa-receipt" title="결제 내역 (M010)" desc="채팅 이용권(P001) 구매 내역 및 마일리지(P002) 사용 내역을 조회합니다." />
                            <div className="dash-card" style={{ marginTop: 20 }}>
                                <EmptyTable headers={['결제 일시', '상품명', '결제 수단', '마일리지 사용', '최종 결제 금액', '영수증']} emptyText="결제 내역이 없습니다." />
                            </div>
                        </div>
                    )}

                    {/* [뷰 8] 차단·신고 */}
                    {view === 'blocks' && (
                        <div className="view-section active">
                            <PageHeader icon="fa-shield-halved" title="차단 및 신고 내역 (M013)" desc="차단한 회원은 상호 간 매칭, 채팅 및 프로필 노출이 차단됩니다." />
                            <div className="dash-card" style={{ marginTop: 20 }}>
                                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 14 }}>🚫 차단한 회원 목록</h3>
                                <div style={{ marginBottom: 30 }}>
                                    <EmptyTable headers={['차단 대상 닉네임', '차단 일자', '상태', '차단 관리']} emptyText="차단한 회원이 없습니다." />
                                </div>
                                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 14 }}>🚨 접수된 신고 내역</h3>
                                <EmptyTable headers={['신고 일시', '신고 대상', '신고 사유', '처리 상태']} emptyText="신고 내역이 없습니다." />
                            </div>
                        </div>
                    )}

                    {/* [뷰 9] 개인정보 수정 */}
                    {view === 'editProfile' && (
                        <div className="view-section active">
                            <PageHeader icon="fa-user-pen" title="개인정보 수정 (M006)" desc="닉네임, 비밀번호, 연락처, 프로필 사진 등을 수정합니다." />
                            <div className="dash-card" style={{ marginTop: 20 }}>
                                <div className="form-grid-web">
                                    <div className="form-group-web full">
                                        <label className="web-label">새 프로필 사진 업로드 (관리자 심사 A001 대상)</label>
                                        <div className="input-row">
                                            <label className="btn-secondary" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <i className="fa-solid fa-camera"></i> 이미지 파일 선택
                                                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatar} />
                                            </label>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center' }}>
                                                * JPG, PNG 파일 지원 (등록 시 관리자 승인 후 반영)
                                            </span>
                                        </div>
                                    </div>
                                    <div className="form-group-web">
                                        <label className="web-label">닉네임 변경</label>
                                        <div className="input-row"><input type="text" className="web-input" placeholder="새 닉네임" /><button className="btn-secondary">중복확인</button></div>
                                    </div>
                                    <div className="form-group-web">
                                        <label className="web-label">휴대전화 번호 변경</label>
                                        <div className="input-row"><input type="text" className="web-input" placeholder="010-0000-0000" /><button className="btn-secondary">재인증</button></div>
                                    </div>
                                    <div className="form-group-web"><label className="web-label">현재 비밀번호 확인</label><input type="password" className="web-input" placeholder="정보 수정을 위해 기존 비밀번호 입력" /></div>
                                    <div className="form-group-web"><label className="web-label">변경할 새 비밀번호</label><input type="password" className="web-input" placeholder="영문, 숫자, 특수문자 조합 8자리 이상" /></div>
                                    <div className="form-group-web"><label className="web-label">MBTI</label><input type="text" className="web-input" placeholder="예: INFP" /></div>
                                    <div className="form-group-web"><label className="web-label">직업</label><input type="text" className="web-input" placeholder="예: 디자이너" /></div>
                                    <div className="form-group-web full"><label className="web-label">주소지 (시/군/구)</label><input type="text" className="web-input" placeholder="예: 서울특별시 마포구" /></div>
                                </div>
                                <div style={{ marginTop: 28, display: 'flex', justifyContent: 'flex-end' }}>
                                    <button className="btn-primary-gradient">수정 내용 저장하기</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* [뷰 10] 회원 탈퇴 */}
                    {view === 'withdraw' && (
                        <div className="view-section active">
                            <div className="page-header">
                                <div>
                                    <h1 className="page-title" style={{ color: '#f87171' }}>
                                        <i className="fa-solid fa-triangle-exclamation"></i> 회원 탈퇴 안내 (M007)
                                    </h1>
                                    <p className="page-subdesc">회원 탈퇴 전 유의사항을 반드시 확인해 주시기 바랍니다.</p>
                                </div>
                            </div>
                            <div className="withdraw-alert-card">
                                <div className="withdraw-title">
                                    <i className="fa-solid fa-circle-exclamation"></i> 탈퇴 시 잔여 자산 및 데이터 소멸 안내
                                </div>
                                <p className="withdraw-p">
                                    1. 회원 탈퇴 시 현재 보유 중인 <strong>채팅 이용권</strong> 및 <strong>마일리지</strong>는 즉시 소멸되며 환불 및 복구가 불가합니다.<br />
                                    2. 기존에 참여했던 1:1 채팅방 및 매칭 기록은 모두 파기 처리됩니다.<br />
                                    3. 작성하신 자유게시판 게시글은 회원 탈퇴 후에도 삭제되지 않으므로, 삭제를 원하시는 경우 탈퇴 전에 직접 삭제해 주시기 바랍니다.
                                </p>
                                <div className="form-group-web" style={{ marginBottom: 20 }}>
                                    <label className="web-label" style={{ cursor: 'pointer' }}>
                                        <span>
                                            <input type="checkbox" checked={withdrawCheck} onChange={(e) => setWithdrawCheck(e.target.checked)} style={{ marginRight: 8 }} />
                                            위 유의사항을 모두 확인하였으며 실루엣 회원 탈퇴에 동의합니다.
                                        </span>
                                    </label>
                                </div>
                                <div className="form-group-web" style={{ maxWidth: 400, marginBottom: 20 }}>
                                    <label className="web-label">본인 확인 비밀번호</label>
                                    <input type="password" className="web-input" value={withdrawPw} onChange={(e) => setWithdrawPw(e.target.value)} placeholder="비밀번호를 입력하세요" />
                                </div>
                                <button className="btn-secondary" style={{ borderColor: 'rgba(239, 68, 68, 0.5)', color: '#f87171', padding: '12px 24px' }} onClick={handleWithdraw}>
                                    실루엣 회원 탈퇴 확정
                                </button>
                            </div>
                        </div>
                    )}
                </section>
            </main>

            {/* ===== 일정 등록 모달 ===== */}
            <div className={`modal-overlay ${modalOpen ? 'open' : ''}`} onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}>
                <div className="modal-window">
                    <div className="modal-header">
                        <h3 className="modal-title">새 데이트 일정 등록 (M012)</h3>
                        <button className="modal-close-btn" onClick={() => setModalOpen(false)}>&times;</button>
                    </div>
                    <div className="form-group-web" style={{ gap: 14 }}>
                        <div>
                            <label className="web-label" style={{ marginBottom: 6 }}>일정 제목</label>
                            <input type="text" className="web-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="예: 분위기 좋은 와인바 데이트" />
                        </div>
                        <div>
                            <label className="web-label" style={{ marginBottom: 6 }}>날짜 및 시간</label>
                            <input type="datetime-local" className="web-input" value={form.startAt} onChange={(e) => setForm({ ...form, startAt: e.target.value })} />
                        </div>
                        <div>
                            <label className="web-label" style={{ marginBottom: 6 }}>장소 및 메모</label>
                            <input type="text" className="web-input" value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} placeholder="예: 홍대입구 3번 출구 만남" />
                        </div>
                        <button className="btn-primary-gradient" style={{ marginTop: 10 }} onClick={saveSchedule}>일정 저장</button>
                    </div>
                </div>
            </div>

            {/* ===== 토스트 ===== */}
            {toast && <div className="mp-toast">{toast}</div>}
        </div>
    );
}

export default MyPage;
