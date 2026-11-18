import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import styles from './post.module.css';
import Client from '../../api/client';
import useAuthStore from '../../stores/useAuthStore';
/* =========================================================
   실루엣 게시글 상세 컴포넌트 (PostDetail) - 담당: 권형석
   - 경로: /post/detail/:id
   - B001 게시글 상세 조회 (조회수 증가, 본문)
   - 추천 토글 (1인 1회)
   - 댓글 / 대댓글 작성
   - 본인 글 삭제
   ========================================================= */

function PostDetail() {
    const { id } = useParams();   // 주소의 글 번호 (/post/detail/5 → "5")
    const [files, setFiles]= useState([]);

    
    const handleDeletePost = async()=>{
        if(!token){
            alert('로그인한 회원만 삭제가능합니다.');
            navigate('/login');
            return;
        }
        if(!window.confirm('게시글을 삭제하시겠습니까?')){
            return; //취소 누르면 변화없음
        }
        try{
            await Client.delete(`/api/posts/${id}`,{
                params: {loginId},
            }),
            alert('게시글이 삭제되었습니다.');
            navigate('/post/free');
        }catch(err){
            console.error(err);
            alert('게시글을 삭제할 수 없습니다.')
        }
    };

    const {id: loginId, token} = useAuthStore();
    
    const navigate= useNavigate();

    const handleDownLoad=async (file)=>{
        if(!token){
            alert('로그인한 회원만 다운로드할 수 있습니다.');
            navigate('/login');
            return;
        }
        try{
            //2) 서버에 파일 요청(파일 덩어리로 받기)
            const res= await Client.get(`/api/posts/files/${file.postFileSeq}/download`,{
                params:{loginId},
                responseType: 'blob',
        })
        const url= window.URL.createObjectURL(res.data);

        const a= document.createElement('a');
        a.href= url;
        a.download= file.originalName;
        document.body.appendChild(a);
        a.click();

        a.remove();
        window.URL.revokeObjectURL(url);
    }catch(err){
        console.error(err);
        alert('다운로드에 실패했습니다.')
        }

    };

    

    // 서버에서 받아올 데이터 (지금은 비어 있음)
    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);

    useEffect(()=>{
        Client.get(`/api/posts/${id}/files`)
            .then((res)=> {
                console.log("첨부파일: ", res.data);
                setFiles(res.data)})
            .catch((err)=> console.log(err));
    },[id]);

    useEffect(() => {
        Client.get(`/api/posts/${id}`)
        .then((res) => setPost(res.data))
        .catch((err) => { console.error(err);
        setPost(null);
        });
    }, [id]);

    // 화면 상태
    const [hasLiked, setHasLiked] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [replyToId, setReplyToId] = useState(null);
    const [replyText, setReplyText] = useState('');

   const isMine = !!loginId && post?.loginId === loginId;
    console.log('로그인 아이디:', loginId, '/ 글쓴이 아이디:', post?.loginId, '/ isMine:', isMine);
    // ===== 서버 연동 예정 함수들 =====
    const handleToggleLike = () => {};
    const handleAddComment = () => {};
    const handleAddReply = (parentSeq) => {};
   



    // ===== 서버 연동 예정 함수들 =====
   

    // 글이 없을 때
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
                        <span>등록일시: <strong>{post.createdAt}</strong></span>
                        <span>·</span>
                        <span>조회수: <strong>{post.viewCount}</strong></span>
                        <span>·</span>
                        <span>추천수: <strong style={{ color: '#f472b6' }}>{post.recommendCount}</strong></span>
                    </div>
                </div>

                <Link to="/post/free" className={styles.backToListBtn}>
                    <i className="fa-solid fa-arrow-left"></i> 목록으로
                </Link>
            </div>

            {/* 본문 */}
            <div className={styles.detailContent}>
                {post.content}
            </div>

            {/* 첨부파일 목록 */}
            {files.length > 0 && (
                <div className={styles.attachedFileBox} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                    <strong>
                        <i className="fa-solid fa-paperclip"></i> 첨부파일 {files.length}개
                    </strong>
                    {files.map((f)=>(
                        <div key={f.postFileSeq} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88rem' }}>
                            <i className={f.fileType === 'IMAGE' ? 'fa-regular fa-image' : 'fa-regular fa-file-pdf'}></i>
                            <a
                                href="#" onClick={(e)=>{e.preventDefault(); handleDownLoad(f);}}
                                style={{ color: 'var(--text-main)', textDecoration: 'underline', cursor: 'pointer' }}
                                title="클릭하면 다운로드됩니다"
                                >{f.originalName}</a>


                            <span style={{color: 'var(--text-dim)', fontSize: '0.78rem'}}>
                                ({Math.ceil(f.fileSize / 1024)}KB)
                            </span>
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

                    

            {/* 댓글 영역 */}
                <div className={styles.commentSection}>
                    <div className={styles.commentTitle}>
                        <i className="fa-regular fa-comment-dots"></i>
                        <span>댓글 {post.commentCount || 0}</span>
                    </div>

                    <div className={styles.commentList}>
                        {comments.length > 0 ? (
                            comments.map((comment) => (
                                <div key={comment.postCommentSeq} className={styles.commentItem}>
                                    <div className={styles.commentAuthorBar}>
                                        <span className={styles.commentAuthor}>{comment.writerName}</span>
                                        <span className={styles.commentDate}>{comment.createdAt}</span>
                                    </div>
                                    <div className={styles.commentBody}>{comment.content}</div>
                                    <div className={styles.commentActions}>
                                        <button
                                            type="button"
                                            className={styles.commentActionLink}
                                            onClick={() => setReplyToId(replyToId === comment.postCommentSeq ? null : comment.postCommentSeq)}
                                        >
                                            답글 달기
                                        </button>
                                    </div>


                                    {/* 대댓글 목록 */}
                                    {comment.replies && comment.replies.map((reply) => (
                                        <div key={reply.postCommentSeq} className={`${styles.commentItem} ${styles.replyItem}`}>
                                            <div className={styles.commentAuthorBar}>
                                                <span className={styles.commentAuthor}>↳ {reply.writerName}</span>
                                                <span className={styles.commentDate}>{reply.createdAt}</span>
                                            </div>
                                            <div className={styles.commentBody}>{reply.content}</div>
                                        </div>
                                    ))}

                                    {/* 대댓글 입력창 */}
                                    {replyToId === comment.postCommentSeq && (
                                        <div className={styles.commentForm}>
                                            <input
                                                type="text"
                                                className={styles.commentInput}
                                                placeholder="답글을 작성하세요..."
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleAddReply(comment.postCommentSeq)}
                                            />
                                            <button
                                                type="button"
                                                className={styles.commentSubmitBtn}
                                                onClick={() => handleAddReply(comment.postCommentSeq)}
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

                    {/* 새 댓글 작성 */}
                    <div className={styles.commentForm}>
                        <input
                            type="text"
                            className={styles.commentInput}
                            placeholder="매너 있고 따뜻한 댓글을 남겨주세요"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                        />
                        <button type="button" className={styles.commentSubmitBtn} onClick={handleAddComment}>
                            댓글 등록
                        </button>
                    </div>
                </div>
            </div>
            );
}

            export default PostDetail;