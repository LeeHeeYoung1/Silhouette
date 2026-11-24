import { useEffect, useRef, useState } from 'react';
import { getLiveList } from '../../api/live';
import { CATEGORIES, categoryLabel, errorMessage } from './liveConstants';
import LiveForm from './liveForm';
import { BanListModal } from './liveModals';
import styles from './live.module.css';

const PAGE_SIZE = 20;

// 방송 목록 (검색·카테고리·무한스크롤) + 방송 시작
function LiveLobby({ myId, notice, onStart, onWatch, onResume }) {
  const [keywordInput, setKeywordInput] = useState('');
  const [query, setQuery] = useState({ keyword: '', category: '', version: 0 });
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // 'start' | 'bans'
  const fetchingRef = useRef(true);
  const sentinelRef = useRef(null);

  useEffect(() => {
    let ignore = false;
    fetchingRef.current = true;
    getLiveList({
      keyword: query.keyword || undefined,
      category: query.category || undefined,
      page,
    })
      .then(({ data }) => {
        if (ignore) return;
        setItems((prev) => {
          if (page === 1) return data;
          // 시청자 수 순서가 바뀌어 겹칠 수 있어서 중복 제거
          const seen = new Set(prev.map((r) => r.liveRoomSeq));
          return [...prev, ...data.filter((r) => !seen.has(r.liveRoomSeq))];
        });
        setHasMore(data.length === PAGE_SIZE);
        setError('');
        setLoaded(true);
      })
      .catch((e) => !ignore && setError(errorMessage(e, '방송 목록을 불러오지 못했어요.')))
      .finally(() => {
        if (!ignore) fetchingRef.current = false;
      });
    return () => {
      ignore = true;
    };
  }, [query, page]);

  // 바닥 근처에 오면 다음 페이지
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !fetchingRef.current) {
          fetchingRef.current = true;
          setPage((p) => p + 1);
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, items.length]);

  const search = (next) => {
    setQuery((prev) => ({ ...prev, ...next, version: prev.version + 1 }));
    setPage(1);
    window.scrollTo({ top: 0 });
  };

  const isSearching = query.keyword || query.category;

  return (
    <div className={styles.lobby}>
      <div className={styles.lobbyHeader}>
        <h2>라이브</h2>
        <div className={styles.lobbyActions}>
          <button className={styles.ghostButton} onClick={() => setModal('bans')}>차단 목록</button>
          <button className={styles.primaryButton} onClick={() => setModal('start')}>📡 방송하기</button>
        </div>
      </div>

      {notice && <p className={styles.noticeBox}>{notice}</p>}

      <form
        className={styles.searchBar}
        onSubmit={(e) => {
          e.preventDefault();
          search({ keyword: keywordInput.trim() });
        }}
      >
        <input
          value={keywordInput}
          onChange={(e) => setKeywordInput(e.target.value)}
          placeholder="제목 또는 방송자 닉네임 검색"
        />
        <button type="submit" className={styles.ghostButton}>검색</button>
        <button type="button" className={styles.ghostButton} onClick={() => search({})} title="새로고침">
          ↻
        </button>
      </form>

      <div className={styles.categoryTabs}>
        <button
          className={!query.category ? styles.tabActive : styles.tab}
          onClick={() => search({ category: '' })}
        >
          전체
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            className={query.category === c.value ? styles.tabActive : styles.tab}
            onClick={() => search({ category: c.value })}
          >
            {c.label}
          </button>
        ))}
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {loaded && items.length === 0 ? (
        <div className={styles.empty}>
          {isSearching ? '조건에 맞는 방송이 없어요.' : '지금 진행 중인 방송이 없어요. 첫 방송을 시작해보세요!'}
        </div>
      ) : (
        <ul className={styles.grid}>
          {items.map((live) => {
            const mine = live.hostLoginId === myId;
            return (
              <li key={live.liveRoomSeq}>
                <button
                  className={styles.card}
                  onClick={() => (mine ? onResume(live.liveRoomSeq) : onWatch(live.liveRoomSeq))}
                  title={mine ? '눌러서 내 방송으로 돌아가기' : undefined}
                >
                  <div className={styles.thumb}>
                    {live.thumbnailUrl ? (
                      <img src={live.thumbnailUrl} alt="" loading="lazy" />
                    ) : (
                      <span className={styles.thumbPlaceholder}>{categoryLabel(live.category)}</span>
                    )}
                    <span className={styles.liveBadge}>LIVE</span>
                    <span className={styles.viewerBadge}>👀 {live.viewerCount ?? 0}</span>
                    {mine && <span className={styles.mineBadge}>내 방송 · 이어하기</span>}
                  </div>
                  <div className={styles.cardBody}>
                    <strong className={styles.cardTitle}>{live.title}</strong>
                    <span className={styles.muted}>
                      {live.hostNickname || live.hostLoginId} · {categoryLabel(live.category)}
                    </span>
                    {live.hashtags?.length > 0 && (
                      <div className={styles.tags}>
                        {live.hashtags.map((t) => (
                          <span key={t} className={styles.tag}>#{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {hasMore && <div ref={sentinelRef} className={styles.sentinel} />}

      {modal === 'start' && <LiveForm onSubmit={onStart} onClose={() => setModal(null)} />}
      {modal === 'bans' && <BanListModal onClose={() => setModal(null)} />}
    </div>
  );
}

export default LiveLobby;
