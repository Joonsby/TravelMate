import { createBrowserRouter, Navigate } from 'react-router-dom'
import AppShell from '../components/layout/AppShell'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import LoginPage from '../features/auth/LoginPage'
import ItineraryPage from '../features/itinerary/ItineraryPage'
import ChatPage from '../features/chat/ChatPage'
import NotesPage from '../features/notes/NotesPage'
import ChecklistPage from '../features/checklist/ChecklistPage'
import ExpensePage from '../features/expense/ExpensePage'
import ProfilePage from '../features/profile/ProfilePage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <AppShell />,
        children: [
          { index: true, element: <Navigate to="/itinerary" replace /> },
          { path: 'itinerary', element: <ItineraryPage /> },
          { path: 'chat',      element: <ChatPage /> },
          { path: 'notes',     element: <NotesPage /> },
          { path: 'checklist', element: <ChecklistPage /> },
          { path: 'expense',   element: <ExpensePage /> },
          { path: 'profile',   element: <ProfilePage /> },
        ],
      },
    ],
  },
])
