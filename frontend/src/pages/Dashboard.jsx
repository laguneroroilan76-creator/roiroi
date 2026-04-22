import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTasks = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/');
        return;
      }

      try {
        const response = await axios.get('http://localhost:5000/api/tasks', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTasks(response.data);
      } catch (err) {
        console.error(err);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="dashboard-view" style={{ padding: '3rem' }}>
      <header style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800' }}>Dashboard Overview</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '1rem', marginTop: '0.4rem' }}>
          Welcome back, {user?.name || 'User'}
        </p>
      </header>

      <div className="stats-row" style={{ display: 'flex', gap: '1.5rem', marginBottom: '3rem' }}>
        <div className="stat-card glass" style={{ flex: 1, padding: '2rem', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div className="stat-icon" style={{ width: '60px', height: '60px', borderRadius: '15px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>📝</div>
          <div>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{tasks.length}</h3>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Active Tasks</p>
          </div>
        </div>
        <div className="stat-card glass" onClick={() => navigate('/history')} style={{ flex: 1, padding: '2rem', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '1.5rem', cursor: 'pointer' }}>
          <div className="stat-icon" style={{ width: '60px', height: '60px', borderRadius: '15px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>📁</div>
          <div>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Records</h3>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>View History & Calendar</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3>Recent Activity</h3>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3>Recent Activity</h3>
      </div>

      {loading ? (
        <p>Loading tasks...</p>
      ) : (
        <div className="task-list">
          {tasks.length > 0 ? tasks.map(task => (
            <div key={task.id} className="task-card">
              <h3>{task.title}</h3>
              <p>{task.description}</p>
              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ 
                  fontSize: '0.75rem', 
                  padding: '0.25rem 0.6rem', 
                  borderRadius: '100px',
                  background: task.completed ? 'rgba(34, 197, 94, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                  color: task.completed ? '#4ade80' : '#facc15'
                }}>
                  {task.completed ? 'Completed' : 'In Progress'}
                </span>
              </div>
            </div>
          )) : (
            <p style={{ color: 'var(--text-dim)' }}>No tasks found. Create one to get started!</p>
          )}
        </div>
      )}
    </div>
  );
}
