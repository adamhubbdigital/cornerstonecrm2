import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Building2, Users, CheckSquare, PieChart, HelpCircle, AlertCircle, ChevronRight, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Task, User, CalendarEvent } from '../lib/types';
import PageTransition from '../components/PageTransition';
import { motion } from 'framer-motion';

const shortcuts = [
  { path: '/organisations', label: 'Organisations', icon: Building2, color: 'bg-exodus-fruit' },
  { path: '/contacts', label: 'Contacts', icon: Users, color: 'bg-fade-green' },
  { path: '/tasks', label: 'Tasks', icon: CheckSquare, color: 'bg-orange-ville' },
  { path: '/calendar', label: 'Calendar', icon: Calendar, color: 'bg-prunus-avium' },
  { path: '/reports', label: 'Reports', icon: PieChart, color: 'bg-mint-leaf' },
  { path: '/help', label: 'Help', icon: HelpCircle, color: 'bg-american-river', mobileOnly: true }
];

export function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user as User);
      }

      const now = new Date().toISOString();

      // Get overdue tasks
      const { data: overdue, error: overdueError } = await supabase
        .from('tasks')
        .select(`
          *,
          organisation:organisations(name),
          contact:contacts(name),
          assignee:profiles(id, full_name)
        `)
        .eq('status', 'pending')
        .lt('due_date', now)
        .order('due_date', { ascending: true });

      if (overdueError) throw overdueError;
      setOverdueTasks(overdue || []);

      // Get upcoming tasks
      const { data: upcoming, error: upcomingError } = await supabase
        .from('tasks')
        .select(`
          *,
          organisation:organisations(name),
          contact:contacts(name),
          assignee:profiles(id, full_name)
        `)
        .eq('status', 'pending')
        .gte('due_date', now)
        .order('due_date', { ascending: true })
        .limit(5);

      if (upcomingError) throw upcomingError;
      setUpcomingTasks(upcoming || []);

      // Get upcoming events
      const { data: events, error: eventsError } = await supabase
        .from('calendar_events')
        .select(`
          *,
          organisation:organisations(name),
          contact:contacts(name)
        `)
        .gte('start_time', now)
        .order('start_time', { ascending: true })
        .limit(5);

      if (eventsError) throw eventsError;
      setUpcomingEvents(events || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
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
      <div className="space-y-8">
        {/* Welcome Section */}
        <h1 className="text-2xl font-semibold text-main-text mt-5 leading-[1.7rem]">
          Hi {user?.user_metadata?.full_name || 'there'}, welcome to Cornerstone CRM
        </h1>

        {/* Shortcuts Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {shortcuts.map((shortcut, index) => {
            // Skip Help icon on desktop
            if (shortcut.mobileOnly && window.innerWidth >= 768) {
              return null;
            }

            const Icon = shortcut.icon;
            return (
              <motion.div
                key={shortcut.path}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.15,
                  ease: [0.4, 0, 0.2, 1]
                }}
              >
                <Link
                  to={shortcut.path}
                  className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-all transform hover:-translate-y-1 text-center group block h-full"
                >
                  <div className={`mx-auto w-12 h-12 rounded-lg ${shortcut.color} bg-opacity-10 flex items-center justify-center mb-3 group-hover:bg-opacity-20 transition-colors`}>
                    <Icon className={`h-6 w-6 ${shortcut.color.replace('bg-', 'text-')}`} />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900">{shortcut.label}</h3>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Overdue Tasks Alert */}
        {overdueTasks.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg overflow-hidden">
            <div className="p-4">
              <div className="flex items-center">
                <AlertCircle className="h-6 w-6 text-red-500 mr-3" />
                <h2 className="text-lg font-semibold text-red-700">
                  {overdueTasks.length} Overdue {overdueTasks.length === 1 ? 'Task' : 'Tasks'}
                </h2>
              </div>
              <div className="mt-4 space-y-3">
                {overdueTasks.map((task) => (
                  <Link
                    key={task.id}
                    to="/tasks"
                    className="block bg-white bg-opacity-50 hover:bg-opacity-75 p-4 rounded-lg transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-red-700 truncate">{task.title}</div>
                        <div className="mt-1 flex flex-wrap gap-3 text-sm text-red-600">
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1 flex-shrink-0" />
                            {new Date(task.due_date!).toLocaleDateString()}
                          </span>
                          {task.assignee && (
                            <span className="flex items-center">
                              <Users className="h-4 w-4 mr-1 flex-shrink-0" />
                              {task.assignee.full_name}
                            </span>
                          )}
                        </div>
                        {(task.organisation?.name || task.contact?.name) && (
                          <div className="mt-1 text-sm text-red-600 truncate">
                            {task.organisation?.name}
                            {task.organisation?.name && task.contact?.name && ' • '}
                            {task.contact?.name}
                          </div>
                        )}
                      </div>
                      <ChevronRight className="h-5 w-5 text-red-400 flex-shrink-0 ml-4" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Upcoming Tasks */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <CheckSquare className="h-5 w-5 mr-2 text-orange-ville" />
                Upcoming Tasks
              </h2>
              <Link to="/tasks" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                View all
              </Link>
            </div>
            
            {upcomingTasks.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No upcoming tasks</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {upcomingTasks.map((task) => (
                  <Link
                    key={task.id}
                    to="/tasks"
                    className="block hover:bg-gray-50 -mx-6 px-6 py-4 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{task.title}</h3>
                        <div className="mt-1 flex flex-wrap gap-3 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1 flex-shrink-0" />
                            {new Date(task.due_date!).toLocaleDateString()}
                          </span>
                          {task.assignee && (
                            <span className="flex items-center">
                              <Users className="h-4 w-4 mr-1 flex-shrink-0" />
                              {task.assignee.full_name}
                            </span>
                          )}
                        </div>
                        {(task.organisation?.name || task.contact?.name) && (
                          <div className="mt-1 text-sm text-gray-500 truncate">
                            {task.organisation?.name}
                            {task.organisation?.name && task.contact?.name && ' • '}
                            {task.contact?.name}
                          </div>
                        )}
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0 ml-4" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Events */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-prunus-avium" />
                Upcoming Events
              </h2>
              <Link to="/calendar" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                View all
              </Link>
            </div>
            
            {upcomingEvents.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No upcoming events</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {upcomingEvents.map((event) => (
                  <Link
                    key={event.id}
                    to="/calendar"
                    className="block hover:bg-gray-50 -mx-6 px-6 py-4 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{event.title}</h3>
                        <div className="mt-1 flex flex-wrap gap-3 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1 flex-shrink-0" />
                            {new Date(event.start_time).toLocaleString()}
                          </span>
                        </div>
                        {(event.organisation?.name || event.contact?.name) && (
                          <div className="mt-1 text-sm text-gray-500 truncate">
                            {event.organisation?.name}
                            {event.organisation?.name && event.contact?.name && ' • '}
                            {event.contact?.name}
                          </div>
                        )}
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0 ml-4" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

export { Dashboard as default };