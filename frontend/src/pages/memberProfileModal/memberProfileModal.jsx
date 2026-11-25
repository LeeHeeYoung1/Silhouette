import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Client from '../../api/client';
import modal from './memberProfileModal.module.css'; // 팝업(배경, 닫기 버튼, 친구 버튼)만 따로
import styles from '../profile/profile.module.css';
 
/* =========================================================
   다른 회원 프로필 팝업
   - 사용: <MemberProfileModal memberSeq={회원번호} onClose={() => ...} />
   - 내 프로필(profile.jsx) 보기 모드와 같은 CSS, 단 "나의 이상형"은 안 보여줌
   - 친구 버튼
       NONE     → [친구 추가]       (누르면 상대에게 알림이 감)
       SENT     → [요청 보냄]       (비활성)
       RECEIVED → [친구 요청 수락]  (상대가 먼저 보낸 요청이 있을 때)
       FRIEND / SELF → 버튼 없음
   ========================================================= */
 
// ===== 도우미 함수 (profile.jsx와 같음) =====
const toTags = (v) => (v ? String(v).split(',').map((s) => s.trim()).filter(Boolean) : []);
const show = (v, unit = '') => (v === null || v === undefined || v === '' ? '-' : `${v}${unit}`);
const isNone = (v) => String(v ?? '').toLowerCase() === 'none';
const smokingText = (v) => (isNone(v) ? '비흡연' : show(v));
const drinkingText = (v) => (isNone(v) ? '안 마셔요' : show(v));
const isMaleGender = (g) => g === 'MALE' || g === 'M';
const isFemaleGender = (g) => g === 'FEMALE' || g === 'F';
const genderLabel = (g) => (isMaleGender(g) ? '남성' : isFemaleGender(g) ? '여성' : '-');
 
// 대표 사진 주소 (sortOrder 가장 작은 것)
const getMainFileUrl = (images) => {
    if (!images || images.length === 0) return null;
    const sorted = [...images].sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99));
    return sorted[0]?.fileUrl ?? null;
};
 
// ===== 보기 조각 (profile.jsx와 같음) =====
function Section({ title, icon, children }) {
    return (
        <section className={styles.section}>
            <h3 className={styles.sectionTitle}><span>{icon}</span> {title}</h3>
            {children}
        </section>
    );
}
 
function InfoRow({ label, value }) {
    return (
        <div className={styles.infoRow}>
            <span className={styles.infoLabel}>{label}</span>
            <span className={styles.infoValue}>{value}</span>
        </div>
    );
}
 
function Tags({ value }) {
    const items = toTags(value);
    if (items.length === 0) return <span className={styles.empty}>-</span>;
    return (
        <div className={styles.tags}>
            {items.map((t) => <span key={t} className={styles.tag}>{t}</span>)}
        </div>
    );
}
 
function TagRow({ label, value }) {
    return (
        <div className={styles.tagRow}>
            <span className={styles.infoLabel}>{label}</span>
            <Tags value={value} />
        </div>
    );
}
 
