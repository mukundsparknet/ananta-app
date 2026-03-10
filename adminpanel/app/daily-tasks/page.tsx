'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

type HostTask = {
  id: number;
  title: string;
  description: string;
  triggerEvent: string;
  targetValue: number;
  rewardCoins: number;
  minLevel: number;
  maxLevel: number;
  active: boolean;
};

type ViewerTask = {
  id: number;
  title: string;
  description: string;
  triggerEvent: string;
  targetValue: number;
  rewardCoins: number;
  minLevel: number;
  maxLevel: number;
  active: boolean;
};

export default function DailyTasksPage() {
  const [activeTab, setActiveTab] = useState<'host' | 'viewer'>('host');
  
  const [hostTasks, setHostTasks] = useState<HostTask[]>([]);
  const [loadingHostTasks, setLoadingHostTasks] = useState(true);
  const [savingHostTask, setSavingHostTask] = useState(false);
  const [editingHostTask, setEditingHostTask] = useState<HostTask | null>(null);
  const [showHostPopup, setShowHostPopup] = useState(false);

  const [viewerTasks, setViewerTasks] = useState<ViewerTask[]>([]);
  const [loadingViewerTasks, setLoadingViewerTasks] = useState(true);
  const [savingViewerTask, setSavingViewerTask] = useState(false);
  const [editingViewerTask, setEditingViewerTask] = useState<ViewerTask | null>(null);
  const [showViewerPopup, setShowViewerPopup] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    const fetchHostTasks = async () => {
      try {
        const res = await axios.get('/api/admin/daily-tasks/host', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setHostTasks(res.data.tasks || []);
      } catch (e) {
      } finally {
        setLoadingHostTasks(false);
      }
    };

    const fetchViewerTasks = async () => {
      try {
        const res = await axios.get('/api/admin/daily-tasks/viewer', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setViewerTasks(res.data.tasks || []);
      } catch (e) {
      } finally {
        setLoadingViewerTasks(false);
      }
    };

    fetchHostTasks();
    fetchViewerTasks();
  }, []);

  const handleHostTaskChange = (field: keyof HostTask, value: any) => {
    setEditingHostTask(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSaveHostTask = async () => {
    if (!editingHostTask) return;
    const token = localStorage.getItem('token');
    try {
      setSavingHostTask(true);
      if (editingHostTask.id) {
        const res = await axios.put(`/api/admin/daily-tasks/host/${editingHostTask.id}`, editingHostTask, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setHostTasks(prev => prev.map(t => (t.id === editingHostTask.id ? res.data : t)));
      } else {
        const res = await axios.post('/api/admin/daily-tasks/host', editingHostTask, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setHostTasks(prev => [...prev, res.data]);
      }
      setShowHostPopup(false);
      setEditingHostTask(null);
    } catch (e) {
      alert('Error saving task');
    } finally {
      setSavingHostTask(false);
    }
  };

  const handleDeleteHostTask = async (taskId: number) => {
    const token = localStorage.getItem('token');
    if (!window.confirm('Delete this task?')) return;
    try {
      await axios.delete(`/api/admin/daily-tasks/host/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHostTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (e) {
      alert('Error deleting task');
    }
  };

  const handleViewerTaskChange = (field: keyof ViewerTask, value: any) => {
    setEditingViewerTask(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSaveViewerTask = async () => {
    if (!editingViewerTask) return;
    const token = localStorage.getItem('token');
    try {
      setSavingViewerTask(true);
      if (editingViewerTask.id) {
        const res = await axios.put(`/api/admin/daily-tasks/viewer/${editingViewerTask.id}`, editingViewerTask, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setViewerTasks(prev => prev.map(t => (t.id === editingViewerTask.id ? res.data : t)));
      } else {
        const res = await axios.post('/api/admin/daily-tasks/viewer', editingViewerTask, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setViewerTasks(prev => [...prev, res.data]);
      }
      setShowViewerPopup(false);
      setEditingViewerTask(null);
    } catch (e) {
      alert('Error saving task');
    } finally {
      setSavingViewerTask(false);
    }
  };

  const handleDeleteViewerTask = async (taskId: number) => {
    const token = localStorage.getItem('token');
    if (!window.confirm('Delete this task?')) return;
    try {
      await axios.delete(`/api/admin/daily-tasks/viewer/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setViewerTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (e) {
      alert('Error deleting task');
    }
  };

  const renderHostTab = () => (
    <div>
      <h2 style={{marginTop:0,marginBottom:16,fontSize:24,color:'#2d3748'}}>Host Tasks</h2>
      <p style={{marginTop:0,marginBottom:24,color:'#718096',fontSize:14}}>
        Manage daily tasks for hosts to complete and earn rewards.
      </p>

      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:16}}>
        <button
          onClick={() => {
            setEditingHostTask({ id: 0, title: '', description: '', triggerEvent: '', targetValue: 0, rewardCoins: 0, minLevel: 1, maxLevel: 99, active: true });
            setShowHostPopup(true);
          }}
          style={{padding:'8px 14px',borderRadius:6,border:'none',background:'#3182ce',color:'white',fontSize:13,cursor:'pointer',fontWeight:600}}
        >
          Add Task
        </button>
      </div>

      {loadingHostTasks ? (
        <p style={{color:'#718096'}}>Loading tasks...</p>
      ) : hostTasks.length === 0 ? (
        <p style={{color:'#718096'}}>No tasks created yet.</p>
      ) : (
        <table style={{width:'100%',borderCollapse:'collapse',background:'white',borderRadius:8,overflow:'hidden',border:'1px solid #e2e8f0'}}>
          <thead>
            <tr style={{background:'#f7fafc'}}>
              <th style={{textAlign:'left',padding:12,fontSize:13,color:'#4a5568',borderBottom:'1px solid #e2e8f0'}}>Title</th>
              <th style={{textAlign:'left',padding:12,fontSize:13,color:'#4a5568',borderBottom:'1px solid #e2e8f0'}}>Trigger Event</th>
              <th style={{textAlign:'left',padding:12,fontSize:13,color:'#4a5568',borderBottom:'1px solid #e2e8f0'}}>Target</th>
              <th style={{textAlign:'left',padding:12,fontSize:13,color:'#4a5568',borderBottom:'1px solid #e2e8f0'}}>Reward</th>
              <th style={{textAlign:'left',padding:12,fontSize:13,color:'#4a5568',borderBottom:'1px solid #e2e8f0'}}>Level Range</th>
              <th style={{textAlign:'left',padding:12,fontSize:13,color:'#4a5568',borderBottom:'1px solid #e2e8f0'}}>Status</th>
              <th style={{textAlign:'right',padding:12,fontSize:13,color:'#4a5568',borderBottom:'1px solid #e2e8f0'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {hostTasks.map(task => (
              <tr key={task.id}>
                <td style={{padding:12,fontSize:14,color:'#2d3748',borderBottom:'1px solid #edf2f7'}}>{task.title}</td>
                <td style={{padding:12,fontSize:14,color:'#2d3748',borderBottom:'1px solid #edf2f7'}}>{task.triggerEvent}</td>
                <td style={{padding:12,fontSize:14,color:'#2d3748',borderBottom:'1px solid #edf2f7'}}>{task.targetValue}</td>
                <td style={{padding:12,fontSize:14,color:'#2d3748',borderBottom:'1px solid #edf2f7'}}>{task.rewardCoins} coins</td>
                <td style={{padding:12,fontSize:14,color:'#2d3748',borderBottom:'1px solid #edf2f7'}}>{task.minLevel}-{task.maxLevel}</td>
                <td style={{padding:12,fontSize:14,color:task.active ? '#38a169' : '#e53e3e',borderBottom:'1px solid #edf2f7'}}>
                  {task.active ? 'Active' : 'Inactive'}
                </td>
                <td style={{padding:12,textAlign:'right',borderBottom:'1px solid #edf2f7'}}>
                  <button
                    onClick={() => {
                      setEditingHostTask(task);
                      setShowHostPopup(true);
                    }}
                    style={{padding:'6px 10px',borderRadius:6,border:'1px solid #e2e8f0',background:'white',color:'#4a5568',fontSize:12,cursor:'pointer',marginRight:8}}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteHostTask(task.id)}
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

  const renderViewerTab = () => (
    <div>
      <h2 style={{marginTop:0,marginBottom:16,fontSize:24,color:'#2d3748'}}>Viewer Tasks</h2>
      <p style={{marginTop:0,marginBottom:24,color:'#718096',fontSize:14}}>
        Manage daily tasks for viewers to complete and earn rewards.
      </p>

      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:16}}>
        <button
          onClick={() => {
            setEditingViewerTask({ id: 0, title: '', description: '', triggerEvent: '', targetValue: 0, rewardCoins: 0, minLevel: 1, maxLevel: 99, active: true });
            setShowViewerPopup(true);
          }}
          style={{padding:'8px 14px',borderRadius:6,border:'none',background:'#3182ce',color:'white',fontSize:13,cursor:'pointer',fontWeight:600}}
        >
          Add Task
        </button>
      </div>

      {loadingViewerTasks ? (
        <p style={{color:'#718096'}}>Loading tasks...</p>
      ) : viewerTasks.length === 0 ? (
        <p style={{color:'#718096'}}>No tasks created yet.</p>
      ) : (
        <table style={{width:'100%',borderCollapse:'collapse',background:'white',borderRadius:8,overflow:'hidden',border:'1px solid #e2e8f0'}}>
          <thead>
            <tr style={{background:'#f7fafc'}}>
              <th style={{textAlign:'left',padding:12,fontSize:13,color:'#4a5568',borderBottom:'1px solid #e2e8f0'}}>Title</th>
              <th style={{textAlign:'left',padding:12,fontSize:13,color:'#4a5568',borderBottom:'1px solid #e2e8f0'}}>Trigger Event</th>
              <th style={{textAlign:'left',padding:12,fontSize:13,color:'#4a5568',borderBottom:'1px solid #e2e8f0'}}>Target</th>
              <th style={{textAlign:'left',padding:12,fontSize:13,color:'#4a5568',borderBottom:'1px solid #e2e8f0'}}>Reward</th>
              <th style={{textAlign:'left',padding:12,fontSize:13,color:'#4a5568',borderBottom:'1px solid #e2e8f0'}}>Level Range</th>
              <th style={{textAlign:'left',padding:12,fontSize:13,color:'#4a5568',borderBottom:'1px solid #e2e8f0'}}>Status</th>
              <th style={{textAlign:'right',padding:12,fontSize:13,color:'#4a5568',borderBottom:'1px solid #e2e8f0'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {viewerTasks.map(task => (
              <tr key={task.id}>
                <td style={{padding:12,fontSize:14,color:'#2d3748',borderBottom:'1px solid #edf2f7'}}>{task.title}</td>
                <td style={{padding:12,fontSize:14,color:'#2d3748',borderBottom:'1px solid #edf2f7'}}>{task.triggerEvent}</td>
                <td style={{padding:12,fontSize:14,color:'#2d3748',borderBottom:'1px solid #edf2f7'}}>{task.targetValue}</td>
                <td style={{padding:12,fontSize:14,color:'#2d3748',borderBottom:'1px solid #edf2f7'}}>{task.rewardCoins} coins</td>
                <td style={{padding:12,fontSize:14,color:'#2d3748',borderBottom:'1px solid #edf2f7'}}>{task.minLevel}-{task.maxLevel}</td>
                <td style={{padding:12,fontSize:14,color:task.active ? '#38a169' : '#e53e3e',borderBottom:'1px solid #edf2f7'}}>
                  {task.active ? 'Active' : 'Inactive'}
                </td>
                <td style={{padding:12,textAlign:'right',borderBottom:'1px solid #edf2f7'}}>
                  <button
                    onClick={() => {
                      setEditingViewerTask(task);
                      setShowViewerPopup(true);
                    }}
                    style={{padding:'6px 10px',borderRadius:6,border:'1px solid #e2e8f0',background:'white',color:'#4a5568',fontSize:12,cursor:'pointer',marginRight:8}}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteViewerTask(task.id)}
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

  const renderHostPopup = () => {
    if (!showHostPopup || !editingHostTask) return null;
    return (
      <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
        <div style={{background:'white',borderRadius:8,padding:24,width:'90%',maxWidth:600,maxHeight:'90vh',overflowY:'auto'}}>
          <h3 style={{margin:0,marginBottom:20,fontSize:20,color:'#2d3748'}}>{editingHostTask.id ? 'Edit Host Task' : 'Add Host Task'}</h3>
          
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
            <div>
              <label style={{display:'block',marginBottom:4,fontSize:13,color:'#4a5568'}}>Title</label>
              <input
                value={editingHostTask.title}
                onChange={e => handleHostTaskChange('title', e.target.value)}
                style={{width:'100%',padding:'8px 10px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:14}}
              />
            </div>
            <div>
              <label style={{display:'block',marginBottom:4,fontSize:13,color:'#4a5568'}}>Trigger Event</label>
              <input
                value={editingHostTask.triggerEvent}
                onChange={e => handleHostTaskChange('triggerEvent', e.target.value)}
                style={{width:'100%',padding:'8px 10px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:14}}
              />
            </div>
          </div>
          
          <div style={{marginBottom:16}}>
            <label style={{display:'block',marginBottom:4,fontSize:13,color:'#4a5568'}}>Description</label>
            <textarea
              value={editingHostTask.description}
              onChange={e => handleHostTaskChange('description', e.target.value)}
              rows={3}
              style={{width:'100%',padding:'8px 10px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:14,resize:'vertical'}}
            />
          </div>
          
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:16,marginBottom:16}}>
            <div>
              <label style={{display:'block',marginBottom:4,fontSize:13,color:'#4a5568'}}>Target Value</label>
              <input
                type="number"
                value={editingHostTask.targetValue}
                onChange={e => handleHostTaskChange('targetValue', Number(e.target.value))}
                style={{width:'100%',padding:'8px 10px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:14}}
              />
            </div>
            <div>
              <label style={{display:'block',marginBottom:4,fontSize:13,color:'#4a5568'}}>Reward Coins</label>
              <input
                type="number"
                value={editingHostTask.rewardCoins}
                onChange={e => handleHostTaskChange('rewardCoins', Number(e.target.value))}
                style={{width:'100%',padding:'8px 10px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:14}}
              />
            </div>
            <div>
              <label style={{display:'block',marginBottom:4,fontSize:13,color:'#4a5568'}}>Min Level</label>
              <input
                type="number"
                value={editingHostTask.minLevel}
                onChange={e => handleHostTaskChange('minLevel', Number(e.target.value))}
                style={{width:'100%',padding:'8px 10px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:14}}
              />
            </div>
            <div>
              <label style={{display:'block',marginBottom:4,fontSize:13,color:'#4a5568'}}>Max Level</label>
              <input
                type="number"
                value={editingHostTask.maxLevel}
                onChange={e => handleHostTaskChange('maxLevel', Number(e.target.value))}
                style={{width:'100%',padding:'8px 10px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:14}}
              />
            </div>
          </div>
          
          <div style={{marginBottom:20}}>
            <label style={{display:'inline-flex',alignItems:'center',gap:8,fontSize:13,color:'#4a5568'}}>
              <input
                type="checkbox"
                checked={editingHostTask.active}
                onChange={e => handleHostTaskChange('active', e.target.checked)}
              />
              Active
            </label>
          </div>
          
          <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
            <button
              onClick={() => {
                setShowHostPopup(false);
                setEditingHostTask(null);
              }}
              style={{padding:'8px 16px',borderRadius:6,border:'1px solid #e2e8f0',background:'white',color:'#4a5568',fontSize:14,cursor:'pointer'}}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveHostTask}
              disabled={savingHostTask}
              style={{padding:'8px 16px',borderRadius:6,border:'none',background:'#3182ce',color:'white',fontSize:14,cursor:'pointer'}}
            >
              {savingHostTask ? 'Saving...' : 'Save Task'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderViewerPopup = () => {
    if (!showViewerPopup || !editingViewerTask) return null;
    return (
      <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
        <div style={{background:'white',borderRadius:8,padding:24,width:'90%',maxWidth:600,maxHeight:'90vh',overflowY:'auto'}}>
          <h3 style={{margin:0,marginBottom:20,fontSize:20,color:'#2d3748'}}>{editingViewerTask.id ? 'Edit Viewer Task' : 'Add Viewer Task'}</h3>
          
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
            <div>
              <label style={{display:'block',marginBottom:4,fontSize:13,color:'#4a5568'}}>Title</label>
              <input
                value={editingViewerTask.title}
                onChange={e => handleViewerTaskChange('title', e.target.value)}
                style={{width:'100%',padding:'8px 10px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:14}}
              />
            </div>
            <div>
              <label style={{display:'block',marginBottom:4,fontSize:13,color:'#4a5568'}}>Trigger Event</label>
              <input
                value={editingViewerTask.triggerEvent}
                onChange={e => handleViewerTaskChange('triggerEvent', e.target.value)}
                style={{width:'100%',padding:'8px 10px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:14}}
              />
            </div>
          </div>
          
          <div style={{marginBottom:16}}>
            <label style={{display:'block',marginBottom:4,fontSize:13,color:'#4a5568'}}>Description</label>
            <textarea
              value={editingViewerTask.description}
              onChange={e => handleViewerTaskChange('description', e.target.value)}
              rows={3}
              style={{width:'100%',padding:'8px 10px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:14,resize:'vertical'}}
            />
          </div>
          
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:16,marginBottom:16}}>
            <div>
              <label style={{display:'block',marginBottom:4,fontSize:13,color:'#4a5568'}}>Target Value</label>
              <input
                type="number"
                value={editingViewerTask.targetValue}
                onChange={e => handleViewerTaskChange('targetValue', Number(e.target.value))}
                style={{width:'100%',padding:'8px 10px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:14}}
              />
            </div>
            <div>
              <label style={{display:'block',marginBottom:4,fontSize:13,color:'#4a5568'}}>Reward Coins</label>
              <input
                type="number"
                value={editingViewerTask.rewardCoins}
                onChange={e => handleViewerTaskChange('rewardCoins', Number(e.target.value))}
                style={{width:'100%',padding:'8px 10px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:14}}
              />
            </div>
            <div>
              <label style={{display:'block',marginBottom:4,fontSize:13,color:'#4a5568'}}>Min Level</label>
              <input
                type="number"
                value={editingViewerTask.minLevel}
                onChange={e => handleViewerTaskChange('minLevel', Number(e.target.value))}
                style={{width:'100%',padding:'8px 10px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:14}}
              />
            </div>
            <div>
              <label style={{display:'block',marginBottom:4,fontSize:13,color:'#4a5568'}}>Max Level</label>
              <input
                type="number"
                value={editingViewerTask.maxLevel}
                onChange={e => handleViewerTaskChange('maxLevel', Number(e.target.value))}
                style={{width:'100%',padding:'8px 10px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:14}}
              />
            </div>
          </div>
          
          <div style={{marginBottom:20}}>
            <label style={{display:'inline-flex',alignItems:'center',gap:8,fontSize:13,color:'#4a5568'}}>
              <input
                type="checkbox"
                checked={editingViewerTask.active}
                onChange={e => handleViewerTaskChange('active', e.target.checked)}
              />
              Active
            </label>
          </div>
          
          <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
            <button
              onClick={() => {
                setShowViewerPopup(false);
                setEditingViewerTask(null);
              }}
              style={{padding:'8px 16px',borderRadius:6,border:'1px solid #e2e8f0',background:'white',color:'#4a5568',fontSize:14,cursor:'pointer'}}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveViewerTask}
              disabled={savingViewerTask}
              style={{padding:'8px 16px',borderRadius:6,border:'none',background:'#3182ce',color:'white',fontSize:14,cursor:'pointer'}}
            >
              {savingViewerTask ? 'Saving...' : 'Save Task'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{marginBottom:24}}>
        <h1 style={{margin:0,fontSize:28,color:'#2d3748'}}>Daily Tasks</h1>
        <p style={{margin:0,marginTop:8,color:'#718096',fontSize:14}}>
          Configure daily tasks for hosts and viewers to complete.
        </p>
      </div>

      <div style={{display:'flex',borderBottom:'1px solid #e2e8f0',marginBottom:24}}>
        <button
          onClick={() => setActiveTab('host')}
          style={{
            padding:'10px 20px',
            border:'none',
            borderBottom: activeTab === 'host' ? '3px solid #3182ce' : '3px solid transparent',
            background:'transparent',
            color: activeTab === 'host' ? '#2d3748' : '#718096',
            fontWeight: activeTab === 'host' ? 600 : 500,
            cursor:'pointer',
          }}
        >
          Host Tasks
        </button>
        <button
          onClick={() => setActiveTab('viewer')}
          style={{
            padding:'10px 20px',
            border:'none',
            borderBottom: activeTab === 'viewer' ? '3px solid #3182ce' : '3px solid transparent',
            background:'transparent',
            color: activeTab === 'viewer' ? '#2d3748' : '#718096',
            fontWeight: activeTab === 'viewer' ? 600 : 500,
            cursor:'pointer',
          }}
        >
          Viewer Tasks
        </button>
      </div>

      {activeTab === 'host' ? renderHostTab() : renderViewerTab()}
      {renderHostPopup()}
      {renderViewerPopup()}
    </div>
  );
}