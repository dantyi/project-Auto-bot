import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)         // { username, role }
  const [loading, setLoading] = useState(true)   // checking localStorage on mount

  // On mount: restore session from localStorage
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user')
      const storedToken = localStorage.getItem('token')
      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser))
      }
    } catch {
      localStorage.removeItem('user')
      localStorage.removeItem('token')
    } finally {
      setLoading(false)
    }
  }, [])

  const login = async (username, password) => {
    const response = await api.post('/auth/login', { username, password })
    const { token, role, username: uname } = response.data

    const userData = { username: uname, role }
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)

    return userData
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // Ignore errors on logout — token is stateless
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setUser(null)
    }
  }

  const isAuthenticated = Boolean(user)

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export default AuthContext
