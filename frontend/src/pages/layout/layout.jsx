
import { useState, useEffect, useCallback, useRef } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import styles from './layout.module.css';
import useOnboardingGuard from '../onboarding/useOnboardingGuard';
import useAuthStore from '../../stores/useAuthStore';
import Client from '../../api/client';
import { Client as StompClient } from '@stomp/stompjs';

// 모든 페이지의 공통 상단 메뉴와 알림 드롭다운을 관리합니다.
function Layout() {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  useOnboardingGuard();

  const [theme, setTheme] = useState(() => localStorage.getItem('silhouette_theme') || 'light');
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationAreaRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [memberSeq, setMemberSeq] = useState(null);
  const [hiddenNotificationIds, setHiddenNotificationIds] = useState([]);

  useEffect(() => {
    if (theme === 'light') document.body.classList.add('theme-light');
    else document.body.classList.remove('theme-light');
    localStorage.setItem('silhouette_theme', theme);
  }, [theme]);

  // 알림 목록과 읽지 않은 개수를 서버에서 다시 가져옵니다.
  const refreshNotifications = useCallback(async () => {
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      const [listResult, countResult] = await Promise.all([
        Client.get('/api/notifications'),
        Client.get('/api/notifications/unread-count')
      ]);

      setNotifications(Array.isArray(listResult.data) ? listResult.data : []);
      setUnreadCount(Number(countResult.data) || 0);
    } catch (error) {
      console.error('알림을 불러오지 못했습니다.', error);
    }
  }, [token]);

  // 로그인 회원 번호를 가져와 개인 알림 STOMP 채널에 연결합니다.
  useEffect(() => {
    if (!token) {
      setMemberSeq(null);
      setNotifications([]);
      setUnreadCount(0);
      return undefined;
    }

    let cancelled = false;

    Client.get('/api/chat/member-seq')
      .then((response) => {
        if (!cancelled) {
          setMemberSeq(Number(response.data));
          refreshNotifications();
        }
      })
      .catch((error) => console.error('알림 회원 번호 조회 실패:', error));

    return () => {
      cancelled = true;
    };
  }, [token, refreshNotifications]);

  useEffect(() => {
    if (!token || !memberSeq) return undefined;

    const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsHost = window.location.hostname || 'localhost';
    const wsPort = window.location.port === '5173'
      ? ':80'
      : (window.location.port ? `:${window.location.port}` : '');
    const brokerURL = `${wsProtocol}://${wsHost}${wsPort}/chat`;

    const client = new StompClient({
      brokerURL,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/sub/notifications/${memberSeq}`, () => {
          refreshNotifications();
        });
      },
      onStompError: (frame) => console.error('알림 STOMP 오류:', frame.headers?.message, frame.body),
      onWebSocketError: (error) => console.error('알림 웹소켓 오류:', error)
    });

    client.activate();

    return () => client.deactivate();
  }, [token, memberSeq, refreshNotifications]);

  const toggleTheme = () => {
    setTheme((prev) => prev === 'light' ? 'dark' : 'light');
  };

  // 알림 하나를 읽음 처리한 뒤 목록과 개수를 갱신합니다.
  const markRead = async (notificationSeq) => {
    await Client.post(`/api/notifications/${notificationSeq}/read`);
    await refreshNotifications();
  };

  // 알림 종류에 따라 채팅 초대 또는 친구 요청을 수락/거절합니다.
  const handleNotificationAction = async (item, action) => {
    try {
      if (item.notification_type === 'CHAT_INVITE') {
        const endpoint = action === 'accept' ? 'accept' : 'reject';

        await Client.post(`/api/chat/invite/${item.reference_seq}/${endpoint}`);
        await markRead(item.notification_seq);

        if (action === 'accept' && item.chat_room_seq) {
          navigate(`/chatting/${item.chat_room_seq}`);
        }

        return;
      }

      if (item.notification_type === 'FRIEND_REQUEST') {
        const endpoint = action === 'accept' ? 'accept' : 'reject';

        await Client.post(`/api/chat/friends/requests/${item.reference_seq}/${endpoint}`);
        await markRead(item.notification_seq);

        window.dispatchEvent(new Event('silhouette-friends-updated'));
        return;
      }

      await markRead(item.notification_seq);
    } catch (error) {
      alert(error.response?.data || '알림을 처리하지 못했습니다.');
      refreshNotifications();
    }
  };

  // 알림 창이 열려 있을 때 바깥(배경)을 누르거나 ESC를 누르면 닫습니다.
  useEffect(() => {
    if (!showNotifications) return undefined;

    const handleOutside = (e) => {
      if (notificationAreaRef.current && !notificationAreaRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') setShowNotifications(false);
    };

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    document.addEventListener('keydown', handleEsc);

    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [showNotifications]);

  // 종 아이콘을 눌러 알림 창을 열거나 닫습니다.
  const openNotifications = async () => {
    const next = !showNotifications;
    setShowNotifications(next);

    if (next) {
      await refreshNotifications();
    }
  };

  // 알림 목록 전체를 한 번에 숨깁니다.
  const hideAllNotifications = () => {
    setHiddenNotificationIds((prev) => [
      ...new Set([
        ...prev,
        ...notifications.map((item) => item.notification_seq)
      ])
    ]);
  };

  // 숨기지 않은 알림만 화면에 표시합니다.
  const visibleNotifications = notifications.filter(
    (item) => !hiddenNotificationIds.includes(item.notification_seq)
  );

  return (
    <div className={styles.appContainer}>
      <header className={styles.header}>
        <div className={styles.brandLogo} onClick={() => navigate('/')}>
          <div className={styles.brandIcon}>🌙</div>
          <span className={styles.brandTitle}>실루엣 (Silhouette)</span>
        </div>

        <div className={styles.headerRight}>
          <nav className={styles.navLinks}>
            <NavLink to="/" end className={({ isActive }) => `${styles.navBtn} ${isActive ? styles.navBtnActive : ''}`}>홈</NavLink>
            <NavLink to="/profile" className={({ isActive }) => `${styles.navBtn} ${isActive ? styles.navBtnActive : ''}`}>프로필</NavLink>
            <NavLink to="/event" end className={({ isActive }) => `${styles.navBtn} ${isActive ? styles.navBtnActive : ''}`}>이벤트</NavLink>
            <NavLink to="/post" className={({ isActive }) => `${styles.navBtn} ${isActive ? styles.navBtnActive : ''}`}>게시판</NavLink>
            <NavLink to="/mypage" className={({ isActive }) => `${styles.navBtn} ${isActive ? styles.navBtnActive : ''}`}>마이페이지</NavLink>
            <NavLink to="/live" className={({ isActive }) => `${styles.navBtn} ${isActive ? styles.navBtnActive : ''}`}>라이브</NavLink>
            <NavLink to="/login" className={({ isActive }) => `${styles.navBtn} ${isActive ? styles.navBtnActive : ''}`}>로그인</NavLink>
            <NavLink to="/signup" className={({ isActive }) => `${styles.navBtn} ${isActive ? styles.navBtnActive : ''}`}>회원가입</NavLink>
          </nav>

          {/* 로그인한 사용자에게만 종 아이콘과 알림 창을 표시합니다. */}
          {token && (
            <div className={styles.notificationArea} ref={notificationAreaRef}>
              <button
                type="button"
                className={styles.notificationBell}
                onClick={openNotifications}
                aria-label="알림 열기"
              >
                🔔
                {unreadCount > 0 && (
                  <span className={styles.notificationCount}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className={styles.notificationDropdown}>
                  <div className={styles.notificationHeader}>
                    <div>
                      <strong>알림</strong>
                      <span>새로운 소식을 확인해보세요.</span>
                    </div>
                    <button
                      type="button"
                      onClick={hideAllNotifications}
                    >
                      ×
                    </button>
                  </div>

                  <div className={styles.notificationList}>
                    {visibleNotifications.length === 0 ? (
                      <div className={styles.notificationEmpty}>
                        새로운 알림이 없습니다.
                      </div>
                    ) : (
                      visibleNotifications.map((item) => {
                        const isChatInvite = item.notification_type === 'CHAT_INVITE';
                        const isFriendRequest = item.notification_type === 'FRIEND_REQUEST';
                        const canRespond =
                          (isChatInvite || isFriendRequest) && item.read_yn === 'N';

                        return (
                          <div
                            key={item.notification_seq}
                            className={`${styles.notificationItem} ${item.read_yn === 'N' ? styles.notificationUnread : ''}`}
                          >
                            <div className={styles.notificationIcon}>
                              {isChatInvite ? '💬' : isFriendRequest ? '👥' : '💗'}
                            </div>

                            <div className={styles.notificationBody}>
                              <strong>{item.sender_nick || '회원'}</strong>
                              <p>{item.notification_content}</p>

                              {isChatInvite && (
                                <small>{item.room_name || '채팅방 초대'}</small>
                              )}

                              {isFriendRequest && (
                                <small>친구 요청을 수락하면 친구 목록에 추가됩니다.</small>
                              )}

                              {canRespond && (
                                <div className={styles.notificationActions}>
                                  <button
                                    type="button"
                                    onClick={() => handleNotificationAction(item, 'accept')}
                                  >
                                    수락
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleNotificationAction(item, 'reject')}
                                  >
                                    거절
                                  </button>
                                </div>
                              )}

                              {!isChatInvite && !isFriendRequest && item.read_yn === 'N' && (
                                <button
                                  type="button"
                                  className={styles.readButton}
                                  onClick={() => markRead(item.notification_seq)}
                                >
                                  읽음
                                </button>
                              )}
                            </div>

                            <button
                              type="button"
                              className={styles.notificationDelete}
                              onClick={() => {
                                setHiddenNotificationIds((prev) => [
                                  ...prev,
                                  item.notification_seq
                                ]);
                              }}
                              aria-label="알림 숨기기"
                            >
                              ×
                            </button>

                            {item.read_yn === 'N' && (
                              <span className={styles.unreadDot}></span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            className={styles.themeToggleBtn}
            onClick={toggleTheme}
            title="화면 모드 전환"
          >
            {theme === 'light' ? '🌸 라이트 모드' : '🌙 다크 모드'}
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
