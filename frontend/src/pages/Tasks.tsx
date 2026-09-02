import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

interface Task {
  id: string;
  status: string;
  assignedTo: string | null;
  finding?: { id: string; title: string; severity: string };
  assignee?: { id: string; email: string } | null;
  verifications?: { id: string; result: string; verifiedAt: string }[];
}

const STATUSES = ['open', 'assigned', 'fixing', 'verification', 'verified', 'closed'];

export const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get('/tasks');
      setTasks(data);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await apiClient.put(`/tasks/${taskId}`, { status: newStatus });
      fetchTasks();
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  const tasksByStatus = STATUSES.reduce((acc, status) => {
    acc[status] = tasks.filter(t => t.status === status);
    return acc;
  }, {} as Record<string, Task[]>);

  const statusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-50 border-red-200';
      case 'assigned': return 'bg-blue-50 border-blue-200';
      case 'fixing': return 'bg-yellow-50 border-yellow-200';
      case 'verification': return 'bg-purple-50 border-purple-200';
      case 'verified': return 'bg-green-50 border-green-200';
      case 'closed': return 'bg-gray-50 border-gray-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Task Board</h1>
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="grid grid-cols-6 gap-4">
          {STATUSES.map(status => (
            <div key={status} className={`rounded-lg border-2 p-3 ${statusColor(status)}`}>
              <h2 className="text-sm font-bold uppercase mb-3 text-center">{status}</h2>
              <div className="space-y-2">
                {tasksByStatus[status].map(task => (
                  <div key={task.id} className="bg-white rounded p-3 shadow-sm">
                    <p className="text-sm font-medium mb-1">{task.finding?.title || 'Unknown'}</p>
                    <p className="text-xs text-gray-500 mb-2">
                      {task.assignee?.email || 'Unassigned'}
                    </p>
                    {task.verifications && task.verifications.length > 0 && (
                      <p className="text-xs text-gray-400 mb-2">
                        Verified: {new Date(task.verifications[0].verifiedAt).toLocaleDateString()}
                      </p>
                    )}
                    <select
                      value={task.status}
                      onChange={e => handleStatusChange(task.id, e.target.value)}
                      className="w-full text-xs border rounded p-1"
                    >
                      {STATUSES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                ))}
                {tasksByStatus[status].length === 0 && (
                  <p className="text-xs text-gray-400 text-center">No tasks</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};