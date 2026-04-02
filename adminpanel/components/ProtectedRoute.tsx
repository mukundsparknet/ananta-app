'use client';
import { useAuth } from './AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('ProtectedRoute: isLoading=', isLoading, 'isAuthenticated=', isAuthenticated);
    if (!isLoading && !isAuthenticated) {
      console.log('ProtectedRoute: Redirecting to login');
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    console.log('ProtectedRoute: Showing loading screen');
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#f7f8fc'
      }}>
        <div style={{
          padding: '20px',
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e2e8f0',
            borderTop: '4px solid #3182ce',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ margin: 0, color: '#4a5568', textAlign: 'center' }}>Verifying authentication...</p>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('ProtectedRoute: Not authenticated, returning null');
    return null;
  }

  console.log('ProtectedRoute: Authenticated, rendering children');
  return <>{children}</>;
}