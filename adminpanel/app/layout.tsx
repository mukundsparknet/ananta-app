'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === '/login') {
    return (
      <html lang="en">
        <body style={{margin:0,fontFamily:'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',background:'#f7f8fc'}}>
          {children}
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body style={{margin:0,fontFamily:'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',background:'#f7f8fc'}}>
        {/* Fixed Top Header */}
        <div style={{
          position:'fixed',
          top:0,
          left:0,
          right:0,
          background:'#1a202c',
          color:'white',
          padding:'0 32px',
          height:72,
          display:'flex',
          alignItems:'center',
          justifyContent:'space-between',
          boxShadow:'0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          zIndex:1000
        }}>
          <div style={{display:'flex',alignItems:'center'}}>
            <div style={{width:40,height:40,background:'linear-gradient(135deg, #4299e1, #3182ce)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',marginRight:16,fontWeight:'bold',fontSize:18}}>A</div>
            <div>
              <h1 style={{margin:0,fontSize:20,fontWeight:600}}>ANANTA</h1>
              <p style={{margin:0,fontSize:12,opacity:0.7}}>Administration Panel</p>
            </div>
          </div>
          <button 
            onClick={()=>{localStorage.removeItem('token');window.location.href='/login'}} 
            style={{padding:'10px 20px',background:'#2d3748',color:'white',border:'1px solid #4a5568',borderRadius:6,cursor:'pointer',fontWeight:500,fontSize:14}}
          >
            Sign Out
          </button>
        </div>

        <div style={{display:'flex',paddingTop:72}}>
          {/* Fixed Sidebar */}
          <div style={{
            position:'fixed',
            top:72,
            left:0,
            width:280,
            height:'calc(100vh - 72px)',
            background:'white',
            borderRight:'1px solid #e2e8f0',
            padding:'24px 0',
            overflowY:'auto',
            zIndex:999
          }}>
            <div style={{padding:'0 24px',marginBottom:32}}>
              <h3 style={{margin:0,fontSize:14,fontWeight:600,color:'#4a5568',textTransform:'uppercase',letterSpacing:'0.05em'}}>Management</h3>
            </div>
            
            <nav>
              <Link href="/users" style={{
                display:'flex',
                alignItems:'center',
                padding:'12px 24px',
                textDecoration:'none',
                color: pathname==='/users' ? '#3182ce' : '#4a5568',
                background: pathname==='/users' ? '#ebf8ff' : 'transparent',
                borderRight: pathname==='/users' ? '3px solid #3182ce' : '3px solid transparent',
                fontWeight: pathname==='/users' ? 600 : 500,
                fontSize:15
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{marginRight:12}}>
                  <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                User Management
              </Link>
              
              <Link href="/recharges" style={{
                display:'flex',
                alignItems:'center',
                padding:'12px 24px',
                textDecoration:'none',
                color: pathname==='/recharges' ? '#3182ce' : '#4a5568',
                background: pathname==='/recharges' ? '#ebf8ff' : 'transparent',
                borderRight: pathname==='/recharges' ? '3px solid #3182ce' : '3px solid transparent',
                fontWeight: pathname==='/recharges' ? 600 : 500,
                fontSize:15
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{marginRight:12}}>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"/>
                </svg>
                Withdraw Requests
              </Link>
              
              <Link href="/recharge-history" style={{
                display:'flex',
                alignItems:'center',
                padding:'12px 24px',
                textDecoration:'none',
                color: pathname==='/recharge-history' ? '#3182ce' : '#4a5568',
                background: pathname==='/recharge-history' ? '#ebf8ff' : 'transparent',
                borderRight: pathname==='/recharge-history' ? '3px solid #3182ce' : '3px solid transparent',
                fontWeight: pathname==='/recharge-history' ? 600 : 500,
                fontSize:15
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{marginRight:12}}>
                  <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                </svg>
                Recharge History
              </Link>
              
              <Link href="/gift-history" style={{
                display:'flex',
                alignItems:'center',
                padding:'12px 24px',
                textDecoration:'none',
                color: pathname==='/gift-history' ? '#3182ce' : '#4a5568',
                background: pathname==='/gift-history' ? '#ebf8ff' : 'transparent',
                borderRight: pathname==='/gift-history' ? '3px solid #3182ce' : '3px solid transparent',
                fontWeight: pathname==='/gift-history' ? 600 : 500,
                fontSize:15
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{marginRight:12}}>
                  <path d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"/>
                </svg>
                Gift History
              </Link>
              
              <Link href="/settings" style={{
                display:'flex',
                alignItems:'center',
                padding:'12px 24px',
                textDecoration:'none',
                color: pathname==='/settings' ? '#3182ce' : '#4a5568',
                background: pathname==='/settings' ? '#ebf8ff' : 'transparent',
                borderRight: pathname==='/settings' ? '3px solid #3182ce' : '3px solid transparent',
                fontWeight: pathname==='/settings' ? 600 : 500,
                fontSize:15
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{marginRight:12}}>
                  <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                </svg>
                Wallet & Gifts
              </Link>
              
              <Link href="/level-management" style={{
                display:'flex',
                alignItems:'center',
                padding:'12px 24px',
                textDecoration:'none',
                color: pathname==='/level-management' ? '#3182ce' : '#4a5568',
                background: pathname==='/level-management' ? '#ebf8ff' : 'transparent',
                borderRight: pathname==='/level-management' ? '3px solid #3182ce' : '3px solid transparent',
                fontWeight: pathname==='/level-management' ? 600 : 500,
                fontSize:15
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{marginRight:12}}>
                  <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586l-2 2V5H5v14h14v-1.586l2-2V19a1 1 0 01-1 1H4a1 1 0 01-1-1V4z"/>
                  <path d="M17.707 7.293a1 1 0 010 1.414L11.414 15l-2.121-2.121a1 1 0 111.414-1.414L12 12.757l5.293-5.293a1 1 0 011.414 0z"/>
                </svg>
                Level Management
              </Link>
              
              <Link href="/daily-tasks" style={{
                display:'flex',
                alignItems:'center',
                padding:'12px 24px',
                textDecoration:'none',
                color: pathname==='/daily-tasks' ? '#3182ce' : '#4a5568',
                background: pathname==='/daily-tasks' ? '#ebf8ff' : 'transparent',
                borderRight: pathname==='/daily-tasks' ? '3px solid #3182ce' : '3px solid transparent',
                fontWeight: pathname==='/daily-tasks' ? 600 : 500,
                fontSize:15
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{marginRight:12}}>
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Daily Tasks
              </Link>

              <Link href="/hero" style={{
                display:'flex',
                alignItems:'center',
                padding:'12px 24px',
                textDecoration:'none',
                color: pathname==='/hero' ? '#3182ce' : '#4a5568',
                background: pathname==='/hero' ? '#ebf8ff' : 'transparent',
                borderRight: pathname==='/hero' ? '3px solid #3182ce' : '3px solid transparent',
                fontWeight: pathname==='/hero' ? 600 : 500,
                fontSize:15
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{marginRight:12}}>
                  <path d="M4 6h16v10H4z"/>
                  <path d="M2 20h20v2H2z"/>
                </svg>
                Hero Section
              </Link>
              
              <Link href="/kyc" style={{
                display:'flex',
                alignItems:'center',
                padding:'12px 24px',
                textDecoration:'none',
                color: pathname==='/kyc' ? '#3182ce' : '#4a5568',
                background: pathname==='/kyc' ? '#ebf8ff' : 'transparent',
                borderRight: pathname==='/kyc' ? '3px solid #3182ce' : '3px solid transparent',
                fontWeight: pathname==='/kyc' ? 600 : 500,
                fontSize:15
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{marginRight:12}}>
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                KYC Verification
              </Link>
              
              <Link href="/referral-management" style={{
                display:'flex',
                alignItems:'center',
                padding:'12px 24px',
                textDecoration:'none',
                color: pathname==='/referral-management' ? '#3182ce' : '#4a5568',
                background: pathname==='/referral-management' ? '#ebf8ff' : 'transparent',
                borderRight: pathname==='/referral-management' ? '3px solid #3182ce' : '3px solid transparent',
                fontWeight: pathname==='/referral-management' ? 600 : 500,
                fontSize:15
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{marginRight:12}}>
                  <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                Referral Management
              </Link>

              <Link href="/app-settings" style={{
                display:'flex',
                alignItems:'center',
                padding:'12px 24px',
                textDecoration:'none',
                color: pathname==='/app-settings' ? '#3182ce' : '#4a5568',
                background: pathname==='/app-settings' ? '#ebf8ff' : 'transparent',
                borderRight: pathname==='/app-settings' ? '3px solid #3182ce' : '3px solid transparent',
                fontWeight: pathname==='/app-settings' ? 600 : 500,
                fontSize:15
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{marginRight:12}}>
                  <path d="M12 8a4 4 0 100 8 4 4 0 000-8z"/>
                  <path d="M4.93 6.21a1 1 0 011.32-.48l1.12.45a7.03 7.03 0 011.5-.87l.26-1.19A1 1 0 0110.1 3h3.8a1 1 0 01.98.79l.26 1.19a7.03 7.03 0 011.5.87l1.12-.45a1 1 0 011.32.48l1.9 3.29a1 1 0 01-.34 1.35l-1.03.66a6.96 6.96 0 010 1.74l1.03.66a1 1 0 01.34 1.35l-1.9 3.29a1 1 0 01-1.32.48l-1.12-.45a7.03 7.03 0 01-1.5.87l-.26 1.19a1 1 0 01-.98.79h-3.8a1 1 0 01-.98-.79l-.26-1.19a7.03 7.03 0 01-1.5-.87l-1.12.45a1 1 0 01-1.32-.48l-1.9-3.29a1 1 0 01.34-1.35l1.03-.66a6.96 6.96 0 010-1.74l-1.03-.66a1 1 0 01-.34-1.35l1.9-3.29z"/>
                </svg>
                App Settings
              </Link>

              <Link href="/reports" style={{
                display:'flex',
                alignItems:'center',
                padding:'12px 24px',
                textDecoration:'none',
                color: pathname==='/reports' ? '#3182ce' : '#4a5568',
                background: pathname==='/reports' ? '#ebf8ff' : 'transparent',
                borderRight: pathname==='/reports' ? '3px solid #3182ce' : '3px solid transparent',
                fontWeight: pathname==='/reports' ? 600 : 500,
                fontSize:15
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight:12}}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                </svg>
                User Reports
              </Link>
            </nav>
          </div>

          {/* Main Content with left margin for sidebar */}
          <div style={{marginLeft:280,flex:1,padding:32,background:'#f7f8fc',minHeight:'calc(100vh - 72px)'}}>
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
