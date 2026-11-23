import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import useAuthStore from '../../stores/useAuthStore';
import Client from '../../api/client';
import styles from './faqwrite.module.css';

/* =========================================================
   FAQ 작성 · 수정 (관리자 전용) - 담당: 권형석
   - 작성: /.../faq/write
   - 수정: /.../faq/edit/:id
   ========================================================= */

const MAX_QUESTION = 90;
const MAX_ANSWER = 5000;
const SORT_MAX = 9999;

const boardBase = (pathname) => pathname.split('/faq')[0];
const onlyDigits = (v) => String(v).replace(/[^0-9]/g, '').slice(0, 4);

function FaqWrite() {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const { id } = useParams();                  // 있으면 수정 모드
    const { token } = useAuthStore();
    const base = boardBase(pathname);
    const isEdit = !!id;

    const [categories, setCategories] = useState([]);
    const [form, setForm] = useState({
        category: '', question: '', answer: '', sortOrder: '', isActive: 'Y',
    });
    const [ready, setReady] = useState(false);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const goList = () => navigate(`${base}/faq`);

    // 관리자 확인 → 카테고리 → (수정이면) 기존 내용
    useEffect(() => {
        if (!token) {
            alert('로그인이 필요합니다.');
            navigate('/login', { replace: true });
            return;
        }
        let cancelled = false;

        (async () => {
            try {
                const role = await Client.get('/api/members/me/role');
                if (!role.data.admin) {
                    alert('관리자만 이용할 수 있습니다.');
                    navigate(`${base}/faq`, { replace: true });
                    return;
                }

                const cat = await Client.get('/api/faqs/categories');
                if (cancelled) return;
                setCategories(cat.data);

                if (isEdit) {
                    const res = await Client.get(`/api/faqs/${id}/edit`);
                    if (cancelled) return;
                    const f = res.data;
                    setForm({
                        category: f.category ?? '',
                        question: f.question ?? '',
                        answer: f.answer ?? '',
                        sortOrder: f.sortOrder == null ? '' : String(f.sortOrder),
                        isActive: f.isActive === 'N' ? 'N' : 'Y',
                    });
                }
                if (!cancelled) setReady(true);
            } catch (err) {
                if (cancelled) return;
                const status = err.response?.status;
                if (status === 401) { alert('로그인이 필요합니다.'); navigate('/login', { replace: true }); }
                else if (status === 403) { alert('관리자만 이용할 수 있습니다.'); navigate(`${base}/faq`, { replace: true }); }
                else if (status === 404) { alert('FAQ를 찾을 수 없습니다.'); navigate(`${base}/faq`, { replace: true }); }
                else { console.error(err); setError('정보를 불러오지 못했습니다.'); }
            }
        })();

        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, id]);

    const setValue = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

    const validate = () => {
        if (!form.category) return '카테고리를 선택해 주세요.';
        if (!form.question.trim()) return '질문을 입력해 주세요.';
        if (form.question.trim().length > MAX_QUESTION) return `질문은 ${MAX_QUESTION}자까지 입력할 수 있어요.`;
        if (!form.answer.trim()) return '답변을 입력해 주세요.';
        if (form.answer.trim().length > MAX_ANSWER) return `답변은 ${MAX_ANSWER}자까지 입력할 수 있어요.`;
        if (form.sortOrder !== '') {
            const n = Number(form.sortOrder);
            if (n < 1 || n > SORT_MAX) return `순서는 1~${SORT_MAX} 사이로 입력해 주세요.`;
        }
        return '';
    };

    const handleSubmit = async () => {
        const msg = validate();
        if (msg) { setError(msg); return; }

        const payload = {
            category: form.category,
            question: form.question.trim(),
            answer: form.answer.trim(),
            sortOrder: form.sortOrder === '' ? null : Number(form.sortOrder),
            isActive: form.isActive,
        };

        setSaving(true);
        setError('');
        try {
            if (isEdit) {
                await Client.put(`/api/faqs/${id}`, payload);
                alert('FAQ가 수정되었습니다.');
            } else {
                await Client.post('/api/faqs', payload);
                alert('FAQ가 등록되었습니다.');
            }
            goList();
        } catch (err) {
            const status = err.response?.status;
            const serverMsg = err.response?.data?.message;
            if (status === 401) { alert('로그인이 필요합니다.'); navigate('/login'); }
            else if (status === 403) alert('관리자만 이용할 수 있습니다.');
            else if (status === 400) setError(serverMsg || '입력값을 다시 확인해 주세요.');
            else { console.error(err); setError('저장에 실패했습니다. 잠시 후 다시 시도해 주세요.'); }
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        if (window.confirm('작성을 취소할까요? 입력한 내용은 저장되지 않아요.')) goList();
    };

    if (!ready) {
        return <div className={styles.card}><p className={styles.notice}>{error || '불러오는 중...'}</p></div>;
    }

    return (
        <div className={styles.card}>
            <h2 className={styles.title}>{isEdit ? 'FAQ 수정' : 'FAQ 작성'}</h2>

            {/* 카테고리 */}
            <div className={styles.field}>
                <label className={styles.label}>카테고리</label>
                <div className={styles.chips}>
                    {categories.map((c) => (
                        <button key={c} type="button"
                            className={`${styles.chip} ${form.category === c ? styles.chipActive : ''}`}
                            onClick={() => setValue('category', c)}>
                            {c}
                        </button>
                    ))}
                </div>
            </div>

            {/* 질문 */}
            <div className={styles.field}>
                <label className={styles.label}>질문</label>
                <input type="text" className={styles.input} maxLength={MAX_QUESTION}
                    placeholder="예: 비밀번호를 잊어버렸어요"
                    value={form.question} onChange={(e) => setValue('question', e.target.value)} />
                <p className={styles.counter}>{form.question.length} / {MAX_QUESTION}</p>
            </div>

            {/* 답변 */}
            <div className={styles.field}>
                <label className={styles.label}>답변</label>
                <textarea className={styles.textarea} rows={10} maxLength={MAX_ANSWER}
                    placeholder="모든 회원에게 해당되는 답변을 적어 주세요. 개인 정보는 넣지 마세요."
                    value={form.answer} onChange={(e) => setValue('answer', e.target.value)} />
                <p className={styles.counter}>{form.answer.length} / {MAX_ANSWER}</p>
            </div>

            {/* 순서 + 보이기 */}
            <div className={styles.row}>
                <div className={styles.field}>
                    <label className={styles.label}>순서 (선택)</label>
                    <input type="text" inputMode="numeric" className={styles.input}
                        placeholder={isEdit ? '비우면 기존 순서 유지' : '비우면 맨 뒤로'}
                        value={form.sortOrder} onChange={(e) => setValue('sortOrder', onlyDigits(e.target.value))} />
                    <p className={styles.hint}>숫자가 작을수록 위에 보여요.</p>
                </div>
                <div className={styles.field}>
                    <label className={styles.label}>공개 여부</label>
                    <label className={styles.checkLabel}>
                        <input type="checkbox" checked={form.isActive === 'Y'}
                            onChange={(e) => setValue('isActive', e.target.checked ? 'Y' : 'N')} />
                        회원에게 보이기
                    </label>
                    <p className={styles.hint}>체크를 끄면 관리자에게만 보여요.</p>
                </div>
            </div>

            {error && <p className={styles.error}>⚠️ {error}</p>}

            <div className={styles.buttons}>
                <button type="button" className={styles.cancelBtn} onClick={handleCancel} disabled={saving}>
                    취소
                </button>
                <button type="button" className={styles.submitBtn} onClick={handleSubmit} disabled={saving}>
                    {saving ? '저장 중...' : isEdit ? '수정하기' : '등록하기'}
                </button>
            </div>
        </div>
    );
}

export default FaqWrite;