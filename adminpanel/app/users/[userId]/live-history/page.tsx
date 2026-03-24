'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';

export default function UserLiveHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');

  useEffect(() => {
    fetchLiveHistory();
  }, [userId]);

  const fetchLiveHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch user details
      const userRes = await axios.get(`/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsername(userRes.data?.username || userId);

      // Fetch live history
      const historyRes = await axios.get(`/api/app/live/history/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSessions(Array.isArray(historyRes.data) ? historyRes.data : []);
    } catch (error: any) {
      console.error('Error fetching live history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateDuration = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return 'N/A';
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const durationMs = end - start;
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  if (loading) {
    return (
      <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:400}}>
        <div style={{textAlign:'center'}}>
          <div style={{width:48,height:48,border:'4px solid #e2e8f0',borderTop:'4px solid #4299e1',borderRadius:'50%',animation:'spin 1s linear infinite',margin:'0 auto 16px'}}></div>
          <p style={{color:'#718096',fontSize:16}}>Loading live history...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div style={{marginBottom:32}}>
        <button
          onClick={() => router.back()}
          style={{
            padding:'8px 16px',
            border:'1px solid #e2e8f0',
            borderRadius:6,
            cursor:'pointer',
            fontSize:14,
            fontWeight:600,
            background:'white',
            color:'#4a5568',
            marginBottom:16,
            transition:'all 0.2s'
          }}
        >
          ← Back to Users
        </button>
        <h1 style={{margin:0,fontSize:28,fontWeight:700,color:'#1a202c',marginBottom:8}}>
          Live History - {username}
        </h1>
        <p style={{margin:0,color:'#718096',fontSize:16}}>
          View all live sessions for this user
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))',gap:20,marginBottom:24}}>
        <div style={{background:'white',padding:20,borderRadius:12,border:'1px solid #e2e8f0',boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
          <div style={{fontSize:14,color:'#718096',marginBottom:8}}>Total Sessions</div>
          <div style={{fontSize:32,fontWeight:700,color:'#1a202c'}}>{sessions.length}</div>
        </div>
        <div style={{background:'white',padding:20,borderRadius:12,border:'1px solid #e2e8f0',boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
          <div style={{fontSize:14,color:'#718096',marginBottom:8}}>Video Sessions</div>
          <div style={{fontSize:32,fontWeight:700,color:'#3182ce'}}>
            {sessions.filter(s => s.type === 'VIDEO').length}
          </div>
        </div>
        <div style={{background:'white',padding:20,borderRadius:12,border:'1px solid #e2e8f0',boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
          <div style={{fontSize:14,color:'#718096',marginBottom:8}}>Audio Sessions</div>
          <div style={{fontSize:32,fontWeight:700,color:'#805ad5'}}>
            {sessions.filter(s => s.type === 'AUDIO').length}
          </div>
        </div>
        <div style={{background:'white',padding:20,borderRadius:12,border:'1px solid #e2e8f0',boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
          <div style={{fontSize:14,color:'#718096',marginBottom:8}}>Total Viewers</div>
          <div style={{fontSize:32,fontWeight:700,color:'#38a169'}}>
            {sessions.reduce((sum, s) => sum + (s.viewerCount || 0), 0)}
          </div>
        </div>
      </div>

      {/* Sessions Table */}
      <div style={{background:'white',borderRadius:12,overflow:'hidden',border:'1px solid #e2e8f0',boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{background:'#f7fafc',borderBottom:'2px solid #e2e8f0'}}>
                <th style={{padding:'16px 20px',textAlign:'left',fontWeight:600,color:'#2d3748',fontSize:14,textTransform:'uppercase',letterSpacing:'0.05em'}}>Session ID</th>
                <th style={{padding:'16px 20px',textAlign:'left',fontWeight:600,color:'#2d3748',fontSize:14,textTransform:'uppercase',letterSpacing:'0.05em'}}>Title</th>
                <th style={{padding:'16px 20px',textAlign:'left',fontWeight:600,color:'#2d3748',fontSize:14,textTransform:'uppercase',letterSpacing:'0.05em'}}>Type</th>
                <th style={{padding:'16px 20px',textAlign:'left',fontWeight:600,color:'#2d3748',fontSize:14,textTransform:'uppercase',letterSpacing:'0.05em'}}>Started</th>
                <th style={{padding:'16px 20px',textAlign:'left',fontWeight:600,color:'#2d3748',fontSize:14,textTransform:'uppercase',letterSpacing:'0.05em'}}>Ended</th>
                <th style={{padding:'16px 20px',textAlign:'left',fontWeight:600,color:'#2d3748',fontSize:14,textTransform:'uppercase',letterSpacing:'0.05em'}}>Duration</th>
                <th style={{padding:'16px 20px',textAlign:'left',fontWeight:600,color:'#2d3748',fontSize:14,textTransform:'uppercase',letterSpacing:'0.05em'}}>Viewers</th>
                <th style={{padding:'16px 20px',textAlign:'left',fontWeight:600,color:'#2d3748',fontSize:14,textTransform:'uppercase',letterSpacing:'0.05em'}}>Status</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session, index) => (
                <tr key={session.sessionId} style={{borderBottom:index < sessions.length - 1 ? '1px solid #e2e8f0' : 'none'}}>
                  <td style={{padding:'20px'}}>
                    <div style={{fontSize:13,color:'#718096',fontFamily:'monospace',background:'#f7fafc',padding:'4px 8px',borderRadius:4,display:'inline-block'}}>
                      {session.sessionId?.substring(0, 8)}...
                    </div>
                  </td>
                  <td style={{padding:'20px'}}>
                    <div style={{fontWeight:600,color:'#1a202c',fontSize:15}}>{session.title || 'Untitled'}</div>
                  </td>
                  <td style={{padding:'20px'}}>
                    <span style={{
                      padding:'6px 12px',
                      borderRadius:16,
                      fontSize:12,
                      fontWeight:600,
                      textTransform:'uppercase',
                      background: session.type === 'VIDEO' ? '#ebf8ff' : '#f3e8ff',
                      color: session.type === 'VIDEO' ? '#3182ce' : '#805ad5',
                      border: `1px solid ${session.type === 'VIDEO' ? '#bee3f8' : '#d6bcfa'}`
                    }}>
                      {session.type}
                    </span>
                  </td>
                  <td style={{padding:'20px'}}>
                    <div style={{fontSize:14,color:'#4a5568'}}>{formatDate(session.createdAt)}</div>
                  </td>
                  <td style={{padding:'20px'}}>
                    <div style={{fontSize:14,color:'#4a5568'}}>{formatDate(session.endedAt)}</div>
                  </td>
                  <td style={{padding:'20px'}}>
                    <div style={{fontSize:14,color:'#4a5568',fontWeight:600}}>
                      {calculateDuration(session.createdAt, session.endedAt)}
                    </div>
                  </td>
                  <td style={{padding:'20px'}}>
                    <div style={{fontSize:16,fontWeight:700,color:'#38a169'}}>
                      {session.viewerCount || 0}
                    </div>
                  </td>
                  <td style={{padding:'20px'}}>
                    <span style={{
                      padding:'6px 12px',
                      borderRadius:16,
                      fontSize:12,
                      fontWeight:600,
                      textTransform:'uppercase',
                      background: session.status === 'LIVE' ? '#f0fff4' : '#f7fafc',
                      color: session.status === 'LIVE' ? '#38a169' : '#718096',
                      border: `1px solid ${session.status === 'LIVE' ? '#9ae6b4' : '#e2e8f0'}`
                    }}>
                      {session.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {sessions.length === 0 && (
        <div style={{textAlign:'center',padding:64,background:'white',borderRadius:12,border:'1px solid #e2e8f0',marginTop:24}}>
          <div style={{fontSize:48,marginBottom:16,opacity:0.5}}>📹</div>
          <h3 style={{margin:0,color:'#4a5568',fontSize:18,marginBottom:8}}>No live sessions found</h3>
          <p style={{margin:0,color:'#718096'}}>This user hasn't hosted any live sessions yet</p>
        </div>
      )}
    </div>
  );
}
