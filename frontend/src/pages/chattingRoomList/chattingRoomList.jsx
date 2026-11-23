
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Client from '../../api/client';
import useAuthStore from '../../stores/useAuthStore';
import styles from './chattingRoomList.module.css';

// 로그인 토큰을 사용해서 프로필 이미지 가져오기
function MemberProfileImage({ imagePath, alt }) {
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    if (!imagePath) {
      setImageUrl('');
      return;
    }

    let cancelled = false;
    let objectUrl = '';

    // 외부 이미지 주소라면 그대로 사용
    if (/^https?:\/\//i.test(imagePath)) {
      setImageUrl(imagePath);
      return;
    }

    // 서버 이미지라면 Axios로 가져오기
    Client.get(imagePath, {
      responseType: 'blob'
    })
      .then((response) => {
        if (cancelled) return;

        objectUrl = URL.createObjectURL(response.data);
        setImageUrl(objectUrl);
      })
      .catch((error) => {
        console.error('프로필 이미지 불러오기 실패:', error);
        setImageUrl('');
      });

    return () => {
      cancelled = true;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [imagePath]);

  if (!imageUrl) {
    return <span>👤</span>;
  }

  return (
    <img
      src={imageUrl}
      alt={alt || '프로필'}
    />
  );
}

function ChatRoomList() {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);

  const [roomList, setRoomList] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [roomName, setRoomName] = useState('');

  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searchMessage, setSearchMessage] = useState('');

  // 채팅방 목록 불러오기
  const fetchChatRooms = async () => {
    try {
      const response = await Client.get('/api/chat/rooms');
      setRoomList(response.data);
    } catch (error) {
      console.error('채팅방 목록을 불러오는데 실패했습니다.', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 받은 채팅 초대 목록 불러오기
  const fetchInvitations = async () => {
    try {
      const response = await Client.get('/api/chat/invitations');
      setInvitations(response.data);
    } catch (error) {
      console.error('초대 목록을 불러오는데 실패했습니다.', error);
    }
  };

  // 로그인 후 목록 불러오기
  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    fetchChatRooms();
    fetchInvitations();
  }, [token]);

  // 회원 닉네임 검색
  const searchMembers = async () => {
    if (!searchKeyword.trim()) {
      setSearchResults([]);
      setSearchMessage('검색어를 입력해주세요.');
      return;
    }

    try {
      const response = await Client.get('/api/chat/members', {
        params: {
          keyword: searchKeyword.trim()
        }
      });

      setSearchResults(response.data);
      setSearchMessage(
        response.data.length === 0 ? '검색 결과가 없습니다.' : ''
      );
    } catch (error) {
      console.error('회원 검색 실패:', error);
      setSearchMessage('회원 검색에 실패했습니다.');
    }
  };

  // 초대할 회원 선택 및 취소
  const toggleMember = (member) => {
    setSelectedMembers((prev) => {
      const alreadySelected = prev.some(
        (item) => item.member_seq === member.member_seq
      );

      if (alreadySelected) {
        return prev.filter(
          (item) => item.member_seq !== member.member_seq
        );
      }

      return [...prev, member];
    });
  };

  // 채팅방 생성 및 회원 초대
  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      alert('채팅방 이름을 입력해주세요.');
      return;
    }

    if (selectedMembers.length === 0) {
      alert('초대할 친구를 선택해주세요.');
      return;
    }

    try {
      const response = await Client.post('/api/chat/room', {
        room_name: roomName.trim(),
        room_type: selectedMembers.length > 1 ? 'GROUP' : '1:1',
        invitee_seqs: selectedMembers.map(
          (member) => member.member_seq
        )
      });

      navigate(`/chatting/${response.data.chat_room_seq}`);
    } catch (error) {
      console.error('채팅방 생성 실패:', error);
      alert(error.response?.data || '채팅방 생성에 실패했습니다.');
    }
  };

  // 채팅방 입장
  const handleEnterRoom = (chat_room_seq) => {
    navigate(`/chatting/${chat_room_seq}`);
  };

  // 채팅 초대 수락 및 거절
  const respondInvitation = async (invitation, accept) => {
    try {
      const url = `/api/chat/invite/${invitation.chat_invitation_seq}/${accept ? 'accept' : 'reject'}`;

      await Client.post(url);

      await fetchInvitations();

      if (accept) {
        await fetchChatRooms();
        navigate(`/chatting/${invitation.chat_room_seq}`);
      }
    } catch (error) {
      console.error('초대 처리 실패:', error);
      alert(error.response?.data || '초대 처리에 실패했습니다.');
    }
  };

  return (
    <div className={styles.container}>

      {/* 상단 제목 */}
      <div className={styles.header}>
        <div className={styles.headerText}>
          <span className={styles.eyebrow}>MESSAGES</span>
          <h2>💬 내 채팅방 목록</h2>
          <p>진행 중인 대화를 확인해보세요.</p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreate((prev) => !prev)}
          className={styles.createBtn}
        >
          {showCreate ? '채팅방 만들기 닫기' : '+ 새 채팅방 만들기'}
        </button>
      </div>

      {/* 새 채팅방 생성 */}
      {showCreate && (
        <div className={styles.createPanel}>
          <div className={styles.createPanelHeader}>
            <div>
              <span className={styles.eyebrow}>NEW CONVERSATION</span>
              <h3>새 채팅방 만들기</h3>
              <p>함께 대화할 친구를 검색하고 선택해주세요.</p>
            </div>

            <div className={styles.createIcon}>💬</div>
          </div>

          <label className={styles.fieldLabel}>
            채팅방 이름
          </label>

          <input
            className={styles.textInput}
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="채팅방 이름을 입력하세요"
          />

          <label className={styles.fieldLabel}>
            친구 검색
          </label>

          <div className={styles.searchRow}>
            <input
              className={styles.textInput}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  searchMembers();
                }
              }}
              placeholder="초대할 친구 닉네임 검색"
            />

            <button
              type="button"
              onClick={searchMembers}
              className={styles.searchBtn}
            >
              검색
            </button>
          </div>

          {searchMessage && (
            <p className={styles.searchMessage}>
              {searchMessage}
            </p>
          )}

          {/* 친구 검색 결과 */}
          {searchResults.length > 0 && (
            <div className={styles.memberResults}>
              {searchResults.map((member) => {
                const selected = selectedMembers.some(
                  (item) => item.member_seq === member.member_seq
                );

                return (
                  <div
                    key={member.member_seq}
                    className={styles.memberResult}
                  >
                    <div className={styles.memberAvatar}>
                      <MemberProfileImage
                        imagePath={member.profile_image}
                        alt={member.nickname}
                      />
                    </div>

                    <span>
                      {member.nickname || member.login_id}
                    </span>

                    <button
                      type="button"
                      className={
                        selected
                          ? styles.selectedBtn
                          : styles.selectBtn
                      }
                      onClick={() => toggleMember(member)}
                    >
                      {selected ? '선택 취소' : '선택'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* 선택한 회원 */}
          {selectedMembers.length > 0 && (
            <div className={styles.selectedArea}>
              <strong>
                초대할 친구 ({selectedMembers.length}명)
              </strong>

              <div className={styles.selectedMembers}>
                {selectedMembers.map((member) => (
                  <button
                    key={member.member_seq}
                    type="button"
                    onClick={() => toggleMember(member)}
                  >
                    {member.nickname || member.login_id} ×
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 채팅방 생성 */}
          <button
            type="button"
            onClick={handleCreateRoom}
            className={styles.submitBtn}
          >
            채팅방 생성 및 초대 보내기
          </button>
        </div>
      )}

      {/* 받은 채팅 초대 */}
      {invitations.length > 0 && (
        <div className={styles.listSection}>
          <div className={styles.listHeader}>
            <div>
              <span className={styles.eyebrow}>INVITATIONS</span>
              <h3>받은 채팅 초대</h3>
            </div>
          </div>

          {invitations.map((invitation) => (
            <div
              key={invitation.chat_invitation_seq}
              className={styles.memberResult}
            >
              <div className={styles.memberAvatar}>
                💌
              </div>

              <span>
                {invitation.inviter_nick || '회원'}님이
                {' '}{invitation.room_name || '채팅방'}에 초대했습니다.
              </span>

              <button
                type="button"
                className={styles.selectBtn}
                onClick={() => respondInvitation(invitation, true)}
              >
                수락
              </button>

              <button
                type="button"
                className={styles.selectedBtn}
                onClick={() => respondInvitation(invitation, false)}
              >
                거절
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 채팅방 목록 */}
      <div className={styles.listSection}>
        <div className={styles.listHeader}>
          <div>
            <span className={styles.eyebrow}>MY CHAT ROOMS</span>
            <h3>
              채팅방 목록
              <span>{roomList.length}</span>
            </h3>
          </div>

          <button
            type="button"
            className={styles.refreshBtn}
            onClick={fetchChatRooms}
          >
            새로고침
          </button>
        </div>

        {isLoading ? (
          <div className={styles.emptyState}>
            <span>💬</span>
            <h4>목록을 불러오는 중입니다.</h4>
          </div>
        ) : roomList.length === 0 ? (
          <div className={styles.emptyState}>
            <span>💬</span>
            <h4>참여 중인 채팅방이 없습니다.</h4>
            <p>친구를 초대해서 첫 대화를 시작해보세요.</p>

            <button
              type="button"
              onClick={() => setShowCreate(true)}
            >
              새 채팅방 만들기
            </button>
          </div>
        ) : (
          <div className={styles.roomGrid}>
            {roomList.map((room) => (
              <button
                type="button"
                key={room.chat_room_seq}
                className={styles.roomCard}
                onClick={() => handleEnterRoom(room.chat_room_seq)}
              >
                <div className={styles.cardTop}>
                  <div className={styles.roomAvatar}>
                    {room.partner_profile ? (
                      <img
                        src={room.partner_profile}
                        alt="profile"
                      />
                    ) : (
                      '👤'
                    )}
                  </div>

                  <span className={styles.roomArrow}>↗</span>
                </div>

                <div className={styles.roomIdentity}>
                  <strong>
                    {room.room_name || room.partner_nick || '상대방'}
                  </strong>

                  <span>
                    {room.partner_nick || '채팅 상대'}
                  </span>
                </div>

                <div className={styles.cardBottom}>
                  <p>
                    {room.last_message || '대화를 시작해보세요.'}
                  </p>

                  <div className={styles.cardMeta}>
                    <span>
                      {room.last_send_time
                        ? new Date(room.last_send_time).toLocaleDateString()
                        : ''}
                    </span>

                    {room.unread_count > 0 && (
                      <span className={styles.unreadBadge}>
                        {room.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatRoomList;
