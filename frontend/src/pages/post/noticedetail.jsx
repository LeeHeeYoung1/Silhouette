import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import styles from './noticedetail.module.css';   // ✅ 공지 상세 전용 css
import Client from '../../api/client';
import useAuthStore from '../../stores/useAuthStore';

/* =========================================================
   공지사항 상세 (NoticeDetail) - 담당: 권형석
   - 경로: /post/notice/:id
   - 누구나 보기 (조회수 +1), 댓글 없음
   - 관리자만 수정 · 삭제 버튼
   ========================================================= */

// "2026-11-23T15:30:12.123" → "2026-11-23 15:30"
const formatDate = (value) => {
    if (!value) return '';
    if (Array.isArray(value)) {
        const [y, m, d, hh = 0, mm = 0] = value;
        const p = (n) => String(n).padStart(2, '0');
        return `${y}-${p(m)}-${p(d)} ${p(hh)}:${p(mm)}`;
    }
    return String(value).replace('T', ' ').slice(0, 16);
};

function NoticeDetail() {
    const { id } = useParams();                 // 공지 번호
    const navigate = useNavigate();
    const { token } = useAuthStore();

    const [notice, setNotice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    // 공지 불러오기
    useEffect(() => {
        let cancelled = false;
        setLoading(true);

        Client.get(`/api/notices/${id}`)
            .then((res) => { if (!cancelled) setNotice(res.data); })
            .catch((err) => {
                if (cancelled) return;
                console.error(err);
                setNotice(null);
            })
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
    }, [id]);

    // 관리자인지 (로그인했을 때만 확인)
    useEffect(() => {
        if (!token) {
            setIsAdmin(false);
            return;
        }
        Client.get('/api/members/me/role')
            .then((res) => setIsAdmin(Boolean(res.data.admin)))
            .catch(() => setIsAdmin(false));
    }, [token]);

    // 삭제 (관리자)
    const handleDelete = async () => {
        if (!window.confirm('공지사항을 삭제하시겠습니까?')) return;
        try {
            await Client.delete(`/api/notices/${id}`);
            alert('공지사항이 삭제되었습니다.');
            navigate('/post/notice');
        } catch (err) {
            const status = err.response?.status;
            if (status === 403) alert('관리자만 삭제할 수 있습니다.');
            else if (status === 401) { alert('로그인이 필요합니다.'); navigate('/login'); }
            else if (status === 404) alert('이미 삭제된 공지사항입니다.');
            else { console.error(err); alert('삭제에 실패했습니다.'); }
        }
    };

    if (loading) {
        return <div className={styles.card}><p className={styles.loading}>공지사항을 불러오는 중...</p></div>;
    }

    // 없거나 삭제된 공지
    if (!notice) {
        return (
            <div className={styles.card}>
                <div className={styles.emptyState}>
                    <i className="fa-regular fa-circle-question"></i>
                    <span>공지사항을 찾을 수 없거나 이미 삭제되었습니다.</span>
                    <Link to="/post/notice" className={styles.listBtn}>
                        공지사항 목록으로 돌아가기
                    </Link>
                </div>
            </div>
        );
    }

    const pinned = notice.isPinned === 'Y';
    const edited = notice.updatedAt && formatDate(notice.updatedAt) !== formatDate(notice.createdAt);

    return (
        <div className={styles.card}>
            {/* 헤더 */}
            <div className={styles.header}>
                <div className={styles.headerInfo}>
                    <span className={`${styles.badge} ${pinned ? styles.badgePinned : ''}`}>
                        {pinned ? '📌 고정 공지' : '📢 공지사항'}
                    </span>
                    <h1 className={styles.title}>{notice.title}</h1>
                    <div className={styles.meta}>
                        <span>작성자 <strong>{notice.writerName || '운영자'}</strong></span>
                        <span className={styles.dot}>·</span>
                        <span>
                            등록일시 <strong>{formatDate(notice.createdAt)}</strong>
                            {edited && <span className={styles.edited}>(수정됨)</span>}
                        </span>
                        <span className={styles.dot}>·</span>
                        <span>조회수 <strong>{notice.viewCount}</strong></span>
                    </div>
                </div>

                <Link to="/post/notice" className={styles.listBtn}>
                    <i className="fa-solid fa-arrow-left"></i> 목록으로
                </Link>
            </div>

            {/* 본문 */}
            <div className={styles.content}>{notice.content}</div>

            {/* 하단 버튼 */}
            <div className={styles.actions}>
                <Link to="/post/notice" className={styles.listBtn}>
                    <i className="fa-solid fa-list"></i> 목록으로 이동
                </Link>

                {/* 관리자만 수정 · 삭제 */}
                {isAdmin && (
                    <div className={styles.adminButtons}>
                        <button type="button" className={styles.editBtn}
                            onClick={() => navigate(`/post/notice/edit/${id}`)}>
                            <i className="fa-solid fa-pen"></i> 공지 수정
                        </button>
                        <button type="button" className={styles.deleteBtn} onClick={handleDelete}>
                            <i className="fa-solid fa-trash-can"></i> 공지 삭제
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default NoticeDetail;