import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/useAuthStore';
import Client from '../../api/client';
import styles from './adminreport.module.css';

/* =========================================================
   관리자 신고 · 블랙리스트 관리 - 담당: 권형석 (A001 조형진 님과 공유)
   - 경로: /admin/reports
   - 탭: 대기 / 처리 완료 / 반려 / 블랙리스트
   - 처리: 반려, 처리 완료(+ 글·댓글 삭제, + 블랙리스트 7일·30일·영구)
   ========================================================= */

const PAGE_SIZE = 10;

const TABS = [
    { key: 'WAITING', label: '🚨 대기' },
    { key: 'DONE', label: '✅ 처리 완료' },
    { key: 'REJECTED', label: '↩️ 반려' },
    { key: 'BLACKLIST', label: '⛔ 블랙리스트' },
];

const REASON_LABEL = {
    SPAM: '스팸·광고', ABUSE: '욕설·비하', OBSCENE: '음란물',
    FRAUD: '사기', PRIVACY: '개인정보 노출', ETC: '기타',
};

const DAYS_OPTIONS = [
    { value: 7, label: '7일' },
    { value: 30, label: '30일' },
    { value: 0, label: '영구' },
];

const formatDate = (value) => {
    if (!value) return '';
    if (Array.isArray(value)) {
        const [y, m, d, hh = 0, mm = 0] = value;
        const p = (n) => String(n).padStart(2, '0');
        return `${y}-${p(m)}-${p(d)} ${p(hh)}:${p(mm)}`;
    }
    return String(value).replace('T', ' ').slice(0, 16);
};

const emptyForm = { adminMemo: '', deleteTarget: false, blacklist: false, blacklistDays: 7, blacklistReason: '' };

