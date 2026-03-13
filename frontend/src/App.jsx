import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import NuevaTarea from './pages/NuevaTarea.jsx'
import TaskDetail from './pages/TaskDetail.jsx'
import AdminUsers from './pages/AdminUsers.jsx'

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* All authenticated users */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Task detail — all authenticated */}
        <Route
          path="/tarea/:id"
          element={
            <ProtectedRoute>
              <TaskDetail />
            </ProtectedRoute>
          }
        />

        {/* Nueva tarea — roles that can create tasks */}
        <Route
          path="/nueva-tarea"
          element={
            <ProtectedRoute allowedRoles={['kickoff', 'ultima_milla', 'config_pem', 'coordinador', 'orquestador']}>
              <NuevaTarea />
            </ProtectedRoute>
          }
        />

        {/* Admin-only: user management */}
        <Route
          path="/admin/usuarios"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />

        {/* Catch-all → dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  )
}
