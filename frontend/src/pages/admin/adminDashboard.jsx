import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import useAuthStore from '../../stores/useAuthStore';
import Client from '../../api/client';
import styles from './adminDashboard.module.css';

/* =========================================================
   관리자 메인 통계 대시보드 (A005)
   - 경로: /admin
   - 이용자 = 그 주에 출석체크한 회원 (관리자 제외)
   - 주 단위(월~일) 집계, 이전 주 / 다음 주로 이동
   ========================================================= */

const TREND_WEEKS = 8;

const GENDER_LABEL = { MALE: '남성', FEMALE: '여성' };
const GENDER_COLOR = { MALE: '#7bb5f4', FEMALE: '#f47b9d' };
const MATCHING_COLOR = { blind: '#9b87f5', ideal: '#f47b9d' };
const BAR_COLOR = '#9b87f5';

// 'yyyy-MM-dd' 문자열 → 날짜 계산 → 'yyyy-MM-dd'
const addDays = (ymd, days) => {
    const [y, m, d] = ymd.split('-').map(Number);
    const date = new Date(y, m - 1, d + days);
    const p = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
};

const shortDate = (ymd) => (ymd ? ymd.slice(5).replace('-', '.') : '');

// 전주 대비 증감 문구
const diffText = (cur, prev) => {
    if (prev === undefined || prev === null) return '';
    const diff = cur - prev;
    if (prev === 0) return diff === 0 ? '전주와 같음' : `전주 대비 +${diff}`;
    const rate = Math.round((diff / prev) * 1000) / 10;
    if (diff === 0) return '전주와 같음';
    return `전주 대비 ${diff > 0 ? '+' : ''}${diff} (${diff > 0 ? '+' : ''}${rate}%)`;
};

const diffClass = (cur, prev) => {
    if (prev === undefined || prev === null || cur === prev) return styles.diffSame;
    return cur > prev ? styles.diffUp : styles.diffDown;
};

function KpiCard({ title, value, unit, sub, subClass }) {
    return (
        <div className={styles.kpiCard}>
            <p className={styles.kpiTitle}>{title}</p>
            <p className={styles.kpiValue}>
                {value}<span className={styles.kpiUnit}>{unit}</span>
            </p>
            {sub && <p className={`${styles.kpiSub} ${subClass || ''}`}>{sub}</p>}
        </div>
    );
}

// 차트 아래에 실제 인원수와 비율을 함께 보여주는 목록
function CountList({ items, labelOf = (v) => v, colorOf }) {
    return (
        <ul className={styles.countList}>
            {items.map((item) => (
                <li key={item.label}>
                    <span className={styles.countLabel}>
                        {colorOf && <i className={styles.dot} style={{ background: colorOf(item) }} />}
                        {labelOf(item.label)}
                    </span>
                    <span>
                        <strong>{item.cnt}</strong>명 · {item.pct}%
                    </span>
                </li>
            ))}
        </ul>
    );
}

function ChartCard({ title, desc, empty, children }) {
    return (
        <section className={styles.chartCard}>
            <h3 className={styles.chartTitle}>{title}</h3>
            {desc && <p className={styles.chartDesc}>{desc}</p>}
            {empty ? <p className={styles.empty}>이번 주 데이터가 없어요.</p> : children}
        </section>
    );
}