function AdminReport() {
    const navigate = useNavigate();
    const { token } = useAuthStore();

    const [ready, setReady] = useState(false);   // 관리자 확인 끝났는지
    const [tab, setTab] = useState('WAITING');
    const [page, setPage] = useState(1);
    const [list, setList] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [reload, setReload] = useState(0);

    const [openSeq, setOpenSeq] = useState(null);    // 처리 창이 열린 신고 번호
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [activeOnly, setActiveOnly] = useState(true);   // 블랙리스트: 적용 중만

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

    // ===== 목록 불러오기 =====
    useEffect(() => {
        if (!ready) return;
        let cancelled = false;
        setLoading(true);

        const request = tab === 'BLACKLIST'
            ? Client.get('/api/admin/blacklist', { params: { activeOnly, page, size: PAGE_SIZE } })
            : Client.get('/api/admin/reports', { params: { status: tab, page, size: PAGE_SIZE } });

        request
            .then((res) => {
                if (cancelled) return;
                setList(res.data.list ?? []);
                setTotalCount(res.data.totalCount ?? 0);
                setTotalPages(Math.max(1, res.data.totalPages ?? 1));
            })
            .catch((err) => {
                if (cancelled) return;
                console.error(err);
                if (err.response?.status === 403) { alert('관리자만 이용할 수 있습니다.'); navigate('/'); }
                else alert('목록을 불러오지 못했습니다.');
            })
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
    }, [ready, tab, page, activeOnly, reload, navigate]);

    const changeTab = (key) => {
        setTab(key);
        setPage(1);
        setOpenSeq(null);
    };

    const openProcess = (seq) => {
        setOpenSeq(openSeq === seq ? null : seq);
        setForm(emptyForm);
    };

    const setValue = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

    // ===== 신고 처리 =====
    const handleProcess = async (report, action) => {
        if (action === 'DONE' && form.blacklist) {
            const period = form.blacklistDays === 0 ? '영구' : `${form.blacklistDays}일`;
            if (!window.confirm(`${report.reportedName ?? '이 회원'}님을 ${period} 블랙리스트로 지정할까요?\n지정하면 이 회원의 글과 댓글이 다른 회원에게 보이지 않아요.`)) return;
        } else if (action === 'DONE' && form.deleteTarget) {
            if (!window.confirm('신고된 글·댓글을 삭제하고 처리할까요?')) return;
        } else if (action === 'REJECT') {
            if (!window.confirm('이 신고를 반려할까요?')) return;
        }

        setSaving(true);
        try {
            await Client.put(`/api/admin/reports/${report.reportSeq}`, {
                action,
                adminMemo: form.adminMemo.trim() || null,
                deleteTarget: action === 'DONE' && form.deleteTarget,
                blacklist: action === 'DONE' && form.blacklist,
                blacklistDays: form.blacklistDays,
                blacklistReason: form.blacklistReason.trim() || null,
            });
            alert(action === 'REJECT' ? '반려했어요.' : '처리했어요.');
            setOpenSeq(null);
            setForm(emptyForm);
            setReload((v) => v + 1);
        } catch (err) {
            const status = err.response?.status;
            const msg = err.response?.data?.message;
            if (status === 409) { alert(msg || '이미 처리됐거나, 이미 블랙리스트인 회원이에요.'); setReload((v) => v + 1); }
            else if (status === 400) alert(msg || '입력값을 확인해 주세요. (관리자는 블랙리스트 지정 불가)');
            else if (status === 403) alert('관리자만 이용할 수 있습니다.');
            else { console.error(err); alert('처리에 실패했습니다.'); }
        } finally {
            setSaving(false);
        }
    };

    // ===== 블랙리스트 해제 =====
    const handleRelease = async (black) => {
        if (!window.confirm(`${black.memberName ?? '이 회원'}님의 블랙리스트를 해제할까요?`)) return;
        try {
            await Client.put(`/api/admin/blacklist/${black.blacklistSeq}/release`);
            alert('해제했어요.');
            setReload((v) => v + 1);
        } catch (err) {
            if (err.response?.status === 409) { alert('이미 해제된 블랙리스트예요.'); setReload((v) => v + 1); }
            else { console.error(err); alert('해제에 실패했습니다.'); }
        }
    };

    const blackStatus = (b) => {
        if (b.releasedAt) return { label: '해제됨', cls: styles.badgeGray };
        if (b.active === 'Y') return { label: '적용 중', cls: styles.badgeRed };
        return { label: '기간 만료', cls: styles.badgeGray };
    };

    if (!ready) return <div className={styles.page}><p className={styles.notice}>확인 중...</p></div>;

    return (
        <div className={styles.page}>
            <h1 className={styles.pageTitle}>🛡️ 신고 · 블랙리스트 관리</h1>

            {/* 탭 */}
            <div className={styles.tabs}>
                {TABS.map((t) => (
                    <button key={t.key} type="button"
                        className={`${styles.tab} ${tab === t.key ? styles.tabActive : ''}`}
                        onClick={() => changeTab(t.key)}>
                        {t.label}
                    </button>
                ))}
            </div>

            <div className={styles.topRow}>
                <p className={styles.count}>총 <strong>{totalCount}</strong>건</p>
                {tab === 'BLACKLIST' && (
                    <label className={styles.checkLabel}>
                        <input type="checkbox" checked={activeOnly}
                            onChange={(e) => { setActiveOnly(e.target.checked); setPage(1); }} />
                        적용 중인 것만 보기
                    </label>
                )}
            </div>

            {loading && <p className={styles.notice}>불러오는 중...</p>}
            {!loading && list.length === 0 && <p className={styles.notice}>내역이 없어요.</p>}

            {/* ===== 신고 목록 ===== */}
            {!loading && tab !== 'BLACKLIST' && list.map((r) => (
                <div key={r.reportSeq} className={styles.card}>
                    <div className={styles.cardHead}>
                        <div className={styles.badges}>
                            <span className={styles.badgeRed}>{REASON_LABEL[r.reasonType] ?? r.reasonType}</span>
                            <span className={styles.badgeGray}>{r.targetType === 'POST' ? '게시글' : '댓글'} #{r.targetSeq}</span>
                            {r.blacklisted === 'Y' && <span className={styles.badgeBlack}>⛔ 블랙리스트 중</span>}
                        </div>
                        <span className={styles.dim}>신고일 {formatDate(r.createdAt)}</span>
                    </div>

                    <div className={styles.people}>
                        <span>신고당한 회원: <strong>{r.reportedName ?? '-'}</strong> ({r.reportedLoginId ?? '-'})
                            · 누적 신고 <strong className={styles.red}>{r.reportedCount ?? 0}</strong>회</span>
                        <span className={styles.dim}>신고한 회원: {r.reporterName ?? '-'}</span>
                    </div>

                    <div className={styles.content}>{r.targetContent || '(내용 없음)'}</div>
                    {r.reasonDetail && <p className={styles.detail}>💬 {r.reasonDetail}</p>}

                    {r.targetType === 'POST' && (
                        <button type="button" className={styles.linkBtn}
                            onClick={() => window.open(`/post/detail/${r.targetSeq}`, '_blank')}>
                            원본 글 새 창으로 보기 ↗
                        </button>
                    )}

                    {/* 처리된 신고 */}
                    {tab !== 'WAITING' && (
                        <p className={styles.processed}>
                            처리일 {formatDate(r.processedAt)}
                            {r.adminMemo && <> · 메모: {r.adminMemo}</>}
                        </p>
                    )}

                    {/* 대기 중 신고: 처리 */}
                    {tab === 'WAITING' && (
                        <>
                            <div className={styles.actions}>
                                <button type="button" className={styles.btnOutline} onClick={() => openProcess(r.reportSeq)}>
                                    {openSeq === r.reportSeq ? '닫기' : '처리하기'}
                                </button>
                            </div>

                            {openSeq === r.reportSeq && (
                                <div className={styles.processBox}>
                                    <textarea className={styles.textarea} rows={2} maxLength={300}
                                        placeholder="처리 메모 (선택)"
                                        value={form.adminMemo} onChange={(e) => setValue('adminMemo', e.target.value)} />

                                    <label className={styles.checkLabel}>
                                        <input type="checkbox" checked={form.deleteTarget}
                                            onChange={(e) => setValue('deleteTarget', e.target.checked)} />
                                        신고된 {r.targetType === 'POST' ? '게시글' : '댓글'} 삭제
                                    </label>

                                    <label className={styles.checkLabel}>
                                        <input type="checkbox" checked={form.blacklist}
                                            disabled={r.blacklisted === 'Y'}
                                            onChange={(e) => setValue('blacklist', e.target.checked)} />
                                        신고당한 회원 블랙리스트 지정
                                        {r.blacklisted === 'Y' && <span className={styles.dim}> (이미 블랙리스트)</span>}
                                    </label>

                                    {form.blacklist && (
                                        <div className={styles.blackForm}>
                                            <div className={styles.days}>
                                                {DAYS_OPTIONS.map((d) => (
                                                    <button key={d.value} type="button"
                                                        className={`${styles.dayBtn} ${form.blacklistDays === d.value ? styles.dayBtnActive : ''}`}
                                                        onClick={() => setValue('blacklistDays', d.value)}>
                                                        {d.label}
                                                    </button>
                                                ))}
                                            </div>
                                            <input type="text" className={styles.input} maxLength={300}
                                                placeholder="블랙리스트 사유 (비우면 신고 사유로 저장)"
                                                value={form.blacklistReason}
                                                onChange={(e) => setValue('blacklistReason', e.target.value)} />
                                        </div>
                                    )}

                                    <div className={styles.actions}>
                                        <button type="button" className={styles.btnGhost} disabled={saving}
                                            onClick={() => handleProcess(r, 'REJECT')}>
                                            반려
                                        </button>
                                        <button type="button" className={styles.btnDanger} disabled={saving}
                                            onClick={() => handleProcess(r, 'DONE')}>
                                            {saving ? '처리 중...' : '처리 완료'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            ))}

            {/* ===== 블랙리스트 목록 ===== */}
            {!loading && tab === 'BLACKLIST' && list.map((b) => {
                const st = blackStatus(b);
                return (
                    <div key={b.blacklistSeq} className={styles.card}>
                        <div className={styles.cardHead}>
                            <div className={styles.badges}>
                                <span className={st.cls}>{st.label}</span>
                                <strong>{b.memberName ?? '-'}</strong>
                                <span className={styles.dim}>({b.memberLoginId ?? '-'})</span>
                            </div>
                            {b.active === 'Y' && !b.releasedAt && (
                                <button type="button" className={styles.btnOutline} onClick={() => handleRelease(b)}>
                                    해제
                                </button>
                            )}
                        </div>
                        <p className={styles.detail}>사유: {b.reason}</p>
                        <p className={styles.dim}>
                            기간: {formatDate(b.startAt)} ~ {b.endAt ? formatDate(b.endAt) : '영구'}
                            {' · '}지정: {b.adminName ?? '-'}
                            {b.releasedAt && <> · 해제일 {formatDate(b.releasedAt)}</>}
                        </p>
                    </div>
                );
            })}

            {/* 페이지 */}
            {totalPages > 1 && (
                <div className={styles.pagination}>
                    <button type="button" className={styles.pageBtn} disabled={page === 1} onClick={() => setPage(page - 1)}>이전</button>
                    <span className={styles.dim}>{page} / {totalPages}</span>
                    <button type="button" className={styles.pageBtn} disabled={page === totalPages} onClick={() => setPage(page + 1)}>다음</button>
                </div>
            )}
        </div>
    );
}

export default AdminReport;