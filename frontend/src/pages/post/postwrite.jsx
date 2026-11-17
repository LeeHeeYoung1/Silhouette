import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';

import styles from './post.module.css';
import Client from '../../api/client';

const freeCategories=[
   {seq: '1', name: '자유'},
   {seq:'2', name:'연애고민'},
   {seq:'3', name: '데이트후기'},
   {seq:'4', name:'익명'}
] 
/* =========================================================
   실루엣 게시판 새글 작성 컴포넌트 (PostWrite) - 담당: 권형석
   - 경로:
     - /post/free/write (자유게시판 새글 작성)
     - /post/notice/write (공지사항 새글 작성)
     - /post/qna/write (1:1 문의 작성)
   - 각 주소에서 상세 작성 폼(Detail UI)이 제공됨
   ========================================================= */

function PostWrite({ writeType = 'free' }) {
    const navigate = useNavigate();
    const params = useParams();

    // writeType 결정 (props 또는 url param)
    const type = params.type || writeType;

    // 폼 상태
    const [form, setForm] = useState({
        category: freeCategories[0].seq, 
        title: '',
        content: '',
        isSecret: false,
        attachedFileName: ''
    });

    // 토스트 상태
    const [toast, setToast] = useState('');
    const showToast = (msg) => {
        setToast(msg);
        clearTimeout(window.__pwToastTimer);
        window.__pwToastTimer = setTimeout(() => setToast(''), 2500);
    };

    const handleSave = async () => {
        if (!form.title.trim()) {
            alert('제목을 입력해주세요.');
            return;
        }
        if (!form.content.trim()) {
            alert('내용을 입력해주세요.');
            return;
        }
        if (type === 'free') {
            const token = sessionStorage.getItem('token');
            if (!token) {
                alert('로그인이 필요합니다.');
                navigate('/login');
                return;
            }
            try {
                const res = await Client.post('/api/posts', {
                    postCategorySeq: Number(form.category),
                    title: form.title.trim(),
                    content: form.content.trim()
                });
                alert(`게시글이 등록되었습니다. (글 번호: ${res.data})`);
                navigate('/post/free');
            } catch (err) {
                console.error(err);
                alert('게시글 등록 중 오류가 발생하였습니다.');
            }
            return;
        }
    
    }
       
    return (
        <div className={styles.writeCard}>
            {/* 작성 헤더 */}
            <div className={styles.writeCardHeader}>
                <h2>
                    <i className="fa-solid fa-pen-fancy" style={{ color: '#a855f7' }}></i>
                    {type === 'notice'
                        ? '📢 공지사항 새글 작성 (Detail UI)'
                        : type === 'qna'
                        ? '🔒 1:1 고객 문의 작성 (Detail UI)'
                        : '💬 자유 게시판 새글 작성 (Detail UI)'}
                </h2>
                <Link
                    to={type === 'notice' ? '/post/notice' : type === 'qna' ? '/post/qna' : '/post/free'}
                    className={styles.cancelBtn}
                >
                    목록으로 취소
                </Link>
            </div>

            {/* 카테고리 선택 */}
            <div className={styles.writeFormGroup}>
                <label className={styles.writeLabel}>
                    <span>카테고리 구분</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>* 해당 게시판 분류를 선택하세요.</span>
                </label>
                {type === 'notice' ? (
                    <select
                        className={styles.selectBox}
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                    >
                        <option value="공지">공지사항 (일반)</option>
                        <option value="이벤트">이벤트 및 프로모션 안내 (E005)</option>
                        <option value="점검">시스템 점검 및 패치노트</option>
                    </select>
                ) : type === 'qna' ? (
                    <select
                        className={styles.selectBox}
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                    >
                        <option value="시스템문의">시스템 / 매칭 관련 문의 (MA002)</option>
                        <option value="결제/이용권">결제 및 채팅 이용권 문의 (P001, P002)</option>
                        <option value="계정/인증">계정 및 본인인증 문의 (M006)</option>
                        <option value="신고/불편접수">비매너 회원 신고 / 차단 문의 (M013)</option>
                    </select>
                ) : (
                    <select
                        className={styles.selectBox}
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                    >
                        <option value="1">자유</option>
                        <option value="2">연애고민</option>
                        <option value="3">데이트후기</option>
                        <option value="4">🎭 익명 (작성자가 마스킹 처리됩니다)</option>
                    </select>
                )}
            </div>

            {/* Q&A 비밀글 옵션 */}
            {type === 'qna' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
                    <input
                        type="checkbox"
                        id="secretCheck"
                        checked={form.isSecret}
                        onChange={(e) => setForm({ ...form, isSecret: e.target.checked })}
                    />
                    <label htmlFor="secretCheck" style={{ fontSize: '0.88rem', color: 'var(--text-sub)', cursor: 'pointer' }}>
                        🔒 비밀글로 등록 (관리자와 작성자 본인만 열람 가능)
                    </label>
                </div>
            )}

            {/* 제목 입력 */}
            <div className={styles.writeFormGroup}>
                <label className={styles.writeLabel}>
                    <span>게시글 제목</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{form.title.length}/100자</span>
                </label>
                <input
                    type="text"
                    maxLength={100}
                    className={styles.writeInput}
                    placeholder="제목을 입력해 주세요..."
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
            </div>

            {/* 작성자 정보 미리보기 */}
            <div style={{ display: 'flex', gap: 20, background: 'var(--bg-input)', padding: '12px 18px', borderRadius: 8, fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-dim)' }}>작성자: <strong style={{ color: '#fff' }}>{form.category === '4' ? '🎭 익명' : '권형석'}</strong></span>
                <span style={{ color: 'var(--text-dim)' }}>등록 게시판: <strong style={{ color: '#c084fc' }}>{type === 'notice' ? '공지사항' : type === 'qna' ? '1:1 Q&A' : '자유 게시판'}</strong></span>
            </div>

            {/* 본문 입력 */}
            <div className={styles.writeFormGroup}>
                <label className={styles.writeLabel}>
                    <span>본문 상세 내용</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{form.content.length}/3000자</span>
                </label>
                <textarea
                    maxLength={3000}
                    className={styles.writeTextarea}
                    placeholder="건전하고 따뜻한 소통을 위해 비방, 욕설, 광고성 내용은 삼가해 주세요."
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                />
                <span className={styles.filterNotice}>
                    * 비속어 필터링(A001) 및 신고 시스템(M013)이 상시 적용됩니다.
                </span>
            </div>

            {/* 첨부파일 */}
            <div className={styles.writeFormGroup}>
                <label className={styles.writeLabel}>
                    <span>첨부 파일 / 사진 첨부</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>JPG, PNG, PDF 지원</span>
                </label>
                <input
                    type="text"
                    className={styles.writeInput}
                    placeholder="첨부할 이미지나 파일명을 입력하거나 선택하세요 (예: my_date_photo.png)"
                    value={form.attachedFileName}
                    onChange={(e) => setForm({ ...form, attachedFileName: e.target.value })}
                />
            </div>

            {/* 하단 버튼 그룹 */}
            <div className={styles.writeButtonGroup}>
                <Link
                    to={type === 'notice' ? '/post/notice' : type === 'qna' ? '/post/qna' : '/post/free'}
                    className={styles.cancelBtn}
                >
                    취소하고 돌아가기
                </Link>
                <button
                    type="button"
                    className={styles.writeBtn}
                    onClick={handleSave}
                >
                    <i className="fa-solid fa-check"></i>
                    게시글 등록 완료
                </button>
            </div>

            {toast && <div className={styles.toast}>{toast}</div>}
        </div>
    );
}

export default PostWrite;
