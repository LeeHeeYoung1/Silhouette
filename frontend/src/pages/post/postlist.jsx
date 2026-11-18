import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './post.module.css';
import Client from '../../api/client';
/* =========================================================
   실루엣 게시판 목록 컴포넌트 (PostList) - 담당: 권형석
   - B001 자유게시판 리스트 (/post/free)
   - B002 공지사항 리스트 (/post/notice)
   - FAQ 리스트 (/post/faq)
   - Q&A 리스트 (/post/qna)
   ========================================================= */

function PostList({ boardType = 'free' }) {
    const navigate = useNavigate();

   
  
    
    
    const [posts, setposts]= useState([]);
 // 자유게시판 카테고리 탭
    const [subCategory, setSubCategory] = useState('전체');


    useEffect(()=>{
        if(boardType !== 'free') return;

        Client.get('/api/posts', {
            params: subCategory === '전체' ? {} : {category: subCategory} 
        })
        .then((res)=> setposts(res.data)).catch((err)=> console.error(err));
    }, [boardType, subCategory]);

     // 페이징
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = 1;


    const qnaList = [];
    const faqList = [];

   

    // 검색 입력값
    const [searchType, setSearchType] = useState('title');
    const [searchKeyword, setSearchKeyword] = useState('');

    // FAQ 아코디언 열림 상태
    const [openFaqId, setOpenFaqId] = useState(null);

  

    // 새글 작성 이동
    const handleGoWrite = () => {
        if (boardType === 'notice') navigate('/post/notice/write');
        else if (boardType === 'qna') navigate('/post/qna/write');
        else navigate('/post/free/write');
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* 상단 액션 바 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                {boardType === 'free' ? (
                    <div className={styles.subCategoryBar}>
                        {['전체', '자유', '연애고민', '데이트후기', '익명'].map((cat) => (
                            <button
                                key={cat}
                                type="button"
                                className={`${styles.categoryChip} ${subCategory === cat ? styles.categoryChipActive : ''}`}
                                onClick={() => { setSubCategory(cat); setCurrentPage(1); }}
                            >
                                {cat === '익명' ? '🎭 익명' : cat}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div style={{ fontSize: '0.92rem', color: 'var(--text-sub)' }}>
                        {boardType === 'notice' && '📢 실루엣 공식 공지사항 및 업데이트 소식 목록입니다.'}
                        {boardType === 'faq' && '❓ 회원님들이 자주 문의하시는 질문과 답변입니다.'}
                        {boardType === 'qna' && '🔒 실루엣 고객센터 1:1 비밀 문의 내역입니다.'}
                    </div>
                )}

                {boardType !== 'faq' && (
                    <button type="button" className={styles.writeBtn} onClick={handleGoWrite}>
                        <i className="fa-solid fa-pen-nib"></i>
                        {boardType === 'notice' ? '공지사항 새글 작성'
                            : boardType === 'qna' ? '1:1 문의 작성'
                            : '새글 작성하기'}
                    </button>
                )}
            </div>

            {/* 검색 바 (자유게시판, 공지사항) */}
            {(boardType === 'free' || boardType === 'notice') && (
                <div className={styles.searchSection}>
                    <div className={styles.searchInputs}>
                        <select
                            className={styles.selectBox}
                            value={searchType}
                            onChange={(e) => setSearchType(e.target.value)}
                        >
                            <option value="title">제목</option>
                            <option value="content">내용</option>
                            <option value="author">작성자</option>
                        </select>
                        <input
                            type="text"
                            className={styles.searchInput}
                            placeholder="검색어를 입력해 주세요..."
                            value={searchKeyword}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                        />
                        <button type="button" className={styles.searchBtn} onClick={() => setCurrentPage(1)}>
                            <i className="fa-solid fa-magnifying-glass"></i> 검색
                        </button>
                    </div>
                    <div className={styles.totalCount}>
                        총 <strong>{posts.length}</strong>개의 게시글
                    </div>
                </div>
            )}

            {/* 1. 자유게시판 / 공지사항 리스트 */}
            {(boardType === 'free' || boardType === 'notice') && (
                <>
                    <div className={styles.tableContainer}>
                        <table className={styles.postTable}>
                            <thead>
                                <tr>
                                    <th style={{ width: '80px', textAlign: 'center' }}>번호</th>
                                    <th style={{ width: '100px' }}>카테고리</th>
                                    <th>제목</th>
                                    <th style={{ width: '130px' }}>작성자</th>
                                    <th style={{ width: '140px' }}>작성일시</th>
                                    <th style={{ width: '80px', textAlign: 'center' }}>조회</th>
                                    <th style={{ width: '80px', textAlign: 'center' }}>추천</th>
                                </tr>
                            </thead>
                            <tbody>
                                {posts.length > 0 ? (
                                    posts.map((post) => (
                                        <tr
                                            key={post.postSeq}
                                            className={styles.postRow}
                                            onClick={() => navigate(`/post/detail/${post.postSeq}`)}
                                        >
                                            <td style={{ textAlign: 'center' }}>{post.postSeq}</td>
                                            <td>
                                                <span className={styles.categoryBadge}>{post.category}</span>
                                            </td>
                                            <td>
                                                <div className={styles.postTitle}>
                                                    <span>{post.title}</span>
                                                    {post.commentCount > 0 && (
                                                        <span className={styles.commentCount}>[{post.commentCount}]</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>{post.writerName}</td>
                                            <td style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>{post.createdAt}</td>
                                            <td style={{ textAlign: 'center' }}>{post.viewCount}</td>
                                            <td style={{ textAlign: 'center', color: '#f472b6', fontWeight: 600 }}>{post.recommendCount}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7}>
                                            <div className={styles.emptyState}>
                                                <i className="fa-regular fa-folder-open"></i>
                                                <span>등록된 게시글이 없습니다.</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* 페이징 */}
                    {totalPages > 1 && (
                        <div className={styles.pagination}>
                            <button
                                type="button"
                                className={styles.pageBtn}
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            >
                                이전
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                                <button
                                    key={num}
                                    type="button"
                                    className={`${styles.pageBtn} ${currentPage === num ? styles.pageBtnActive : ''}`}
                                    onClick={() => setCurrentPage(num)}
                                >
                                    {num}
                                </button>
                            ))}
                            <button
                                type="button"
                                className={styles.pageBtn}
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            >
                                다음
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* 2. FAQ 아코디언 */}
            {boardType === 'faq' && (
                <div className={styles.faqList}>
                    {faqList.length > 0 ? (
                        faqList.map((faq) => {
                            const isOpen = openFaqId === faq.faqSeq;
                            return (
                                <div key={faq.faqSeq} className={styles.faqItem}>
                                    <div
                                        className={styles.faqQuestion}
                                        onClick={() => setOpenFaqId(isOpen ? null : faq.faqSeq)}
                                    >
                                        <div>
                                            <span className={styles.faqQMark}>Q.</span>
                                            <span>{faq.question}</span>
                                        </div>
                                        <i className={`fa-solid ${isOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`} style={{ color: 'var(--text-dim)' }}></i>
                                    </div>
                                    {isOpen && (
                                        <div className={styles.faqAnswer}>{faq.answer}</div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className={styles.emptyState}>
                            <i className="fa-regular fa-folder-open"></i>
                            <span>등록된 FAQ가 없습니다.</span>
                        </div>
                    )}
                </div>
            )}

            {/* 3. Q&A 리스트 */}
            {boardType === 'qna' && (
                <div className={styles.tableContainer}>
                    <table className={styles.postTable}>
                        <thead>
                            <tr>
                                <th style={{ width: '80px', textAlign: 'center' }}>상태</th>
                                <th>질문 제목</th>
                                <th style={{ width: '120px' }}>작성자</th>
                                <th style={{ width: '140px' }}>등록일시</th>
                            </tr>
                        </thead>
                        <tbody>
                            {qnaList.length > 0 ? (
                                qnaList.map((qna) => (
                                    <tr key={qna.qnaSeq} className={styles.postRow}>
                                        <td style={{ textAlign: 'center' }}>
                                            {qna.answerStatus === 'DONE' ? (
                                                <span className={styles.answerDone}>답변완료</span>
                                            ) : (
                                                <span className={styles.answerPending}>답변대기</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className={styles.postTitle}>
                                                {qna.isSecret === 'Y' && (
                                                    <i className={`fa-solid fa-lock ${styles.secretBadge}`} title="비밀글"></i>
                                                )}
                                                <span>{qna.title}</span>
                                            </div>
                                        </td>
                                        <td>{qna.writerName}</td>
                                        <td style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>{qna.createdAt}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4}>
                                        <div className={styles.emptyState}>
                                            <i className="fa-regular fa-folder-open"></i>
                                            <span>등록된 문의가 없습니다.</span>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default PostList;