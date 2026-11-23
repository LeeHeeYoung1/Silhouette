import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/useAuthStore';
import Client from '../../api/client';
import styles from './faqlist.module.css';

/* =========================================================
   FAQ 목록 (자주 묻는 질문) - 담당: 권형석
   - 카테고리 탭 + 질문을 누르면 답변이 펼쳐지는 목록
   - 작성·수정·삭제·숨기기: 관리자만 (서버에서도 403으로 막음)
   - 댓글 없음, 상세 페이지 없음
   ========================================================= */

const ALL = '';   // 전체 탭

// 현재 주소에서 /faq 앞부분 (예: /post/faq → /post)
const boardBase = (pathname) => pathname.split('/faq')[0];

function FaqList() {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const { token } = useAuthStore();
    const base = boardBase(pathname);

    const [categories, setCategories] = useState([]);
    const [category, setCategory] = useState(ALL);
    const [faqs, setFaqs] = useState([]);
    const [openSeq, setOpenSeq] = useState(null);     // 펼친 질문 번호
    const [keyword, setKeyword] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [reload, setReload] = useState(0);          // 수정·삭제 후 다시 불러오기

    // 카테고리 목록 + 관리자 여부 (처음 한 번)
    useEffect(() => {
        let cancelled = false;

        Client.get('/api/faqs/categories')
            .then((res) => { if (!cancelled) setCategories(res.data); })
            .catch((err) => console.error(err));

        if (token) {
            Client.get('/api/members/me/role')
                .then((res) => { if (!cancelled) setIsAdmin(!!res.data.admin); })
                .catch(() => { if (!cancelled) setIsAdmin(false); });
        }

        return () => { cancelled = true; };
    }, [token]);

    // FAQ 목록 (카테고리를 바꿀 때마다)
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError('');

        Client.get('/api/faqs', { params: { category: category || undefined } })
            .then((res) => {
                if (cancelled) return;
                setFaqs(res.data);
                setOpenSeq(null);
            })
            .catch((err) => {
                if (cancelled) return;
                console.error(err);
                setError('FAQ를 불러오지 못했습니다.');
            })
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
    }, [category, reload]);

    // 검색 (화면에서 바로 거르기: 질문 + 답변)
    const shownFaqs = useMemo(() => {
        const words = keyword.trim().toLowerCase().split(/\s+/).filter(Boolean);
        if (words.length === 0) return faqs;
        return faqs.filter((f) => {
            const text = `${f.question} ${f.answer}`.toLowerCase();
            return words.every((w) => text.includes(w));
        });
    }, [faqs, keyword]);

    const toggleOpen = (seq) => setOpenSeq((prev) => (prev === seq ? null : seq));

    // ===== 관리자 기능 =====
    const handleError = (err, fallback) => {
        const status = err.response?.status;
        if (status === 401) { alert('로그인이 필요합니다.'); navigate('/login'); }
        else if (status === 403) alert('관리자만 이용할 수 있습니다.');
        else if (status === 404) { alert('이미 삭제된 FAQ입니다.'); setReload((v) => v + 1); }
        else { console.error(err); alert(fallback); }
    };

    const handleDelete = async (faq) => {
        if (!window.confirm(`"${faq.question}"\n이 FAQ를 삭제할까요? 되돌릴 수 없어요.`)) return;
        try {
            await Client.delete(`/api/faqs/${faq.faqSeq}`);
            setReload((v) => v + 1);
        } catch (err) {
            handleError(err, '삭제에 실패했습니다.');
        }
    };

    // 보이기 ↔ 숨기기 (삭제하지 않고 잠깐 숨길 때)
    const handleToggleActive = async (faq) => {
        const next = faq.isActive === 'Y' ? 'N' : 'Y';
        try {
            await Client.put(`/api/faqs/${faq.faqSeq}`, { ...faq, isActive: next });
            setReload((v) => v + 1);
        } catch (err) {
            handleError(err, '변경에 실패했습니다.');
        }
    };

    // ===== 화면 =====
    return (
        <div className={styles.wrap}>
            {/* 상단: 검색 + 관리자 글쓰기 */}
            <div className={styles.topBar}>
                <input
                    type="text"
                    className={styles.search}
                    placeholder="궁금한 내용을 검색해 보세요"
                    value={keyword}
                    maxLength={50}
                    onChange={(e) => setKeyword(e.target.value)}
                />
                {isAdmin && (
                    <button type="button" className={styles.writeBtn}
                        onClick={() => navigate(`${base}/faq/write`)}>
                        ✏️ FAQ 작성
                    </button>
                )}
            </div>

            {/* 카테고리 탭 */}
            <div className={styles.tabs}>
                {[ALL, ...categories].map((c) => (
                    <button
                        key={c || 'all'}
                        type="button"
                        className={`${styles.tab} ${category === c ? styles.tabActive : ''}`}
                        onClick={() => setCategory(c)}
                    >
                        {c || '전체'}
                    </button>
                ))}
            </div>

            {/* 목록 */}
            {loading && <p className={styles.notice}>불러오는 중...</p>}
            {!loading && error && <p className={styles.notice}>{error}</p>}
            {!loading && !error && shownFaqs.length === 0 && (
                <p className={styles.notice}>
                    {keyword.trim() ? '검색 결과가 없어요.' : '등록된 FAQ가 없어요.'}
                </p>
            )}

            {!loading && !error && shownFaqs.length > 0 && (
                <ul className={styles.list}>
                    {shownFaqs.map((faq) => {
                        const open = openSeq === faq.faqSeq;
                        const hidden = faq.isActive === 'N';
                        return (
                            <li key={faq.faqSeq}
                                className={`${styles.item} ${open ? styles.itemOpen : ''} ${hidden ? styles.itemHidden : ''}`}>
                                <button type="button" className={styles.question} onClick={() => toggleOpen(faq.faqSeq)}>
                                    <span className={styles.qMark}>Q</span>
                                    <span className={styles.badge}>{faq.category}</span>
                                    {hidden && <span className={styles.hiddenBadge}>숨김</span>}
                                    <span className={styles.qText}>{faq.question}</span>
                                    <span className={styles.arrow}>{open ? '▲' : '▼'}</span>
                                </button>

                                {open && (
                                    <div className={styles.answer}>
                                        <span className={styles.aMark}>A</span>
                                        <p className={styles.aText}>{faq.answer}</p>

                                        {isAdmin && (
                                            <div className={styles.adminButtons}>
                                                <span className={styles.sortInfo}>순서 {faq.sortOrder}</span>
                                                <button type="button" className={styles.subBtn}
                                                    onClick={() => handleToggleActive(faq)}>
                                                    {hidden ? '👁 보이기' : '🙈 숨기기'}
                                                </button>
                                                <button type="button" className={styles.editBtn}
                                                    onClick={() => navigate(`${base}/faq/edit/${faq.faqSeq}`)}>
                                                    수정
                                                </button>
                                                <button type="button" className={styles.deleteBtn}
                                                    onClick={() => handleDelete(faq)}>
                                                    삭제
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}

            <p className={styles.footer}>
                원하는 답을 찾지 못했다면 <strong>1:1 Q&amp;A</strong>로 문의해 주세요.
            </p>
        </div>
    );
}

export default FaqList;