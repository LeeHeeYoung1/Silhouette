import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Client from '../../api/client';
import useAuthStore from '../../stores/useAuthStore';
import styles from './chattingRoomList.module.css';

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

  const fetchInvitations = async () => {
    try {
      const response = await Client.get('/api/chat/invitations');
      setInvitations(response.data);
    } catch (error) {
      console.error('초대 목록을 불러오는데 실패했습니다.', error);
    }
  };

  useEffect(() => {
    if (!token) return;

    Client.get('/api/chat/rooms')
      .then((response) => setRoomList(response.data))
      .catch((error) => console.error('채팅방 목록을 불러오는데 실패했습니다.', error))
      .finally(() => setIsLoading(false));

    Client.get('/api/chat/invitations')
      .then((response) => setInvitations(response.data))
      .catch((error) => console.error('초대 목록을 불러오는데 실패했습니다.', error));
  }, [token]);

  const searchMembers = async () => {
    if (!searchKeyword.trim()) {
      setSearchResults([]);
      setSearchMessage('검색어를 입력해주세요.');
      return;
    }

    try {
      const response = await Client.get('/api/chat/members', {
        params: { keyword: searchKeyword.trim() }
      });
      setSearchResults(response.data);
      setSearchMessage(response.data.length === 0 ? '검색 결과가 없습니다.' : '');
    } catch (error) {
      console.error('회원 검색 실패:', error);
      setSearchMessage('회원 검색에 실패했습니다.');
    }
  };

  const toggleMember = (member) => {
    setSelectedMembers((prev) => {
      if (prev.some((item) => item.member_seq === member.member_seq)) {
        return prev.filter((item) => item.member_seq !== member.member_seq);
      }
      return [...prev, member];
    });
  };

  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      alert('채팅방 이름을 입력해주세요.');
      return;
    }

    try {
      const response = await Client.post('/api/chat/room', {
        room_name: roomName.trim(),
        room_type: selectedMembers.length > 1 ? 'GROUP' : '1:1',
        invitee_seqs: selectedMembers.map((member) => member.member_seq)
      });
      navigate(`/chatting/${response.data.chat_room_seq}`);
    } catch (error) {
      console.error('채팅방 생성 실패:', error);
      alert(error.response?.data || '채팅방 생성에 실패했습니다.');
    }
  };

  const handleEnterRoom = (chat_room_seq) => {
    navigate(`/chatting/${chat_room_seq}`);
  };

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
      alert(error.response?.data || '초대 처리에 실패했습니다.');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>💬 내 채팅방 목록</h2>
        <p>진행 중인 대화를 확인해보세요.</p>
        <button onClick={() => setShowCreate((prev) => !prev)} className={styles.createBtn}>
          {showCreate ? '채팅방 만들기 닫기' : '+ 새 채팅방 만들기'}
        </button>

        {showCreate && (
          <div style={{ marginTop: '16px', padding: '16px', border: '1px solid var(--border-color, #ddd)', borderRadius: '12px', background: 'var(--card-bg, #fff)' }}>
            <h3>새 채팅방 만들기</h3>
            <input
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="채팅방 이름을 입력하세요"
              style={{ width: '100%', boxSizing: 'border-box', padding: '10px', marginBottom: '12px' }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') searchMembers(); }}
                placeholder="초대할 회원 닉네임 또는 아이디 검색"
                style={{ flex: 1, minWidth: 0, padding: '10px' }}
              />
              <button type="button" onClick={searchMembers}>검색</button>
            </div>
            {searchMessage && <p>{searchMessage}</p>}
            {searchResults.map((member) => {
              const selected = selectedMembers.some((item) => item.member_seq === member.member_seq);
              return (
                <div key={member.member_seq} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                  <span>{member.nickname || member.login_id} ({member.login_id})</span>
                  <button type="button" onClick={() => toggleMember(member)}>
                    {selected ? '선택 취소' : '선택'}
                  </button>
                </div>
              );
            })}
            {selectedMembers.length > 0 && (
              <div style={{ marginTop: '12px' }}>
                <strong>초대할 회원 ({selectedMembers.length}명)</strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                  {selectedMembers.map((member) => (
                    <button key={member.member_seq} type="button" onClick={() => toggleMember(member)}>
                      {member.nickname || member.login_id} ×
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button type="button" onClick={handleCreateRoom} style={{ marginTop: '14px', width: '100%', padding: '10px' }}>
              채팅방 생성 및 초대 보내기
            </button>
          </div>
        )}
      </div>

      {invitations.length > 0 && (
        <div className={styles.roomListWrapper} style={{ marginBottom: '20px', padding: '16px' }}>
          <h3>받은 채팅 초대</h3>
          {invitations.map((invitation) => (
            <div key={invitation.chat_invitation_seq}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '10px 0', borderBottom: '1px solid #eee' }}>
              <div>
                <strong>{invitation.inviter_nick || '회원'}님이 초대했습니다.</strong>
                <div>{invitation.room_name || '채팅방'}</div>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button type="button" onClick={() => respondInvitation(invitation, true)}>수락</button>
                <button type="button" onClick={() => respondInvitation(invitation, false)}>거절</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={styles.roomListWrapper}>
        {isLoading ? (
          <div className={styles.emptyMessage}>목록을 불러오는 중입니다...</div>
        ) : roomList.length === 0 ? (
          <div className={styles.emptyMessage}>참여 중인 채팅방이 없습니다.</div>
        ) : (
          <ul className={styles.roomList}>
            {roomList.map((room) => (
              <li
                key={room.chat_room_seq}
                className={styles.roomItem}
                onClick={() => handleEnterRoom(room.chat_room_seq)}
              >
                <div className={styles.roomAvatar}>
                  {room.partner_profile ? (
                    <img src={room.partner_profile} alt="profile"
                      style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                  ) : (
                    '👤'
                  )}
                </div>
                <div className={styles.roomInfo}>
                  <div className={styles.roomTop}>
                    <span className={styles.roomName}>
                      {room.room_name || room.partner_nick || '상대방'}
                    </span>
                    <span className={styles.roomDate}>
                      {room.last_send_time ? new Date(room.last_send_time).toLocaleDateString() : ''}
                    </span>
                  </div>
                  <div className={styles.roomBottom}>
                    <span className={styles.roomPreview}>
                      {room.last_message || '대화를 시작해보세요.'}
                    </span>
                    {room.unread_count > 0 && (
                      <span className={styles.unreadBadge}>{room.unread_count}</span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default ChatRoomList;
