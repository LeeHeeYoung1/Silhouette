import styles from './post.module.css';
import axios from 'axios';
import { useState } from 'react';

/* =========================================================
   실루엣 게시판(Post) 통합 컴포넌트 (B001, B002) - 담당: 권형석
   - 컴포넌트명: Post (첫글자 대문자)
   - 경로: pages/post/post.jsx (소문자)
   ---------------------------------------------------------
   - 상태(useState)·이벤트·데이터 없이 화면 모양만 남긴 버전
   - 기본으로 보이는 화면: 게시글 목록 (Post)
   - 나머지 화면은 아래에 컴포넌트로 따로 떼어둠 (필요할 때 Post 안에 넣어서 사용)
       · FaqList          : FAQ 아코디언
       · QnaTable         : 1:1 Q&A 목록
       · PostDetailModal  : 게시글 상세 + 댓글
       · QnaDetailModal   : Q&A 상세 + 관리자 답변
       · WriteModal       : 새 글 / 문의 작성
   ========================================================= */

const categories = ['전체', '자유', '연애고민', '데이트후기', '익명'];

function Post() {
    return (
        <div className={styles.postContainer}>
            <div className={styles.postInner}>
                {/* 상단 헤더 & 글쓰기 버튼 */}
                <div className={styles.headerSection}>
                    <div className={styles.titleArea}>
                        <h1>
                            <span>🌙</span> 실루엣 라운지 & 게시판 (Post)
                        </h1>
                        <p>자유로운 이야기, 연애 상담 및 공지사항과 1:1 고객센터를 이용하세요.</p>
                    </div>
                    <button type="button" className={styles.writeBtn}>
                        <i className="fa-solid fa-pen-nib"></i>
                        새 글 작성하기
                    </button>
                </div>

                {/* 메인 탭 */}
                <nav className={styles.tabNav}>
                    <button type="button" className={`${styles.tabBtn} ${styles.tabBtnActive}`}>💬 자유 게시판 (B001)</button>
                    <button type="button" className={styles.tabBtn}>📢 공지사항 (B002)</button>
                    <button type="button" className={styles.tabBtn}>❓ 자주 묻는 질문 (FAQ)</button>
                    <button type="button" className={styles.tabBtn}>🔒 1:1 Q&A 문의 (B002, A004)</button>
                </nav>

                {/* 자유게시판 서브 카테고리 */}
                <div className={styles.subCategoryBar}>
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            type="button"
                            className={`${styles.categoryChip} ${cat === '전체' ? styles.categoryChipActive : ''}`}
                        >
                            {cat === '익명' ? '🎭 익명' : cat}
                        </button>
                    ))}
                </div>

                {/* 검색 바 */}
                <div className={styles.searchSection}>
                    <div className={styles.searchInputs}>
                        <select className={styles.selectBox}>
                            <option value="title">제목</option>
                            <option value="content">내용</option>
                            <option value="author">작성자</option>
                        </select>
                        <input type="text" className={styles.searchInput} placeholder="검색어를 입력해 주세요..." />
                        <button type="button" className={styles.searchBtn}>
                            <i className="fa-solid fa-magnifying-glass"></i> 검색
                        </button>
                    </div>
                    <div className={styles.totalCount}>
                        총 <strong>0</strong>개의 게시글
                    </div>
                </div>

                {/* 게시글 목록 */}
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
                            {/* 게시글 한 줄 모양 (데이터가 생기면 이 tr 을 반복)
                            <tr className={styles.postRow}>
                                <td style={{ textAlign: 'center' }}>1</td>
                                <td><span className={styles.categoryBadge}>자유</span></td>
                                <td>
                                    <div className={styles.postTitle}>
                                        <span>제목</span>
                                        <i className={`fa-solid fa-paperclip ${styles.fileIcon}`}></i>
                                        <span className={styles.commentCount}>[0]</span>
                                    </div>
                                </td>
                                <td>작성자</td>
                                <td style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>작성일시</td>
                                <td style={{ textAlign: 'center' }}>0</td>
                                <td style={{ textAlign: 'center', color: '#f472b6', fontWeight: 600 }}>0</td>
                            </tr>
                            */}
                            <tr>
                                <td colSpan={7}>
                                    <div className={styles.emptyState}>
                                        <i className="fa-regular fa-folder-open"></i>
                                        <span>조건에 맞는 게시글이 없습니다.</span>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* 페이징 */}
                <div className={styles.pagination}>
                    <button type="button" className={styles.pageBtn}>이전</button>
                    <button type="button" className={`${styles.pageBtn} ${styles.pageBtnActive}`}>1</button>
                    <button type="button" className={styles.pageBtn}>다음</button>
                </div>
            </div>
        </div>
    );
}

