import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Client from '../../api/client';
import useFriendChat from './useFriendChat';
import styles from './FriendChat.module.css';

/* =========================================================
   친구 · 채팅 본문 (친구 목록 탭 / 채팅방 탭)
   - 홈 오른쪽 사이드바와 모든 페이지의 친구 · 채팅 팝업(FloatingDock)에서 같이 씀
   - 친구 목록 · 채팅방 · 초대 데이터는 FriendChatProvider에서 공유
   - onOpenProfile(memberSeq): 친구를 눌렀을 때 프로필 팝업 열기
   ========================================================= */
export default function FriendChatBody({ onOpenProfile }) {
  const navi = useNavigate();
  const { friendList, myRoomList, invitations, friendImageUrls, totalUnread, refreshRooms, fetchInvitations } =
    useFriendChat();

  const [sidebarTab, setSidebarTab] = useState('friends');
  const [friendSearchKeyword, setFriendSearchKeyword] = useState('');
  const [myFriendKeyword, setMyFriendKeyword] = useState('');
  const [friendSearchMode, setFriendSearchMode] = useState('mine'); // 'mine' | 'add'
  const [friendSearchResults, setFriendSearchResults] = useState([]);
  const [friendSearchMessage, setFriendSearchMessage] = useState('');

  // 채팅방 만들기
  const [showCreate, setShowCreate] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [createKeyword, setCreateKeyword] = useState('');
  const [selectedMemberSeqs, setSelectedMemberSeqs] = useState([]);


  // 친구가 아닌 회원을 로그인 아이디로 검색
  const searchNonFriends = async () => {
    if (!friendSearchKeyword.trim()) {
      setFriendSearchResults([]);
      setFriendSearchMessage('로그인 아이디를 입력해 주세요.');
      return;
    }
    try {
      const response = await Client.get('/api/chat/friends/search', {
        params: { keyword: friendSearchKeyword.trim() }
      });
      setFriendSearchResults(response.data || []);
      setFriendSearchMessage(response.data?.length ? '' : '친구 추가할 수 있는 회원이 없습니다.');
    } catch (error) {
      console.error('친구 검색 실패:', error);
      setFriendSearchMessage(error.response?.data || '회원 검색에 실패했습니다.');
    }
  };

  const addSearchedFriend = async (member) => {
    try {
      await Client.post('/api/chat/friends/request', {
        friend_member_seq: Number(member.member_seq)
      });
      setFriendSearchResults((prev) =>
        prev.filter((item) => Number(item.member_seq) !== Number(member.member_seq))
      );
      setFriendSearchMessage(`${member.login_id}님에게 친구 요청을 보냈습니다.`);
    } catch (error) {
      alert(error.response?.data || '친구 요청을 보내지 못했습니다.');
    }
  };

  // 채팅방에 초대할 친구 선택 및 취소
  const toggleCreateMember = (friendSeq) => {
    const seq = Number(friendSeq);

    setSelectedMemberSeqs((prev) =>
      prev.includes(seq) ? prev.filter((item) => item !== seq) : [...prev, seq]
    );
  };

  // 채팅방 만들기 패널 닫기 + 입력값 초기화
  const closeCreatePanel = () => {
    setShowCreate(false);
    setRoomName('');
    setCreateKeyword('');
    setSelectedMemberSeqs([]);
  };

  // 채팅방 생성 및 친구 초대
  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      alert('채팅방 이름을 입력해주세요.');
      return;
    }

    if (selectedMemberSeqs.length === 0) {
      alert('초대할 친구를 선택해주세요.');
      return;
    }

    try {
      const response = await Client.post('/api/chat/room', {
        room_name: roomName.trim(),
        room_type: selectedMemberSeqs.length > 1 ? 'GROUP' : '1:1',
        invitee_seqs: selectedMemberSeqs
      });

      closeCreatePanel();
      navi(`/chatting/${response.data.chat_room_seq}`);
    } catch (error) {
      console.error('채팅방 생성 실패:', error);
      alert(error.response?.data || '채팅방 생성에 실패했습니다.');
    }
  };

  // 받은 채팅 초대 수락 및 거절
  const respondInvitation = async (invitation, accept) => {
    try {
      const url = `/api/chat/invite/${invitation.chat_invitation_seq}/${accept ? 'accept' : 'reject'}`;

      await Client.post(url);
      await fetchInvitations();

      if (accept) {
        await refreshRooms();
        navi(`/chatting/${invitation.chat_room_seq}`);
      }
    } catch (error) {
      console.error('초대 처리 실패:', error);
      alert(error.response?.data || '초대 처리에 실패했습니다.');
    }
  };

  // 채팅방 만들기에서 친구 닉네임/아이디로 거르기
  const filteredMyFriends = friendList.filter((friend) => {
    const keyword = friendSearchMode === 'mine' ? myFriendKeyword.trim().toLowerCase() : '';
    if (!keyword) return true;
    return (
      (friend.nickname || '').toLowerCase().includes(keyword) ||
      (friend.login_id || '').toLowerCase().includes(keyword)
    );
  });

  const filteredCreateFriends = friendList.filter((friend) => {
    const keyword = createKeyword.trim().toLowerCase();

    if (!keyword) return true;

    return (
      (friend.nickname || '').toLowerCase().includes(keyword) ||
      (friend.login_id || '').toLowerCase().includes(keyword)
    );
  });

  return (
    <>
      <div className={styles.popupDockTabs}>
        <button
          type="button"
          className={`${styles.dockTab} ${sidebarTab === 'friends' ? styles.dockTabActive : ''}`}
          onClick={() => setSidebarTab('friends')}
        >
          친구 목록 ({friendList.length})
        </button>
        <button
          type="button"
          className={`${styles.dockTab} ${sidebarTab === 'rooms' ? styles.dockTabActive : ''}`}
          onClick={() => setSidebarTab('rooms')}
        >
          <span>채팅방</span>
          {totalUnread > 0 && <span className={styles.dockBadge}>{totalUnread}</span>}
        </button>
      </div>

      <div className={styles.popupDockBody}>
        <div className={styles.sidebarListBox}>
          {sidebarTab === 'friends' && (
            <>
              <div className={styles.sidebarFixedTop}>
                <h3 className={styles.sidebarListTitle}>
                  내 친구 <span className={styles.sidebarCount}>{friendList.length}</span>
                </h3>

                <div className={styles.searchModeToggle}>
                  <button
                    type="button"
                    className={`${styles.searchModeBtn} ${friendSearchMode === 'mine' ? styles.searchModeActive : ''
                      }`}
                    onClick={() => setFriendSearchMode('mine')}
                  >
                    내 친구 검색
                  </button>
                  <button
                    type="button"
                    className={`${styles.searchModeBtn} ${friendSearchMode === 'add' ? styles.searchModeActive : ''
                      }`}
                    onClick={() => setFriendSearchMode('add')}
                  >
                    친구 추가 검색
                  </button>
                </div>

                {friendSearchMode === 'mine' ? (
                  <div className={styles.sidebarSearchRow}>
                    <input
                      type="text"
                      className={styles.sidebarInput}
                      value={myFriendKeyword}
                      onChange={(e) => setMyFriendKeyword(e.target.value)}
                      placeholder="닉네임 또는 아이디로 내 친구 찾기"
                    />
                    {myFriendKeyword && (
                      <button
                        type="button"
                        className={styles.sidebarSmallBtn}
                        onClick={() => setMyFriendKeyword('')}
                      >
                        지우기
                      </button>
                    )}
                  </div>
                ) : (
                  <div className={styles.sidebarSearchRow}>
                    <input
                      type="text"
                      className={styles.sidebarInput}
                      value={friendSearchKeyword}
                      onChange={(e) => {
                        setFriendSearchKeyword(e.target.value);
                        if (!e.target.value.trim()) {
                          setFriendSearchResults([]);
                          setFriendSearchMessage('');
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') searchNonFriends();
                      }}
                      placeholder="로그인 아이디로 친구 추가 검색"
                    />
                    <button
                      type="button"
                      className={styles.sidebarSmallBtn}
                      onClick={searchNonFriends}
                    >
                      검색
                    </button>
                  </div>
                )}

                {friendSearchMode === 'add' && friendSearchMessage && (
                  <p className={styles.sidebarEmpty}>{friendSearchMessage}</p>
                )}

                {friendSearchMode === 'add' &&
                  friendSearchResults.map((member) => (
                    <div key={member.member_seq} className={styles.sidebarPerson}>
                      <span className={styles.sidebarPersonName}>
                        {member.nickname || member.login_id} ({member.login_id})
                      </span>
                      <button
                        type="button"
                        className={styles.sidebarPrimaryBtn}
                        onClick={() => addSearchedFriend(member)}
                      >
                        친구 추가
                      </button>
                    </div>
                  ))}
              </div>

              <div className={styles.sidebarScroll}>
                {friendList.length === 0 && (
                  <p className={styles.sidebarEmpty}>등록된 친구가 없습니다.</p>
                )}

                {friendList.length > 0 && filteredMyFriends.length === 0 && (
                  <p className={styles.sidebarEmpty}>검색 결과가 없습니다.</p>
                )}

                {filteredMyFriends.map((friend) => {
                  const friendSeq = friend.member_seq ?? friend.memberSeq;
                  return (
                    <div
                      className={styles.sidebarPerson}
                      key={friendSeq ?? friend.login_id ?? friend.loginId}
                      onClick={() => onOpenProfile?.(friendSeq)}
                      style={{ cursor: 'pointer' }}
                      title="프로필 보기"
                    >
                      {friendImageUrls[Number(friendSeq)] ? (
                        <img
                          src={friendImageUrls[Number(friendSeq)]}
                          alt=""
                          className={styles.sidebarAvatar}
                        />
                      ) : (
                        <div className={styles.sidebarAvatarFallback}>👤</div>
                      )}

                      <span className={styles.sidebarPersonName}>
                        {friend.nickname || friend.login_id || friend.loginId}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {sidebarTab === 'rooms' && (
            <>
              <div className={`${styles.sidebarTitleRow} ${styles.sidebarFixedTop}`}>
                <h3 className={styles.sidebarListTitle}>
                  내 채팅방 <span className={styles.sidebarCount}>{myRoomList.length}</span>
                </h3>

                <div className={styles.sidebarTitleActions}>
                  <button type="button" className={styles.sidebarSmallBtn} onClick={refreshRooms}>
                    새로고침
                  </button>
                  <button
                    type="button"
                    className={styles.sidebarPrimaryBtn}
                    onClick={() => (showCreate ? closeCreatePanel() : setShowCreate(true))}
                  >
                    {showCreate ? '닫기' : '+ 새 채팅방'}
                  </button>
                </div>
              </div>

              <div className={styles.sidebarScroll}>
                {showCreate && (
                  <div className={styles.createPanel}>
                    <label className={styles.createLabel}>채팅방 이름</label>
                    <input
                      type="text"
                      className={styles.sidebarInput}
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      placeholder="채팅방 이름을 입력하세요"
                    />

                    <label className={styles.createLabel}>
                      초대할 친구 ({selectedMemberSeqs.length}명 선택)
                    </label>
                    <input
                      type="text"
                      className={styles.sidebarInput}
                      value={createKeyword}
                      onChange={(e) => setCreateKeyword(e.target.value)}
                      placeholder="친구 닉네임 검색"
                    />

                    <div className={styles.createFriendList}>
                      {filteredCreateFriends.length === 0 ? (
                        <p className={styles.sidebarEmpty}>
                          {friendList.length === 0
                            ? '먼저 친구를 추가해 주세요.'
                            : '검색 결과가 없습니다.'}
                        </p>
                      ) : (
                        filteredCreateFriends.map((friend) => {
                          const selected = selectedMemberSeqs.includes(Number(friend.member_seq));

                          return (
                            <button
                              type="button"
                              key={friend.member_seq}
                              className={`${styles.createFriendItem} ${selected ? styles.createFriendSelected : ''
                                }`}
                              onClick={() => toggleCreateMember(friend.member_seq)}
                            >
                              {friendImageUrls[Number(friend.member_seq)] ? (
                                <img
                                  src={friendImageUrls[Number(friend.member_seq)]}
                                  alt=""
                                  className={styles.sidebarAvatar}
                                />
                              ) : (
                                <div className={styles.sidebarAvatarFallback}>
                                  {(friend.nickname || friend.login_id || '?').slice(0, 1)}
                                </div>
                              )}

                              <span className={styles.sidebarPersonName}>
                                {friend.nickname || friend.login_id}
                              </span>
                              <span className={styles.createCheck}>{selected ? '✓' : ''}</span>
                            </button>
                          );
                        })
                      )}
                    </div>

                    <button
                      type="button"
                      className={styles.createSubmitBtn}
                      onClick={handleCreateRoom}
                    >
                      채팅방 생성 및 초대 보내기
                    </button>
                  </div>
                )}

                {invitations.length > 0 && (
                  <div className={styles.inviteSection}>
                    <h4 className={styles.inviteSectionTitle}>받은 채팅 초대</h4>

                    {invitations.map((invitation) => (
                      <div key={invitation.chat_invitation_seq} className={styles.inviteItem}>
                        <span className={styles.inviteText}>
                          {invitation.inviter_nick || '회원'}님이{' '}
                          {invitation.room_name || '채팅방'}에 초대했습니다.
                        </span>

                        <div className={styles.inviteActions}>
                          <button
                            type="button"
                            className={styles.sidebarPrimaryBtn}
                            onClick={() => respondInvitation(invitation, true)}
                          >
                            수락
                          </button>
                          <button
                            type="button"
                            className={styles.sidebarSmallBtn}
                            onClick={() => respondInvitation(invitation, false)}
                          >
                            거절
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {myRoomList.length === 0 && (
                  <p className={styles.sidebarEmpty}>참여 중인 채팅방이 없습니다.</p>
                )}

                {myRoomList.map((room) => (
                  <button
                    type="button"
                    className={styles.sidebarRoom}
                    key={room.chat_room_seq}
                    onClick={() => navi(`/chatting/${room.chat_room_seq}`)}
                  >
                    <div className={styles.sidebarRoomTop}>
                      <strong>{room.room_name || room.partner_nick || '채팅방'}</strong>

                      {room.unread_count > 0 && (
                        <span className={styles.sidebarUnread}>{room.unread_count}</span>
                      )}
                    </div>

                    <span>{room.last_message || '대화를 시작해보세요.'}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
