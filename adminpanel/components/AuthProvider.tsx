'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (token) {
      // Verify token with backend
      fetch('https://admin.anantalive.com/api/admin/verify-token', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      .then(res => {
        if (res.ok) {
          setIsAuthenticated(true);
          // If user is on login page and authenticated, redirect to users
          if (pathname === '/login') {
            router.push('/users');
          }
        } else {
          localStorage.removeItem('token');
          document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
          setIsAuthenticated(false);
          if (pathname !== '/login') {
            router.push('/login');
          }
        }
      })
      .catch((error) => {
        console.error('Token verification failed:', error);
        localStorage.removeItem('token');
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
        setIsAuthenticated(false);
        if (pathname !== '/login') {
          router.push('/login');
        }
      })
      .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
      setIsAuthenticated(false);
      if (pathname !== '/login') {
        router.push('/login');
      }
    }
  }, [pathname, router]);

  const login = (token: string) => {
    console.log('AuthProvider: Setting token and authentication state');
    localStorage.setItem('token', token);
    // Set cookie without domain (will use current domain)
    document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Lax; Secure`;
    setIsAuthenticated(true);
    setIsLoading(false);
  };

  const logout = () => {
    localStorage.removeItem('token');
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    setIsAuthenticated(false);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}