'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

type RechargePlan = {
  id: number;
  name: string;
  coins: number;
  price: number;
  popular: boolean;
  active: boolean;
};

type Gift = {
  id: number;
  name: string;
  coinValue: number;
  imageUrl: string;
  active: boolean;
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'wallet' | 'gifts'>('wallet');
  const [plans, setPlans] = useState<RechargePlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [savingPlan, setSavingPlan] = useState(false);

  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loadingGifts, setLoadingGifts] = useState(true);
  const [savingGift, setSavingGift] = useState(false);
  const [editingGift, setEditingGift] = useState<Gift | null>(null);
  const [giftImageFile, setGiftImageFile] = useState<File | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const fetchPlans = async () => {
      try {
        const res = await axios.get('/api/admin/wallet/plans', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPlans(res.data.plans || []);
      } catch (e) {
      } finally {
        setLoadingPlans(false);
      }
    };
    const fetchGifts = async () => {
      try {
        const res = await axios.get('/api/admin/gifts', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setGifts(res.data.gifts || []);
      } catch (e) {
      } finally {
        setLoadingGifts(false);
      }
    };
    fetchPlans();
    fetchGifts();
  }, []);

  const handlePlanChange = (index: number, field: keyof RechargePlan, value: any) => {
    setPlans(prev => {
      const copy = [...prev];
      const item = { ...copy[index], [field]: value };
      copy[index] = item;
      return copy;
    });
  };

  const handleSavePlan = async (plan: RechargePlan) => {
    const token = localStorage.getItem('token');
    try {
      setSavingPlan(true);
      const payload = {
        ...plan,
      };
      if (plan.id) {
        const res = await axios.put(`/api/admin/wallet/plans/${plan.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPlans(prev => prev.map(p => (p.id === plan.id ? res.data : p)));
      } else {
        const res = await axios.post('/api/admin/wallet/plans', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPlans(prev => [...prev, res.data]);
      }
    } catch (e) {
      alert('Error saving plan');
    } finally {
      setSavingPlan(false);
    }
  };

  const handleDeletePlan = async (planId: number) => {
    const token = localStorage.getItem('token');
    if (!window.confirm('Delete this plan?')) {
      return;
    }
    try {
      await axios.delete(`/api/admin/wallet/plans/${planId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPlans(prev => prev.filter(p => p.id !== planId));
    } catch (e) {
      alert('Error deleting plan');
    }
  };

  const handleEditGiftField = (field: keyof Gift, value: any) => {
    setEditingGift(prev => {
      const base: Gift = prev || {
        id: 0,
        name: '',
        coinValue: 0,
        imageUrl: '',
        active: true,
      };
      return {
        ...base,
        [field]: value,
      };
    });
  };

  const handleSaveGift = async () => {
    if (!editingGift) {
      return;
    }
    if (!editingGift.name || editingGift.coinValue <= 0) {
      alert('Name and coin value are required');
      return;
    }
    const token = localStorage.getItem('token');
    try {
      setSavingGift(true);
      const formData = new FormData();
      if (editingGift.id) {
        formData.append('id', String(editingGift.id));
      }
      formData.append('name', editingGift.name);
      formData.append('coinValue', String(editingGift.coinValue));
      formData.append('active', String(editingGift.active));
      if (giftImageFile) {
        formData.append('image', giftImageFile);
      }
      const res = await axios.post('/api/admin/gifts/save', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const saved: Gift = res.data;
      if (editingGift.id) {
        setGifts(prev => prev.map(g => (g.id === saved.id ? saved : g)));
      } else {
        setGifts(prev => [...prev, saved]);
      }
      setEditingGift(null);
      setGiftImageFile(null);
    } catch (e) {
      alert('Error saving gift');
    } finally {
      setSavingGift(false);
    }
  };

  const handleDeleteGift = async (giftId: number) => {
    const token = localStorage.getItem('token');
    if (!window.confirm('Delete this gift?')) {
      return;
    }
    try {
      await axios.delete(`/api/admin/gifts/${giftId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGifts(prev => prev.filter(g => g.id !== giftId));
    } catch (e) {
      alert('Error deleting gift');
    }
  };

  const renderWalletTab = () => (
    <div>
      <h2 style={{marginTop:0,marginBottom:16,fontSize:24,color:'#2d3748'}}>Wallet Settings</h2>
      <p style={{marginTop:0,marginBottom:24,color:'#718096',fontSize:14}}>
        Manage recharge plans and coin pricing.
      </p>

      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:16}}>
        <button
          onClick={() =>
            setPlans(prev => [
              ...prev,
              {
                id: 0,
                name: '',
                coins: 0,
                price: 0,
                popular: false,
                active: true,
              },
            ])
          }
          style={{
            padding:'8px 14px',
            borderRadius:6,
            border:'none',
            background:'#3182ce',
            color:'white',
            fontSize:13,
            cursor:'pointer',
            fontWeight:600,
          }}
        >
          Add plan
        </button>
      </div>

      {loadingPlans ? (
        <p style={{color:'#718096'}}>Loading plans...</p>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          {plans.map((plan, index) => (
            <div key={plan.id} style={{background:'white',padding:16,borderRadius:8,border:'1px solid #e2e8f0',display:'flex',alignItems:'center',gap:16}}>
              <div style={{flex:2}}>
                <label style={{display:'block',marginBottom:4,fontSize:13,color:'#4a5568'}}>Name</label>
                <input
                  value={plan.name}
                  onChange={e => handlePlanChange(index, 'name', e.target.value)}
                  style={{width:'100%',padding:'8px 10px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:14}}
                />
              </div>
              <div style={{flex:1}}>
                <label style={{display:'block',marginBottom:4,fontSize:13,color:'#4a5568'}}>Coins</label>
                <input
                  type="number"
                  value={plan.coins}
                  onChange={e => handlePlanChange(index, 'coins', Number(e.target.value))}
                  style={{width:'100%',padding:'8px 10px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:14}}
                />
              </div>
              <div style={{flex:1}}>
                <label style={{display:'block',marginBottom:4,fontSize:13,color:'#4a5568'}}>Price (₹)</label>
                <input
                  type="number"
                  value={plan.price}
                  onChange={e => handlePlanChange(index, 'price', Number(e.target.value))}
                  style={{width:'100%',padding:'8px 10px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:14}}
                />
              </div>
              <div style={{flex:1}}>
                <label style={{display:'block',marginBottom:4,fontSize:13,color:'#4a5568'}}>Popular</label>
                <input
                  type="checkbox"
                  checked={plan.popular}
                  onChange={e => handlePlanChange(index, 'popular', e.target.checked)}
                />
              </div>
              <div style={{flex:1}}>
                <label style={{display:'block',marginBottom:4,fontSize:13,color:'#4a5568'}}>Active</label>
                <input
                  type="checkbox"
                  checked={plan.active}
                  onChange={e => handlePlanChange(index, 'active', e.target.checked)}
                />
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                <button
                  onClick={() => handleSavePlan(plan)}
                  disabled={savingPlan}
                  style={{padding:'8px 12px',borderRadius:6,border:'none',background:'#3182ce',color:'white',fontSize:13,cursor:'pointer'}}
                >
                  {savingPlan ? 'Saving...' : 'Save'}
                </button>
                {plan.id && (
                  <button
                    onClick={() => handleDeletePlan(plan.id)}
                    style={{padding:'8px 12px',borderRadius:6,border:'1px solid #e53e3e',background:'white',color:'#e53e3e',fontSize:13,cursor:'pointer'}}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderGiftTab = () => (
    <div>
      <h2 style={{marginTop:0,marginBottom:16,fontSize:24,color:'#2d3748'}}>Gift Settings</h2>
      <p style={{marginTop:0,marginBottom:24,color:'#718096',fontSize:14}}>
        Create gifts that users can send during live sessions.
      </p>

      <div style={{marginBottom:24}}>
        <button
          onClick={() => {
            setEditingGift({
              id: 0,
              name: '',
              coinValue: 0,
              imageUrl: '',
              active: true,
            });
            setGiftImageFile(null);
          }}
          style={{padding:'8px 16px',borderRadius:8,border:'none',background:'#3182ce',color:'white',fontSize:14,cursor:'pointer'}}
        >
          New Gift
        </button>
      </div>

      {editingGift && (
        <div style={{background:'white',padding:16,borderRadius:8,border:'1px solid #e2e8f0',marginBottom:24}}>
          <div style={{display:'grid',gridTemplateColumns:'1.5fr 1fr',gap:16,marginBottom:16}}>
            <div>
              <label style={{display:'block',marginBottom:4,fontSize:13,color:'#4a5568'}}>Name</label>
              <input
                value={editingGift.name}
                onChange={e => handleEditGiftField('name', e.target.value)}
                style={{width:'100%',padding:'8px 10px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:14}}
              />
            </div>
            <div>
              <label style={{display:'block',marginBottom:4,fontSize:13,color:'#4a5568'}}>Coin Value</label>
              <input
                type="number"
                value={editingGift.coinValue}
                onChange={e => handleEditGiftField('coinValue', Number(e.target.value))}
                style={{width:'100%',padding:'8px 10px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:14}}
              />
            </div>
          </div>
          <div style={{marginBottom:16}}>
            <label style={{display:'block',marginBottom:4,fontSize:13,color:'#4a5568'}}>Image/Video</label>
            <div style={{display:'flex',alignItems:'center',gap:16}}>
              <div>
                {editingGift.imageUrl ? (
                  editingGift.imageUrl.match(/\.(mp4|mov|avi|webm)$/i) ? (
                    <video
                      src={editingGift.imageUrl}
                      style={{width:60,height:60,objectFit:'cover',borderRadius:8,border:'1px solid #e2e8f0'}}
                      controls
                      muted
                    />
                  ) : (
                    <img
                      src={editingGift.imageUrl}
                      alt={editingGift.name}
                      style={{width:60,height:60,objectFit:'cover',borderRadius:8,border:'1px solid #e2e8f0'}}
                    />
                  )
                ) : (
                  <div style={{width:60,height:60,borderRadius:8,border:'1px dashed #cbd5e0',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:'#a0aec0'}}>
                    No media
                  </div>
                )}
              </div>
              <div>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={e => {
                    const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
                    setGiftImageFile(file);
                  }}
                />
                <p style={{margin:0,marginTop:4,fontSize:11,color:'#a0aec0'}}>
                  JPG, PNG, GIF, MP4, MOV, AVI • Max 30MB
                </p>
              </div>
            </div>
          </div>
          <div style={{marginBottom:16}}>
            <label style={{display:'inline-flex',alignItems:'center',gap:8,fontSize:13,color:'#4a5568'}}>
              <input
                type="checkbox"
                checked={editingGift.active}
                onChange={e => handleEditGiftField('active', e.target.checked)}
              />
              Active
            </label>
          </div>
          <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
            <button
              onClick={() => {
                setEditingGift(null);
                setGiftImageFile(null);
              }}
              style={{padding:'8px 16px',borderRadius:8,border:'1px solid #e2e8f0',background:'white',color:'#4a5568',fontSize:14,cursor:'pointer'}}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveGift}
              disabled={savingGift}
              style={{padding:'8px 16px',borderRadius:8,border:'none',background:'#38a169',color:'white',fontSize:14,cursor:'pointer'}}
            >
              {savingGift ? 'Saving...' : 'Save Gift'}
            </button>
          </div>
        </div>
      )}

      {loadingGifts ? (
        <p style={{color:'#718096'}}>Loading gifts...</p>
      ) : gifts.length === 0 ? (
        <p style={{color:'#718096'}}>No gifts created yet.</p>
      ) : (
        <table style={{width:'100%',borderCollapse:'collapse',background:'white',borderRadius:8,overflow:'hidden',border:'1px solid #e2e8f0'}}>
          <thead>
            <tr style={{background:'#f7fafc'}}>
              <th style={{textAlign:'left',padding:12,fontSize:13,color:'#4a5568',borderBottom:'1px solid #e2e8f0'}}>Name</th>
              <th style={{textAlign:'left',padding:12,fontSize:13,color:'#4a5568',borderBottom:'1px solid #e2e8f0'}}>Coin Value</th>
              <th style={{textAlign:'left',padding:12,fontSize:13,color:'#4a5568',borderBottom:'1px solid #e2e8f0'}}>Image</th>
              <th style={{textAlign:'left',padding:12,fontSize:13,color:'#4a5568',borderBottom:'1px solid #e2e8f0'}}>Active</th>
              <th style={{textAlign:'right',padding:12,fontSize:13,color:'#4a5568',borderBottom:'1px solid #e2e8f0'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {gifts.map(gift => (
              <tr key={gift.id}>
                <td style={{padding:12,fontSize:14,color:'#2d3748',borderBottom:'1px solid #edf2f7'}}>
                  {gift.name}
                </td>
                <td style={{padding:12,fontSize:14,color:'#2d3748',borderBottom:'1px solid #edf2f7'}}>
                  {gift.coinValue}
                </td>
                <td style={{padding:12,fontSize:14,color:'#2d3748',borderBottom:'1px solid #edf2f7'}}>
                  {gift.imageUrl ? (
                    gift.imageUrl.match(/\.(mp4|mov|avi|webm)$/i) ? (
                      <video src={gift.imageUrl} style={{width:40,height:40,objectFit:'cover',borderRadius:6}} controls muted />
                    ) : (
                      <img src={gift.imageUrl} alt={gift.name} style={{width:40,height:40,objectFit:'cover',borderRadius:6}} />
                    )
                  ) : (
                    <span style={{color:'#a0aec0',fontSize:12}}>No media</span>
                  )}
                </td>
                <td style={{padding:12,fontSize:14,color:gift.active ? '#38a169' : '#e53e3e',borderBottom:'1px solid #edf2f7'}}>
                  {gift.active ? 'Active' : 'Inactive'}
                </td>
                <td style={{padding:12,textAlign:'right',borderBottom:'1px solid #edf2f7'}}>
                  <button
                    onClick={() => {
                      setEditingGift(gift);
                      setGiftImageFile(null);
                    }}
                    style={{padding:'6px 10px',borderRadius:6,border:'1px solid #e2e8f0',background:'white',color:'#4a5568',fontSize:12,cursor:'pointer',marginRight:8}}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteGift(gift.id)}
                    style={{padding:'6px 10px',borderRadius:6,border:'1px solid #e53e3e',background:'white',color:'#e53e3e',fontSize:12,cursor:'pointer'}}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  return (
    <div>
      <div style={{marginBottom:24}}>
        <h1 style={{margin:0,fontSize:28,color:'#2d3748'}}>Settings</h1>
        <p style={{margin:0,marginTop:8,color:'#718096',fontSize:14}}>
          Manage wallet and gift configuration for the app.
        </p>
      </div>

      <div style={{display:'flex',borderBottom:'1px solid #e2e8f0',marginBottom:24}}>
        <button
          onClick={() => setActiveTab('wallet')}
          style={{
            padding:'10px 20px',
            border:'none',
            borderBottom: activeTab === 'wallet' ? '3px solid #3182ce' : '3px solid transparent',
            background:'transparent',
            color: activeTab === 'wallet' ? '#2d3748' : '#718096',
            fontWeight: activeTab === 'wallet' ? 600 : 500,
            cursor:'pointer',
          }}
        >
          Wallet settings
        </button>
        <button
          onClick={() => setActiveTab('gifts')}
          style={{
            padding:'10px 20px',
            border:'none',
            borderBottom: activeTab === 'gifts' ? '3px solid #3182ce' : '3px solid transparent',
            background:'transparent',
            color: activeTab === 'gifts' ? '#2d3748' : '#718096',
            fontWeight: activeTab === 'gifts' ? 600 : 500,
            cursor:'pointer',
          }}
        >
          Gift settings
        </button>
      </div>

      {activeTab === 'wallet' ? renderWalletTab() : renderGiftTab()}
    </div>
  );
}
