import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useAuthStore from '../../stores/useAuthStore';
import Client from '../../api/client';
import styles from './qna.module.css';

/* =========================================================
   1:1 Q&A 상세 - 담당: 권형석
   - 남의 비밀글: 비밀번호 입력 → 맞으면 열람 (작성자·관리자는 바로 열람)
   - 작성자: 답변 전에만 수정, 삭제는 언제든
   - 관리자: 답변 1개 등록·수정·삭제, 문의 삭제
   ========================================================= */

const MAX_ANSWER = 5000;

const formatDate = (value) => {
    if (!value) return '';
    if (Array.isArray(value)) {
        const [y, m, d, hh = 0, mm = 0] = value;
        const p = (n) => String(n).padStart(2, '0');
        return `${y}-${p(m)}-${p(d)} ${p(hh)}:${p(mm)}`;
    }
    return String(value).replace('T', ' ').slice(0, 16);
};

function QnaDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token } = useAuthStore();

    const [qna, setQna] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [reload, setReload] = useState(0);

    // 비밀번호 입력
    const [password, setPassword] = useState('');
    const [pwError, setPwError] = useState('');
    const [verifying, setVerifying] = useState(false);

    // 관리자 답변
    const [answerText, setAnswerText] = useState('');
    const [answerEditing, setAnswerEditing] = useState(false);
    const [answerSaving, setAnswerSaving] = useState(false);

    const goList = () => navigate('/post/qna');

    // 관리자인지
    useEffect(() => {
        if (!token) { setIsAdmin(false); return; }
        Client.get('/api/members/me/role')
            .then((res) => setIsAdmin(Boolean(res.data.admin)))
            .catch(() => setIsAdmin(false));
    }, [token]);

    // 문의 불러오기
    useEffect(() => {
        let cancelled = false;
        setLoading(true);

        Client.get(`/api/qnas/${id}`)
            .then((res) => { if (!cancelled) setQna(res.data); })
            .catch((err) => {
                if (cancelled) return;
                if (err.response?.status === 404) { alert('삭제되었거나 없는 문의입니다.'); goList(); }
                else { console.error(err); alert('문의를 불러오지 못했습니다.'); }
            })
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, token, reload]);

    // ===== 비밀번호로 열기 =====
    const handleVerify = async () => {
        if (!password) { setPwError('비밀번호를 입력해 주세요.'); return; }
        setVerifying(true);
        setPwError('');
        try {
            const res = await Client.post(`/api/qnas/${id}/verify`, { password });
            setQna(res.data);
            setPassword('');
        } catch (err) {
            if (err.response?.status === 403) setPwError('비밀번호가 일치하지 않습니다.');
            else { console.error(err); setPwError('확인에 실패했습니다. 잠시 후 다시 시도해 주세요.'); }
        } finally {
            setVerifying(false);
        }
    };

    // ===== 문의 삭제 (작성자 · 관리자) =====
    const handleDelete = async () => {
        if (!window.confirm('이 문의를 삭제할까요?')) return;
        try {
            await Client.delete(`/api/qnas/${id}`);
            alert('삭제되었습니다.');
            goList();
        } catch (err) {
            const status = err.response?.status;
            if (status === 401) { alert('로그인이 필요합니다.'); navigate('/login'); }
            else if (status === 403) alert('본인 문의만 삭제할 수 있어요.');
            else { console.error(err); alert('삭제에 실패했습니다.'); }
        }
    };

    // ===== 관리자 답변 =====
    const startAnswerEdit = () => {
        setAnswerText(qna.answer?.content ?? '');
        setAnswerEditing(true);
    };

    const cancelAnswerEdit = () => {
        setAnswerEditing(false);
        setAnswerText('');
    };

    const handleAnswerSubmit = async () => {
        const text = answerText.trim();
        if (!text) { alert('답변 내용을 입력해 주세요.'); return; }
        setAnswerSaving(true);
        try {
            if (qna.answer) await Client.put(`/api/qnas/${id}/answer`, { content: text });
            else await Client.post(`/api/qnas/${id}/answer`, { content: text });
            setAnswerEditing(false);
            setAnswerText('');
            setReload((v) => v + 1);
        } catch (err) {
            const status = err.response?.status;
            if (status === 403) alert('관리자만 답변할 수 있어요.');
            else if (status === 409) { alert('이미 답변이 있어요.'); setReload((v) => v + 1); }
            else { console.error(err); alert('답변 저장에 실패했습니다.'); }
        } finally {
            setAnswerSaving(false);
        }
    };

    const handleAnswerDelete = async () => {
        if (!window.confirm('답변을 삭제할까요? 문의가 다시 답변대기 상태가 돼요.')) return;
        try {
            await Client.delete(`/api/qnas/${id}/answer`);
            setReload((v) => v + 1);
        } catch (err) {
            console.error(err);
            alert('답변 삭제에 실패했습니다.');
        }
    };

    // ===================== 화면 =====================
    if (loading && !qna) {
        return <div className={styles.card}><p className={styles.notice}>불러오는 중...</p></div>;
    }
    if (!qna) {
        return <div className={styles.card}><p className={styles.notice}>문의를 찾을 수 없습니다.</p></div>;
    }

    // ----- 잠긴 비밀글 -----
    if (qna.locked) {
        return (
            <div className={styles.card}>
                <div className={styles.lockBox}>
                    <div className={styles.lockIcon}>🔒</div>
                    <h2 className={styles.title}>비밀글입니다.</h2>
                    <p className={styles.hint}>작성자와 관리자만 볼 수 있어요. 비밀번호를 입력하면 열람할 수 있어요.</p>
                    <div className={styles.pwRow}>
                        <input
                            type="password"
                            className={styles.input}
                            placeholder="비밀번호"
                            maxLength={30}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && handleVerify()}
                        />
                        <button type="button" className={styles.btnPrimary} onClick={handleVerify} disabled={verifying}>
                            {verifying ? '확인 중...' : '확인'}
                        </button>
                    </div>
                    {pwError && <p className={styles.error}>⚠️ {pwError}</p>}
                    <button type="button" className={styles.btnGhost} onClick={goList}>목록으로</button>
                </div>
            </div>
        );
    }

    // ----- 열람 가능 -----
    const done = qna.answerStatus === 'DONE';
    const canDelete = qna.mine || isAdmin;
    const showAnswerForm = isAdmin && (!qna.answer || answerEditing);

    return (
        <div className={styles.card}>
            <button type="button" className={styles.btnGhost} onClick={goList}>← 목록으로</button>

            {/* 문의 */}
            <div className={styles.header}>
                <div className={styles.badges}>
                    {done
                        ? <span className={styles.statusDone}>답변완료</span>
                        : <span className={styles.statusWait}>답변대기</span>}
                    {qna.isSecret === 'Y' && <span className={styles.secretBadge}>🔒 비밀글</span>}
                </div>
                <h2 className={styles.title}>{qna.title}</h2>
                <p className={styles.meta}>
                    {qna.writerName || '-'}
                    <span className={styles.dot}>·</span>
                    {formatDate(qna.createdAt)}
                </p>
            </div>

            <div className={styles.content}>{qna.content}</div>

            {/* 작성자 · 관리자 버튼 */}
            {(qna.mine || canDelete) && (
                <div className={styles.actions}>
                    {qna.mine && !qna.editable && (
                        <span className={styles.hint}>답변이 달린 문의는 수정할 수 없어요.</span>
                    )}
                    {qna.editable && (
                        <button type="button" className={styles.btnOutline}
                            onClick={() => navigate(`/post/qna/edit/${id}`)}>
                            수정
                        </button>
                    )}
                    {canDelete && (
                        <button type="button" className={styles.btnDanger} onClick={handleDelete}>삭제</button>
                    )}
                </div>
            )}

            {/* 답변 */}
            <div className={styles.answerBox}>
                <h3 className={styles.answerHead}>💬 관리자 답변</h3>

                {qna.answer && !answerEditing && (
                    <>
                        <p className={styles.answerMeta}>
                            {qna.answer.adminName || '운영자'}
                            <span className={styles.dot}>·</span>
                            {formatDate(qna.answer.createdAt)}
                            {qna.answer.updatedAt && formatDate(qna.answer.updatedAt) !== formatDate(qna.answer.createdAt) && (
                                <span className={styles.dim}> (수정됨)</span>
                            )}
                        </p>
                        <div className={styles.answerContent}>{qna.answer.content}</div>
                        {isAdmin && (
                            <div className={styles.actions}>
                                <button type="button" className={styles.btnOutline} onClick={startAnswerEdit}>답변 수정</button>
                                <button type="button" className={styles.btnDanger} onClick={handleAnswerDelete}>답변 삭제</button>
                            </div>
                        )}
                    </>
                )}

                {!qna.answer && !isAdmin && (
                    <p className={styles.answerEmpty}>아직 답변이 없어요. 관리자가 확인 후 답변해 드릴게요.</p>
                )}

                {showAnswerForm && (
                    <div className={styles.field}>
                        <textarea
                            className={styles.textarea}
                            rows={6}
                            maxLength={MAX_ANSWER}
                            placeholder="답변을 입력해 주세요."
                            value={answerText}
                            onChange={(e) => setAnswerText(e.target.value)}
                        />
                        <p className={styles.counter}>{answerText.length} / {MAX_ANSWER}</p>
                        <div className={styles.actions}>
                            {answerEditing && (
                                <button type="button" className={styles.btnGhost} onClick={cancelAnswerEdit} disabled={answerSaving}>
                                    취소
                                </button>
                            )}
                            <button type="button" className={styles.btnPrimary} onClick={handleAnswerSubmit} disabled={answerSaving}>
                                {answerSaving ? '저장 중...' : qna.answer ? '답변 수정' : '답변 등록'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default QnaDetail;