function MemberProfileModal({ memberSeq, onClose }) {
    const [data, setData] = useState(null);       // { basic, profile, images, relation, requestSeq }
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [relation, setRelation] = useState('NONE');
    const [requestSeq, setRequestSeq] = useState(null);
    const [busy, setBusy] = useState(false);
 
    const [photoUrl, setPhotoUrl] = useState(null);
    const [imgFailed, setImgFailed] = useState(false);
 
    const mainFileUrl = getMainFileUrl(data?.images);
 
    // ESC 키로 닫기
    useEffect(() => {
        const onKeyDown = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [onClose]);
 
    // 프로필 불러오기
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setErrorMsg('');
        setData(null);
 
        Client.get(`/api/profile/member/${memberSeq}`)
            .then((res) => {
                if (cancelled) return;
                setData(res.data);
                setRelation(res.data.relation || 'NONE');
                setRequestSeq(res.data.requestSeq ?? null);
            })
            .catch((err) => {
                if (cancelled) return;
                const status = err.response?.status;
                if (status === 403) setErrorMsg('프로필을 볼 수 없는 회원입니다.');
                else if (status === 404) setErrorMsg('회원 정보를 찾을 수 없습니다.');
                else { console.error(err); setErrorMsg('프로필을 불러오지 못했습니다.'); }
            })
            .finally(() => { if (!cancelled) setLoading(false); });
 
        return () => { cancelled = true; };
    }, [memberSeq]);
 
    // 사진은 토큰이 필요해서 Client(axios)로 받아서 보여줌
    useEffect(() => {
        if (!mainFileUrl) {
            setPhotoUrl(null);
            return;
        }
        let cancelled = false;
        let objectUrl = null;
 
        Client.get(mainFileUrl, { responseType: 'blob' })
            .then((res) => {
                if (cancelled) return;
                objectUrl = URL.createObjectURL(res.data);
                setPhotoUrl(objectUrl);
                setImgFailed(false);
            })
            .catch((err) => {
                if (cancelled) return;
                console.error(err);
                setImgFailed(true);
            });
 
        return () => {
            cancelled = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [mainFileUrl]);
 
    // 친구 추가 (상대에게 알림이 감)
    const handleAddFriend = async () => {
        setBusy(true);
        try {
            await Client.post('/api/chat/friends/request', { friend_member_seq: Number(memberSeq) });
            setRelation('SENT');
            alert('친구 요청을 보냈어요.');
        } catch (err) {
            const msg = err.response?.data;
            alert(typeof msg === 'string' && msg ? msg : '친구 요청에 실패했어요.');
        } finally {
            setBusy(false);
        }
    };
 
    // 이미 친구인 회원을 친구 목록에서 삭제합니다.
    const handleDeleteFriend = async () => {
        if (!window.confirm('이 회원을 친구 목록에서 삭제할까요?')) return;
        setBusy(true);
        try {
            await Client.delete(`/api/chat/friends/${memberSeq}`);
            setRelation('NONE');
            window.dispatchEvent(new Event('silhouette-friends-updated'));
            alert('친구를 삭제했습니다.');
        } catch (err) {
            const msg = err.response?.data;
            alert(typeof msg === 'string' && msg ? msg : '친구 삭제에 실패했어요.');
        } finally {
            setBusy(false);
        }
    };

    // 상대가 먼저 보낸 요청 수락
    const handleAcceptFriend = async () => {
        if (!requestSeq) return;
        setBusy(true);
        try {
            await Client.post(`/api/chat/friends/requests/${requestSeq}/accept`);
            setRelation('FRIEND');
            window.dispatchEvent(new Event('silhouette-friends-updated'));   // home 친구 목록 새로고침
            alert('친구가 되었어요.');
        } catch (err) {
            const msg = err.response?.data;
            alert(typeof msg === 'string' && msg ? msg : '수락에 실패했어요.');
        } finally {
            setBusy(false);
        }
    };
 
    // 친구 버튼 (친구/본인이면 안 보임)
    const renderFriendButton = () => {
        if (relation === 'NONE') {
            return (
                <button type="button" className={modal.friendBtn} onClick={handleAddFriend} disabled={busy}>
                    {busy ? '요청 중...' : '➕ 친구 추가'}
                </button>
            );
        }
        if (relation === 'SENT') {
            return <button type="button" className={modal.friendBtn} disabled>✔ 요청 보냄</button>;
        }
        if (relation === 'FRIEND') {
            return (
                <button type="button" className={modal.friendBtn} onClick={handleDeleteFriend} disabled={busy}>
                    {busy ? '삭제 중...' : '친구 삭제'}
                </button>
            );
        }
        if (relation === 'RECEIVED') {
            return (
                <button type="button" className={modal.friendBtn} onClick={handleAcceptFriend} disabled={busy}>
                    {busy ? '처리 중...' : '💌 친구 요청 수락'}
                </button>
            );
        }
        return null;
    };
 
    const basic = data?.basic ?? {};
    const profile = data?.profile ?? null;
    const isMale = isMaleGender(basic.gender);
 
    return createPortal(
        <div className={modal.overlay} onClick={onClose}>
            <div className={modal.panel} onClick={(e) => e.stopPropagation()}>
                <button type="button" className={modal.closeBtn} onClick={onClose} aria-label="닫기">✕</button>
 
                <div className={modal.scroll}>
                    <div className={styles.card}>
                        {loading && <p className={styles.notice}>불러오는 중...</p>}
 
                        {!loading && errorMsg && <p className={styles.notice}>{errorMsg}</p>}
 
                        {!loading && !errorMsg && data && (
                            <>
                                {/* ===== 상단: 증명사진 + 기본 정보 ===== */}
                                <div className={styles.hero}>
                                    <div className={styles.photoBox}>
                                        <div className={styles.photoFrame}>
                                            {photoUrl && !imgFailed ? (
                                                <img src={photoUrl} alt={`${basic.nickname} 프로필 사진`} className={styles.photo} />
                                            ) : (
                                                <span className={styles.photoEmpty}>👤</span>
                                            )}
                                        </div>
                                    </div>
 
                                    <div className={styles.heroInfo}>
                                        <h2 className={styles.nickname}>{basic.nickname}</h2>
                                        <p className={styles.heroMeta}>
                                            {genderLabel(basic.gender)} · 만 {show(basic.age)}세
                                            {profile?.mbti && <> · <strong>{profile.mbti}</strong></>}
                                            {profile?.job && <> · {profile.job}</>}
                                        </p>
                                        {profile && (
                                            <div className={styles.heroChips}>
                                                {profile.loveType && <span className={styles.heroChip}>💕 {profile.loveType}</span>}
                                                {profile.faceType && <span className={styles.heroChip}>✨ {profile.faceType}</span>}
                                                {isMale && profile.militaryStatus && <span className={styles.heroChip}>🎖️ {profile.militaryStatus}</span>}
                                            </div>
                                        )}
                                        {renderFriendButton()}
                                    </div>
                                </div>
 
                                {/* ===== 프로필이 없는 회원 ===== */}
                                {!profile && (
                                    <p className={styles.notice}>아직 프로필을 등록하지 않은 회원이에요.</p>
                                )}
 
                                {/* ===== 상세 정보 (나의 이상형은 보여주지 않음) ===== */}
                                {profile && (
                                    <>
                                        <Section title="자기소개" icon="💬">
                                            <p className={styles.intro}>{profile.introduction || '-'}</p>
                                        </Section>
 
                                        <div className={styles.grid}>
                                            <Section title="기본 정보" icon="📋">
                                                <InfoRow label="키" value={show(profile.height, 'cm')} />
                                                <InfoRow label="몸무게" value={show(profile.weight, 'kg')} />
                                                <InfoRow label="직업" value={show(profile.job)} />
                                                <InfoRow label="MBTI" value={show(profile.mbti)} />
                                                {isMale && <InfoRow label="병역" value={show(profile.militaryStatus)} />}
                                            </Section>
 
                                            <Section title="생활 습관" icon="🍷">
                                                <InfoRow label="음주" value={drinkingText(profile.drinking)} />
                                                <InfoRow label="흡연" value={smokingText(profile.smoking)} />
                                                <InfoRow label="종교" value={show(profile.religion)} />
                                                <TagRow label="음식 취향" value={profile.foodPreference} />
                                            </Section>
 
                                            <Section title="외모 · 연애 성향" icon="💄">
                                                <InfoRow label="얼굴상" value={show(profile.faceType)} />
                                                <InfoRow label="피부 타입" value={show(profile.skinType)} />
                                                <InfoRow label="연애 스타일" value={show(profile.loveType)} />
                                            </Section>
 
                                            <Section title="취향" icon="🎨">
                                                <TagRow label="취미" value={profile.hobby} />
                                                <TagRow label="좋아하는 것" value={profile.favorite} />
                                                <TagRow label="싫어하는 것" value={profile.dislike} />
                                            </Section>
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

export default MemberProfileModal;