/* ---------- FAQ 아코디언 ---------- */
export function FaqList() {
    return (
        <div className={styles.faqList}>
            <div className={styles.faqItem}>
                <div className={styles.faqQuestion}>
                    <div>
                        <span className={styles.faqQMark}>Q.</span>
                        <span>질문 내용</span>
                    </div>
                    <i className="fa-solid fa-chevron-down" style={{ color: 'var(--text-dim)' }}></i>
                </div>
                <div className={styles.faqAnswer}>
                    <div style={{ color: '#d8b4fe', fontWeight: 700, marginBottom: 6 }}>실루엣 고객만족센터 가이드</div>
                    답변 내용
                </div>
            </div>
        </div>
    );
}

/* ---------- Q&A 목록 ---------- */
export function QnaTable() {
    return (
        <div className={styles.tableContainer}>
            <table className={styles.postTable}>
                <thead>
                    <tr>
                        <th style={{ width: '80px', textAlign: 'center' }}>상태</th>
                        <th style={{ width: '120px' }}>문의유형</th>
                        <th>질문 제목</th>
                        <th style={{ width: '120px' }}>작성자</th>
                        <th style={{ width: '140px' }}>등록일시</th>
                    </tr>
                </thead>
                <tbody>
                    <tr className={styles.postRow}>
                        <td style={{ textAlign: 'center' }}>
                            <span className={styles.answerPending}>답변대기</span>
                            {/* 답변 완료일 때: <span className={styles.answerDone}>답변완료</span> */}
                        </td>
                        <td><span className={styles.categoryBadge}>문의유형</span></td>
                        <td>
                            <div className={styles.postTitle}>
                                <i className={`fa-solid fa-lock ${styles.secretBadge}`} title="비밀글"></i>
                                <span>질문 제목</span>
                            </div>
                        </td>
                        <td>작성자</td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>등록일시</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}

/* ---------- 게시글 상세 모달 ---------- */
export function PostDetailModal() {
    return (
        <div className={styles.modalOverlay}>
            <div className={styles.detailModalWindow}>
                <div className={styles.detailHeader}>
                    <div>
                        <span className={styles.categoryBadge}>카테고리</span>
                        <h2 className={styles.detailTitle}>게시글 제목</h2>
                        <div className={styles.detailMeta}>
                            <span>작성자: <strong>작성자</strong></span>
                            <span>·</span>
                            <span>작성일시</span>
                            <span>·</span>
                            <span>조회수 0</span>
                        </div>
                    </div>
                    <button type="button" className={styles.modalCloseBtn}>&times;</button>
                </div>

                <div className={styles.detailContent}>본문 내용</div>

                <div className={styles.attachedFileBox}>
                    <i className="fa-solid fa-file-arrow-down"></i>
                    <span>첨부파일: <strong>파일명</strong> (클릭 시 다운로드)</span>
                </div>

                <div className={styles.likeSection}>
                    <button type="button" className={styles.likeBtn}>
                        <i className="fa-solid fa-heart"></i>
                        <span>추천 0</span>
                    </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <button type="button" className={styles.searchBtn} style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171' }}>
                        게시글 삭제
                    </button>
                </div>

                <div className={styles.commentSection}>
                    <div className={styles.commentTitle}>
                        <i className="fa-regular fa-comment-dots"></i>
                        <span>댓글 0</span>
                    </div>

                    <div className={styles.commentList}>
                        <div className={styles.commentItem}>
                            <div className={styles.commentAuthorBar}>
                                <span className={styles.commentAuthor}>댓글 작성자</span>
                                <span className={styles.commentDate}>작성일시</span>
                            </div>
                            <div className={styles.commentBody}>댓글 내용</div>
                            <div className={styles.commentActions}>
                                <button type="button" className={styles.commentActionLink}>답글 달기</button>
                            </div>

                            {/* 대댓글 */}
                            <div className={`${styles.commentItem} ${styles.replyItem}`}>
                                <div className={styles.commentAuthorBar}>
                                    <span className={styles.commentAuthor}>↳ 답글 작성자</span>
                                    <span className={styles.commentDate}>작성일시</span>
                                </div>
                                <div className={styles.commentBody}>답글 내용</div>
                            </div>

                            {/* 답글 입력 */}
                            <div className={styles.commentForm} style={{ marginTop: 8 }}>
                                <input type="text" className={styles.commentInput} placeholder="답글 내용을 입력하세요..." />
                                <button type="button" className={styles.commentSubmitBtn}>등록</button>
                            </div>
                        </div>
                    </div>

                    <div className={styles.commentForm}>
                        <input type="text" className={styles.commentInput} placeholder="따뜻한 댓글을 남겨주세요 (비속어 필터 적용)" />
                        <button type="button" className={styles.commentSubmitBtn}>댓글 등록</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ---------- Q&A 상세 모달 ---------- */
export function QnaDetailModal() {
    return (
        <div className={styles.modalOverlay}>
            <div className={styles.detailModalWindow}>
                <div className={styles.detailHeader}>
                    <div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                            <span className={styles.categoryBadge}>문의유형</span>
                            <span className={styles.answerPending}>답변대기</span>
                        </div>
                        <h2 className={styles.detailTitle}>
                            <i className={`fa-solid fa-lock ${styles.secretBadge}`}></i>
                            질문 제목
                        </h2>
                        <div className={styles.detailMeta}>
                            <span>작성자: 작성자</span>
                            <span>·</span>
                            <span>등록일시</span>
                        </div>
                    </div>
                    <button type="button" className={styles.modalCloseBtn}>&times;</button>
                </div>

                <div className={styles.detailContent} style={{ background: 'var(--bg-input)', padding: 18, borderRadius: 10 }}>
                    <div style={{ fontWeight: 700, color: '#c084fc', marginBottom: 6 }}>문의 내용</div>
                    문의 내용
                </div>

                <div style={{ marginTop: 10 }}>
                    <div style={{ fontWeight: 700, color: '#34d399', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <i className="fa-solid fa-shield-halved"></i> 관리자 답변 (A004)
                    </div>
                    <div style={{ color: 'var(--text-dim)', fontSize: '0.88rem', padding: 12 }}>
                        현재 관리자가 문의 내용을 확인 중입니다. 빠른 시일 내에 답변드리겠습니다.
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ---------- 새 글 / 문의 작성 모달 ---------- */
export function WriteModal() {
    return (
        <div className={styles.modalOverlay}>
            <div className={styles.writeModalWindow}>
                <div className={styles.detailHeader}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>✍ 새 게시글 작성 (B001)</h2>
                    <button type="button" className={styles.modalCloseBtn}>&times;</button>
                </div>

                <div className={styles.writeFormGroup}>
                    <label className={styles.writeLabel}>카테고리 선택</label>
                    <select className={styles.selectBox}>
                        <option value="자유">자유</option>
                        <option value="연애고민">연애고민</option>
                        <option value="데이트후기">데이트후기</option>
                        <option value="익명">🎭 익명 (작성자가 노출되지 않습니다)</option>
                    </select>
                </div>

                <div className={styles.writeFormGroup}>
                    <label className={styles.writeLabel}>제목</label>
                    <input type="text" className={styles.writeInput} placeholder="제목을 입력하세요" />
                </div>

                {/* Q&A 작성일 때만 사용 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" id="secretCheck" />
                    <label htmlFor="secretCheck" style={{ fontSize: '0.85rem', color: 'var(--text-sub)', cursor: 'pointer' }}>
                        비밀글로 등록 (관리자와 작성자 본인만 열람 가능)
                    </label>
                </div>

                <div className={styles.writeFormGroup}>
                    <label className={styles.writeLabel}>내용</label>
                    <textarea className={styles.writeTextarea} placeholder="내용을 작성하세요. 음란, 비방, 광고 글은 사전 통보 없이 삭제될 수 있습니다." />
                    <span className={styles.filterNotice}>* 건전한 소통을 위해 비속어 필터링(A001)이 상시 적용됩니다.</span>
                </div>

                <div className={styles.writeFormGroup}>
                    <label className={styles.writeLabel}>첨부 파일 / 사진</label>
                    <input type="file" className={styles.writeInput} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                    <button type="button" className={styles.searchBtn}>취소</button>
                    <button type="button" className={styles.writeBtn}>등록 완료</button>
                </div>
            </div>
        </div>
    );
}

export default Post;
