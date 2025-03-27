export interface ContactUpdate {
  id: string;
  contact_id: string;
  type: 'email' | 'phone' | 'meeting' | 'event' | 'other';
  content: string;
  created_at: string;
  created_by: string;
  creator?: {
    full_name: string;
  };
}

export interface OrganisationUpdate {
  id: string;
  organisation_id: string;
  type: 'meeting' | 'event' | 'status' | 'other';
  content: string;
  created_at: string;
  created_by: string;
  creator?: {
    full_name: string;
  };
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  task_id?: string;
  team_id: string;
  start: Date;
  end: Date;
  creator?: {
    full_name: string;
  };
  task?: {
    title: string;
    description?: string;
  };
}