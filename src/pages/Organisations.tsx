import React, { useEffect, useState } from 'react';
import { Plus, X, Link as LinkIcon, Calendar, Building2, User, ExternalLink, Trash2, Edit, ChevronRight, MessageSquare, Mail, Phone } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import type { Organisation, Contact, Task, OrganisationUpdate } from '../lib/types';
import PageTransition from '../components/PageTransition';
import { useDeleteConfirmation } from '../hooks/useDeleteConfirmation';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import { ViewPanel } from '../components/ViewPanel';
import { FormPanel } from '../components/FormPanel';
import { FormField } from '../components/FormField';
import { CollapsibleSection } from '../components/CollapsibleSection';
import { TaskModal } from '../components/TaskModal';

export function Organisations() {
  const navigate = useNavigate();
  const location = useLocation();
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrganisation, setSelectedOrganisation] = useState<Organisation | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingUpdate, setIsAddingUpdate] = useState(false);
  const [error, setError] = useState('');
  const [teamId, setTeamId] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [updates, setUpdates] = useState<OrganisationUpdate[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website: '',
    current_status: ''
  });
  const [updateData, setUpdateData] = useState({
    type: 'other' as OrganisationUpdate['type'],
    content: ''
  });

  const { confirmation, requestConfirmation, cancelConfirmation } = useDeleteConfirmation();

  const handleContactClick = (e: React.MouseEvent, contact: Contact) => {
    e.stopPropagation();
    navigate('/contacts', { state: { selectedContactId: contact.id } });
  };

  useEffect(() => {
    loadOrganisations();
    loadTeamId();

    const handleAddModal = (e: CustomEvent) => {
      if (e.detail.type === 'organisation') {
        setIsCreating(true);
        setIsEditing(false);
        setFormData({
          name: '',
          description: '',
          website: '',
          current_status: ''
        });
      }
    };

    window.addEventListener('openAddModal', handleAddModal as EventListener);

    return () => {
      window.removeEventListener('openAddModal', handleAddModal as EventListener);
    };
  }, []);

  useEffect(() => {
    const state = location.state as { selectedOrganisationId?: string };
    if (state?.selectedOrganisationId) {
      const organisation = organisations.find(org => org.id === state.selectedOrganisationId);
      if (organisation) {
        handleOrganisationClick(organisation);
      }
    }
  }, [location.state, organisations]);

  useEffect(() => {
    if (selectedOrganisation) {
      loadContacts(selectedOrganisation.id);
      loadTasks(selectedOrganisation.id);
      loadUpdates(selectedOrganisation.id);
    }
  }, [selectedOrganisation]);

  async function loadTeamId() {
    try {
      const { data: teamMembers, error } = await supabase
        .from('team_members')
        .select('team_id')
        .single();

      if (error) throw error;
      setTeamId(teamMembers.team_id);
    } catch (error: any) {
      console.error('Error loading team ID:', error);
      setError(error.message);
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
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadContacts(organisationId: string) {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('organisation_id', organisationId)
        .order('name');

      if (error) throw error;
      setContacts(data || []);
    } catch (error: any) {
      console.error('Error loading contacts:', error);
    }
  }

  async function loadTasks(organisationId: string) {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assignee:profiles(id, full_name)
        `)
        .eq('organisation_id', organisationId)
        .order('due_date', { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error: any) {
      console.error('Error loading tasks:', error);
    }
  }

  async function loadUpdates(organisationId: string) {
    try {
      const { data, error } = await supabase
        .from('organisation_updates')
        .select(`
          *,
          creator:profiles!organisation_updates_created_by_fkey(
            full_name
          )
        `)
        .eq('organisation_id', organisationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUpdates(data || []);
    } catch (error: any) {
      console.error('Error loading updates:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!teamId) {
      setError('No team ID found. Please ensure you are part of a team.');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      if (isEditing && selectedOrganisation) {
        const { error } = await supabase
          .from('organisations')
          .update(formData)
          .eq('id', selectedOrganisation.id);

        if (error) throw error;

        setSelectedOrganisation({
          ...selectedOrganisation,
          ...formData
        });

        setOrganisations(orgs => 
          orgs.map(org => 
            org.id === selectedOrganisation.id ? { ...org, ...formData } : org
          )
        );
      } else {
        const organisationData = {
          ...formData,
          team_id: teamId,
          created_by: user.id
        };

        const { data, error } = await supabase
          .from('organisations')
          .insert([organisationData])
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setOrganisations(orgs => [...orgs, data]);
        }
      }

      setFormData({
        name: '',
        description: '',
        website: '',
        current_status: ''
      });
      setIsCreating(false);
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error saving organisation:', error);
      setError(error.message);
    }
  }

  async function handleAddUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOrganisation) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const newUpdate = {
        organisation_id: selectedOrganisation.id,
        type: updateData.type,
        content: updateData.content,
        created_by: user.id
      };

      const { data, error } = await supabase
        .from('organisation_updates')
        .insert([newUpdate])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setUpdates(prevUpdates => [data, ...prevUpdates]);
      }

      setUpdateData({
        type: 'other',
        content: ''
      });
      setIsAddingUpdate(false);
    } catch (error: any) {
      console.error('Error adding update:', error);
      setError(error.message);
    }
  }

  async function handleDeleteUpdate(updateId: string) {
    try {
      const { error } = await supabase
        .from('organisation_updates')
        .delete()
        .eq('id', updateId);

      if (error) throw error;
      setUpdates(prevUpdates => prevUpdates.filter(update => update.id !== updateId));
    } catch (error: any) {
      console.error('Error deleting update:', error);
      setError(error.message);
    }
  }

  function confirmDeleteUpdate(update: OrganisationUpdate) {
    requestConfirmation({
      title: 'Delete Update',
      message: 'Are you sure you want to delete this update? This action cannot be undone.',
      onConfirm: async () => {
        await handleDeleteUpdate(update.id);
      }
    });
  }

  async function handleDeleteOrganisation(organisationId: string) {
    try {
      const { error } = await supabase
        .from('organisations')
        .delete()
        .eq('id', organisationId);

      if (error) throw error;

      setShowPanel(false);
      setSelectedOrganisation(null);
      setOrganisations(prevOrgs => prevOrgs.filter(org => org.id !== organisationId));
    } catch (error: any) {
      console.error('Error deleting organisation:', error);
      setError(error.message);
    }
  }

  function confirmDeleteOrganisation(org: Organisation) {
    requestConfirmation({
      title: 'Delete Organisation',
      message: `Are you sure you want to delete "${org.name}"? This will also remove all associated tasks and unlink all contacts. This action cannot be undone.`,
      onConfirm: async () => {
        await handleDeleteOrganisation(org.id);
      }
    });
  }

  function handleEditOrganisation(org: Organisation) {
    setFormData({
      name: org.name,
      description: org.description || '',
      website: org.website || '',
      current_status: org.current_status || ''
    });
    setIsEditing(true);
    setIsCreating(true);
    setShowPanel(false);
  }

  async function trackView(organisationId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('recent_views')
        .upsert({
          user_id: user.id,
          item_type: 'organisation',
          item_id: organisationId,
          viewed_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,item_type,item_id'
        });
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  }

  const handleOrganisationClick = (org: Organisation) => {
    setSelectedOrganisation(org);
    setShowPanel(true);
    trackView(org.id);
  };

  const renderOrganisation = (org: Organisation, index: number) => (
    <motion.div
      key={org.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.15,
        ease: [0.4, 0, 0.2, 1]
      }}
      onClick={() => handleOrganisationClick(org)}
      className="bg-white p-4 sm:p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex-1 min-w-0 pr-4">
          <h3 className="text-lg font-medium text-gray-900 truncate">{org.name}</h3>
          {org.website && (
            <a
              href={org.website}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="mt-1 text-sm text-[#6f5192] hover:text-[#5d4379] flex items-center overflow-hidden"
            >
              <LinkIcon className="h-4 w-4 flex-shrink-0 mr-1" />
              <span className="truncate">{new URL(org.website).hostname}</span>
            </a>
          )}
          {org.description && (
            <p className="mt-2 text-sm text-gray-600 line-clamp-2">{org.description}</p>
          )}
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEditOrganisation(org);
            }}
            className="p-2 text-gray-400 hover:text-[#6f5192] rounded-full hover:bg-gray-100"
          >
            <Edit className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              confirmDeleteOrganisation(org);
            }}
            className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100"
          >
            <Trash2 className="h-5 w-5" />
          </button>
          <ChevronRight className="h-5 w-5 text-[#6f5192]" />
        </div>
      </div>
    </motion.div>
  );

  const handleClosePanel = () => {
    setShowPanel(false);
    setSelectedOrganisation(null);
    navigate('.', { replace: true, state: {} });
  };

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
          <h1 className="text-2xl font-semibold text-gray-800">Organisations</h1>
          <button
            onClick={() => {
              setIsCreating(true);
              setIsEditing(false);
              setFormData({
                name: '',
                description: '',
                website: '',
                current_status: ''
              });
            }}
            className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-[#6f5192] text-white rounded-lg hover:bg-[#5d4379] focus:outline-none focus:ring-2 focus:ring-[#6f5192] focus:ring-offset-2"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Organisation
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {organisations.map((org, index) => renderOrganisation(org, index))}
          {organisations.length === 0 && (
            <p className="text-center text-gray-500 py-8">
              No organisations found. Click "Add Organisation" to create one.
            </p>
          )}
        </div>

        <FormPanel
          isOpen={isCreating}
          onClose={() => {
            setIsCreating(false);
            setIsEditing(false);
          }}
          title={isEditing ? 'Edit Organisation' : 'Add Organisation'}
          onSubmit={handleSubmit}
        >
          <div className="space-y-6">
            <FormField label="Name" required>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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

            <FormField label="Website">
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="form-input"
              />
            </FormField>

            <FormField label="Current Status">
              <textarea
                value={formData.current_status}
                onChange={(e) => setFormData({ ...formData, current_status: e.target.value })}
                rows={2}
                className="form-textarea"
              />
            </FormField>
          </div>
        </FormPanel>

        {selectedOrganisation && (
          <ViewPanel
            isOpen={showPanel}
            onClose={handleClosePanel}
            title={selectedOrganisation.name}
            actions={
              <>
                <button
                  onClick={() => handleEditOrganisation(selectedOrganisation)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                >
                  <Edit className="h-5 w-5" />
                </button>
                <button
                  onClick={() => confirmDeleteOrganisation(selectedOrganisation)}
                  className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </>
            }
          >
            <div className="space-y-6">
              {selectedOrganisation.description && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Description</h3>
                  <p className="mt-2 text-gray-900">{selectedOrganisation.description}</p>
                </div>
              )}

              {selectedOrganisation.website && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Website</h3>
                  <a
                    href={selectedOrganisation.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <LinkIcon className="h-4 w-4 mr-2" />
                    {selectedOrganisation.website}
                  </a>
                </div>
              )}

              {selectedOrganisation.current_status && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Current Status</h3>
                  <p className="mt-2 text-gray-900">{selectedOrganisation.current_status}</p>
                </div>
              )}

              <CollapsibleSection
                title="Updates"
                defaultExpanded={true}
                actions={
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsAddingUpdate(true);
                    }}
                    className="flex items-center justify-center w-36 px-3 py-1.5 bg-[#6f5192] text-white text-sm rounded-lg hover:bg-[#5d4379] focus:outline-none focus:ring-2 focus:ring-[#6f5192] focus:ring-offset-2"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Update
                  </button>
                }
              >
                <div className="space-y-4">
                  {updates.map((update) => (
                    <div
                      key={update.id}
                      className="bg-gray-50 p-4 rounded-lg group relative"
                    >
                      <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                        <MessageSquare className="h-4 w-4 text-[#bd4f9d]" />
                        <span className="capitalize">{update.type}</span>
                        <span>•</span>
                        <time>{new Date(update.created_at).toLocaleDateString()}</time>
                        {update.creator && (
                          <>
                            <span>•</span>
                            <span>{update.creator.full_name}</span>
                          </>
                        )}
                      </div>
                      <p className="text-gray-900">{update.content}</p>
                      
                      <button
                        onClick={() => confirmDeleteUpdate(update)}
                        className="absolute top-2 right-2 p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-white transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {updates.length === 0 && (
                    <p className="text-gray-500">No updates yet</p>
                  )}
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                title="Contacts"
                defaultExpanded={true}
                actions={
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle adding contact
                    }}
                    className="flex items-center justify-center w-36 px-3 py-1.5 bg-[#6f5192] text-white text-sm rounded-lg hover:bg-[#5d4379] focus:outline-none focus:ring-2 focus:ring-[#6f5192] focus:ring-offset-2"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Contact
                  </button>
                }
              >
                <div className="space-y-4">
                  {contacts.map((contact) => (
                    <div
                      key={contact.id}
                      onClick={(e) => handleContactClick(e, contact)}
                      className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group relative"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">{contact.name}</h4>
                          <ChevronRight className="h-5 w-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        {contact.role && (
                          <p className="text-sm text-gray-600">{contact.role}</p>
                        )}
                        <div className="mt-2 space-y-1">
                          {contact.email && (
                            <a
                              href={`mailto:${contact.email}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
                            >
                              <Mail className="h-4 w-4 mr-2" />
                              {contact.email}
                            </a>
                          )}
                          {contact.phone && (
                            <a
                              href={`tel:${contact.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
                            >
                              <Phone className="h-4 w-4 mr-2" />
                              {contact.phone}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {contacts.length === 0 && (
                    <p className="text-gray-500">No contacts added yet</p>
                  )}
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                title="Tasks"
                defaultExpanded={true}
                actions={
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle adding task
                    }}
                    className="flex items-center justify-center w-36 px-3 py-1.5 bg-[#6f5192] text-white text-sm rounded-lg hover:bg-[#5d4379] focus:outline-none focus:ring-2 focus:ring-[#6f5192] focus:ring-offset-2"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Task
                  </button>
                }
              >
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{task.title}</h4>
                          {task.description && (
                            <p className="mt-1 text-sm text-gray-600 line-clamp-2">{task.description}</p>
                          )}
                          <div className="mt-2 flex flex-wrap gap-2 text-sm text-gray-500">
                            {task.due_date && (
                              <span className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                {new Date(task.due_date).toLocaleDateString()}
                              </span>
                            )}
                            {task.assignee && (
                              <span className="flex items-center">
                                <User className="h-4 w-4 mr-1" />
                                {task.assignee.full_name}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0 ml-4" />
                      </div>
                    </div>
                  ))}
                  {tasks.length === 0 && (
                    <p className="text-gray-500">No tasks added yet</p>
                  )}
                </div>
              </CollapsibleSection>
            </div>
          </ViewPanel>
        )}

        {isAddingUpdate && selectedOrganisation && (
          <div className="modal-container">
            <div className="modal-content">
              <div className="modal-header">
                <h2 className="modal-title">Add Update</h2>
                <button
                  onClick={() => setIsAddingUpdate(false)}
                  className="modal-close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleAddUpdate}>
                <div className="modal-body">
                  <div className="space-y-4">
                    <FormField label="Type">
                      <select
                        value={updateData.type}
                        onChange={(e) => setUpdateData({ ...updateData, type: e.target.value as OrganisationUpdate['type'] })}
                        className="form-select"
                      >
                        <option value="meeting">Meeting</option>
                        <option value="event">Event</option>
                        <option value="status">Status</option>
                        <option value="other">Other</option>
                      </select>
                    </FormField>

                    <FormField label="Details" required>
                      <textarea
                        value={updateData.content}
                        onChange={(e) => setUpdateData({ ...updateData, content: e.target.value })}
                        rows={3}
                        className="form-textarea"
                        required
                      />
                    </FormField>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    onClick={() => setIsAddingUpdate(false)}
                    className="modal-cancel"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="modal-submit"
                  >
                    Add Update
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {confirmation && (
          <DeleteConfirmationModal
            {...confirmation}
            onCancel={cancelConfirmation}
          />
        )}

        <TaskModal
          task={selectedTask}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      </div>
    </PageTransition>
  );
}

export default Organisations;