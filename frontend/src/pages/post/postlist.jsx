import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './postlist.module.css';
import Client from '../../api/client';
/* =========================================================
   실루엣 게시판 목록 컴포넌트 (PostList) - 담당: 권형석
   - B001 자유게시판 리스트 (/post/free)
   - 익명게시판 리스트 (/post/anon)
   - B002 공지사항 리스트 (/post/notice)
   - FAQ 리스트 (/post/faq)
   - Q&A 리스트 (/post/qna)
   - 검색: 제목+내용(기본) / 제목 / 내용 / 작성자(자유게시판만)
           띄어쓴 단어가 모두 들어간 글 (AND)
   ========================================================= */

const PAGE_SIZE = 10;      // 한 페이지에 보여줄 글 수
const PAGE_GROUP = 10;     // 페이지 번호를 한 번에 몇 개 보여줄지 (1~10, 11~20 ...)
const MAX_KEYWORD = 50;    // ✅ 검색어 최대 글자 (서버와 같음)
const DEFAULT_SEARCH = { type: 'titleContent', keyword: '' };   // ✅ 검색 기본값

// 자유게시판 카테고리 탭 ('익명'은 익명게시판으로 분리돼서 빠짐)
const FREE_CATEGORIES = ['전체', '자유', '연애고민', '데이트후기'];

// 화면의 게시판 이름 → 서버에 보낼 BOARD_TYPE 값
const BOARD_TYPE_MAP = { free: 'FREE', anon: 'ANON' };

