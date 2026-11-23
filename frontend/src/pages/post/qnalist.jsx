import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/useAuthStore';
import Client from '../../api/client';
import styles from './qna.module.css';

/* =========================================================
   1:1 Q&A 목록 - 담당: 권형석
   - 남의 비밀글은 서버에서 제목을 "비밀글입니다."로 가려서 보냄
   - 로그인하면 "내 문의만" 보기 가능
   ========================================================= */

const PAGE_SIZE = 10;
const PAGE_GROUP = 10;

// "2026-11-23T15:30:12" → "2026-11-23 15:30"
const formatDate = (value) => {
    if (!value) return '';
    if (Array.isArray(value)) {
        const [y, m, d, hh = 0, mm = 0] = value;
        const p = (n) => String(n).padStart(2, '0');
        return `${y}-${p(m)}-${p(d)} ${p(hh)}:${p(mm)}`;
    }
    return String(value).replace('T', ' ').slice(0, 16);
};

function QnaList() {
    const navigate = useNavigate();
    const { token } = useAuthStore();

    const [list, setList] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [mineOnly, setMineOnly] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError('');

        Client.get('/api/qnas', { params: { page, size: PAGE_SIZE, mine: mineOnly } })
            .then((res) => {
                if (cancelled) return;
                setList(res.data.list ?? []);
                setTotalCount(res.data.totalCount ?? 0);
                setTotalPages(Math.max(1, res.data.totalPages ?? 1));
            })
            .catch((err) => {
                if (cancelled) return;
                if (err.response?.status === 401) {
                    alert('로그인이 필요합니다.');
                    setMineOnly(false);
                } else {
                    console.error(err);
                    setError('문의 목록을 불러오지 못했습니다.');
                }
            })
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
    }, [page, mineOnly]);

    const displayNo = (index) => totalCount - (page - 1) * PAGE_SIZE - index;

    const startPage = Math.floor((page - 1) / PAGE_GROUP) * PAGE_GROUP + 1;
    const endPage = Math.min(startPage + PAGE_GROUP - 1, totalPages);
    const pageNumbers = [];
    for (let n = startPage; n <= endPage; n++) pageNumbers.push(n);

    const goPage = (num) => {
        if (num < 1 || num > totalPages || num === page) return;
        setPage(num);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const toggleMine = () => {
        if (!token) { alert('로그인이 필요합니다.'); navigate('/login'); return; }
        setMineOnly((v) => !v);
        setPage(1);
    };

    const goWrite = () => {
        if (!token) { alert('로그인 후 문의할 수 있어요.'); navigate('/login'); return; }
        navigate('/post/qna/write');
    };

    return (
        <div className={styles.wrap}>
            {/* 상단 */}
            <div className={styles.topBar}>
                <p className={styles.desc}>🔒 궁금한 점을 1:1로 문의하면 관리자가 답변해 드려요.</p>
                <div className={styles.topRight}>
                    {token && (
                        <button type="button"
                            className={`${styles.btnGhost} ${mineOnly ? styles.btnGhostActive : ''}`}
                            onClick={toggleMine}>
                            {mineOnly ? '✓ 내 문의만' : '내 문의만'}
                        </button>
                    )}
                    <button type="button" className={styles.btnPrimary} onClick={goWrite}>
                        ✏️ 1:1 문의 작성
                    </button>
                </div>
            </div>

            <p className={styles.count}>총 <strong>{totalCount}</strong>개의 문의</p>

            {/* 목록 */}
            <div className={styles.tableBox}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th style={{ width: 70 }}>번호</th>
                            <th style={{ width: 100 }}>상태</th>
                            <th>제목</th>
                            <th style={{ width: 130 }}>작성자</th>
                            <th style={{ width: 140 }}>등록일</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr><td colSpan={5} className={styles.empty}>불러오는 중...</td></tr>
                        )}
                        {!loading && error && (
                            <tr><td colSpan={5} className={styles.empty}>{error}</td></tr>
                        )}
                        {!loading && !error && list.length === 0 && (
                            <tr><td colSpan={5} className={styles.empty}>
                                {mineOnly ? '작성한 문의가 없어요.' : '등록된 문의가 없어요.'}
                            </td></tr>
                        )}
                        {!loading && !error && list.map((q, index) => (
                            <tr key={q.qnaSeq} className={styles.row} onClick={() => navigate(`/post/qna/${q.qnaSeq}`)}>
                                <td className={styles.center}>{displayNo(index)}</td>
                                <td className={styles.center}>
                                    {q.answerStatus === 'DONE'
                                        ? <span className={styles.statusDone}>답변완료</span>
                                        : <span className={styles.statusWait}>답변대기</span>}
                                </td>
                                <td>
                                    <div className={styles.titleCell}>
                                        {q.isSecret === 'Y' && <span className={styles.lock}>🔒</span>}
                                        <span>{q.title}</span>
                                        {q.mine && <span className={styles.mineBadge}>내 글</span>}
                                    </div>
                                </td>
                                <td>{q.writerName || '-'}</td>
                                <td className={styles.dim}>{formatDate(q.createdAt)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* 페이지 */}
            {totalPages > 1 && (
                <div className={styles.pagination}>
                    <button type="button" className={styles.pageBtn} disabled={page === 1} onClick={() => goPage(1)}>처음</button>
                    <button type="button" className={styles.pageBtn} disabled={page === 1} onClick={() => goPage(page - 1)}>이전</button>
                    {pageNumbers.map((num) => (
                        <button key={num} type="button"
                            className={`${styles.pageBtn} ${page === num ? styles.pageBtnActive : ''}`}
                            onClick={() => goPage(num)}>
                            {num}
                        </button>
                    ))}
                    <button type="button" className={styles.pageBtn} disabled={page === totalPages} onClick={() => goPage(page + 1)}>다음</button>
                    <button type="button" className={styles.pageBtn} disabled={page === totalPages} onClick={() => goPage(totalPages)}>끝</button>
                </div>
            )}
        </div>
    );
}

export default QnaList;