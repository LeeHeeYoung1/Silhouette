import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getStoredPosts, saveStoredPosts } from './postData';
import styles from './post.module.css';

/* =========================================================
   실루엣 게시글 상세 컴포넌트 (PostDetail) - 담당: 권형석
   - 경로: /post/detail/:id
   - B001 게시글 상세 조회 (조회수 증가, 본문, 첨부파일)
   - M008 연계 추천 토글 (1인 1회 추천/취소)
   - 댓글 및 대댓글(답글) 작성 및 삭제
   - 본인 작성 글 삭제
   ========================================================= */

function PostDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [post, setPost] = useState(null);
    const [hasLiked, setHasLiked] = useState(false);

    // 댓글 및 답글 입력 상태
    const [commentText, setCommentText] = useState('');
    const [replyToId, setReplyToId] = useState(null);
    const [replyText, setReplyText] = useState('');

    // 토스트
    const [toast, setToast] = useState('');
    const showToast = (msg) => {
        setToast(msg);
        clearTimeout(window.__pdToastTimer);
        window.__pdToastTimer = setTimeout(() => setToast(''), 2500);
    };

    useEffect(() => {
        const posts = getStoredPosts();
        const targetPost = posts.find((p) => String(p.postSeq) === String(id));

        if (targetPost) {
            // 조회수 1 증가 및 저장
            const updated = posts.map((p) =>
                String(p.postSeq) === String(id) ? { ...p, viewCount: p.viewCount + 1 } : p
            );
            saveStoredPosts(updated);
            setPost({ ...targetPost, viewCount: targetPost.viewCount + 1 });
        }
    }, [id]);

    if (!post) {
        return (
            <div className={styles.detailCard}>
                <div className={styles.emptyState}>
                    <i className="fa-regular fa-circle-question"></i>
                    <span>게시글을 찾을 수 없거나 이미 삭제되었습니다.</span>
                    <Link to="/post/free" className={styles.backToListBtn} style={{ marginTop: 14 }}>
                        자유게시판 목록으로 돌아가기
                    </Link>
                </div>
            </div>
        );
    }

    // 추천 토글 (B001, M008)
    const handleToggleLike = () => {
        const posts = getStoredPosts();
        const nextLike = !hasLiked;
        setHasLiked(nextLike);

        const newRecommendCount = nextLike ? post.recommendCount + 1 : Math.max(0, post.recommendCount - 1);
        const updated = posts.map((p) =>
            String(p.postSeq) === String(id) ? { ...p, recommendCount: newRecommendCount } : p
        );
        saveStoredPosts(updated);
        setPost((prev) => ({ ...prev, recommendCount: newRecommendCount }));

        showToast(nextLike ? '게시글을 추천하였습니다! 👍' : '추천이 취소되었습니다.');
    };

    // 댓글 등록
    const handleAddComment = () => {
        if (!commentText.trim()) {
            alert('댓글 내용을 입력해 주세요.');
            return;
        }

        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const formattedDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

        const newComment = {
            id: Date.now(),
            author: '권형석',
            createdAt: formattedDate,
            content: commentText.trim(),
            replies: []
        };

        const updatedComments = [...(post.comments || []), newComment];
        const newCommentCount = (post.commentCount || 0) + 1;

        const posts = getStoredPosts();
        const updated = posts.map((p) =>
            String(p.postSeq) === String(id)
                ? { ...p, comments: updatedComments, commentCount: newCommentCount }
                : p
        );
        saveStoredPosts(updated);

        setPost((prev) => ({ ...prev, comments: updatedComments, commentCount: newCommentCount }));
        setCommentText('');
        showToast('댓글이 등록되었습니다.');
    };

    // 대댓글(답글) 등록
    const handleAddReply = (commentId) => {
        if (!replyText.trim()) {
            alert('답글 내용을 입력해 주세요.');
            return;
        }

        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const formattedDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

        const newReply = {
            id: Date.now(),
            author: '권형석',
            createdAt: formattedDate,
            content: replyText.trim()
        };

        const updatedComments = post.comments.map((c) => {
            if (c.id === commentId) {
                return { ...c, replies: [...(c.replies || []), newReply] };
            }
            return c;
        });
        const newCommentCount = (post.commentCount || 0) + 1;

        const posts = getStoredPosts();
        const updated = posts.map((p) =>
            String(p.postSeq) === String(id)
                ? { ...p, comments: updatedComments, commentCount: newCommentCount }
                : p
        );
        saveStoredPosts(updated);

        setPost((prev) => ({ ...prev, comments: updatedComments, commentCount: newCommentCount }));
        setReplyToId(null);
        setReplyText('');
        showToast('답글이 등록되었습니다.');
    };

    // 게시글 삭제
    const handleDeletePost = () => {
        if (!window.confirm('정말로 이 게시글을 삭제하시겠습니까?')) return;
        const posts = getStoredPosts();
        const updated = posts.filter((p) => String(p.postSeq) !== String(id));
        saveStoredPosts(updated);
        alert('게시글이 삭제되었습니다.');
        navigate(post.boardType === 'notice' ? '/post/notice' : '/post/free');
    };

    const backUrl = post.boardType === 'notice' ? '/post/notice' : '/post/free';

    return (
        <div className={styles.detailCard}>
            {/* 게시글 상단 헤더 */}
            <div className={styles.detailHeader}>
                <div>
                    <span className={styles.categoryBadge}>{post.category}</span>
                    <h1 className={styles.detailTitle}>{post.title}</h1>
                    <div className={styles.detailMeta}>
                        <span>작성자: <strong>{post.category === '익명' ? '🎭 익명' : post.author}</strong></span>
                        <span>·</span>
                        <span>등록일시: <strong>{post.createdAt}</strong></span>
                        <span>·</span>
                        <span>조회수: <strong>{post.viewCount}</strong></span>
                        <span>·</span>
                        <span>추천수: <strong style={{ color: '#f472b6' }}>{post.recommendCount}</strong></span>
                    </div>
                </div>

                <Link to={backUrl} className={styles.backToListBtn}>
                    <i className="fa-solid fa-arrow-left"></i> 목록으로
                </Link>
            </div>

            {/* 본문 내용 */}
            <div className={styles.detailContent}>
                {post.content}
            </div>

            {/* 첨부파일 영역 */}
            {post.files && post.files.length > 0 && (
                <div className={styles.attachedFileBox}>
                    <i className="fa-solid fa-file-arrow-down" style={{ fontSize: '1.1rem' }}></i>
                    <span>
                        첨부 파일: <strong>{post.files.join(', ')}</strong> (클릭 시 가상 다운로드)
                    </span>
                </div>
            )}

            {/* 추천 버튼 영역 (M008 연계) */}
            <div className={styles.likeSection}>
                <button
                    type="button"
                    className={`${styles.likeBtn} ${hasLiked ? styles.likeBtnActive : ''}`}
                    onClick={handleToggleLike}
                >
                    <i className="fa-solid fa-heart"></i>
                    <span>추천 {post.recommendCount}</span>
                </button>
            </div>

            {/* 하단 액션 버튼 (목록 복귀 & 삭제) */}
            <div className={styles.detailActionButtons}>
                <Link to={backUrl} className={styles.backToListBtn}>
                    <i className="fa-solid fa-list"></i> 목록으로 이동
                </Link>

                {post.author === '권형석' && (
                    <button
                        type="button"
                        className={styles.searchBtn}
                        style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171' }}
                        onClick={handleDeletePost}
                    >
                        <i className="fa-solid fa-trash-can"></i> 게시글 삭제
                    </button>
                )}
            </div>

            {/* 댓글 및 대댓글 영역 */}
            <div className={styles.commentSection}>
                <div className={styles.commentTitle}>
                    <i className="fa-regular fa-comment-dots"></i>
                    <span>댓글 {post.commentCount || 0}</span>
                </div>

                <div className={styles.commentList}>
                    {post.comments && post.comments.length > 0 ? (
                        post.comments.map((comment) => (
                            <div key={comment.id} className={styles.commentItem}>
                                <div className={styles.commentAuthorBar}>
                                    <span className={styles.commentAuthor}>{comment.author}</span>
                                    <span className={styles.commentDate}>{comment.createdAt}</span>
                                </div>
                                <div className={styles.commentBody}>{comment.content}</div>
                                <div className={styles.commentActions}>
                                    <button
                                        type="button"
                                        className={styles.commentActionLink}
                                        onClick={() => setReplyToId(replyToId === comment.id ? null : comment.id)}
                                    >
                                        답글 달기
                                    </button>
                                </div>

                                {/* 대댓글 목록 */}
                                {comment.replies && comment.replies.map((reply) => (
                                    <div key={reply.id} className={`${styles.commentItem} ${styles.replyItem}`}>
                                        <div className={styles.commentAuthorBar}>
                                            <span className={styles.commentAuthor}>↳ {reply.author}</span>
                                            <span className={styles.commentDate}>{reply.createdAt}</span>
                                        </div>
                                        <div className={styles.commentBody}>{reply.content}</div>
                                    </div>
                                ))}

                                {/* 대댓글 입력창 */}
                                {replyToId === comment.id && (
                                    <div className={styles.commentForm}>
                                        <input
                                            type="text"
                                            className={styles.commentInput}
                                            placeholder="답글을 작성하세요..."
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddReply(comment.id)}
                                        />
                                        <button
                                            type="button"
                                            className={styles.commentSubmitBtn}
                                            onClick={() => handleAddReply(comment.id)}
                                        >
                                            답글 등록
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div style={{ color: 'var(--text-dim)', fontSize: '0.88rem', padding: '12px 0' }}>
                            등록된 댓글이 없습니다. 첫 번째 댓글을 남겨보세요!
                        </div>
                    )}
                </div>

                {/* 신규 댓글 작성 폼 */}
                <div className={styles.commentForm}>
                    <input
                        type="text"
                        className={styles.commentInput}
                        placeholder="매너 있고 따뜻한 댓글을 남겨주세요 (비속어 필터 적용)"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                    />
                    <button
                        type="button"
                        className={styles.commentSubmitBtn}
                        onClick={handleAddComment}
                    >
                        댓글 등록
                    </button>
                </div>
            </div>

            {toast && <div className={styles.toast}>{toast}</div>}
        </div>
    );
}

export default PostDetail;
