import React, { useEffect, useState } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer, ToolbarProps, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enGB } from 'date-fns/locale';
import { Plus, X, Calendar as CalendarIcon, Clock, User, Building2, ChevronLeft, ChevronRight, Trash2, Edit } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { CalendarEvent, Organisation, Contact } from '../lib/types';
import PageTransition from '../components/PageTransition';
import { FormPanel } from '../components/FormPanel';
import { FormField } from '../components/FormField';
import { useDeleteConfirmation } from '../hooks/useDeleteConfirmation';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import { ViewPanel } from '../components/ViewPanel';
import { useLocation } from 'react-router-dom';

import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'en-GB': enGB,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }), // Monday
  getDay,
  locales,
});

// Custom Event Component
const EventComponent = ({ event }: { event: CalendarEvent }) => (
  <div className="h-full">
    <div className="flex items-start">
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-white truncate">{event.title}</h4>
        {event.description && (
          <p className="text-xs text-white/80 truncate mt-0.5">{event.description}</p>
        )}
      </div>
    </div>
  </div>
);

// Custom Header Component
const CustomHeader = ({ label }: { label: string }) => (
  <div className="flex items-center justify-center py-2 font-medium text-gray-600">
    {label}
  </div>
);

// Custom Time Gutter Header
const TimeGutterHeader = () => (
  <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase">
    Time
  </div>
);

// Custom Time Slot Component
const TimeSlotWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="border-b border-gray-100">
    {children}
  </div>
);

// Custom Toolbar Component
const CustomToolbar = (props: ToolbarProps) => {
  const currentDate = new Date(props.date);
  const monthYear = format(currentDate, 'MMMM yyyy');
  const isMobile = window.innerWidth < 768;
  
  return (
    <div className="flex items-center justify-between p-6">
      <div className="flex items-center space-x-4">
        <h2 className="text-xl font-semibold text-gray-900">{monthYear}</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => props.onNavigate('PREV')}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => props.onNavigate('TODAY')}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 text-sm font-medium"
          >
            Today
          </button>
          <button
            onClick={() => props.onNavigate('NEXT')}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {!isMobile && (
        <div className="flex items-center space-x-2">
          <select
            value={props.view}
            onChange={(e) => props.onView(e.target.value as View)}
            className="form-select text-sm py-2.5 px-4 w-44 border-gray-200 rounded-lg bg-white hover:border-gray-300 focus:border-electron-blue focus:ring focus:ring-electron-blue focus:ring-opacity-20 transition-all duration-200 shadow-sm"
          >
            <option value="month">Month View</option>
            <option value="week">Week View</option>
            <option value="day">Day View</option>
            <option value="agenda">List View</option>
          </select>
        </div>
      )}
    </div>
  );
};

// Custom Agenda Header Component
const AgendaHeader = ({ date, label }: { date: Date; label: string }) => {
  // Add validation check for date
  const isValidDate = date instanceof Date && !isNaN(date.getTime());
  if (!isValidDate) {
    return null;
  }

  return (
    <div className="py-4 px-6 bg-white border-b border-gray-200 sticky top-0 z-10">
      <h3 className="text-lg font-semibold text-gray-900">
        {format(date, "EEEE, MMMM d, yyyy")}
      </h3>
    </div>
  );
};

