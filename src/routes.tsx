import { createBrowserRouter } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import ChatView from './components/chat/ChatView';
import GalleryView from './components/gallery/GalleryView';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <ChatView /> },
      { path: 'chat/:sessionId', element: <ChatView /> },
      { path: 'gallery', element: <GalleryView /> },
    ],
  },
]);
