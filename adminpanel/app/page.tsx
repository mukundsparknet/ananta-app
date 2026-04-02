'use client';
import { useEffect } from 'react';

export default function HomePage() {
  useEffect(() => {
    window.location.href = '/login';
  }, []);

  return (
    <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh'}}>
      <div style={{textAlign:'center'}}>
        <h1>🚀 Redirecting to Login...</h1>
      </div>
    </div>
  );
}