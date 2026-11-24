import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/useAuthStore';
import Client from '../../api/client';
import styles from './reportbutton.module.css';

/* =========================================================
   신고 버튼 + 사유 선택 창 (게시글 · 댓글 공통) - 담당: 권형석
   사용법:
     <ReportButton targetType="POST" targetSeq={post.postSeq} />
     <ReportButton targetType="COMMENT" targetSeq={comment.postCommentSeq} small />
   - 익명 게시판도 신고 가능 (작성자는 서버가 찾아서 저장, 신고자에게는 안 보여줌)
   - 본인 글 · 중복 신고는 서버에서도 막음
   ========================================================= */

const REASONS = [
    { value: 'SPAM', label: '스팸 · 광고' },
    { value: 'ABUSE', label: '욕설 · 비하 · 혐오' },
    { value: 'OBSCENE', label: '음란물 · 선정적인 내용' },
    { value: 'FRAUD', label: '사기 · 금전 요구' },
    { value: 'PRIVACY', label: '개인정보 노출' },
    { value: 'ETC', label: '기타' },
];
const MAX_DETAIL = 300;

function ReportButton({ targetType, targetSeq, small = false }) {
    const navigate = useNavigate();
    const { token } = useAuthStore();

    const [open, setOpen] = useState(false);
    const [reported, setReported] = useState(false);   // 이미 신고했는지
    const [reason, setReason] = useState('');
    const [detail, setDetail] = useState('');
    const [error, setError] = useState('');
    const [sending, setSending] = useState(false);

    const label = targetType === 'COMMENT' ? '댓글' : '게시글';

    // 창이 열려 있을 때 Esc로 닫기
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => { if (e.key === 'Escape') close(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const openModal = (e) => {
        e.stopPropagation();   // 댓글 줄 클릭 이벤트와 겹치지 않게
        if (!token) {
            alert('로그인 후 신고할 수 있어요.');
            navigate('/login');
            return;
        }
        if (reported) {
            alert(`이미 신고한 ${label}이에요.`);
            return;
        }
        setOpen(true);
    };

    const close = () => {
        if (sending) return;
        setOpen(false);
        setReason('');
        setDetail('');
        setError('');
    };

    const handleSubmit = async () => {
        if (!reason) { setError('신고 사유를 선택해 주세요.'); return; }
        if (reason === 'ETC' && !detail.trim()) { setError('기타 사유는 내용을 적어 주세요.'); return; }

        setSending(true);
        setError('');
        try {
            await Client.post('/api/reports', {
                targetType,
                targetSeq,
                reasonType: reason,
                reasonDetail: detail.trim() || null,
            });
            setReported(true);
            setOpen(false);
            setReason('');
            setDetail('');
            alert('신고가 접수되었어요. 관리자가 확인 후 처리할게요.');
        } catch (err) {
            const status = err.response?.status;
            const msg = err.response?.data?.message;
            if (status === 401) { alert('로그인이 필요합니다.'); navigate('/login'); }
            else if (status === 409) { setReported(true); setOpen(false); alert(`이미 신고한 ${label}이에요.`); }
            else if (status === 404) { setOpen(false); alert(`삭제되었거나 없는 ${label}이에요.`); }
            else if (status === 400) setError(msg || '본인 글은 신고할 수 없거나, 입력값이 올바르지 않아요.');
            else { console.error(err); setError('신고에 실패했어요. 잠시 후 다시 시도해 주세요.'); }
        } finally {
            setSending(false);
        }
    };

    return (
        <>
            <button
                type="button"
                className={`${styles.reportBtn} ${small ? styles.small : ''} ${reported ? styles.done : ''}`}
                onClick={openModal}
                title={reported ? '신고 완료' : `${label} 신고`}
            >
                🚨 {reported ? '신고됨' : '신고'}
            </button>

            {open && (
                <div className={styles.overlay} onClick={close}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <h3 className={styles.title}>🚨 {label} 신고</h3>
                        <p className={styles.desc}>
                            신고 사유를 선택해 주세요. 허위 신고는 제재될 수 있어요.
                        </p>

                        <div className={styles.reasons}>
                            {REASONS.map((r) => (
                                <label
                                    key={r.value}
                                    className={`${styles.reason} ${reason === r.value ? styles.reasonActive : ''}`}
                                >
                                    <input
                                        type="radio"
                                        name={`report-${targetType}-${targetSeq}`}
                                        value={r.value}
                                        checked={reason === r.value}
                                        onChange={() => setReason(r.value)}
                                    />
                                    {r.label}
                                </label>
                            ))}
                        </div>

                        <textarea
                            className={styles.textarea}
                            rows={4}
                            maxLength={MAX_DETAIL}
                            placeholder={reason === 'ETC' ? '신고 사유를 적어 주세요. (필수)' : '추가로 알려 주실 내용이 있으면 적어 주세요. (선택)'}
                            value={detail}
                            onChange={(e) => setDetail(e.target.value)}
                        />
                        <p className={styles.counter}>{detail.length} / {MAX_DETAIL}</p>

                        {error && <p className={styles.error}>⚠️ {error}</p>}

                        <div className={styles.buttons}>
                            <button type="button" className={styles.cancelBtn} onClick={close} disabled={sending}>
                                취소
                            </button>
                            <button type="button" className={styles.submitBtn} onClick={handleSubmit} disabled={sending}>
                                {sending ? '접수 중...' : '신고하기'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default ReportButton;