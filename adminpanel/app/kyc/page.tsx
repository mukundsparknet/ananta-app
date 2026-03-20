'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function KYCPage() {
  const [kycRequests, setKycRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [docModal, setDocModal] = useState<any>(null);
  const router = useRouter();

  const resolveImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    if (url.startsWith('/uploads/')) {
      return `https://ecofuelglobal.com${url}`;
    }
    return url;
  };

  useEffect(() => {
    fetchKYC();
  }, []);

  const fetchKYC = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/kyc', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setKycRequests(response.data.kycRequests);
    } catch (error) {
      console.error('Error fetching KYC:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKYCAction = async (kycId: string, action: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/admin/kyc', 
        { kycId, action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchKYC();
    } catch (error) {
      alert('Error processing KYC');
    }
  };

  if (loading) {
    return (
      <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:400}}>
        <div style={{textAlign:'center'}}>
          <div style={{width:48,height:48,border:'4px solid #e2e8f0',borderTop:'4px solid #4299e1',borderRadius:'50%',animation:'spin 1s linear infinite',margin:'0 auto 16px'}}></div>
          <p style={{color:'#718096',fontSize:16}}>Loading KYC requests...</p>
        </div>
      </div>
    );
  }

  const pendingCount = kycRequests.filter((k: any) => k.status === 'PENDING').length;
  const approvedCount = kycRequests.filter((k: any) => k.status === 'APPROVED').length;
  const rejectedCount = kycRequests.filter((k: any) => k.status === 'REJECTED').length;

  return (
    <div>
      {/* Page Header */}
      <div style={{marginBottom:32}}>
        <h1 style={{margin:0,fontSize:28,fontWeight:700,color:'#1a202c',marginBottom:8}}>KYC Verification</h1>
        <p style={{margin:0,color:'#718096',fontSize:16}}>Review and verify user identity documents</p>
      </div>

      {/* Statistics Cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))',gap:24,marginBottom:32}}>
        <div style={{background:'white',padding:24,borderRadius:12,border:'1px solid #e2e8f0',boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div>
              <p style={{margin:0,fontSize:14,color:'#718096',marginBottom:8,fontWeight:500}}>Pending Review</p>
              <p style={{margin:0,fontSize:32,fontWeight:700,color:'#ed8936'}}>{pendingCount}</p>
            </div>
            <div style={{width:56,height:56,background:'#fef5e7',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#ed8936">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
        </div>

        <div style={{background:'white',padding:24,borderRadius:12,border:'1px solid #e2e8f0',boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div>
              <p style={{margin:0,fontSize:14,color:'#718096',marginBottom:8,fontWeight:500}}>Verified Users</p>
              <p style={{margin:0,fontSize:32,fontWeight:700,color:'#38a169'}}>{approvedCount}</p>
            </div>
            <div style={{width:56,height:56,background:'#f0fff4',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#38a169">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
        </div>

        <div style={{background:'white',padding:24,borderRadius:12,border:'1px solid #e2e8f0',boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div>
              <p style={{margin:0,fontSize:14,color:'#718096',marginBottom:8,fontWeight:500}}>Rejected</p>
              <p style={{margin:0,fontSize:32,fontWeight:700,color:'#e53e3e'}}>{rejectedCount}</p>
            </div>
            <div style={{width:56,height:56,background:'#fed7d7',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#e53e3e">
                <path d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      {/* KYC Table */}
      <div style={{background:'white',borderRadius:12,overflow:'hidden',border:'1px solid #e2e8f0',boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{background:'#f7fafc',borderBottom:'2px solid #e2e8f0'}}>
                <th style={{padding:'16px 20px',textAlign:'left',fontWeight:600,color:'#2d3748',fontSize:14,textTransform:'uppercase',letterSpacing:'0.05em'}}>User Details</th>
                <th style={{padding:'16px 20px',textAlign:'left',fontWeight:600,color:'#2d3748',fontSize:14,textTransform:'uppercase',letterSpacing:'0.05em'}}>Document Info</th>
                <th style={{padding:'16px 20px',textAlign:'left',fontWeight:600,color:'#2d3748',fontSize:14,textTransform:'uppercase',letterSpacing:'0.05em'}}>Status</th>
                <th style={{padding:'16px 20px',textAlign:'left',fontWeight:600,color:'#2d3748',fontSize:14,textTransform:'uppercase',letterSpacing:'0.05em'}}>Submitted</th>
                <th style={{padding:'16px 20px',textAlign:'left',fontWeight:600,color:'#2d3748',fontSize:14,textTransform:'uppercase',letterSpacing:'0.05em'}}>Documents</th>
                <th style={{padding:'16px 20px',textAlign:'left',fontWeight:600,color:'#2d3748',fontSize:14,textTransform:'uppercase',letterSpacing:'0.05em'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {kycRequests.map((kyc: any, index) => (
                <tr key={kyc.id} style={{borderBottom:index < kycRequests.length - 1 ? '1px solid #e2e8f0' : 'none'}}>
                  <td style={{padding:'20px'}}>
                    <div style={{fontWeight:600,color:'#1a202c',fontSize:16}}>{kyc.userId}</div>
                  </td>
                  <td style={{padding:'20px'}}>
                    <div style={{fontWeight:600,color:'#4a5568',marginBottom:4}}>{kyc.documentType}</div>
                    <div style={{fontSize:14,color:'#718096',fontFamily:'monospace'}}>{kyc.documentNumber}</div>
                  </td>
                  <td style={{padding:'20px'}}>
                    <span style={{
                      padding:'8px 16px',
                      borderRadius:20,
                      fontSize:12,
                      fontWeight:600,
                      textTransform:'uppercase',
                      letterSpacing:'0.05em',
                      background: kyc.status === 'APPROVED' ? '#f0fff4' : kyc.status === 'REJECTED' ? '#fed7d7' : '#fef5e7',
                      color: kyc.status === 'APPROVED' ? '#38a169' : kyc.status === 'REJECTED' ? '#c53030' : '#d69e2e',
                      border: `1px solid ${kyc.status === 'APPROVED' ? '#9ae6b4' : kyc.status === 'REJECTED' ? '#feb2b2' : '#fbd38d'}`
                    }}>
                      {kyc.status}
                    </span>
                  </td>
                  <td style={{padding:'20px'}}>
                    <span style={{color:'#718096',fontSize:15}}>{new Date(kyc.createdAt).toLocaleDateString('en-US', {year:'numeric',month:'short',day:'numeric'})}</span>
                  </td>
                  <td style={{padding:'20px'}}>
                    <button
                      onClick={() => setDocModal(kyc)}
                      style={{padding:'10px 16px',borderRadius:6,cursor:'pointer',fontSize:13,fontWeight:600,background:'#6b46c1',color:'white',border:'none'}}
                    >
                      View Documents
                    </button>
                  </td>
                  <td style={{padding:'20px'}}>
                    <div style={{display:'flex',gap:8}}>
                      <button
                        onClick={() => router.push(`/users/${kyc.userId}`)}
                        style={{
                          padding:'10px 20px',
                          borderRadius:6,
                          cursor:'pointer',
                          fontSize:13,
                          fontWeight:600,
                          background:'white',
                          color:'#3182ce',
                          border:'1px solid #3182ce',
                          transition:'all 0.2s'
                        }}
                      >
                        View
                      </button>
                      {kyc.status === 'PENDING' && (
                        <>
                          <button 
                            onClick={() => handleKYCAction(kyc.id, 'approve')}
                            style={{
                              padding:'10px 20px',
                              border:'none',
                              borderRadius:6,
                              cursor:'pointer',
                              fontSize:13,
                              fontWeight:600,
                              background:'#38a169',
                              color:'white',
                              transition:'all 0.2s'
                            }}
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleKYCAction(kyc.id, 'reject')}
                            style={{
                              padding:'10px 20px',
                              border:'1px solid #e53e3e',
                              borderRadius:6,
                              cursor:'pointer',
                              fontSize:13,
                              fontWeight:600,
                              background:'white',
                              color:'#e53e3e',
                              transition:'all 0.2s'
                            }}
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Images Popup */}
      {docModal && (
        <div
          onClick={() => setDocModal(null)}
          style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:20}}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{background:'white',borderRadius:16,width:'100%',maxWidth:700,maxHeight:'90vh',overflow:'auto',boxShadow:'0 25px 50px rgba(0,0,0,0.25)'}}
          >
            {/* Modal Header */}
            <div style={{padding:'20px 24px',borderBottom:'1px solid #e2e8f0',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <h2 style={{margin:0,fontSize:20,fontWeight:700,color:'#1a202c'}}>Document Images</h2>
                <p style={{margin:0,fontSize:13,color:'#718096',marginTop:4}}>User: {docModal.userId}</p>
              </div>
              <button onClick={() => setDocModal(null)} style={{background:'none',border:'none',fontSize:24,cursor:'pointer',color:'#718096',lineHeight:1}}>×</button>
            </div>
            {/* Details */}
            <div style={{padding:'20px 24px',borderBottom:'1px solid #e2e8f0',display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
              <div>
                <div style={{fontSize:11,color:'#a0aec0',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:4}}>Document Type</div>
                <div style={{fontSize:15,fontWeight:600,color:'#2d3748'}}>{docModal.documentType}</div>
              </div>
              <div>
                <div style={{fontSize:11,color:'#a0aec0',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:4}}>Document Number</div>
                <div style={{fontSize:15,fontWeight:600,color:'#2d3748',fontFamily:'monospace'}}>{docModal.documentNumber}</div>
              </div>
              <div>
                <div style={{fontSize:11,color:'#a0aec0',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:4}}>Status</div>
                <span style={{
                  padding:'4px 12px',borderRadius:20,fontSize:12,fontWeight:600,textTransform:'uppercase',
                  background: docModal.status === 'APPROVED' ? '#f0fff4' : docModal.status === 'REJECTED' ? '#fed7d7' : '#fef5e7',
                  color: docModal.status === 'APPROVED' ? '#38a169' : docModal.status === 'REJECTED' ? '#c53030' : '#d69e2e',
                  border: `1px solid ${docModal.status === 'APPROVED' ? '#9ae6b4' : docModal.status === 'REJECTED' ? '#feb2b2' : '#fbd38d'}`
                }}>{docModal.status}</span>
              </div>
            </div>
            {/* Images */}
            <div style={{padding:'24px'}}>
              {(docModal.documentFrontImage || docModal.documentBackImage) ? (
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
                  {docModal.documentFrontImage && (
                    <div>
                      <div style={{fontSize:12,color:'#718096',fontWeight:600,marginBottom:8,textTransform:'uppercase',letterSpacing:'0.05em'}}>Front Side</div>
                      <a href={resolveImageUrl(docModal.documentFrontImage)} target="_blank" rel="noreferrer">
                        <img
                          src={resolveImageUrl(docModal.documentFrontImage)}
                          alt="Front"
                          style={{width:'100%',height:200,objectFit:'cover',borderRadius:8,border:'1px solid #e2e8f0',cursor:'pointer',display:'block'}}
                        />
                      </a>
                      <p style={{margin:'8px 0 0',fontSize:12,color:'#a0aec0',textAlign:'center'}}>Click to open full size</p>
                    </div>
                  )}
                  {docModal.documentBackImage && (
                    <div>
                      <div style={{fontSize:12,color:'#718096',fontWeight:600,marginBottom:8,textTransform:'uppercase',letterSpacing:'0.05em'}}>Back Side</div>
                      <a href={resolveImageUrl(docModal.documentBackImage)} target="_blank" rel="noreferrer">
                        <img
                          src={resolveImageUrl(docModal.documentBackImage)}
                          alt="Back"
                          style={{width:'100%',height:200,objectFit:'cover',borderRadius:8,border:'1px solid #e2e8f0',cursor:'pointer',display:'block'}}
                        />
                      </a>
                      <p style={{margin:'8px 0 0',fontSize:12,color:'#a0aec0',textAlign:'center'}}>Click to open full size</p>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{textAlign:'center',padding:40,color:'#a0aec0'}}>
                  <div style={{fontSize:40,marginBottom:12}}>🖼️</div>
                  <p style={{margin:0}}>No document images uploaded</p>
                </div>
              )}
            </div>
            {/* Footer actions */}
            {docModal.status === 'PENDING' && (
              <div style={{padding:'16px 24px',borderTop:'1px solid #e2e8f0',display:'flex',gap:12,justifyContent:'flex-end'}}>
                <button
                  onClick={() => { handleKYCAction(docModal.id, 'approve'); setDocModal(null); }}
                  style={{padding:'10px 24px',borderRadius:6,border:'none',cursor:'pointer',fontSize:14,fontWeight:600,background:'#38a169',color:'white'}}
                >Approve</button>
                <button
                  onClick={() => { handleKYCAction(docModal.id, 'reject'); setDocModal(null); }}
                  style={{padding:'10px 24px',borderRadius:6,border:'1px solid #e53e3e',cursor:'pointer',fontSize:14,fontWeight:600,background:'white',color:'#e53e3e'}}
                >Reject</button>
              </div>
            )}
          </div>
        </div>
      )}

      {kycRequests.length === 0 && (
        <div style={{textAlign:'center',padding:64,background:'white',borderRadius:12,border:'1px solid #e2e8f0',marginTop:24}}>
          <div style={{fontSize:48,marginBottom:16,opacity:0.5}}>📋</div>
          <h3 style={{margin:0,color:'#4a5568',fontSize:18,marginBottom:8}}>No KYC requests</h3>
          <p style={{margin:0,color:'#718096'}}>KYC verification requests will appear here when submitted</p>
        </div>
      )}
    </div>
  );
}
