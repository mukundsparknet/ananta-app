'use client';
import { useState } from 'react';
import axios from 'axios';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/admin/login', { email, password });
      localStorage.setItem('token', response.data.token);
      window.location.href = '/users';
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{width:'100%',maxWidth:440}}>
        {/* Header */}
        <div style={{textAlign:'center',marginBottom:48}}>
          <div style={{
            width:80,
            height:80,
            background:'linear-gradient(135deg, #4299e1, #3182ce)',
            borderRadius:16,
            margin:'0 auto 24px',
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            fontSize:32,
            fontWeight:'bold',
            color:'white',
            boxShadow:'0 10px 25px rgba(66, 153, 225, 0.3)'
          }}>
            A
          </div>
          <h1 style={{margin:0,fontSize:32,fontWeight:700,color:'#1a202c',marginBottom:8}}>ANANTA Admin</h1>
          <p style={{margin:0,color:'#718096',fontSize:16}}>Sign in to access the administration panel</p>
        </div>

        {/* Login Form */}
        <div style={{background:'white',padding:40,borderRadius:12,boxShadow:'0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',border:'1px solid #e2e8f0'}}>
          <form onSubmit={handleSubmit} autoComplete="off">
            <div style={{marginBottom:24}}>
              <label style={{display:'block',marginBottom:8,color:'#2d3748',fontWeight:600,fontSize:14}}>
                Email Address
              </label>
              <input 
                type="email" 
                value={email} 
                onChange={(e)=>setEmail(e.target.value)} 
                style={{
                  width:'100%',
                  padding:'14px 16px',
                  border:'2px solid #e2e8f0',
                  borderRadius:8,
                  fontSize:16,
                  transition:'all 0.2s',
                  outline:'none',
                  background:'#f7fafc',
                  boxSizing:'border-box'
                }}
                autoComplete="off"
                onFocus={(e) => {
                  e.target.style.borderColor = '#4299e1';
                  e.target.style.background = 'white';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.background = '#f7fafc';
                }}
                required 
              />
            </div>
            
            <div style={{marginBottom:32}}>
              <label style={{display:'block',marginBottom:8,color:'#2d3748',fontWeight:600,fontSize:14}}>
                Password
              </label>
              <div style={{position:'relative'}}>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={password} 
                  onChange={(e)=>setPassword(e.target.value)} 
                  style={{
                    width:'100%',
                    padding:'14px 16px',
                    paddingRight:60,
                    border:'2px solid #e2e8f0',
                    borderRadius:8,
                    fontSize:16,
                    transition:'all 0.2s',
                    outline:'none',
                    background:'#f7fafc',
                    boxSizing:'border-box'
                  }}
                  autoComplete="new-password"
                  placeholder="Enter your password"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#4299e1';
                    e.target.style.background = 'white';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.background = '#f7fafc';
                  }}
                  required 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position:'absolute',
                    right:12,
                    top:'50%',
                    transform:'translateY(-50%)',
                    fontSize:13,
                    color:'#4299e1',
                    background:'transparent',
                    border:'none',
                    cursor:'pointer',
                    padding:'4px 8px',
                    fontWeight:600
                  }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                background:'#fed7d7',
                border:'1px solid #feb2b2',
                color:'#c53030',
                padding:16,
                borderRadius:8,
                marginBottom:24,
                fontSize:14,
                fontWeight:500
              }}>
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              style={{
                width:'100%',
                padding:16,
                background: loading ? '#a0aec0' : 'linear-gradient(135deg, #4299e1, #3182ce)',
                color:'white',
                border:'none',
                borderRadius:8,
                fontSize:16,
                fontWeight:600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition:'all 0.2s',
                boxShadow: loading ? 'none' : '0 4px 14px 0 rgba(66, 153, 225, 0.39)'
              }}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div style={{textAlign:'center',marginTop:32}}>
          <p style={{margin:0,color:'#a0aec0',fontSize:14}}>© 2026 ANANTA. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
