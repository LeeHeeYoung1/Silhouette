import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import styles from './post.module.css';

/* =========================================================
   실루엣 게시판 메인 레이아웃 (Post) - 담당: 권형석
   - B001 자유 게시판 라우팅 (/post/free)
   - 익명 게시판 라우팅 (/post/anon)
   - B002 공지 게시판 라우팅 (/post/notice, /post/faq, /post/qna)
   - 하위 콘텐츠는 Outlet을 통해 렌더링
   ========================================================= */

// 탭 공통 클래스 (지금 주소면 활성 스타일)
const tabClass = ({ isActive }) => `${styles.tabBtn} ${isActive ? styles.tabBtnActive : ''}`;

function Post() {
    const navigate = useNavigate();

    return (
        <div className={styles.postContainer}>
            <div className={styles.postInner}>
                {/* 상단 라운지 헤더 */}
                <div className={styles.headerSection}>
                    <div className={styles.titleArea} onClick={() => navigate('/post/free')}>
                        <h1>
                             실루엣 라운지 & 커뮤니티 (Post)
                        </h1>
                        <p>익명 소통, 연애 상담 및 공지사항과 1:1 고객센터를 이용하세요.</p>
                    </div>
                </div>

                {/* 메인 탭 네비게이션 (주소 이동 NavLink) */}
                <nav className={styles.tabNav}>
                    <NavLink to="/post/free" className={tabClass}>
                         자유 게시판 
                    </NavLink>
                    {/* ✅ 익명 게시판 */}
                    <NavLink to="/post/anon" className={tabClass}>
                         익명 게시판
                    </NavLink>
                    <NavLink to="/post/notice" className={tabClass}>
                         공지사항 
                    </NavLink>
                    <NavLink to="/post/faq" className={tabClass}>
                         자주 묻는 질문 (FAQ)
                    </NavLink>
                    <NavLink to="/post/qna" className={tabClass}>
                         1:1 Q&A 문의 
                    </NavLink>
                </nav>

                {/* 서브 라우트 뷰 렌더링 영역 */}
                <main>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default Post;