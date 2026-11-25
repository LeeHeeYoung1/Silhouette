import { useEffect, useState } from 'react';
import Client from '../../api/client';
import styles from './memberavatar.module.css';

/* 동그란 프로필 사진
   - fileUrl: 사진 주소 (없으면 👤 표시)
   - size: 지름(px)
   - onClick: 있으면 눌렀을 때 실행 (익명 글이면 넘기지 않기) */
function MemberAvatar({ fileUrl, size = 36, alt = '프로필 사진', onClick }) {
    const [src, setSrc] = useState(null);

    // 사진은 토큰이 필요해서 Client(axios)로 받아서 보여줌
    useEffect(() => {
        if (!fileUrl) {
            setSrc(null);
            return;
        }
        let cancelled = false;
        let objectUrl = null;

        Client.get(fileUrl, { responseType: 'blob' })
            .then((res) => {
                if (cancelled) return;
                objectUrl = URL.createObjectURL(res.data);
                setSrc(objectUrl);
            })
            .catch((err) => {
                console.error('사진 불러오기 실패', fileUrl, err.response?.status, err);
                if (!cancelled) setSrc(null);
            });

        return () => {
            cancelled = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [fileUrl]);

    const clickable = typeof onClick === 'function';

    return (
        <span
            className={`${styles.avatar} ${clickable ? styles.clickable : ''}`}
            style={{ width: size, height: size, fontSize: size * 0.55 }}
            onClick={clickable ? onClick : undefined}
            role={clickable ? 'button' : undefined}
        >
            {src ? <img src={src} alt={alt} className={styles.img} /> : <span>👤</span>}
        </span>
    );
}

export default MemberAvatar;