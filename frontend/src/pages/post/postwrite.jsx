import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import styles from './postwrite.module.css';
import useAuthStore from '../../stores/useAuthStore';
import Client from '../../api/client';

/* =========================================================
   실루엣 게시판 새글 작성 / 수정 (PostWrite) - 담당: 권형석
   - /post/free/write        자유게시판 새글 (첨부파일 최대 6개)
   - /post/free/edit/:id     자유게시판 글 수정
   - /post/anon/write        익명게시판 새글 (카테고리 '익명' 고정)
   - /post/anon/edit/:id     익명게시판 글 수정
   - /post/notice/write      ✅ 공지사항 새글 (관리자만)
   - /post/notice/edit/:id   ✅ 공지사항 수정 (관리자만)
   - /post/qna/write         1:1 문의 (서버 연동 전)
   ========================================================= */

const MAX_FILES = 6;
const MAX_FILE_SIZE = 10 * 1024 * 1024;   // 파일당 10MB
const MAX_TOTAL_SIZE = 50 * 1024 * 1024;  // 전체 50MB

// 화면의 게시판 이름 → 서버에 보낼 BOARD_TYPE 값
const BOARD_TYPE_MAP = { free: 'FREE', anon: 'ANON' };
const ANON_CATEGORY = '익명';

// ✅ 게시판별 제목 · 본문 최대 글자 (서버와 같음)
const LIMITS = {
    notice: { title: 60, content: 5000 },
    default: { title: 100, content: 3000 },
};

// 게시판별 첫 카테고리 값
const defaultCategory = (type) =>
    type === 'anon' ? ANON_CATEGORY
        : type === 'qna' ? '시스템문의'
        : '자유';