function AdminDashboard() {
    const navigate = useNavigate();
    const { token } = useAuthStore();

    const [ready, setReady] = useState(false);       // 관리자 확인 끝났는지
    const [weekStart, setWeekStart] = useState(null); // null = 이번 주
    const [weekly, setWeekly] = useState(null);
    const [trend, setTrend] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // ===== 관리자 확인 =====
    useEffect(() => {
        if (!token) {
            alert('로그인이 필요합니다.');
            navigate('/login', { replace: true });
            return;
        }
        Client.get('/api/members/me/role')
            .then((res) => {
                if (res.data.admin) setReady(true);
                else { alert('관리자만 이용할 수 있습니다.'); navigate('/', { replace: true }); }
            })
            .catch(() => navigate('/', { replace: true }));
    }, [token, navigate]);

    // ===== 주간 통계 =====
    useEffect(() => {
        if (!ready) return;
        let alive = true;
        setLoading(true);
        setError('');
        Client.get('/api/admin/stats/weekly', { params: weekStart ? { weekStart } : {} })
            .then((res) => { if (alive) setWeekly(res.data); })
            .catch((err) => {
                if (alive) setError(err.response?.data?.message || '통계를 불러오지 못했어요.');
            })
            .finally(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
    }, [ready, weekStart]);

    // ===== 최근 8주 추이 =====
    useEffect(() => {
        if (!ready) return;
        Client.get('/api/admin/stats/trend', { params: { weeks: TREND_WEEKS } })
            .then((res) => setTrend(Array.isArray(res.data) ? res.data : []))
            .catch(() => setTrend([]));
    }, [ready]);

    if (!ready) return <div className={styles.page}><p className={styles.notice}>확인 중…</p></div>;

    const summary = weekly?.summary || {};
    const prev = weekly?.prevSummary || {};
    const matchingTotal = (summary.blindCount || 0) + (summary.idealCount || 0);
    const prevMatchingTotal = (prev.blindCount || 0) + (prev.idealCount || 0);
    const blindRate = summary.blindCount
        ? Math.round((summary.blindContinued / summary.blindCount) * 1000) / 10
        : null;

    const matchingItems = matchingTotal === 0 ? [] : [
        { key: 'blind', label: '블라인드 매칭', cnt: summary.blindCount, pct: Math.round((summary.blindCount / matchingTotal) * 1000) / 10 },
        { key: 'ideal', label: '이상형 매칭', cnt: summary.idealCount, pct: Math.round((summary.idealCount / matchingTotal) * 1000) / 10 },
    ];

    const trendData = trend.map((row) => ({ ...row, week: shortDate(row.weekStart) }));

    return (
        <div className={styles.page}>
            {/* ===== 상단: 제목 · 주 선택 · 관리자 메뉴 ===== */}
            <header className={styles.header}>
                <div>
                    <h2 className={styles.pageTitle}>관리자 대시보드</h2>
                    <p className={styles.basis}>이용자 = 그 주에 출석체크한 회원 (관리자 제외) · 월~일 기준</p>
                </div>
                <nav className={styles.adminLinks}>
                    <Link to="/admin/manage">👥 회원 · 금칙어 · 사진 심사</Link>
                    <Link to="/admin/reports">🛡️ 신고 · 블랙리스트</Link>
                    <Link to="/admin/live">📡 라이브 관리</Link>
                </nav>
            </header>

            <div className={styles.weekBar}>
                <button
                    type="button"
                    className={styles.weekBtn}
                    disabled={!weekly || loading}
                    onClick={() => setWeekStart(addDays(weekly.weekStart, -7))}
                >
                    ◀ 이전 주
                </button>
                <div className={styles.weekRange}>
                    {weekly ? `${weekly.weekStart} ~ ${weekly.weekEnd}` : '…'}
                    {weekly?.inProgress && <span className={styles.badge}>집계 중</span>}
                </div>
                <button
                    type="button"
                    className={styles.weekBtn}
                    disabled={!weekly || loading || weekly.inProgress}
                    onClick={() => setWeekStart(addDays(weekly.weekStart, 7))}
                >
                    다음 주 ▶
                </button>
                {weekly && !weekly.inProgress && (
                    <button type="button" className={styles.weekBtnGhost} onClick={() => setWeekStart(null)}>
                        이번 주
                    </button>
                )}
            </div>

            {error && <p className={styles.error}>{error}</p>}

            {weekly && (
                <>
                    {/* ===== 숫자 카드 ===== */}
                    <div className={styles.kpiGrid}>
                        <KpiCard
                            title="이용자 수"
                            value={summary.activeMembers ?? 0}
                            unit="명"
                            sub={diffText(summary.activeMembers, prev.activeMembers)}
                            subClass={diffClass(summary.activeMembers, prev.activeMembers)}
                        />
                        <KpiCard
                            title="이용 횟수 (출석)"
                            value={summary.attendCount ?? 0}
                            unit="회"
                            sub={diffText(summary.attendCount, prev.attendCount)}
                            subClass={diffClass(summary.attendCount, prev.attendCount)}
                        />
                        <KpiCard
                            title="신규 가입자"
                            value={summary.newMembers ?? 0}
                            unit="명"
                            sub={diffText(summary.newMembers, prev.newMembers)}
                            subClass={diffClass(summary.newMembers, prev.newMembers)}
                        />
                        <KpiCard
                            title="매칭 성사"
                            value={matchingTotal}
                            unit="건"
                            sub={diffText(matchingTotal, prevMatchingTotal)}
                            subClass={diffClass(matchingTotal, prevMatchingTotal)}
                        />
                        <KpiCard
                            title="블라인드 대화 성사율"
                            value={blindRate === null ? '-' : blindRate}
                            unit={blindRate === null ? '' : '%'}
                            sub={`둘 다 GO ${summary.blindContinued ?? 0} / ${summary.blindCount ?? 0}건`}
                        />
                    </div>

                    {/* ===== 비율 차트 ===== */}
                    <div className={styles.chartGrid}>
                        <ChartCard title="성비" empty={weekly.gender.length === 0}>
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie
                                        data={weekly.gender}
                                        dataKey="cnt"
                                        nameKey="label"
                                        innerRadius={55}
                                        outerRadius={85}
                                        paddingAngle={2}
                                        isAnimationActive={false}
                                    >
                                        {weekly.gender.map((item) => (
                                            <Cell key={item.label} fill={GENDER_COLOR[item.label] || BAR_COLOR} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(v, n) => [`${v}명`, GENDER_LABEL[n] || n]} />
                                </PieChart>
                            </ResponsiveContainer>
                            <CountList
                                items={weekly.gender}
                                labelOf={(v) => GENDER_LABEL[v] || v}
                                colorOf={(item) => GENDER_COLOR[item.label] || BAR_COLOR}
                            />
                        </ChartCard>

                        <ChartCard title="매칭 사용 비율" desc="이번 주 성사된 매칭 건수 기준" empty={matchingItems.length === 0}>
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie
                                        data={matchingItems}
                                        dataKey="cnt"
                                        nameKey="label"
                                        innerRadius={55}
                                        outerRadius={85}
                                        paddingAngle={2}
                                        isAnimationActive={false}
                                    >
                                        {matchingItems.map((item) => (
                                            <Cell key={item.key} fill={MATCHING_COLOR[item.key]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(v, n) => [`${v}건`, n]} />
                                </PieChart>
                            </ResponsiveContainer>
                            <ul className={styles.countList}>
                                {matchingItems.map((item) => (
                                    <li key={item.key}>
                                        <span className={styles.countLabel}>
                                            <i className={styles.dot} style={{ background: MATCHING_COLOR[item.key] }} />
                                            {item.label}
                                        </span>
                                        <span><strong>{item.cnt}</strong>건 · {item.pct}%</span>
                                    </li>
                                ))}
                            </ul>
                        </ChartCard>

                        <ChartCard title="연령대 (연 나이)" empty={weekly.age.length === 0}>
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={weekly.age} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                                    <CartesianGrid vertical={false} className={styles.grid} />
                                    <XAxis dataKey="label" tickLine={false} />
                                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                                    <Tooltip formatter={(v) => [`${v}명`, '이용자']} cursor={{ fillOpacity: 0.08 }} />
                                    <Bar dataKey="cnt" fill={BAR_COLOR} radius={[4, 4, 0, 0]} maxBarSize={40} isAnimationActive={false} />
                                </BarChart>
                            </ResponsiveContainer>
                            <CountList items={weekly.age} />
                        </ChartCard>

                        <ChartCard title="지역 (시·도)" empty={weekly.region.length === 0}>
                            <ResponsiveContainer width="100%" height={Math.max(160, weekly.region.length * 34)}>
                                <BarChart data={weekly.region} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                                    <CartesianGrid horizontal={false} className={styles.grid} />
                                    <XAxis type="number" allowDecimals={false} tickLine={false} />
                                    <YAxis type="category" dataKey="label" width={48} tickLine={false} axisLine={false} />
                                    <Tooltip formatter={(v) => [`${v}명`, '이용자']} cursor={{ fillOpacity: 0.08 }} />
                                    <Bar dataKey="cnt" fill={BAR_COLOR} radius={[0, 4, 4, 0]} maxBarSize={22} isAnimationActive={false} />
                                </BarChart>
                            </ResponsiveContainer>
                            <CountList items={weekly.region} />
                        </ChartCard>
                    </div>
                </>
            )}

            {/* ===== 최근 8주 추이 ===== */}
            <div className={styles.chartGrid}>
                <ChartCard title={`주간 이용자 · 신규 가입자 (최근 ${TREND_WEEKS}주)`} empty={trendData.length === 0}>
                    <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={trendData} margin={{ top: 8, right: 16, left: -20, bottom: 0 }}>
                            <CartesianGrid vertical={false} className={styles.grid} />
                            <XAxis dataKey="week" tickLine={false} />
                            <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                            <Tooltip labelFormatter={(l) => `${l} 주`} />
                            <Legend />
                            <Line type="monotone" dataKey="activeMembers" name="이용자" stroke="#9b87f5" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
                            <Line type="monotone" dataKey="newMembers" name="신규 가입자" stroke="#f47b9d" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title={`주간 매칭 성사 (최근 ${TREND_WEEKS}주)`} empty={trendData.length === 0}>
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={trendData} margin={{ top: 8, right: 16, left: -20, bottom: 0 }}>
                            <CartesianGrid vertical={false} className={styles.grid} />
                            <XAxis dataKey="week" tickLine={false} />
                            <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                            <Tooltip labelFormatter={(l) => `${l} 주`} cursor={{ fillOpacity: 0.08 }} />
                            <Legend />
                            <Bar dataKey="blindCount" name="블라인드" stackId="m" fill={MATCHING_COLOR.blind} maxBarSize={36} isAnimationActive={false} />
                            <Bar dataKey="idealCount" name="이상형" stackId="m" fill={MATCHING_COLOR.ideal} radius={[4, 4, 0, 0]} maxBarSize={36} isAnimationActive={false} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>
        </div>
    );
}

export default AdminDashboard;