import React, { useState } from 'react';
import { Calendar, Building2, User, ExternalLink, Edit, Trash2, X } from 'lucide-react';
import { Task } from '../lib/types';
import { ViewPanel } from './ViewPanel';
import { FormPanel } from './FormPanel';
import { FormField } from './FormField';
import { useDeleteConfirmation } from '../hooks/useDeleteConfirmation';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { supabase } from '../lib/supabase';

interface TaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
}

export function TaskModal({ task, isOpen, onClose, onUpdate, onDelete }: TaskModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    organisation_id: '',
    contact_id: '',
    assignee_id: '',
    status: '' as Task['status']
  });
  const [error, setError] = useState('');
  const { confirmation, requestConfirmation, cancelConfirmation } = useDeleteConfirmation();

  if (!task) return null;

  const handleEdit = () => {
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const { data, error: updateError } = await supabase
        .from('tasks')
        .update(formData)
        .eq('id', task.id)
        .select(`
          *,
          organisation:organisations(*),
          contact:contacts(*),
          links:task_links(*),
          assignee:profiles(*)
        `)
        .single();

      if (updateError) throw updateError;
      if (data) {
        onUpdate?.(data);
        setIsEditing(false);
      }
    } catch (error: any) {
      console.error('Error updating task:', error);
      setError(error.message);
    }
  };

  const handleDelete = () => {
    requestConfirmation({
      title: 'Delete Task',
      message: `Are you sure you want to delete "${task.title}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          const { error: deleteError } = await supabase
            .from('tasks')
            .delete()
            .eq('id', task.id);

          if (deleteError) throw deleteError;
          onDelete?.(task.id);
          onClose();
        } catch (error: any) {
          console.error('Error deleting task:', error);
          setError(error.message);
        }
      }
    });
  };

  const handleStatusChange = async (newStatus: Task['status']) => {
    try {
      const { data, error: updateError } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', task.id)
        .select(`
          *,
          organisation:organisations(*),
          contact:contacts(*),
          links:task_links(*),
          assignee:profiles(*)
        `)
        .single();

      if (updateError) throw updateError;
      if (data) {
        onUpdate?.(data);
      }
    } catch (error: any) {
      console.error('Error updating task status:', error);
      setError(error.message);
    }
  };

  if (isEditing) {
    return (
      <FormPanel
        isOpen={isOpen}
        onClose={() => {
          setIsEditing(false);
          setError('');
        }}
        title="Edit Task"
        onSubmit={handleSubmit}
      >
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <FormField label="Title" required>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="form-input"
              required
            />
          </FormField>

          <FormField label="Description">
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="form-textarea"
            />
          </FormField>

          <FormField label="Due Date">
            <input
              type="datetime-local"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="form-input"
            />
          </FormField>

          <FormField label="Status">
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as Task['status'] })}
              className="form-select"
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </FormField>
        </div>
      </FormPanel>
    );
  }

  return (
    <>
      <ViewPanel
        isOpen={isOpen}
        onClose={onClose}
        title={task.title}
        actions={
          <>
            <button
              onClick={handleEdit}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <Edit className="h-5 w-5" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </>
        }
      >
        <div className="space-y-6">
          {error && (
            <div className="p-4 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {task.description && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Description</h3>
              <p className="mt-2 text-gray-900 whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            {task.due_date && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Due Date</h3>
                <p className="mt-2 text-gray-900 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  {new Date(task.due_date).toLocaleDateString()}
                </p>
              </div>
            )}

            {task.assignee && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Assignee</h3>
                <p className="mt-2 text-gray-900 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  {task.assignee.full_name}
                </p>
              </div>
            )}
          </div>

          {task.organisation && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Organisation</h3>
              <p className="mt-2 text-gray-900 flex items-center">
                <Building2 className="h-4 w-4 mr-2" />
                {task.organisation.name}
              </p>
            </div>
          )}

          {task.contact && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Contact</h3>
              <p className="mt-2 text-gray-900 flex items-center">
                <User className="h-4 w-4 mr-2" />
                {task.contact.name}
              </p>
            </div>
          )}

          {task.links && task.links.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Links</h3>
              <div className="mt-2 space-y-2">
                {task.links.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 min-w-0">
                        <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span className="text-blue-600 truncate">
                          {link.title || link.url}
                        </span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="sticky bottom-0 bg-white pt-6 pb-6 -mx-6 px-6 border-t border-gray-200 flex justify-end space-x-3">
            <button
              onClick={() => {
                const newStatus = task.status === 'completed'
                  ? 'pending'
                  : task.status === 'in_progress'
                  ? 'completed'
                  : 'in_progress';
                
                handleStatusChange(newStatus);
              }}
              className={`px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                task.status === 'completed'
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500'
                  : task.status === 'in_progress'
                  ? 'bg-green-100 text-green-700 hover:bg-green-200 focus:ring-green-500'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200 focus:ring-blue-500'
              }`}
            >
              {task.status === 'completed'
                ? 'Reopen'
                : task.status === 'in_progress'
                ? 'Complete'
                : 'Start'}
            </button>
          </div>
        </div>
      </ViewPanel>

      {confirmation && (
        <DeleteConfirmationModal
          {...confirmation}
          onCancel={cancelConfirmation}
        />
      )}
    </>
  );
}