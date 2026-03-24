'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';

interface RechargeRecord {
  id: number;
  userId: string;
  username?: string;
  amount: number;
  coins: number;
  planName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
}

export default function RechargeHistoryPage() {
  const [recharges, setRecharges] = useState<RechargeRecord[]>([]);
  const [filteredRecharges, setFilteredRecharges] = useState<RechargeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchRecharges();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [recharges, searchTerm, startDate, endDate]);

  const fetchRecharges = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/recharges', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const rechargesData = response.data?.recharges || [];
      
      // Backend now includes username, no need to fetch separately
      setRecharges(rechargesData);
    } catch (error: any) {
      console.error('Error fetching recharges:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...recharges];

    // Search filter (userId or username)
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(r => 
        r.userId.toLowerCase().includes(search) ||
        (r.username && r.username.toLowerCase().includes(search))
      );
    }

    // Date range filter
    if (startDate) {
      filtered = filtered.filter(r => {
        const rechargeDate = new Date(r.createdAt);
        return rechargeDate >= new Date(startDate);
      });
    }

    if (endDate) {
      filtered = filtered.filter(r => {
        const rechargeDate = new Date(r.createdAt);
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        return rechargeDate <= endDateTime;
      });
    }

    setFilteredRecharges(filtered);
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata'
    }) + ' IST';
  };

  const exportToExcel = () => {
    setExporting(true);
    
    try {
      // Prepare data for export
      const exportData = filteredRecharges.map(r => ({
        'User ID': r.userId,
        'Username': r.username || 'Unknown',
        'Plan Name': r.planName || 'N/A',
        'Amount (₹)': r.amount,
        'Coins': r.coins,
        'Status': r.status,
        'Recharge Date': formatDateTime(r.createdAt),
        'Updated Date': formatDateTime(r.updatedAt)
      }));

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Set column widths
      ws['!cols'] = [
        { wch: 15 }, // User ID
        { wch: 20 }, // Username
        { wch: 25 }, // Plan Name
        { wch: 12 }, // Amount
        { wch: 10 }, // Coins
        { wch: 12 }, // Status
        { wch: 30 }, // Recharge Date
        { wch: 30 }  // Updated Date
      ];

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Recharge History');

      // Generate filename with current date
      const filename = `Recharge_History_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Download file
      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
  };

  // Calculate statistics
  const stats = {
    total: filteredRecharges.length,
    pending: filteredRecharges.filter(r => r.status === 'PENDING').length,
    approved: filteredRecharges.filter(r => r.status === 'APPROVED').length,
    rejected: filteredRecharges.filter(r => r.status === 'REJECTED').length,
    totalAmount: filteredRecharges.reduce((sum, r) => sum + (r.amount || 0), 0),
    totalCoins: filteredRecharges.reduce((sum, r) => sum + (r.coins || 0), 0)
  };

  if (loading) {
    return (
      <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:400}}>
        <div style={{textAlign:'center'}}>
          <div style={{width:48,height:48,border:'4px solid #e2e8f0',borderTop:'4px solid #4299e1',borderRadius:'50%',animation:'spin 1s linear infinite',margin:'0 auto 16px'}}></div>
          <p style={{color:'#718096',fontSize:16}}>Loading recharge history...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div style={{marginBottom:32}}>
        <h1 style={{margin:0,fontSize:28,fontWeight:700,color:'#1a202c',marginBottom:8}}>
          Recharge History
        </h1>
        <p style={{margin:0,color:'#718096',fontSize:16}}>
          View and manage all recharge transactions
        </p>
      </div>

      {/* Statistics Cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))',gap:20,marginBottom:24}}>
        <div style={{background:'white',padding:20,borderRadius:12,border:'1px solid #e2e8f0',boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
          <div style={{fontSize:14,color:'#718096',marginBottom:8}}>Total Recharges</div>
          <div style={{fontSize:32,fontWeight:700,color:'#1a202c'}}>{stats.total}</div>
        </div>
        <div style={{background:'white',padding:20,borderRadius:12,border:'1px solid #e2e8f0',boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
          <div style={{fontSize:14,color:'#718096',marginBottom:8}}>Pending</div>
          <div style={{fontSize:32,fontWeight:700,color:'#d69e2e'}}>{stats.pending}</div>
        </div>
        <div style={{background:'white',padding:20,borderRadius:12,border:'1px solid #e2e8f0',boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
          <div style={{fontSize:14,color:'#718096',marginBottom:8}}>Approved</div>
          <div style={{fontSize:32,fontWeight:700,color:'#38a169'}}>{stats.approved}</div>
        </div>
        <div style={{background:'white',padding:20,borderRadius:12,border:'1px solid #e2e8f0',boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
          <div style={{fontSize:14,color:'#718096',marginBottom:8}}>Rejected</div>
          <div style={{fontSize:32,fontWeight:700,color:'#e53e3e'}}>{stats.rejected}</div>
        </div>
        <div style={{background:'white',padding:20,borderRadius:12,border:'1px solid #e2e8f0',boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
          <div style={{fontSize:14,color:'#718096',marginBottom:8}}>Total Amount</div>
          <div style={{fontSize:32,fontWeight:700,color:'#3182ce'}}>₹{stats.totalAmount.toLocaleString()}</div>
        </div>
        <div style={{background:'white',padding:20,borderRadius:12,border:'1px solid #e2e8f0',boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
          <div style={{fontSize:14,color:'#718096',marginBottom:8}}>Total Coins</div>
          <div style={{fontSize:32,fontWeight:700,color:'#805ad5'}}>{stats.totalCoins.toLocaleString()}</div>
        </div>
      </div>

      {/* Filters Section */}
      <div style={{background:'white',padding:24,borderRadius:12,border:'1px solid #e2e8f0',boxShadow:'0 1px 3px rgba(0,0,0,0.1)',marginBottom:24}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <h2 style={{margin:0,fontSize:18,fontWeight:600,color:'#2d3748'}}>Filters</h2>
          <button
            onClick={clearFilters}
            style={{
              padding:'8px 16px',
              border:'1px solid #e2e8f0',
              borderRadius:6,
              cursor:'pointer',
              fontSize:14,
              fontWeight:600,
              background:'white',
              color:'#4a5568',
              transition:'all 0.2s'
            }}
          >
            Clear Filters
          </button>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))',gap:16}}>
          {/* Search */}
          <div>
            <label style={{display:'block',fontSize:14,fontWeight:600,color:'#4a5568',marginBottom:8}}>
              Search (User ID / Username)
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by User ID or Username..."
              style={{
                width:'100%',
                padding:'10px 14px',
                borderRadius:8,
                border:'1px solid #cbd5e0',
                fontSize:14,
                outline:'none',
                transition:'border 0.2s'
              }}
            />
          </div>

          {/* Start Date */}
          <div>
            <label style={{display:'block',fontSize:14,fontWeight:600,color:'#4a5568',marginBottom:8}}>
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                width:'100%',
                padding:'10px 14px',
                borderRadius:8,
                border:'1px solid #cbd5e0',
                fontSize:14,
                outline:'none'
              }}
            />
          </div>

          {/* End Date */}
          <div>
            <label style={{display:'block',fontSize:14,fontWeight:600,color:'#4a5568',marginBottom:8}}>
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                width:'100%',
                padding:'10px 14px',
                borderRadius:8,
                border:'1px solid #cbd5e0',
                fontSize:14,
                outline:'none'
              }}
            />
          </div>
        </div>

        <div style={{marginTop:16,fontSize:14,color:'#718096'}}>
          Showing {filteredRecharges.length} of {recharges.length} recharges
        </div>
      </div>

      {/* Export Button */}
      <div style={{marginBottom:16,display:'flex',justifyContent:'flex-end'}}>
        <button
          onClick={exportToExcel}
          disabled={exporting || filteredRecharges.length === 0}
          style={{
            padding:'12px 24px',
            border:'none',
            borderRadius:8,
            cursor: filteredRecharges.length === 0 ? 'not-allowed' : 'pointer',
            fontSize:14,
            fontWeight:600,
            background: filteredRecharges.length === 0 ? '#cbd5e0' : '#38a169',
            color:'white',
            display:'flex',
            alignItems:'center',
            gap:8,
            transition:'all 0.2s',
            opacity: exporting ? 0.7 : 1
          }}
        >
          <span style={{fontSize:18}}>📊</span>
          {exporting ? 'Exporting...' : 'Export to Excel'}
        </button>
      </div>

      {/* Recharges Table */}
      <div style={{background:'white',borderRadius:12,overflow:'hidden',border:'1px solid #e2e8f0',boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{background:'#f7fafc',borderBottom:'2px solid #e2e8f0'}}>
                <th style={{padding:'16px 20px',textAlign:'left',fontWeight:600,color:'#2d3748',fontSize:14,textTransform:'uppercase',letterSpacing:'0.05em'}}>User ID</th>
                <th style={{padding:'16px 20px',textAlign:'left',fontWeight:600,color:'#2d3748',fontSize:14,textTransform:'uppercase',letterSpacing:'0.05em'}}>Username</th>
                <th style={{padding:'16px 20px',textAlign:'left',fontWeight:600,color:'#2d3748',fontSize:14,textTransform:'uppercase',letterSpacing:'0.05em'}}>Plan Name</th>
                <th style={{padding:'16px 20px',textAlign:'left',fontWeight:600,color:'#2d3748',fontSize:14,textTransform:'uppercase',letterSpacing:'0.05em'}}>Amount</th>
                <th style={{padding:'16px 20px',textAlign:'left',fontWeight:600,color:'#2d3748',fontSize:14,textTransform:'uppercase',letterSpacing:'0.05em'}}>Coins</th>
                <th style={{padding:'16px 20px',textAlign:'left',fontWeight:600,color:'#2d3748',fontSize:14,textTransform:'uppercase',letterSpacing:'0.05em'}}>Status</th>
                <th style={{padding:'16px 20px',textAlign:'left',fontWeight:600,color:'#2d3748',fontSize:14,textTransform:'uppercase',letterSpacing:'0.05em'}}>Recharge Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecharges.map((recharge, index) => (
                <tr key={recharge.id} style={{borderBottom:index < filteredRecharges.length - 1 ? '1px solid #e2e8f0' : 'none'}}>
                  <td style={{padding:'20px'}}>
                    <div style={{fontSize:13,color:'#718096',fontFamily:'monospace',background:'#f7fafc',padding:'6px 12px',borderRadius:6,display:'inline-block',fontWeight:600}}>
                      {recharge.userId}
                    </div>
                  </td>
                  <td style={{padding:'20px'}}>
                    <div style={{fontWeight:600,color:'#1a202c',fontSize:15}}>
                      {recharge.username || 'Unknown'}
                    </div>
                  </td>
                  <td style={{padding:'20px'}}>
                    <div style={{fontSize:14,color:'#4a5568'}}>
                      {recharge.planName || 'N/A'}
                    </div>
                  </td>
                  <td style={{padding:'20px'}}>
                    <div style={{fontSize:16,fontWeight:700,color:'#3182ce'}}>
                      ₹{(recharge.amount || 0).toLocaleString()}
                    </div>
                  </td>
                  <td style={{padding:'20px'}}>
                    <div style={{fontSize:16,fontWeight:700,color:'#805ad5'}}>
                      {(recharge.coins || 0).toLocaleString()}
                    </div>
                  </td>
                  <td style={{padding:'20px'}}>
                    <span style={{
                      padding:'6px 12px',
                      borderRadius:16,
                      fontSize:12,
                      fontWeight:600,
                      textTransform:'uppercase',
                      background: recharge.status === 'APPROVED' ? '#f0fff4' : recharge.status === 'REJECTED' ? '#fed7d7' : '#fef5e7',
                      color: recharge.status === 'APPROVED' ? '#38a169' : recharge.status === 'REJECTED' ? '#c53030' : '#d69e2e',
                      border: `1px solid ${recharge.status === 'APPROVED' ? '#9ae6b4' : recharge.status === 'REJECTED' ? '#feb2b2' : '#fbd38d'}`
                    }}>
                      {recharge.status}
                    </span>
                  </td>
                  <td style={{padding:'20px'}}>
                    <div style={{fontSize:14,color:'#4a5568'}}>
                      {formatDateTime(recharge.createdAt)}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRecharges.length === 0 && (
                <tr>
                  <td colSpan={7} style={{padding:64,textAlign:'center'}}>
                    <div style={{fontSize:48,marginBottom:16,opacity:0.5}}>💳</div>
                    <h3 style={{margin:0,color:'#4a5568',fontSize:18,marginBottom:8}}>No recharges found</h3>
                    <p style={{margin:0,color:'#718096'}}>
                      {searchTerm || startDate || endDate
                        ? 'Try adjusting your filters'
                        : 'No recharge transactions yet'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
