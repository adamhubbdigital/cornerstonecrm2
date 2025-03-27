import React, { useEffect, useState } from 'react';
import { Plus, X, Link as LinkIcon, Calendar, Building2, UserIcon, ExternalLink, Trash2, Edit, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Task, Organisation, Contact, User } from '../lib/types';
import PageTransition from '../components/PageTransition';
import { useDeleteConfirmation } from '../hooks/useDeleteConfirmation';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import { SlidePanel } from '../components/SlidePanel';

export function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    organisation_id: '',
    contact_id: '',
    assignee_id: '',
    status: 'pending' as Task['status']
  });

  const { confirmation, requestConfirmation, cancelConfirmation } = useDeleteConfirmation();

  useEffect(() => {
    loadTasks();
    loadOrganisations();
    loadContacts();
    loadTeamMembers();

    const handleAddModal = (e: CustomEvent) => {
      if (e.detail.type === 'task') {
        setIsCreating(true);
        setIsEditing(false);
        setFormData({
          title: '',
          description: '',
          due_date: '',
          organisation_id: '',
          contact_id: '',
          assignee_id: '',
          status: 'pending'
        });
      }
    };

    window.addEventListener('openAddModal', handleAddModal as EventListener);

    return () => {
      window.removeEventListener('openAddModal', handleAddModal as EventListener);
    };
  }, []);

  async function loadTasks() {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          organisation:organisations(*),
          contact:contacts(*),
          assignee:profiles(*)
        `)
        .order('due_date', { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error: any) {
      console.error('Error loading tasks:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadOrganisations() {
    try {
      const { data, error } = await supabase
        .from('organisations')
        .select('*')
        .order('name');

      if (error) throw error;
      setOrganisations(data || []);
    } catch (error: any) {
      console.error('Error loading organisations:', error);
    }
  }

  async function loadContacts() {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('name');

      if (error) throw error;
      setContacts(data || []);
    } catch (error: any) {
      console.error('Error loading contacts:', error);
    }
  }

  async function loadTeamMembers() {
    try {
      const { data: teamData } = await supabase
        .from('team_members')
        .select('team_id')
        .single();

      if (teamData) {
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('id, full_name');

        if (error) throw error;
        if (profiles) {
          setTeamMembers(profiles);
        }
      }
    } catch (error: any) {
      console.error('Error loading team members:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const taskData = {
        ...formData,
        created_by: user.id,
        assignee_id: formData.assignee_id || user.id
      };

      if (isEditing && selectedTask) {
        const { data, error } = await supabase
          .from('tasks')
          .update(taskData)
          .eq('id', selectedTask.id)
          .select(`
            *,
            organisation:organisations(*),
            contact:contacts(*),
            assignee:profiles(*)
          `)
          .single();

        if (error) throw error;
        if (data) {
          setTasks(prevTasks =>
            prevTasks.map(task =>
              task.id === selectedTask.id ? data : task
            )
          );
          setSelectedTask(data);
        }
      } else {
        const { data, error } = await supabase
          .from('tasks')
          .insert([taskData])
          .select(`
            *,
            organisation:organisations(*),
            contact:contacts(*),
            assignee:profiles(*)
          `)
          .single();

        if (error) throw error;
        if (data) {
          setTasks(prevTasks => [...prevTasks, data]);
        }
      }

      setFormData({
        title: '',
        description: '',
        due_date: '',
        organisation_id: '',
        contact_id: '',
        assignee_id: '',
        status: 'pending'
      });
      setIsCreating(false);
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error saving task:', error);
      setError(error.message);
    }
  }

  async function handleUpdateTask(taskId: string, updates: Partial<Task>) {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select(`
          *,
          organisation:organisations(*),
          contact:contacts(*),
          assignee:profiles(*)
        `)
        .single();

      if (error) throw error;
      if (data) {
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === taskId ? data : task
          )
        );
        setSelectedTask(data);
      }
    } catch (error: any) {
      console.error('Error updating task:', error);
      setError(error.message);
    }
  }

  async function handleDeleteTask(taskId: string) {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      setShowPanel(false);
      setSelectedTask(null);
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    } catch (error: any) {
      console.error('Error deleting task:', error);
      setError(error.message);
    }
  }

  function confirmDeleteTask(task: Task) {
    requestConfirmation({
      title: 'Delete Task',
      message: `Are you sure you want to delete "${task.title}"? This action cannot be undone.`,
      onConfirm: async () => {
        await handleDeleteTask(task.id);
      }
    });
  }

  function handleEditTask(task: Task) {
    setFormData({
      title: task.title,
      description: task.description || '',
      due_date: task.due_date || '',
      organisation_id: task.organisation_id || '',
      contact_id: task.contact_id || '',
      assignee_id: task.assignee_id || '',
      status: task.status
    });
    setIsEditing(true);
    setIsCreating(true);
    setShowPanel(false);
  }

  function getStatusColor(status: Task['status']) {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  function handleViewTask(task: Task) {
    setSelectedTask(task);
    setShowPanel(true);
  }

  const now = new Date();
  const overdueTasks = tasks.filter(
    task => task.status !== 'completed' && task.due_date && new Date(task.due_date) < now
  );
  const upcomingTasks = tasks.filter(
    task => task.status !== 'completed' && (!task.due_date || new Date(task.due_date) >= now)
  );

  const renderTask = (task: Task) => (
    <div className="flex items-start justify-between w-full">
      <div className="flex-1 min-w-0 pr-4">
        <h3 className="text-lg font-medium text-gray-900 truncate">{task.title}</h3>
        {task.description && (
          <p className="mt-1 text-sm text-gray-600 line-clamp-2">{task.description}</p>
        )}
        <div className="mt-2 flex flex-wrap gap-2 text-sm text-gray-500">
          {task.due_date && (
            <span className="flex items-center">
              <Calendar className="h-4 w-4 mr-1 flex-shrink-0" />
              {new Date(task.due_date).toLocaleDateString()}
            </span>
          )}
          {task.organisation && (
            <span className="flex items-center">
              <Building2 className="h-4 w-4 mr-1 flex-shrink-0" />
              <span className="truncate">{task.organisation.name}</span>
            </span>
          )}
          {task.contact && (
            <span className="flex items-center">
              <UserIcon className="h-4 w-4 mr-1 flex-shrink-0" />
              <span className="truncate">{task.contact.name}</span>
            </span>
          )}
          {task.assignee && (
            <span className="flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
              <UserIcon className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="truncate text-xs">
                {task.assignee.full_name}
              </span>
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-2 flex-shrink-0">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
          {task.status.replace('_', ' ')}
        </span>
        <ChevronRight className="h-5 w-5 text-gray-400" />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="relative h-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Tasks</h1>
          <button
            onClick={() => {
              setIsCreating(true);
              setIsEditing(false);
              setFormData({
                title: '',
                description: '',
                due_date: '',
                organisation_id: '',
                contact_id: '',
                assignee_id: '',
                status: 'pending'
              });
            }}
            className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-[#6f5192] text-white rounded-lg hover:bg-[#5d4379] focus:outline-none focus:ring-2 focus:ring-[#6f5192] focus:ring-offset-2"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Task
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <SlidePanel
          isOpen={isCreating}
          onClose={() => {
            setIsCreating(false);
            setIsEditing(false);
          }}
          title={isEditing ? 'Edit Task' : 'Add Task'}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-group">
              <label htmlFor="title" className="form-label required">
                Title
              </label>
              <input
                type="text"
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="description" className="form-label">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="form-textarea"
              />
            </div>

            <div className="form-group">
              <label htmlFor="due_date" className="form-label">
                Due Date
              </label>
              <input
                type="datetime-local"
                id="due_date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="organisation_id" className="form-label">
                Organisation
              </label>
              <select
                id="organisation_id"
                value={formData.organisation_id}
                onChange={(e) => setFormData({ ...formData, organisation_id: e.target.value })}
                className="form-select"
              >
                <option value="">Select an organisation</option>
                {organisations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="contact_id" className="form-label">
                Contact
              </label>
              <select
                id="contact_id"
                value={formData.contact_id}
                onChange={(e) => setFormData({ ...formData, contact_id: e.target.value })}
                className="form-select"
              >
                <option value="">Select a contact</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="assignee_id" className="form-label">
                Assignee
              </label>
              <select
                id="assignee_id"
                value={formData.assignee_id}
                onChange={(e) => setFormData({ ...formData, assignee_id: e.target.value })}
                className="form-select"
              >
                <option value="">Assign to me</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="status" className="form-label">
                Status
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Task['status'] })}
                className="form-select"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="sticky bottom-0 bg-white pt-6 pb-6 -mx-6 px-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setIsEditing(false);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {isEditing ? 'Save Changes' : 'Create Task'}
              </button>
            </div>
          </form>
        </SlidePanel>

        {selectedTask && (
          <SlidePanel
            isOpen={showPanel}
            onClose={() => {
              setShowPanel(false);
              setSelectedTask(null);
            }}
            title={selectedTask.title}
          >
            <div className="space-y-6">
              {selectedTask.description && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Description</h3>
                  <p className="mt-2 text-gray-900 whitespace-pre-wrap">{selectedTask.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                {selectedTask.due_date && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Due Date</h3>
                    <p className="mt-2 text-gray-900 flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(selectedTask.due_date).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {selectedTask.assignee && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Assignee</h3>
                    <p className="mt-2 text-gray-900 flex items-center">
                      <UserIcon className="h-4 w-4 mr-2" />
                      {selectedTask.assignee.full_name}
                    </p>
                  </div>
                )}
              </div>

              {selectedTask.organisation && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Organisation</h3>
                  <p className="mt-2 text-gray-900 flex items-center">
                    <Building2 className="h-4 w-4 mr-2" />
                    {selectedTask.organisation.name}
                  </p>
                </div>
              )}

              {selectedTask.contact && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Contact</h3>
                  <p className="mt-2 text-gray-900 flex items-center">
                    <UserIcon className="h-4 w-4 mr-2" />
                    {selectedTask.contact.name}
                  </p>
                </div>
              )}

              <div className="sticky bottom-0 bg-white pt-6 pb-6 -mx-6 px-6 border-t border-gray-200 flex justify-between">
                <button
                  onClick={() => confirmDeleteTask(selectedTask)}
                  className="px-4 py-2 text-red-600 hover:text-red-700 focus:outline-none"
                >
                  Delete Task
                </button>
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleEditTask(selectedTask)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      const newStatus = selectedTask.status === 'completed'
                        ? 'pending'
                        : selectedTask.status === 'in_progress'
                        ? 'completed'
                        : 'in_progress';
                      
                      handleUpdateTask(selectedTask.id, { status: newStatus });
                    }}
                    className={`px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      selectedTask.status === 'completed'
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500'
                        : selectedTask.status === 'in_progress'
                        ? 'bg-green-100 text-green-700 hover:bg-green-200 focus:ring-green-500'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200 focus:ring-blue-500'
                    }`}
                  >
                    {selectedTask.status === 'completed'
                      ? 'Reopen'
                      : selectedTask.status === 'in_progress'
                      ? 'Complete'
                      : 'Start'}
                  </button>
                </div>
              </div>
            </div>
          </SlidePanel>
        )}

        {overdueTasks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-red-600 mb-4">Overdue Tasks</h2>
            <div className="space-y-4">
              {overdueTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleViewTask(task)}
                  className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer border-l-4 border-red-500"
                >
                  {renderTask(task)}
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Upcoming Tasks</h2>
          <div className="space-y-4">
            {upcomingTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => handleViewTask(task)}
                className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              >
                {renderTask(task)}
              </div>
            ))}
            {upcomingTasks.length === 0 && (
              <p className="text-gray-500">No upcoming tasks</p>
            )}
          </div>
        </div>

        {confirmation && (
          <DeleteConfirmationModal
            {...confirmation}
            onCancel={cancelConfirmation}
          />
        )}
      </div>
    </PageTransition>
  );
}

export default Tasks;