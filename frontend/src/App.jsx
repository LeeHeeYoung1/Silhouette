import { Routes, Route, Navigate } from 'react-router-dom';

import Home from './pages/home/home';
import Login from './pages/login/login';
import Signup from './pages/signup/signup';
import Layout from './pages/layout/layout';
import MyPage from './pages/home/mypage/mypage';
import Post from './pages/post/post';
import PostList from './pages/post/postlist';
import PostDetail from './pages/post/postdetail';
import PostWrite from './pages/post/postwrite';
import Live from './pages/live/live';
import LiveAdmin from './pages/live/liveAdmin';
import Chatting from './pages/chatting/chatting';
import ChatRoomList from './pages/chattingRoomList/chattingRoomList';
import Event from './pages/event/event';
// import Profile from './pages/profile/profile';
import Onboarding from './pages/onboarding/onboarding';

import BlindChatting from './pages/blindChatting/blindChatting';


function App() {
  return (
    <Routes>
      {/* 상단 헤더 및 공통 레이아웃 */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/event" element={<Event />} />
        {/* <Route path="/profile" element={<Profile />} /> */}
        
        {/* 게시판 (Post) 라우트 */}
        <Route path="/post" element={<Post />}>
          <Route index element={<Navigate to="free" replace />} />
          <Route path="free" element={<PostList boardType="free" />} />
          <Route path="notice" element={<PostList boardType="notice" />} />
          <Route path="faq" element={<PostList boardType="faq" />} />
          <Route path="qna" element={<PostList boardType="qna" />} />
          <Route path="free/write" element={<PostWrite writeType="free" />} />
          <Route path="notice/write" element={<PostWrite writeType="notice" />} />
          <Route path="qna/write" element={<PostWrite writeType="qna" />} />
          <Route path="write/:type" element={<PostWrite />} />
          <Route path="detail/:id" element={<PostDetail />} />
        </Route>

        <Route path="/board/*" element={<Navigate to="/post/free" replace />} />
        <Route path="/live" element={<Live />} />
        <Route path="/admin/live" element={<LiveAdmin />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/chatting/:roomId" element={<Chatting />} />
        <Route path="/chattingRoomList" element={<ChatRoomList />} />

        {/* 블라인드 (blind) 라우트 */}
        <Route path='/chat/:roomSeq' element={<BlindChatting />} />
      </Route>

        <Route path="/onboarding" element={<Onboarding />} />   {/* ← 여기 추가 */}

      <Route path="*" element={<Navigate to="/" replace />} />

      
    </Routes>
  );
}

export default App;