function PostWrite({ writeType = 'free' }) {
    const navigate = useNavigate();
    const params = useParams();
    const { id, token } = useAuthStore();       // id = 로그인 아이디
    const type = params.type || writeType;

    const isAnon = type === 'anon';
    const isNotice = type === 'notice';                  // ✅ 공지사항
    const isPostBoard = type === 'free' || isAnon;
    const limit = isNotice ? LIMITS.notice : LIMITS.default;

    // 주소에 글 번호(:id)가 있으면 수정 모드
    const postSeq = params.id;
    const isEdit = Boolean(postSeq);

    // 로그인 안 했으면 로그인 페이지로
    useEffect(() => {
        if (!token) {
            alert('로그인이 필요한 서비스입니다.');
            navigate('/login');
        }
    }, [token, navigate]);

    // ✅ 공지사항은 관리자만 (서버에서도 막지만, 화면 진입부터 차단)
    useEffect(() => {
        if (!isNotice || !token) return;
        let cancelled = false;
        Client.get('/api/members/me/role')
            .then((res) => {
                if (cancelled || res.data.admin) return;
                alert('관리자만 공지사항을 작성할 수 있습니다.');
                navigate('/post/notice', { replace: true });
            })
            .catch(() => {
                if (cancelled) return;
                navigate('/post/notice', { replace: true });
            });
        return () => { cancelled = true; };
    }, [isNotice, token, navigate]);

    // 입력값
    const [form, setForm] = useState({
        category: defaultCategory(type),
        title: '',
        content: '',
        isSecret: false,
        isPinned: false        // ✅ 공지 상단 고정
    });

    // 새글 작성 중에 게시판이 바뀌면 카테고리를 그 게시판 기본값으로
    useEffect(() => {
        if (isEdit) return;
        setForm((prev) => ({ ...prev, category: defaultCategory(type) }));
    }, [type, isEdit]);

    // 수정 모드: 기존 글 불러오기
    const [loading, setLoading] = useState(isEdit);

    useEffect(() => {
        if (!isEdit || !token || !id) return;
        let cancelled = false;

        // ✅ 공지: 관리자용 수정 조회 / 자유·익명: 본인 글 수정 조회
        const request = isNotice
            ? Client.get(`/api/notices/${postSeq}/edit`)
            : Client.get(`/api/posts/${postSeq}/edit`, { params: { loginId: id } });

        request
            .then((res) => {
                if (cancelled) return;

                if (isNotice) {
                    setForm((prev) => ({
                        ...prev,
                        title: res.data.title,
                        content: res.data.content,
                        isPinned: res.data.isPinned === 'Y'
                    }));
                    return;
                }

                // 주소와 실제 게시판이 다르면 맞는 주소로 이동
                const realType = res.data.boardType === 'ANON' ? 'anon' : 'free';
                if (realType !== type) {
                    navigate(`/post/${realType}/edit/${postSeq}`, { replace: true });
                    return;
                }

                setForm((prev) => ({
                    ...prev,
                    category: realType === 'anon' ? ANON_CATEGORY : res.data.category,
                    title: res.data.title,
                    content: res.data.content
                }));
            })
            .catch((err) => {
                if (cancelled) return;
                const status = err.response?.status;
                if (status === 403) alert(isNotice ? '관리자만 수정할 수 있습니다.' : '본인 글만 수정할 수 있습니다.');
                else if (status === 404) alert('게시글을 찾을 수 없습니다.');
                else if (status === 401) alert('로그인이 필요합니다.');
                else { console.error(err); alert('게시글을 불러오지 못했습니다.'); }
                navigate(isNotice ? `/post/notice/${postSeq}` : `/post/detail/${postSeq}`, { replace: true });
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
    }, [isEdit, isNotice, postSeq, id, token, type, navigate]);

    // 첨부파일: { file, previewUrl }
    const [files, setFiles] = useState([]);
    const fileInputRef = useRef(null);

    useEffect(() => {
        return () => files.forEach((f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
    }, [files]);

    const handleload = () => {
        fileInputRef.current.click();
    };

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

    const handleRemoveFile = (index) => {
        const target = files[index];
        if (target.previewUrl) URL.revokeObjectURL(target.previewUrl);
        setFiles(files.filter((_, i) => i !== index));
    };

    const formatSize = (bytes) =>
        bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)}MB` : `${Math.ceil(bytes / 1024)}KB`;

    const categoryToSend = isAnon ? ANON_CATEGORY : form.category;

    // ✅ 공지사항 저장 (작성 / 수정)
    const saveNotice = async () => {
        const body = {
            title: form.title.trim(),
            content: form.content.trim(),
            isPinned: form.isPinned ? 'Y' : 'N'
        };
        try {
            if (isEdit) {
                await Client.put(`/api/notices/${postSeq}`, body);
                alert('공지사항이 수정되었습니다.');
                navigate(`/post/notice/${postSeq}`, { replace: true });
            } else {
                const res = await Client.post('/api/notices', body);
                alert('공지사항이 등록되었습니다.');
                navigate(`/post/notice/${res.data.noticeSeq}`, { replace: true });
            }
        } catch (err) {
            const status = err.response?.status;
            if (status === 403) alert('관리자만 작성할 수 있습니다.');
            else if (status === 401) { alert('로그인이 필요합니다.'); navigate('/login'); }
            else if (status === 400) alert(`제목은 ${limit.title}자, 내용은 ${limit.content}자 이내로 입력해 주세요.`);
            else if (status === 404) alert('공지사항을 찾을 수 없습니다.');
            else { console.error(err); alert('공지사항 저장 중 오류가 발생하였습니다.'); }
        }
    };

    // 등록 / 수정
    const handleSave = async () => {
        if (!form.title.trim()) {
            alert('제목을 입력해주세요.');
            return;
        }
        if (!form.content.trim()) {
            alert('내용을 입력해주세요.');
            return;
        }

        // ✅ 공지사항
        if (isNotice) {
            await saveNotice();
            return;
        }

        // 자유·익명 수정
        if (isEdit) {
            try {
                await Client.put(`/api/posts/${postSeq}`, {
                    loginId: id,
                    category: categoryToSend,
                    title: form.title.trim(),
                    content: form.content.trim()
                });
                alert('게시글이 수정되었습니다.');
                navigate(`/post/detail/${postSeq}`, { replace: true });
            } catch (err) {
                const status = err.response?.status;
                if (status === 403) alert('본인 글만 수정할 수 있습니다.');
                else if (status === 404) alert('게시글을 찾을 수 없습니다.');
                else if (status === 400) alert('카테고리·제목·내용을 다시 확인해 주세요.');
                else if (status === 401) { alert('로그인이 필요합니다.'); navigate('/login'); }
                else { console.error(err); alert('게시글 수정 중 오류가 발생하였습니다.'); }
            }
            return;
        }

        // 자유·익명 새글
        if (isPostBoard) {
            const formData = new FormData();
            formData.append('boardType', BOARD_TYPE_MAP[type]);
            formData.append('category', categoryToSend);
            formData.append('title', form.title.trim());
            formData.append('content', form.content.trim());
            formData.append('loginId', id);
            files.forEach((f) => formData.append('files', f.file));

            try {
                const res = await Client.post('/api/posts', formData);
                alert(`게시글이 등록되었습니다. (글 번호: ${res.data})`);
                navigate(isAnon ? '/post/anon' : '/post/free');
            } catch (err) {
                console.error(err);
                const status = err.response?.status;
                if (status === 401) {
                    alert('로그인 정보가 없습니다. 다시 로그인해 주세요.');
                    navigate('/login');
                } else if (status === 400) {
                    alert('카테고리·제목·내용을 다시 확인해 주세요.');
                } else {
                    alert('게시글 등록 중 오류가 발생하였습니다.');
                }
            }
            return;
        }

        alert('1:1 문의 등록은 준비 중입니다.');
    };

    // 취소하면 돌아갈 곳
    const listPath = isNotice
        ? (isEdit ? `/post/notice/${postSeq}` : '/post/notice')
        : isEdit ? `/post/detail/${postSeq}`
        : isAnon ? '/post/anon'
        : type === 'qna' ? '/post/qna'
        : '/post/free';

    // 헤더 제목
    const headerTitle = isNotice
        ? (isEdit ? '📢 공지사항 수정' : '📢 공지사항 새글 작성')
        : isAnon ? (isEdit ? '🎭 익명 게시판 글 수정' : '🎭 익명 게시판 새글 작성')
        : isEdit ? '✏️ 자유 게시판 글 수정'
        : type === 'qna' ? '🔒 1:1 고객 문의 작성'
        : '💬 자유 게시판 새글 작성';

    // 등록 게시판 이름
    const boardName = isAnon ? '익명 게시판'
        : isNotice ? '공지사항'
        : type === 'qna' ? '1:1 Q&A'
        : '자유 게시판';

    if (loading) {
        return <div className={styles.writeCard}>게시글을 불러오는 중...</div>;
    }

    return (
        <div className={styles.writeCard}>
            {/* 헤더 */}
            <div className={styles.writeCardHeader}>
                <h2>
                    <i className="fa-solid fa-pen-fancy" style={{ color: 'var(--ink)' }}></i>
                    {headerTitle}
                </h2>
                <Link to={listPath} className={styles.cancelBtn}>{isEdit ? '수정 취소' : '목록으로 취소'}</Link>
            </div>

            {/* 카테고리 / 안내 */}
            {isAnon ? (
                <div style={{ background: 'var(--bg-input)', padding: '12px 18px', borderRadius: 8, fontSize: '0.88rem', color: 'var(--text-sub)', lineHeight: 1.6 }}>
                    🎭 익명 게시판에 작성하는 글은 <strong style={{ color: '#c084fc' }}>작성자와 댓글 작성자 모두 익명</strong>으로 표시됩니다.
                    <br />
                    본문이나 첨부파일 이름에 개인정보(이름, 연락처 등)를 쓰지 않도록 주의해 주세요.
                </div>
            ) : isNotice ? (
                // ✅ 공지: 카테고리 대신 상단 고정
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
                    <input type="checkbox" id="pinnedCheck" checked={form.isPinned}
                        onChange={(e) => setForm({ ...form, isPinned: e.target.checked })} />
                    <label htmlFor="pinnedCheck" style={{ fontSize: '0.88rem', color: 'var(--text-sub)', cursor: 'pointer' }}>
                        📌 상단 고정 (목록 맨 위에 항상 표시)
                    </label>
                </div>
            ) : (
                <div className={styles.writeFormGroup}>
                    <label className={styles.writeLabel}>
                        <span>카테고리 구분</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>* 해당 게시판 분류를 선택하세요.</span>
                    </label>
                    {type === 'qna' ? (
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
                        </select>
                    )}
                </div>
            )}

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
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{form.title.length}/{limit.title}자</span>
                </label>
                <input type="text" maxLength={limit.title} className={styles.writeInput}
                    placeholder="제목을 입력해 주세요..."
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>

            {/* 작성자 미리보기 */}
            <div style={{ display: 'flex', gap: 20, background: 'var(--bg-input)', padding: '12px 18px', borderRadius: 8, fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-dim)' }}>
                    작성자: <strong style={{ color: '#fff' }}>
                        {isAnon ? '🎭 익명' : isNotice ? '🛡️ 관리자' : (id || '알 수 없음')}
                    </strong>
                </span>
                <span style={{ color: 'var(--text-dim)' }}>
                    등록 게시판: <strong style={{ color: '#c084fc' }}>{boardName}</strong>
                </span>
            </div>

            {/* 본문 */}
            <div className={styles.writeFormGroup}>
                <label className={styles.writeLabel}>
                    <span>본문 상세 내용</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{form.content.length}/{limit.content}자</span>
                </label>
                <textarea maxLength={limit.content} className={styles.writeTextarea}
                    placeholder={isNotice ? '공지 내용을 입력해 주세요.' : '건전하고 따뜻한 소통을 위해 비방, 욕설, 광고성 내용은 삼가해 주세요.'}
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })} />
            </div>

            {/* 수정 모드: 첨부파일은 그대로 유지 안내 */}
            {isPostBoard && isEdit && (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', padding: '4px 0' }}>
                    📎 첨부파일은 수정되지 않고 기존 파일이 그대로 유지됩니다.
                </div>
            )}

            {/* 첨부파일 (자유·익명 새글만) */}
            {isPostBoard && !isEdit && (
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
                <Link to={listPath} className={styles.cancelBtn}>{isEdit ? '수정 취소' : '취소하고 돌아가기'}</Link>
                <button type="button" className={styles.writeBtn} onClick={handleSave}>
                    <i className="fa-solid fa-check"></i>
                    {isEdit ? '게시글 수정 완료'
                        : isAnon ? '익명으로 등록'
                        : isNotice ? '공지사항 등록'
                        : '게시글 등록 완료'}
                </button>
            </div>
        </div>
    );
}

export default PostWrite;