function PostList({ boardType = 'free' }) {
    const navigate = useNavigate();

    // 서버에서 글을 가져오는 게시판인지 (자유, 익명)
    const isPostBoard = boardType === 'free' || boardType === 'anon';
    const isAnon = boardType === 'anon';

    const [posts, setposts] = useState([]);
    // 자유게시판 카테고리 탭
    const [subCategory, setSubCategory] = useState('전체');

    // 페이징 상태
    const [currentPage, setCurrentPage] = useState(1);   // 지금 보는 페이지
    const [totalPages, setTotalPages] = useState(1);     // 전체 페이지 수 (서버가 알려줌)
    const [totalCount, setTotalCount] = useState(0);     // 전체 글 수 (서버가 알려줌)

    // ✅ 검색 입력칸 (타자 치는 중인 값)
    const [searchType, setSearchType] = useState(DEFAULT_SEARCH.type);
    const [searchKeyword, setSearchKeyword] = useState('');
    // ✅ 실제로 적용된 검색 (검색 버튼 / Enter를 눌러야 바뀜 → 타자 칠 때마다 요청 안 보냄)
    const [search, setSearch] = useState(DEFAULT_SEARCH);

    // FAQ 아코디언 열림 상태
    const [openFaqId, setOpenFaqId] = useState(null);

    // 게시판 탭을 바꾸면 (자유 ↔ 익명) 페이지·카테고리·검색 초기화
    useEffect(() => {
        setposts([]);
        setSubCategory('전체');
        setCurrentPage(1);
        setSearchType(DEFAULT_SEARCH.type);
        setSearchKeyword('');
        setSearch(DEFAULT_SEARCH);   // ✅
    }, [boardType]);

    // 게시판·카테고리·페이지·검색이 바뀔 때마다 그 페이지 글만 가져오기
    useEffect(() => {
        if (!isPostBoard) return;
        let cancelled = false;   // 탭을 빨리 바꾸면 늦게 온 이전 응답은 무시

        const params = {
            boardType: BOARD_TYPE_MAP[boardType],   // FREE 또는 ANON
            page: currentPage,
            size: PAGE_SIZE,
        };
        // 카테고리 필터는 자유게시판에서만
        if (!isAnon && subCategory !== '전체') params.category = subCategory;
        // ✅ 검색어가 있을 때만 보냄
        if (search.keyword) {
            params.searchType = search.type;
            params.keyword = search.keyword;
        }

        Client.get('/api/posts', { params })
            .then((res) => {
                if (cancelled) return;
                setposts(res.data.list ?? []);
                setTotalCount(res.data.totalCount ?? 0);
                setTotalPages(Math.max(1, res.data.totalPages ?? 1));
            })
            .catch((err) => {
                if (cancelled) return;
                console.error(err);
                if (err.response?.status === 400) alert('검색 조건을 다시 확인해 주세요.');
            });

        return () => { cancelled = true; };
    }, [boardType, isPostBoard, isAnon, subCategory, currentPage, search]);

    // 화면에 보여줄 글 번호 (게시판마다 1부터, 최신 글이 가장 큰 번호)
    const displayNo = (index) => totalCount - (currentPage - 1) * PAGE_SIZE - index;

    // 페이지 번호 묶음 (PAGE_GROUP=10 → 1~10, 11~20 ...)
    const startPage = Math.floor((currentPage - 1) / PAGE_GROUP) * PAGE_GROUP + 1;
    const endPage = Math.min(startPage + PAGE_GROUP - 1, totalPages);
    const pageNumbers = [];
    for (let n = startPage; n <= endPage; n++) pageNumbers.push(n);

    // 페이지 이동 (범위 밖이나 같은 페이지는 무시, 맨 위로 스크롤)
    const goPage = (num) => {
        if (num < 1 || num > totalPages || num === currentPage) return;
        setCurrentPage(num);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // ✅ 검색 실행 (빈칸이면 전체 목록)
    const handleSearch = () => {
        setSearch({ type: searchType, keyword: searchKeyword.trim() });
        setCurrentPage(1);
    };

    // ✅ 검색 초기화
    const clearSearch = () => {
        setSearchType(DEFAULT_SEARCH.type);
        setSearchKeyword('');
        setSearch(DEFAULT_SEARCH);
        setCurrentPage(1);
    };

    const qnaList = [];
    const faqList = [];

    // 새글 작성 이동
    const handleGoWrite = () => {
        if (boardType === 'notice') navigate('/post/notice/write');
        else if (boardType === 'qna') navigate('/post/qna/write');
        else if (isAnon) navigate('/post/anon/write');
        else navigate('/post/free/write');
    };

    // 목록 표에 카테고리 칸을 보여줄지 (익명게시판은 전부 '익명'이라 숨김)
    const showCategoryCol = !isAnon;
    const columnCount = showCategoryCol ? 7 : 6;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* 상단 액션 바 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                {boardType === 'free' ? (
                    <div className={styles.subCategoryBar}>
                        {FREE_CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                type="button"
                                className={`${styles.categoryChip} ${subCategory === cat ? styles.categoryChipActive : ''}`}
                                onClick={() => { setSubCategory(cat); setCurrentPage(1); }}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div style={{ fontSize: '0.92rem', color: 'var(--text-sub)' }}>
                        {isAnon && '🎭 익명 게시판입니다. 글 작성자와 댓글 작성자 모두 익명으로 표시됩니다.'}
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
                            : isAnon ? '익명으로 글쓰기'
                            : '새글 작성하기'}
                    </button>
                )}
            </div>

            {/* ✅ 검색 바 (자유게시판, 익명게시판, 공지사항) */}
            {(isPostBoard || boardType === 'notice') && (
                <div className={styles.searchSection}>
                    <div className={styles.searchInputs}>
                        <select
                            className={styles.selectBox}
                            value={searchType}
                            onChange={(e) => setSearchType(e.target.value)}
                        >
                            <option value="titleContent">제목+내용</option>
                            <option value="title">제목</option>
                            <option value="content">내용</option>
                            {/* 익명게시판은 작성자 검색 불가 (누가 썼는지 알아낼 수 있어서) */}
                            {!isAnon && <option value="author">작성자</option>}
                        </select>
                        <input
                            type="text"
                            className={styles.searchInput}
                            placeholder="검색어를 입력해 주세요 (띄어쓰기로 여러 단어 검색)"
                            value={searchKeyword}
                            maxLength={MAX_KEYWORD}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && handleSearch()}
                        />
                        <button type="button" className={styles.searchBtn} onClick={handleSearch}>
                            <i className="fa-solid fa-magnifying-glass"></i> 검색
                        </button>
                        {search.keyword && (
                            <button type="button" className={styles.searchBtn} onClick={clearSearch}>
                                초기화
                            </button>
                        )}
                    </div>
                    <div className={styles.totalCount}>
                        {search.keyword
                            ? <>"<strong>{search.keyword}</strong>" 검색 결과 <strong>{totalCount}</strong>개</>
                            : <>총 <strong>{totalCount}</strong>개의 게시글</>}
                    </div>
                </div>
            )}

            {/* 1. 자유게시판 / 익명게시판 / 공지사항 리스트 */}
            {(isPostBoard || boardType === 'notice') && (
                <>
                    <div className={styles.tableContainer}>
                        <table className={styles.postTable}>
                            <thead>
                                <tr>
                                    <th style={{ width: '80px', textAlign: 'center' }}>번호</th>
                                    {showCategoryCol && <th style={{ width: '100px' }}>카테고리</th>}
                                    <th>제목</th>
                                    <th style={{ width: '130px' }}>작성자</th>
                                    <th style={{ width: '140px' }}>작성일시</th>
                                    <th style={{ width: '80px', textAlign: 'center' }}>조회</th>
                                    <th style={{ width: '80px', textAlign: 'center' }}>추천</th>
                                </tr>
                            </thead>
                            <tbody>
                                {posts.length > 0 ? (
                                    posts.map((post, index) => (
                                        <tr
                                            key={post.postSeq}
                                            className={styles.postRow}
                                            onClick={() => navigate(`/post/detail/${post.postSeq}`)}
                                        >
                                            <td style={{ textAlign: 'center' }}>{displayNo(index)}</td>
                                            {showCategoryCol && (
                                                <td>
                                                    <span className={styles.categoryBadge}>{post.category}</span>
                                                </td>
                                            )}
                                            <td>
                                                <div className={styles.postTitle}>
                                                    <span>{post.title}</span>
                                                    {post.commentCount > 0 && (
                                                        <span className={styles.commentCount}>[{post.commentCount}]</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>{isAnon ? '🎭 익명' : post.writerName}</td>
                                            <td style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>{post.createdAt}</td>
                                            <td style={{ textAlign: 'center' }}>{post.viewCount}</td>
                                            <td style={{ textAlign: 'center', color: '#f472b6', fontWeight: 600 }}>{post.recommendCount}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={columnCount}>
                                            <div className={styles.emptyState}>
                                                <i className="fa-regular fa-folder-open"></i>
                                                {/* ✅ 검색 중이면 검색 결과 없음 문구 */}
                                                <span>
                                                    {search.keyword
                                                        ? `"${search.keyword}" 검색 결과가 없습니다.`
                                                        : '등록된 게시글이 없습니다.'}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* 페이지 네비게이트: 처음 / 이전 / 번호 10개 / 다음 / 끝 */}
                    {totalPages > 1 && (
                        <div className={styles.pagination}>
                            <button type="button" className={styles.pageBtn}
                                disabled={currentPage === 1} onClick={() => goPage(1)}>
                                처음
                            </button>
                            <button type="button" className={styles.pageBtn}
                                disabled={currentPage === 1} onClick={() => goPage(currentPage - 1)}>
                                이전
                            </button>
                            {pageNumbers.map((num) => (
                                <button
                                    key={num}
                                    type="button"
                                    className={`${styles.pageBtn} ${currentPage === num ? styles.pageBtnActive : ''}`}
                                    onClick={() => goPage(num)}
                                >
                                    {num}
                                </button>
                            ))}
                            <button type="button" className={styles.pageBtn}
                                disabled={currentPage === totalPages} onClick={() => goPage(currentPage + 1)}>
                                다음
                            </button>
                            <button type="button" className={styles.pageBtn}
                                disabled={currentPage === totalPages} onClick={() => goPage(totalPages)}>
                                끝
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