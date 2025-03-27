import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, X, User, Mail, Phone, Building2, Calendar, MessageSquare, Trash2, Edit, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import type { Contact, ContactUpdate, Organisation, Task } from '../lib/types';
import PageTransition from '../components/PageTransition';
import { useDeleteConfirmation } from '../hooks/useDeleteConfirmation';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import { DetailPanel } from '../components/DetailPanel';
import { FormPanel } from '../components/FormPanel';
import { FormField } from '../components/FormField';
import { CollapsibleSection } from '../components/CollapsibleSection';

export function Contacts() {
  const location = useLocation();
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<(Contact & { tasks?: Task[] })[]>([]);
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<(Contact & { tasks?: Task[] }) | null>(null);
  const [contactUpdates, setContactUpdates] = useState<ContactUpdate[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingUpdate, setIsAddingUpdate] = useState(false);
  const [error, setError] = useState('');
  const [teamId, setTeamId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    organisation_id: '',
    current_status: ''
  });
  const [updateData, setUpdateData] = useState({
    type: 'other' as ContactUpdate['type'],
    content: ''
  });

  const { confirmation, requestConfirmation, cancelConfirmation } = useDeleteConfirmation();

  useEffect(() => {
    loadContacts();
    loadOrganisations();
    loadTeamId();

    const handleAddModal = (e: CustomEvent) => {
      if (e.detail.type === 'contact') {
        setIsCreating(true);
        setIsEditing(false);
        setFormData({
          name: '',
          email: '',
          phone: '',
          role: '',
          organisation_id: '',
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
    const state = location.state as { selectedContactId?: string };
    if (state?.selectedContactId) {
      const contact = contacts.find(c => c.id === state.selectedContactId);
      if (contact) {
        handleContactClick(contact);
      }
    }
  }, [location.state, contacts]);

  useEffect(() => {
    if (selectedContact) {
      loadContactUpdates(selectedContact.id);
    }
  }, [selectedContact]);

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

  async function loadContacts() {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select(`
          *,
          organisation:organisations(*),
          tasks(*)
        `)
        .order('name');

      if (error) throw error;
      setContacts(data || []);
    } catch (error: any) {
      console.error('Error loading contacts:', error);
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

  async function loadContactUpdates(contactId: string) {
    try {
      const { data, error } = await supabase
        .from('contact_updates')
        .select(`
          *,
          creator:profiles(
            full_name
          )
        `)
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContactUpdates(data || []);
    } catch (error: any) {
      console.error('Error loading contact updates:', error);
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

      if (isEditing && selectedContact) {
        const { error } = await supabase
          .from('contacts')
          .update(formData)
          .eq('id', selectedContact.id);

        if (error) throw error;

        setSelectedContact({
          ...selectedContact,
          ...formData,
          organisation: formData.organisation_id ? 
            organisations.find(org => org.id === formData.organisation_id) : 
            null
        });

        setContacts(contacts => 
          contacts.map(contact => 
            contact.id === selectedContact.id ? 
            {
              ...contact,
              ...formData,
              organisation: formData.organisation_id ? 
                organisations.find(org => org.id === formData.organisation_id) : 
                null
            } : contact
          )
        );
      } else {
        const contactData = {
          ...formData,
          team_id: teamId,
          created_by: user.id
        };

        const { data, error } = await supabase
          .from('contacts')
          .insert([contactData])
          .select(`
            *,
            organisation:organisations(*),
            tasks(*)
          `)
          .single();

        if (error) throw error;
        if (data) {
          setContacts(contacts => [...contacts, data]);
        }
      }

      setFormData({
        name: '',
        email: '',
        phone: '',
        role: '',
        organisation_id: '',
        current_status: ''
      });
      setIsCreating(false);
      setIsEditing(false);
      setShowPanel(false);
    } catch (error: any) {
      console.error('Error saving contact:', error);
      setError(error.message);
    }
  }

  async function handleAddUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedContact) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const newUpdate = {
        contact_id: selectedContact.id,
        type: updateData.type,
        content: updateData.content,
        created_by: user.id
      };

      const { data, error } = await supabase
        .from('contact_updates')
        .insert([newUpdate])
        .select(`
          *,
          creator:profiles(
            full_name
          )
        `)
        .single();

      if (error) throw error;
      if (data) {
        setContactUpdates(updates => [data, ...updates]);
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

  async function handleDeleteContact(contactId: string) {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId);

      if (error) throw error;

      handleClosePanel();
      setContacts(contacts => contacts.filter(contact => contact.id !== contactId));
    } catch (error: any) {
      console.error('Error deleting contact:', error);
      setError(error.message);
    }
  }

  function confirmDeleteContact(contact: Contact) {
    requestConfirmation({
      title: 'Delete Contact',
      message: `Are you sure you want to delete "${contact.name}"? This will also remove all associated tasks and updates. This action cannot be undone.`,
      onConfirm: async () => {
        await handleDeleteContact(contact.id);
      }
    });
  }

  function handleEditContact(contact: Contact) {
    setFormData({
      name: contact.name,
      email: contact.email || '',
      phone: contact.phone || '',
      role: contact.role || '',
      organisation_id: contact.organisation_id || '',
      current_status: contact.current_status || ''
    });
    setSelectedContact(contact);
    setIsEditing(true);
  }

  async function trackView(contactId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('recent_views')
        .upsert({
          user_id: user.id,
          item_type: 'contact',
          item_id: contactId,
          viewed_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,item_type,item_id'
        });
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  }

  const handleContactClick = (contact: Contact & { tasks?: Task[] }) => {
    setSelectedContact(contact);
    setShowPanel(true);
    trackView(contact.id);
  };

  const handleClosePanel = () => {
    setShowPanel(false);
    setSelectedContact(null);
    setIsEditing(false);
    navigate('.', { replace: true, state: {} });
  };

  const renderContact = (contact: Contact & { tasks?: Task[] }, index: number) => (
    <motion.div
      key={contact.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.15,
        ease: [0.4, 0, 0.2, 1]
      }}
      onClick={() => handleContactClick(contact)}
      className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex-1 min-w-0 pr-4">
          <h3 className="text-lg font-medium text-gray-900 truncate">{contact.name}</h3>
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
          {contact.organisation && (
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <Building2 className="h-4 w-4 mr-2" />
              {contact.organisation.name}
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEditContact(contact);
            }}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <Edit className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              confirmDeleteContact(contact);
            }}
            className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100"
          >
            <Trash2 className="h-5 w-5" />
          </button>
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </div>
      </div>
    </motion.div>
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
          <h1 className="text-2xl font-semibold text-gray-800">Contacts</h1>
          <button
            onClick={() => {
              setIsCreating(true);
              setIsEditing(false);
              setFormData({
                name: '',
                email: '',
                phone: '',
                role: '',
                organisation_id: '',
                current_status: ''
              });
            }}
            className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-[#6f5192] text-white rounded-lg hover:bg-[#5d4379] focus:outline-none focus:ring-2 focus:ring-[#6f5192] focus:ring-offset-2"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Contact
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {contacts.map((contact, index) => renderContact(contact, index))}
          {contacts.length === 0 && (
            <p className="text-center text-gray-500 py-8">
              No contacts found. Click "Add Contact" to create one.
            </p>
          )}
        </div>

        <FormPanel
          isOpen={isCreating && !isEditing}
          onClose={() => {
            setIsCreating(false);
            setIsEditing(false);
          }}
          title="Add Contact"
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

            <FormField label="Email">
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="form-input"
              />
            </FormField>

            <FormField label="Phone">
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="form-input"
              />
            </FormField>

            <FormField label="Role">
              <input
                type="text"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="form-input"
              />
            </FormField>

            <FormField label="Organisation">
              <select
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

        {selectedContact && (
          <>
            <DetailPanel
              isOpen={showPanel && !isEditing}
              onClose={handleClosePanel}
              title={selectedContact.name}
              actions={
                <>
                  <button
                    onClick={() => handleEditContact(selectedContact)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => confirmDeleteContact(selectedContact)}
                    className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </>
              }
            >
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  {selectedContact.email && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Email</h3>
                      <a
                        href={`mailto:${selectedContact.email}`}
                        className="mt-2 text-gray-900 flex items-center hover:text-[#6f5192]"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        {selectedContact.email}
                      </a>
                    </div>
                  )}
                  {selectedContact.phone && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                      <a
                        href={`tel:${selectedContact.phone}`}
                        className="mt-2 text-gray-900 flex items-center hover:text-[#6f5192]"
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        {selectedContact.phone}
                      </a>
                    </div>
                  )}
                </div>

                {selectedContact.role && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Role</h3>
                    <p className="mt-2 text-gray-900">{selectedContact.role}</p>
                  </div>
                )}

                {selectedContact.organisation && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Organisation</h3>
                    <div className="mt-2 flex items-center text-gray-900">
                      <Building2 className="h-4 w-4 mr-2" />
                      {selectedContact.organisation.name}
                    </div>
                  </div>
                )}

                {selectedContact.current_status && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Current Status</h3>
                    <p className="mt-2 text-gray-900">{selectedContact.current_status}</p>
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
                    {contactUpdates.map((update) => (
                      <div
                        key={update.id}
                        className="bg-gray-50 p-4 rounded-lg"
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
                      </div>
                    ))}
                    {contactUpdates.length === 0 && (
                      <p className="text-gray-500">No updates yet</p>
                    )}
                  </div>
                </CollapsibleSection>

                {selectedContact.tasks && selectedContact.tasks.length > 0 && (
                  <CollapsibleSection title="Tasks">
                    <div className="space-y-4">
                      {selectedContact.tasks.map((task) => (
                        <div
                          key={task.id}
                          className="bg-gray-50 p-4 rounded-lg"
                        >
                          <h4 className="font-medium text-gray-900">{task.title}</h4>
                          {task.description && (
                            <p className="mt-1 text-sm text-gray-600">{task.description}</p>
                          )}
                          {task.due_date && (
                            <div className="mt-2 flex items-center text-sm text-gray-500">
                              <Calendar className="h-4 w-4 mr-1" />
                              Due: {new Date(task.due_date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CollapsibleSection>
                )}
              </div>
            </DetailPanel>

            <FormPanel
              isOpen={isEditing}
              onClose={() => setIsEditing(false)}
              title="Edit Contact"
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

                <FormField label="Email">
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="form-input"
                  />
                </FormField>

                <FormField label="Phone">
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="form-input"
                  />
                </FormField>

                <FormField label="Role">
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="form-input"
                  />
                </FormField>

                <FormField label="Organisation">
                  <select
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
          </>
        )}

        {isAddingUpdate && selectedContact && (
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
                        onChange={(e) => setUpdateData({ ...updateData, type: e.target.value as ContactUpdate['type'] })}
                        className="form-select"
                      >
                        <option value="email">Email</option>
                        <option value="phone">Phone</option>
                        <option value="meeting">Meeting</option>
                        <option value="event">Event</option>
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
      </div>
    </PageTransition>
  );
}

export default Contacts;