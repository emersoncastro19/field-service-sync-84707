import React, { createContext, useContext, useEffect, useState } from 'react'
import { obtenerUsuarioActual, logoutUsuario } from '@/backend/services/authService'
import { Usuario, AuthContextType } from '@/shared/types'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null)

  useEffect(() => {
    const u = obtenerUsuarioActual()
    setUsuario(u)
  }, [])

  const logout = () => {
    logoutUsuario()
    setUsuario(null)
  }

  return (
    <AuthContext.Provider value={{ usuario, setUsuario, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
