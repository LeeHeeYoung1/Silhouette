import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import styles from './postdetail.module.css';
import Client from '../../api/client';
import useAuthStore from '../../stores/useAuthStore';

/* =========================================================
   실루엣 게시글 상세 컴포넌트 (PostDetail) - 담당: 권형석
   - 경로: /post/detail/:id
   - B001 게시글 상세 조회 (조회수 증가, 본문)
   - 추천 토글 (1인 1회)
   - 댓글 / 대댓글 등록 · 수정 · 삭제
   - 본인 글 삭제
   ========================================================= */

const MAX_COMMENT = 1000;

// "2026-11-19T15:30:12.123" → "2026-11-19 15:30"
const formatDate = (value) => {
    if (!value) return '';
    if (Array.isArray(value)) {
        const [y, m, d, hh = 0, mm = 0] = value;
        const p = (n) => String(n).padStart(2, '0');
        return `${y}-${p(m)}-${p(d)} ${p(hh)}:${p(mm)}`;
    }
    return String(value).replace('T', ' ').slice(0, 16);
};

// 한글 입력 중(조합 중) Enter는 무시 → 댓글 두 번 등록 방지
const isEnter = (e) => e.key === 'Enter' && !e.nativeEvent.isComposing;

function PostDetail() {
    const { id } = useParams();   // 주소의 글 번호 (/post/detail/5 → "5")
    const navigate = useNavigate();
    const { id: loginId, token } = useAuthStore();

    // 서버에서 받아올 데이터
    const [post, setPost] = useState(null);
    const [files, setFiles] = useState([]);
    const [comments, setComments] = useState([]);
    const [hasLiked, setHasLiked] = useState(false);

    // 댓글 화면 상태
    const [commentText, setCommentText] = useState('');      // 새 댓글 입력
    const [replyToId, setReplyToId] = useState(null);        // 답글 입력창이 열린 부모 댓글 번호
    const [replyText, setReplyText] = useState('');          // 답글 입력
    const [editingId, setEditingId] = useState(null);        // 수정 중인 댓글 번호
    const [editText, setEditText] = useState('');            // 수정 입력
    const [submitting, setSubmitting] = useState(false);     // 중복 클릭 방지

    const isMine = !!loginId && post?.loginId === loginId;
    const isMyComment = (c) => !!loginId && c.isDeleted !== 'Y' && c.loginId === loginId;

    /* ===================== 데이터 불러오기 ===================== */

    // 처음 들어올 때와 댓글 등록/수정/삭제 후에 다시 불러오기 위해 함수로 분리
    const loadComments = () => {
        Client.get(`/api/posts/${id}/comments`)
            .then((res) => setComments(res.data))
            .catch((err) => console.error(err));
    };

    useEffect(() => {
        Client.get(`/api/posts/${id}`)
            .then((res) => setPost(res.data))
            .catch((err) => {
                console.error(err);
                setPost(null);
            });

        Client.get(`/api/posts/${id}/files`)
            .then((res) => setFiles(res.data))
            .catch((err) => console.error(err));

        loadComments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    useEffect(() => {
        if (!loginId) return;
        Client.get(`/api/posts/${id}/recommend`, { params: { loginId } })
            .then((res) => setHasLiked(res.data.liked))
            .catch((err) => console.error(err));
    }, [id, loginId]);

    /* ===================== 공통 ===================== */

    // 로그인 안 했으면 알림 후 로그인 페이지로
    const requireLogin = (message) => {
        if (token) return true;
        alert(message);
        navigate('/login');
        return false;
    };

    // 서버 에러 상태코드별 안내
    const handleError = (err, fallback) => {
        console.error(err);
        const status = err.response?.status;
        if (status === 401) {
            alert('로그인 정보가 없습니다. 다시 로그인해 주세요.');
            navigate('/login');
        } else if (status === 403) {
            alert('본인이 작성한 댓글만 수정/삭제할 수 있습니다.');
        } else if (status === 404) {
            alert('이미 삭제되었거나 존재하지 않는 댓글/게시글입니다.');
            loadComments();
        } else if (status === 400) {
            alert(`댓글은 1~${MAX_COMMENT}자로 입력해 주세요.`);
        } else {
            alert(fallback);
        }
    };

    // 댓글 수 화면 반영 (+1 / -1)
    const changeCommentCount = (diff) => {
        setPost((prev) => prev && ({
            ...prev,
            commentCount: Math.max(0, (prev.commentCount || 0) + diff),
        }));
    };

    /* ===================== 댓글 등록 ===================== */
    const handleAddComment = async () => {
        if (!requireLogin('로그인한 회원만 댓글을 작성할 수 있습니다.')) return;
        const content = commentText.trim();
        if (!content) {
            alert('댓글 내용을 입력해 주세요.');
            return;
        }
        if (submitting) return;
        setSubmitting(true);
        try {
            await Client.post(`/api/posts/${id}/comments`, { loginId, content });
            setCommentText('');
            loadComments();
            changeCommentCount(1);
        } catch (err) {
            handleError(err, '댓글 등록에 실패했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    /* ===================== 대댓글(답글) 등록 ===================== */
    const toggleReply = (parentSeq) => {
        if (!requireLogin('로그인한 회원만 답글을 작성할 수 있습니다.')) return;
        setEditingId(null);
        setReplyText('');
        setReplyToId(replyToId === parentSeq ? null : parentSeq);
    };

    const handleAddReply = async (parentSeq) => {
        if (!requireLogin('로그인한 회원만 답글을 작성할 수 있습니다.')) return;
        const content = replyText.trim();
        if (!content) {
            alert('답글 내용을 입력해 주세요.');
            return;
        }
        if (submitting) return;
        setSubmitting(true);
        try {
            await Client.post(`/api/posts/${id}/comments`, {
                loginId,
                content,
                parentPostCommentSeq: parentSeq,
            });
            setReplyText('');
            setReplyToId(null);
            loadComments();
            changeCommentCount(1);
        } catch (err) {
            handleError(err, '답글 등록에 실패했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    /* ===================== 댓글 · 대댓글 수정 ===================== */
    const startEdit = (comment) => {
        setReplyToId(null);
        setEditingId(comment.postCommentSeq);
        setEditText(comment.content);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditText('');
    };

    const handleUpdateComment = async (comment) => {
        if (!requireLogin('로그인한 회원만 수정할 수 있습니다.')) return;
        const content = editText.trim();
        if (!content) {
            alert('수정할 내용을 입력해 주세요.');
            return;
        }
        if (content === comment.content) {
            cancelEdit();
            return;
        }
        if (submitting) return;
        setSubmitting(true);
        try {
            await Client.put(`/api/posts/${id}/comments/${comment.postCommentSeq}`, { loginId, content });
            cancelEdit();
            loadComments();
        } catch (err) {
            handleError(err, '댓글 수정에 실패했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    /* ===================== 댓글 · 대댓글 삭제 ===================== */
    const handleDeleteComment = async (comment) => {
        if (!requireLogin('로그인한 회원만 삭제할 수 있습니다.')) return;
        const isReply = comment.parentPostCommentSeq != null;
        if (!window.confirm(isReply ? '답글을 삭제하시겠습니까?' : '댓글을 삭제하시겠습니까?')) return;
        try {
            await Client.delete(`/api/posts/${id}/comments/${comment.postCommentSeq}`, {
                params: { loginId },
            });
            if (editingId === comment.postCommentSeq) cancelEdit();
            if (replyToId === comment.postCommentSeq) setReplyToId(null);
            loadComments();
            changeCommentCount(-1);
        } catch (err) {
            handleError(err, '댓글 삭제에 실패했습니다.');
        }
    };

    /* ===================== 게시글 삭제 / 추천 / 다운로드 ===================== */
    const handleDeletePost = async () => {
        if (!requireLogin('로그인한 회원만 삭제가능합니다.')) return;
        if (!window.confirm('게시글을 삭제하시겠습니까?')) return;
        try {
            await Client.delete(`/api/posts/${id}`, { params: { loginId } });
            alert('게시글이 삭제되었습니다.');
            navigate('/post/free');
        } catch (err) {
            console.error(err);
            alert('게시글을 삭제할 수 없습니다.');
        }
    };

    const handleToggleLike = async () => {
        if (!requireLogin('로그인한 회원만 추천할 수 있습니다.')) return;
        try {
            const res = await Client.post(`/api/posts/${id}/recommend`, null, { params: { loginId } });
            setHasLiked(res.data.liked);
            setPost((prev) => ({ ...prev, recommendCount: res.data.recommendCount }));
        } catch (err) {
            console.error(err);
            alert('추천 처리에 실패했습니다.');
        }
    };

    const handleDownLoad = async (file) => {
        if (!requireLogin('로그인한 회원만 다운로드할 수 있습니다.')) return;
        try {
            // 서버에 파일 요청 (파일 덩어리로 받기)
            const res = await Client.get(`/api/posts/files/${file.postFileSeq}/download`, {
                params: { loginId },
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(res.data);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.originalName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error(err);
            alert('다운로드에 실패했습니다.');
        }
    };

    /* ===================== 댓글 하나 그리기 (댓글 / 대댓글 공용) ===================== */
    const renderComment = (comment, isReply = false) => {
        const deleted = comment.isDeleted === 'Y';
        const mine = isMyComment(comment);
        const editing = editingId === comment.postCommentSeq;
        const edited = !deleted && comment.updatedAt && comment.updatedAt !== comment.createdAt;

        return (
            <div
                className={[
                    styles.commentItem,
                    isReply ? styles.replyItem : '',
                    deleted ? styles.deletedComment : '',
                ].join(' ')}
            >
                {!deleted && (
                    <div className={styles.commentAuthorBar}>
                        <div className={styles.commentAuthorGroup}>
                            <span className={styles.commentAuthor}>
                                {isReply && '↳ '}{comment.writerName}
                            </span>
                            {mine && <span className={styles.myBadge}>내 댓글</span>}
                            {post.loginId && comment.loginId === post.loginId && post.category !== '익명' && (
                                <span className={styles.myBadge}>작성자</span>
                            )}
                        </div>
                        <span className={styles.commentDate}>
                            {formatDate(comment.createdAt)}
                            {edited && <span className={styles.editedMark}>(수정됨)</span>}
                        </span>
                    </div>
                )}

                {editing ? (
                    <div className={styles.editForm}>
                        <textarea
                            className={styles.editTextarea}
                            value={editText}
                            maxLength={MAX_COMMENT}
                            autoFocus
                            onChange={(e) => setEditText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Escape' && cancelEdit()}
                        />
                        <div className={styles.editButtons}>
                            <span className={styles.editCount}>{editText.length}/{MAX_COMMENT}자</span>
                            <button type="button" className={styles.editCancelBtn} onClick={cancelEdit}>
                                취소
                            </button>
                            <button
                                type="button"
                                className={styles.editSaveBtn}
                                disabled={submitting}
                                onClick={() => handleUpdateComment(comment)}
                            >
                                수정 완료
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className={styles.commentBody}>{comment.content}</div>
                )}

                {!deleted && !editing && (
                    <div className={styles.commentActions}>
                        {/* 대댓글은 1단계까지만 → 부모 댓글에만 답글 버튼 */}
                        {!isReply && (
                            <button
                                type="button"
                                className={styles.commentActionLink}
                                onClick={() => toggleReply(comment.postCommentSeq)}
                            >
                                {replyToId === comment.postCommentSeq ? '답글 취소' : '답글 달기'}
                            </button>
                        )}
                        {mine && (
                            <>
                                <button
                                    type="button"
                                    className={styles.commentActionLink}
                                    onClick={() => startEdit(comment)}
                                >
                                    수정
                                </button>
                                <button
                                    type="button"
                                    className={`${styles.commentActionLink} ${styles.commentActionDanger}`}
                                    onClick={() => handleDeleteComment(comment)}
                                >
                                    삭제
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        );
    };

    /* ===================== 화면 ===================== */

    // 글이 없을 때
    if (!post) {
        return (
            <div className={styles.detailCard}>
                <div className={styles.emptyState}>
                    <i className="fa-regular fa-circle-question"></i>
                    <span>게시글을 찾을 수 없거나 이미 삭제되었습니다.</span>
                    <Link to="/post/free" className={`${styles.backToListBtn} ${styles.emptyBackBtn}`}>
                        자유게시판 목록으로 돌아가기
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.detailCard}>
            {/* 헤더 */}
            <div className={styles.detailHeader}>
                <div>
                    <span className={styles.categoryBadge}>{post.category}</span>
                    <h1 className={styles.detailTitle}>{post.title}</h1>
                    <div className={styles.detailMeta}>
                        <span>작성자: <strong>{post.writerName}</strong></span>
                        <span>·</span>
                        <span>등록일시: <strong>{formatDate(post.createdAt)}</strong></span>
                        <span>·</span>
                        <span>조회수: <strong>{post.viewCount}</strong></span>
                        <span>·</span>
                        <span>추천수: <strong className={styles.recommendStrong}>{post.recommendCount}</strong></span>
                    </div>
                </div>

                <Link to="/post/free" className={styles.backToListBtn}>
                    <i className="fa-solid fa-arrow-left"></i> 목록으로
                </Link>
            </div>

            {/* 본문 */}
            <div className={styles.detailContent}>{post.content}</div>

            {/* 첨부파일 목록 */}
            {files.length > 0 && (
                <div className={styles.attachedFileBox}>
                    <strong>
                        <i className="fa-solid fa-paperclip"></i> 첨부파일 {files.length}개
                    </strong>
                    {files.map((f) => (
                        <div key={f.postFileSeq} className={styles.attachedFileRow}>
                            <i className={f.fileType === 'IMAGE' ? 'fa-regular fa-image' : 'fa-regular fa-file-pdf'}></i>
                            <a
                                href="#"
                                className={styles.attachedFileLink}
                                onClick={(e) => { e.preventDefault(); handleDownLoad(f); }}
                                title="클릭하면 다운로드됩니다"
                            >
                                {f.originalName}
                            </a>
                            <span className={styles.attachedFileSize}>({Math.ceil(f.fileSize / 1024)}KB)</span>
                        </div>
                    ))}
                </div>
            )}

            {/* 추천 버튼 */}
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

            {/* 하단 버튼 */}
            <div className={styles.detailActionButtons}>
                <Link to="/post/free" className={styles.backToListBtn}>
                    <i className="fa-solid fa-list"></i> 목록으로 이동
                </Link>

                {isMine && (
                    <button type="button" className={styles.deletePostBtn} onClick={handleDeletePost}>
                        <i className="fa-solid fa-trash-can"></i> 게시글 삭제
                    </button>
                )}
            </div>

            {/* 댓글 영역 */}
            <div className={styles.commentSection}>
                <div className={styles.commentTitle}>
                    <i className="fa-regular fa-comment-dots"></i>
                    <span>댓글 {post.commentCount || 0}</span>
                </div>

                <div className={styles.commentList}>
                    {comments.length > 0 ? (
                        comments.map((comment) => (
                            <div key={comment.postCommentSeq} className={styles.commentList}>
                                {/* 부모 댓글 */}
                                {renderComment(comment)}

                                {/* 대댓글 목록 */}
                                {comment.replies?.map((reply) => (
                                    <div key={reply.postCommentSeq}>{renderComment(reply, true)}</div>
                                ))}

                                {/* 대댓글 입력창 */}
                                {replyToId === comment.postCommentSeq && (
                                    <div className={`${styles.commentForm} ${styles.replyForm}`}>
                                        <input
                                            type="text"
                                            className={styles.commentInput}
                                            placeholder={`${comment.writerName}님에게 답글을 작성하세요...`}
                                            value={replyText}
                                            maxLength={MAX_COMMENT}
                                            autoFocus
                                            onChange={(e) => setReplyText(e.target.value)}
                                            onKeyDown={(e) => isEnter(e) && handleAddReply(comment.postCommentSeq)}
                                        />
                                        <button
                                            type="button"
                                            className={styles.commentSubmitBtn}
                                            disabled={submitting}
                                            onClick={() => handleAddReply(comment.postCommentSeq)}
                                        >
                                            답글 등록
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className={styles.commentEmpty}>
                            등록된 댓글이 없습니다. 첫 번째 댓글을 남겨보세요!
                        </div>
                    )}
                </div>

                {/* 새 댓글 작성 */}
                <div className={styles.commentForm}>
                    <input
                        type="text"
                        className={styles.commentInput}
                        placeholder={token ? '매너 있고 따뜻한 댓글을 남겨주세요' : '로그인 후 댓글을 작성할 수 있습니다'}
                        value={commentText}
                        maxLength={MAX_COMMENT}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyDown={(e) => isEnter(e) && handleAddComment()}
                    />
                    <button
                        type="button"
                        className={styles.commentSubmitBtn}
                        disabled={submitting}
                        onClick={handleAddComment}
                    >
                        댓글 등록
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PostDetail;
