import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useAuthStore from '../../stores/useAuthStore';
import Client from '../../api/client';
import styles from './qna.module.css';

/* =========================================================
   1:1 Q&A 작성 · 수정 - 담당: 권형석
   - 작성: /post/qna/write   수정: /post/qna/edit/:id (답변 전만)
   - 비밀글: 비밀번호 6~30자 (숫자·영문 대소문자·특수문자 모두 허용)
   ========================================================= */

const MAX_TITLE = 50;
const MAX_CONTENT = 5000;
const PW_MIN = 6;
const PW_MAX = 30;

function QnaWrite() {
    const { id } = useParams();
    const isEdit = !!id;
    const navigate = useNavigate();
    const { token } = useAuthStore();

    const [form, setForm] = useState({
        title: '', content: '', isSecret: false, password: '', passwordConfirm: '',
    });
    const [wasSecret, setWasSecret] = useState(false);   // 수정 전 비밀글이었는지
    const [showPw, setShowPw] = useState(false);
    const [ready, setReady] = useState(false);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    // 로그인 확인 + (수정이면) 기존 내용 불러오기
    useEffect(() => {
        if (!token) {
            alert('로그인 후 문의할 수 있어요.');
            navigate('/login', { replace: true });
            return;
        }
        if (!isEdit) { setReady(true); return; }

        let cancelled = false;
        Client.get(`/api/qnas/${id}/edit`)
            .then((res) => {
                if (cancelled) return;
                const q = res.data;
                const secret = q.isSecret === 'Y';
                setForm({
                    title: q.title ?? '', content: q.content ?? '',
                    isSecret: secret, password: '', passwordConfirm: '',
                });
                setWasSecret(secret);
                setReady(true);
            })
            .catch((err) => {
                if (cancelled) return;
                const status = err.response?.status;
                if (status === 401) { alert('로그인이 필요합니다.'); navigate('/login', { replace: true }); }
                else if (status === 403) { alert('본인 문의만 수정할 수 있어요.'); navigate(`/post/qna/${id}`, { replace: true }); }
                else if (status === 409) { alert('답변이 달린 문의는 수정할 수 없어요.'); navigate(`/post/qna/${id}`, { replace: true }); }
                else if (status === 404) { alert('삭제되었거나 없는 문의입니다.'); navigate('/post/qna', { replace: true }); }
                else { console.error(err); setError('문의를 불러오지 못했습니다.'); }
            });

        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, id]);

    const setValue = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

    // 수정 화면에서 원래 비밀글이고 비밀번호를 비우면 → 기존 비밀번호 유지
    const keepOldPassword = isEdit && wasSecret && form.password === '';

    const validate = () => {
        if (!form.title.trim()) return '제목을 입력해 주세요.';
        if (form.title.trim().length > MAX_TITLE) return `제목은 ${MAX_TITLE}자까지 입력할 수 있어요.`;
        if (!form.content.trim()) return '내용을 입력해 주세요.';
        if (form.content.trim().length > MAX_CONTENT) return `내용은 ${MAX_CONTENT}자까지 입력할 수 있어요.`;
        if (form.isSecret && !keepOldPassword) {
            if (form.password.length < PW_MIN || form.password.length > PW_MAX) {
                return `비밀번호는 ${PW_MIN}~${PW_MAX}자로 입력해 주세요.`;
            }
            if (form.password !== form.passwordConfirm) return '비밀번호가 서로 달라요.';
        }
        return '';
    };

    const handleSubmit = async () => {
        const msg = validate();
        if (msg) { setError(msg); return; }

        const payload = {
            title: form.title.trim(),
            content: form.content.trim(),
            isSecret: form.isSecret ? 'Y' : 'N',
            secretPassword: form.isSecret && form.password ? form.password : null,
        };

        setSaving(true);
        setError('');
        try {
            if (isEdit) {
                await Client.put(`/api/qnas/${id}`, payload);
                alert('문의가 수정되었습니다.');
                navigate(`/post/qna/${id}`, { replace: true });
            } else {
                const res = await Client.post('/api/qnas', payload);
                alert('문의가 등록되었습니다.');
                navigate(`/post/qna/${res.data.qnaSeq}`, { replace: true });
            }
        } catch (err) {
            const status = err.response?.status;
            if (status === 401) { alert('로그인이 필요합니다.'); navigate('/login'); }
            else if (status === 409) { alert('답변이 달린 문의는 수정할 수 없어요.'); navigate(`/post/qna/${id}`); }
            else if (status === 400) setError(err.response?.data?.message || '입력값을 다시 확인해 주세요.');
            else { console.error(err); setError('저장에 실패했습니다. 잠시 후 다시 시도해 주세요.'); }
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        if (!window.confirm('작성을 취소할까요? 입력한 내용은 저장되지 않아요.')) return;
        navigate(isEdit ? `/post/qna/${id}` : '/post/qna');
    };

    if (!ready) {
        return <div className={styles.card}><p className={styles.notice}>{error || '불러오는 중...'}</p></div>;
    }

    return (
        <div className={styles.card}>
            <h2 className={styles.formTitle}>{isEdit ? '1:1 문의 수정' : '1:1 문의 작성'}</h2>

            {/* 제목 */}
            <div className={styles.field}>
                <label className={styles.label}>제목</label>
                <input type="text" className={styles.input} maxLength={MAX_TITLE}
                    placeholder="문의 제목을 입력해 주세요"
                    value={form.title} onChange={(e) => setValue('title', e.target.value)} />
                <p className={styles.counter}>{form.title.length} / {MAX_TITLE}</p>
            </div>

            {/* 내용 */}
            <div className={styles.field}>
                <label className={styles.label}>내용</label>
                <textarea className={styles.textarea} rows={10} maxLength={MAX_CONTENT}
                    placeholder="궁금한 점을 자세히 적어 주세요."
                    value={form.content} onChange={(e) => setValue('content', e.target.value)} />
                <p className={styles.counter}>{form.content.length} / {MAX_CONTENT}</p>
            </div>

            {/* 비밀글 */}
            <div className={styles.field}>
                <label className={styles.checkLabel}>
                    <input type="checkbox" checked={form.isSecret}
                        onChange={(e) => setValue('isSecret', e.target.checked)} />
                    🔒 비밀글로 작성 (작성자와 관리자, 비밀번호를 아는 사람만 볼 수 있어요)
                </label>
            </div>

            {form.isSecret && (
                <div className={styles.row}>
                    <div className={styles.field}>
                        <label className={styles.label}>비밀번호</label>
                        <input type={showPw ? 'text' : 'password'} className={styles.input}
                            maxLength={PW_MAX} autoComplete="new-password"
                            placeholder={isEdit && wasSecret ? '비우면 기존 비밀번호 유지' : `${PW_MIN}자 이상`}
                            value={form.password} onChange={(e) => setValue('password', e.target.value)} />
                        <p className={styles.hint}>{PW_MIN}~{PW_MAX}자, 숫자·영문·특수문자 모두 사용 가능</p>
                    </div>
                    <div className={styles.field}>
                        <label className={styles.label}>비밀번호 확인</label>
                        <input type={showPw ? 'text' : 'password'} className={styles.input}
                            maxLength={PW_MAX} autoComplete="new-password"
                            placeholder="한 번 더 입력"
                            disabled={keepOldPassword}
                            value={form.passwordConfirm} onChange={(e) => setValue('passwordConfirm', e.target.value)} />
                        <label className={styles.checkLabel}>
                            <input type="checkbox" checked={showPw} onChange={(e) => setShowPw(e.target.checked)} />
                            비밀번호 보기
                        </label>
                    </div>
                </div>
            )}

            {error && <p className={styles.error}>⚠️ {error}</p>}

            <div className={styles.actions}>
                <button type="button" className={styles.btnGhost} onClick={handleCancel} disabled={saving}>취소</button>
                <button type="button" className={styles.btnPrimary} onClick={handleSubmit} disabled={saving}>
                    {saving ? '저장 중...' : isEdit ? '수정하기' : '등록하기'}
                </button>
            </div>
        </div>
    );
}

export default QnaWrite;