// Custom Agenda Event Component
const AgendaEvent = ({ event }: { event: CalendarEvent }) => {
  const startTime = new Date(event.start_time);
  const endTime = new Date(event.end_time);
  const isMobile = window.innerWidth < 768;
  
  return (
    <div className="flex items-start py-4 px-6 hover:bg-gray-50 transition-colors cursor-pointer">
      {/* Time Column */}
      <div className="w-32 flex-shrink-0">
        <div className="text-sm font-medium text-gray-900">
          {format(startTime, 'h:mm a')}
        </div>
        <div className="text-sm text-gray-500">
          {format(endTime, 'h:mm a')}
        </div>
      </div>

      {/* Event Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="text-base font-medium text-gray-900">{event.title}</h4>
            {!isMobile && (
              <>
                {event.description && (
                  <p className="text-sm text-gray-600 line-clamp-2 mt-1">{event.description}</p>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  {event.organisation?.name && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 text-xs font-medium text-gray-700">
                      <Building2 className="h-3.5 w-3.5 mr-1" />
                      {event.organisation.name}
                    </span>
                  )}
                  {event.contact?.name && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 text-xs font-medium text-gray-700">
                      <User className="h-3.5 w-3.5 mr-1" />
                      {event.contact.name}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0 ml-4" />
        </div>
      </div>
    </div>
  );
};

export function Calendar() {
  const location = useLocation();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [teamId, setTeamId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    organisation_id: '',
    contact_id: ''
  });

  const { confirmation, requestConfirmation, cancelConfirmation } = useDeleteConfirmation();
  const isMobile = window.innerWidth < 768;

  useEffect(() => {
    loadEvents();
    loadOrganisations();
    loadContacts();
    loadTeamId();
  }, []);

  useEffect(() => {
    const state = location.state as { selectedEventId?: string };
    if (state?.selectedEventId && events.length > 0) {
      const event = events.find(e => e.id === state.selectedEventId);
      if (event) {
        handleViewEvent(event);
      }
    }
  }, [location.state, events]);

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

  async function loadEvents() {
    try {
      const { data, error: eventsError } = await supabase
        .from('calendar_events')
        .select(`
          *,
          creator:profiles!calendar_events_created_by_fkey(
            full_name
          ),
          organisation:organisations(
            name
          ),
          contact:contacts(
            name
          )
        `)
        .order('start_time', { ascending: true });

      if (eventsError) throw eventsError;

      const formattedEvents = data?.map(event => ({
        ...event,
        start: new Date(event.start_time),
        end: new Date(event.end_time)
      })) || [];

      setEvents(formattedEvents);
    } catch (error: any) {
      console.error('Error loading events:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadOrganisations() {
    try {
      const { data: organisations, error } = await supabase
        .from('organisations')
        .select('*')
        .order('name');

      if (error) throw error;
      setOrganisations(organisations || []);
    } catch (error: any) {
      console.error('Error loading organisations:', error);
    }
  }

  async function loadContacts() {
    try {
      const { data: contacts, error } = await supabase
        .from('contacts')
        .select('*')
        .order('name');

      if (error) throw error;
      setContacts(contacts || []);
    } catch (error: any) {
      console.error('Error loading contacts:', error);
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

      const eventData = {
        ...formData,
        team_id: teamId,
        created_by: user.id
      };

      if (isEditing && selectedEvent) {
        const { data, error } = await supabase
          .from('calendar_events')
          .update(eventData)
          .eq('id', selectedEvent.id)
          .select(`
            *,
            creator:profiles!calendar_events_created_by_fkey(
              full_name
            ),
            organisation:organisations(
              name
            ),
            contact:contacts(
              name
            )
          `)
          .single();

        if (error) throw error;
        if (data) {
          setEvents(events => events.map(event =>
            event.id === selectedEvent.id
              ? { ...data, start: new Date(data.start_time), end: new Date(data.end_time) }
              : event
          ));
        }
      } else {
        const { data, error } = await supabase
          .from('calendar_events')
          .insert([eventData])
          .select(`
            *,
            creator:profiles!calendar_events_created_by_fkey(
              full_name
            ),
            organisation:organisations(
              name
            ),
            contact:contacts(
              name
            )
          `)
          .single();

        if (error) throw error;
        if (data) {
          setEvents(events => [...events, {
            ...data,
            start: new Date(data.start_time),
            end: new Date(data.end_time)
          }]);
        }
      }

      setFormData({
        title: '',
        description: '',
        start_time: '',
        end_time: '',
        organisation_id: '',
        contact_id: ''
      });
      setIsCreating(false);
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error saving event:', error);
      setError(error.message);
    }
  }

  async function handleDeleteEvent(eventId: string) {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
      setEvents(events => events.filter(event => event.id !== eventId));
      setShowPanel(false);
    } catch (error: any) {
      console.error('Error deleting event:', error);
      setError(error.message);
    }
  }

  function confirmDeleteEvent(event: CalendarEvent) {
    requestConfirmation({
      title: 'Delete Event',
      message: `Are you sure you want to delete "${event.title}"? This action cannot be undone.`,
      onConfirm: async () => {
        await handleDeleteEvent(event.id);
      }
    });
  }

  function handleEditEvent(event: CalendarEvent) {
    setFormData({
      title: event.title,
      description: event.description || '',
      start_time: format(new Date(event.start_time), "yyyy-MM-dd'T'HH:mm"),
      end_time: format(new Date(event.end_time), "yyyy-MM-dd'T'HH:mm"),
      organisation_id: event.organisation_id || '',
      contact_id: event.contact_id || ''
    });
    setSelectedEvent(event);
    setIsEditing(true);
    setIsCreating(true);
    setShowPanel(false);
  }

  function handleViewEvent(event: CalendarEvent) {
    setSelectedEvent(event);
    setShowPanel(true);
  }

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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Calendar</h1>
          <button
            onClick={() => {
              setIsCreating(true);
              setIsEditing(false);
              setFormData({
                title: '',
                description: '',
                start_time: '',
                end_time: '',
                organisation_id: '',
                contact_id: ''
              });
            }}
            className="flex items-center px-4 py-2 bg-[#6f5192] text-white rounded-lg hover:bg-[#5d4379] focus:outline-none focus:ring-2 focus:ring-[#6f5192] focus:ring-offset-2"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Event
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm">
          <BigCalendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 'calc(100vh - 250px)' }}
            defaultView={isMobile ? 'agenda' : 'month'}
            views={isMobile ? { agenda: true } : {
              month: true,
              week: true,
              day: true,
              agenda: true
            }}
            tooltipAccessor={event => event.title}
            onSelectEvent={event => handleViewEvent(event)}
            components={{
              event: EventComponent,
              header: CustomHeader,
              timeGutterHeader: TimeGutterHeader,
              timeSlotWrapper: TimeSlotWrapper,
              toolbar: CustomToolbar,
              agenda: {
                event: AgendaEvent,
                date: AgendaHeader
              }
            }}
            dayPropGetter={() => ({
              className: 'bg-gray-50'
            })}
            messages={{
              agenda: 'List',
              allDay: 'All Day',
              next: 'Next',
              previous: 'Previous',
              today: 'Today',
              tomorrow: 'Tomorrow',
              yesterday: 'Yesterday'
            }}
            className="p-6"
          />
        </div>

        <FormPanel
          isOpen={isCreating}
          onClose={() => {
            setIsCreating(false);
            setIsEditing(false);
          }}
          title={isEditing ? 'Edit Event' : 'Add Event'}
          onSubmit={handleSubmit}
        >
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

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Start Time" required>
                <input
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="form-input"
                  required
                />
              </FormField>

              <FormField label="End Time" required>
                <input
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="form-input"
                  required
                />
              </FormField>
            </div>

            <FormField label="Organisation">
              <select
                value={formData.organisation_id}
                onChange={(e) => setFormData({ ...formData, organisation_id: e.target.value })}
                className="form-select"
              >
                <option value="">None</option>
                {organisations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Contact">
              <select
                value={formData.contact_id}
                onChange={(e) => setFormData({ ...formData, contact_id: e.target.value })}
                className="form-select"
              >
                <option value="">None</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
        </FormPanel>

        {selectedEvent && (
          <ViewPanel
            isOpen={showPanel}
            onClose={() => {
              setShowPanel(false);
              setSelectedEvent(null);
            }}
            title={selectedEvent.title}
            actions={
              <>
                <button
                  onClick={() => handleEditEvent(selectedEvent)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                >
                  <Edit className="h-5 w-5" />
                </button>
                <button
                  onClick={() => confirmDeleteEvent(selectedEvent)}
                  className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </>
            }
          >
            <div className="space-y-6">
              {selectedEvent.description && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Description</h3>
                  <p className="mt-2 text-gray-900 whitespace-pre-wrap">{selectedEvent.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Start Time</h3>
                  <p className="mt-2 text-gray-900 flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    {format(new Date(selectedEvent.start_time), 'PPp')}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">End Time</h3>
                  <p className="mt-2 text-gray-900 flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    {format(new Date(selectedEvent.end_time), 'PPp')}
                  </p>
                </div>
              </div>

              {selectedEvent.organisation && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Organisation</h3>
                  <p className="mt-2 text-gray-900 flex items-center">
                    <Building2 className="h-4 w-4 mr-2" />
                    {selectedEvent.organisation.name}
                  </p>
                </div>
              )}

              {selectedEvent.contact && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Contact</h3>
                  <p className="mt-2 text-gray-900 flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    {selectedEvent.contact.name}
                  </p>
                </div>
              )}
            </div>
          </ViewPanel>
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

export default Calendar;