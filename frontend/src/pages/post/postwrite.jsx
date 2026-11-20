import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import styles from './postwrite.module.css';
import useAuthStore from '../../stores/useAuthStore';
import Client from '../../api/client';

/* =========================================================
   실루엣 게시판 새글 작성 (PostWrite) - 담당: 권형석
   - /post/free/write   자유게시판 (첨부파일 최대 6개)
   - /post/notice/write 공지사항 (서버 연동 전)
   - /post/qna/write    1:1 문의 (서버 연동 전)
   ========================================================= */

const MAX_FILES = 6;
const MAX_FILE_SIZE = 10 * 1024 * 1024;   // 파일당 10MB
const MAX_TOTAL_SIZE = 50 * 1024 * 1024;  // 전체 50MB

function PostWrite({ writeType = 'free' }) {
    const navigate = useNavigate();
    const params = useParams();
    const { id, token } = useAuthStore();
    const type = params.type || writeType;

    // 로그인 안 했으면 로그인 페이지로
    useEffect(() => {
        if (!token) {
            alert('로그인이 필요한 서비스입니다.');
            navigate('/login');
        }
    }, [token, navigate]);

    // 입력값
    const [form, setForm] = useState({
        category: '자유',
        title: '',
        content: '',
        isSecret: false
    });

    // 첨부파일: { file, previewUrl }
    const [files, setFiles] = useState([]);
    const fileInputRef = useRef(null);

    // 미리보기 주소 메모리 정리
    useEffect(() => {
        return () => files.forEach((f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
    }, [files]);

    // 업로드 영역 클릭 → 숨겨진 파일 선택창 열기
    const handleload = () => {
        fileInputRef.current.click();
    };

    // 파일 선택했을 때
    const handleFileChange = (e) => {
        const selected = Array.from(e.target.files);
        e.target.value = '';

        if (files.length + selected.length > MAX_FILES) {
            alert(`첨부파일은 최대 ${MAX_FILES}개까지 올릴 수 있습니다.`);
            return;
        }
        const tooBig = selected.find((f) => f.size > MAX_FILE_SIZE);
        if (tooBig) {
            alert(`"${tooBig.name}" 파일이 10MB를 넘습니다.`);
            return;
        }
        const total = [...files.map((f) => f.file), ...selected].reduce((sum, f) => sum + f.size, 0);
        if (total > MAX_TOTAL_SIZE) {
            alert('첨부파일 전체 용량은 50MB를 넘을 수 없습니다.');
            return;
        }

        const added = selected.map((file) => ({
            file,
            previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
        }));
        setFiles([...files, ...added]);
    };

    // 파일 하나 빼기
    const handleRemoveFile = (index) => {
        const target = files[index];
        if (target.previewUrl) URL.revokeObjectURL(target.previewUrl);
        setFiles(files.filter((_, i) => i !== index));
    };

    // 용량 표시 (1234567 → "1.2MB")
    const formatSize = (bytes) =>
        bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)}MB` : `${Math.ceil(bytes / 1024)}KB`;

    // 등록
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
            const formData = new FormData();
            formData.append('category', form.category);
            formData.append('title', form.title.trim());
            formData.append('content', form.content.trim());
            formData.append('loginId', id);
            files.forEach((f) => formData.append('files', f.file));

            try {
                const res = await Client.post('/api/posts', formData);
                alert(`게시글이 등록되었습니다. (글 번호: ${res.data})`);
                navigate('/post/free');
            } catch (err) {
                console.error(err);
                if (err.response?.status === 401) {
                    alert(err.response.data);
                    navigate('/login');
                } else {
                    alert('게시글 등록 중 오류가 발생하였습니다.');
                }
            }
            return;
        }

        alert('공지사항과 1:1 문의 등록은 준비 중입니다.');
    };

    const listPath = type === 'notice' ? '/post/notice' : type === 'qna' ? '/post/qna' : '/post/free';

    return (
        <div className={styles.writeCard}>
            {/* 헤더 */}
            <div className={styles.writeCardHeader}>
                <h2>
                    <i className="fa-solid fa-pen-fancy" style={{ color: '#a855f7' }}></i>
                    {type === 'notice' ? '📢 공지사항 새글 작성'
                        : type === 'qna' ? '🔒 1:1 고객 문의 작성'
                        : '💬 자유 게시판 새글 작성'}
                </h2>
                <Link to={listPath} className={styles.cancelBtn}>목록으로 취소</Link>
            </div>

            {/* 카테고리 */}
            <div className={styles.writeFormGroup}>
                <label className={styles.writeLabel}>
                    <span>카테고리 구분</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>* 해당 게시판 분류를 선택하세요.</span>
                </label>
                {type === 'notice' ? (
                    <select className={styles.selectBox} value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}>
                        <option value="공지">공지사항 (일반)</option>
                        <option value="이벤트">이벤트 및 프로모션 안내</option>
                        <option value="점검">시스템 점검 및 패치노트</option>
                    </select>
                ) : type === 'qna' ? (
                    <select className={styles.selectBox} value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}>
                        <option value="시스템문의">시스템 / 매칭 관련 문의</option>
                        <option value="결제/이용권">결제 및 채팅 이용권 문의</option>
                        <option value="계정/인증">계정 및 본인인증 문의</option>
                        <option value="신고/불편접수">비매너 회원 신고 / 차단 문의</option>
                    </select>
                ) : (
                    <select className={styles.selectBox} value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}>
                        <option value="자유">자유</option>
                        <option value="연애고민">연애고민</option>
                        <option value="데이트후기">데이트후기</option>
                        <option value="익명">🎭 익명 (작성자가 마스킹 처리됩니다)</option>
                    </select>
                )}
            </div>

            {/* QnA 비밀글 */}
            {type === 'qna' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
                    <input type="checkbox" id="secretCheck" checked={form.isSecret}
                        onChange={(e) => setForm({ ...form, isSecret: e.target.checked })} />
                    <label htmlFor="secretCheck" style={{ fontSize: '0.88rem', color: 'var(--text-sub)', cursor: 'pointer' }}>
                        🔒 비밀글로 등록 (관리자와 작성자 본인만 열람 가능)
                    </label>
                </div>
            )}

            {/* 제목 */}
            <div className={styles.writeFormGroup}>
                <label className={styles.writeLabel}>
                    <span>게시글 제목</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{form.title.length}/100자</span>
                </label>
                <input type="text" maxLength={100} className={styles.writeInput}
                    placeholder="제목을 입력해 주세요..."
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>

            {/* 작성자 미리보기 */}
            <div style={{ display: 'flex', gap: 20, background: 'var(--bg-input)', padding: '12px 18px', borderRadius: 8, fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-dim)' }}>
                    작성자: <strong style={{ color: '#fff' }}>{form.category === '익명' ? '🎭 익명' : (id || '알 수 없음')}</strong>
                </span>
                <span style={{ color: 'var(--text-dim)' }}>
                    등록 게시판: <strong style={{ color: '#c084fc' }}>{type === 'notice' ? '공지사항' : type === 'qna' ? '1:1 Q&A' : '자유 게시판'}</strong>
                </span>
            </div>

            {/* 본문 */}
            <div className={styles.writeFormGroup}>
                <label className={styles.writeLabel}>
                    <span>본문 상세 내용</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{form.content.length}/3000자</span>
                </label>
                <textarea maxLength={3000} className={styles.writeTextarea}
                    placeholder="건전하고 따뜻한 소통을 위해 비방, 욕설, 광고성 내용은 삼가해 주세요."
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })} />
            </div>

            {/* 첨부파일 (자유게시판) */}
            {type === 'free' && (
                <div className={styles.writeFormGroup}>
                    <label className={styles.writeLabel}>
                        <span>첨부 파일 / 사진</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                            {files.length}/{MAX_FILES}개 · 파일당 10MB
                        </span>
                    </label>

                    <input
                        type="file"
                        ref={fileInputRef}
                        multiple
                        accept="image/jpeg,image/png,image/gif,application/pdf"
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                    />

                    <button
                        type="button"
                        className={styles.uploadZone}
                        onClick={handleload}
                        disabled={files.length >= MAX_FILES}
                    >
                        <i className="fa-solid fa-cloud-arrow-up"></i>
                        <span className={styles.uploadMain}>
                            {files.length >= MAX_FILES ? '최대 개수에 도달했습니다' : '클릭해서 파일 선택'}
                        </span>
                        <span className={styles.uploadSub}>JPG · PNG · GIF · PDF (최대 {MAX_FILES}개)</span>
                    </button>

                    {files.length > 0 && (
                        <ul className={styles.fileList}>
                            {files.map((f, index) => (
                                <li key={`${f.file.name}-${index}`} className={styles.fileItem}>
                                    {f.previewUrl ? (
                                        <img src={f.previewUrl} alt={f.file.name} className={styles.filePreview} />
                                    ) : (
                                        <div className={styles.fileIconBox}>
                                            <i className="fa-regular fa-file-pdf"></i>
                                        </div>
                                    )}
                                    <div className={styles.fileInfo}>
                                        <span className={styles.fileName}>{f.file.name}</span>
                                        <span className={styles.fileSize}>{formatSize(f.file.size)}</span>
                                    </div>
                                    <button
                                        type="button"
                                        className={styles.fileRemoveBtn}
                                        onClick={() => handleRemoveFile(index)}
                                        title="삭제"
                                    >
                                        <i className="fa-solid fa-xmark"></i>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {/* 버튼 */}
            <div className={styles.writeButtonGroup}>
                <Link to={listPath} className={styles.cancelBtn}>취소하고 돌아가기</Link>
                <button type="button" className={styles.writeBtn} onClick={handleSave}>
                    <i className="fa-solid fa-check"></i>
                    게시글 등록 완료
                </button>
            </div>
        </div>
    );
}

export default PostWrite;