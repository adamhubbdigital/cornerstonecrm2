import React, { useState } from 'react';
import { ChevronDown, Building2, Users, CheckSquare, Calendar, MessageSquare, FileText, Mail, Phone, Clock } from 'lucide-react';

interface FAQItem {
  id: string;
  title: string;
  icon: React.FC<{ className?: string }>;
  content: React.ReactNode;
}

export function Help() {
  const [openItem, setOpenItem] = useState<string | null>(null);

  const faqItems: FAQItem[] = [
    {
      id: 'add-organisation',
      title: 'How to add an Organisation',
      icon: Building2,
      content: (
        <div className="space-y-4">
          <p>To add a new organisation:</p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Click the <span className="font-semibold">Add</span> button in the top navigation</li>
            <li>Select <span className="font-semibold">Add Organisation</span></li>
            <li>Fill in the organisation details:
              <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                <li><span className="font-semibold">Name</span> (required)</li>
                <li><span className="font-semibold">Description</span></li>
                <li><span className="font-semibold">Website</span></li>
                <li><span className="font-semibold">Current Status</span></li>
              </ul>
            </li>
            <li>Click <span className="font-semibold">Create Organisation</span></li>
          </ol>
          <p className="text-sm text-gray-600 mt-4">
            After creating an organisation, you can add contacts, tasks, and updates associated with it.
          </p>
        </div>
      )
    },
    {
      id: 'add-contact',
      title: 'How to add a Contact',
      icon: Users,
      content: (
        <div className="space-y-4">
          <p>To add a new contact:</p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Click the <span className="font-semibold">Add</span> button in the top navigation</li>
            <li>Select <span className="font-semibold">Add Contact</span></li>
            <li>Fill in the contact details:
              <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                <li><span className="font-semibold">Name</span> (required)</li>
                <li><span className="font-semibold">Email</span></li>
                <li><span className="font-semibold">Phone</span></li>
                <li><span className="font-semibold">Role</span></li>
                <li><span className="font-semibold">Organisation</span></li>
                <li><span className="font-semibold">Current Status</span></li>
              </ul>
            </li>
            <li>Click <span className="font-semibold">Create Contact</span></li>
          </ol>
          <p className="text-sm text-gray-600 mt-4">
            You can link contacts to organisations and track all interactions through updates.
          </p>
        </div>
      )
    },
    {
      id: 'add-task',
      title: 'How to add a Task',
      icon: CheckSquare,
      content: (
        <div className="space-y-4">
          <p>To add a new task:</p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Click the <span className="font-semibold">Add</span> button in the top navigation</li>
            <li>Select <span className="font-semibold">Add Task</span></li>
            <li>Fill in the task details:
              <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                <li><span className="font-semibold">Title</span> (required)</li>
                <li><span className="font-semibold">Description</span></li>
                <li><span className="font-semibold">Due Date</span></li>
                <li><span className="font-semibold">Organisation</span></li>
                <li><span className="font-semibold">Contact</span></li>
                <li><span className="font-semibold">Assignee</span></li>
              </ul>
            </li>
            <li>Click <span className="font-semibold">Create Task</span></li>
          </ol>
          <div className="text-sm text-gray-600 mt-4 space-y-2">
            <p>After creating a task, you can:</p>
            <ul className="list-disc list-inside ml-4">
              <li>Track its progress (Pending, In Progress, Completed)</li>
              <li>Update its details</li>
              <li>Link it to organisations and contacts</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'add-event',
      title: 'How to add an Event',
      icon: Calendar,
      content: (
        <div className="space-y-4">
          <p>To add a new calendar event:</p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Navigate to the <span className="font-semibold">Calendar</span> page using the sidebar menu</li>
            <li>Click the <span className="font-semibold">Add Event</span> button in the top-right corner</li>
            <li>Fill in the event details:
              <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                <li><span className="font-semibold">Title</span> (required) - The event name or description</li>
                <li><span className="font-semibold">Description</span> - Additional details about the event</li>
                <li><span className="font-semibold">Start Time</span> (required) - When the event begins</li>
                <li><span className="font-semibold">End Time</span> (required) - When the event ends</li>
                <li><span className="font-semibold">Organisation</span> - Link to a related organisation</li>
                <li><span className="font-semibold">Contact</span> - Link to a related contact</li>
              </ul>
            </li>
            <li>Click <span className="font-semibold">Save</span> to create the event</li>
          </ol>
          <div className="text-sm text-gray-600 mt-4 space-y-2">
            <p>
              After creating an event, you can:
            </p>
            <ul className="list-disc list-inside ml-4">
              <li>View it in different calendar views (Month, Week, Day, List)</li>
              <li>Edit or delete it by clicking on the event</li>
              <li>See it linked to related organisations and contacts</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'add-updates',
      title: 'How to add Updates to Contacts and Organisations',
      icon: MessageSquare,
      content: (
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">Adding Contact Updates</h3>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Open a contact's details by clicking on them in the Contacts list</li>
            <li>Find the <span className="font-semibold">Updates</span> section</li>
            <li>Click <span className="font-semibold">Add Update</span></li>
            <li>Choose the update type:
              <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                <li><span className="font-semibold">Email</span> - Record email communications</li>
                <li><span className="font-semibold">Phone</span> - Log phone calls</li>
                <li><span className="font-semibold">Meeting</span> - Document meetings</li>
                <li><span className="font-semibold">Event</span> - Record event attendance</li>
                <li><span className="font-semibold">Other</span> - Any other type of update</li>
              </ul>
            </li>
            <li>Enter the update details in the content field</li>
            <li>Click <span className="font-semibold">Add Update</span> to save</li>
          </ol>

          <h3 className="font-medium text-gray-900 mt-6">Adding Organisation Updates</h3>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Open an organisation's details by clicking on them in the Organisations list</li>
            <li>Find the <span className="font-semibold">Updates</span> section</li>
            <li>Click <span className="font-semibold">Add Update</span></li>
            <li>Choose the update type:
              <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                <li><span className="font-semibold">Meeting</span> - Document meetings</li>
                <li><span className="font-semibold">Event</span> - Record event participation</li>
                <li><span className="font-semibold">Status</span> - Update organisation status</li>
                <li><span className="font-semibold">Other</span> - Any other type of update</li>
              </ul>
            </li>
            <li>Enter the update details in the content field</li>
            <li>Click <span className="font-semibold">Add Update</span> to save</li>
          </ol>

          <div className="text-sm text-gray-600 mt-4">
            <p>
              Updates help maintain a chronological record of all interactions and changes, making it easy to track the history of relationships with contacts and organisations.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'run-report',
      title: 'How to run a Report',
      icon: FileText,
      content: (
        <div className="space-y-4">
          <p>To generate and view reports:</p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Navigate to the <span className="font-semibold">Reports</span> page using the sidebar menu</li>
            <li>Choose from the available report types:
              <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                <li><span className="font-semibold">Current Status Report</span> - Overview of all organisations' current status</li>
              </ul>
            </li>
            <li>Click on the desired report to view it</li>
            <li>Use the <span className="font-semibold">Download PDF</span> button to save or print the report</li>
          </ol>
          <div className="text-sm text-gray-600 mt-4 space-y-2">
            <p>
              Reports provide valuable insights and summaries of your data. Each report can be:
            </p>
            <ul className="list-disc list-inside ml-4">
              <li>Viewed directly in the browser</li>
              <li>Downloaded as a PDF for sharing or archiving</li>
              <li>Printed for physical records</li>
            </ul>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Help & FAQ</h1>
      
      <div className="bg-white rounded-lg shadow-sm">
        {faqItems.map((item, index) => (
          <div key={item.id}>
            <button
              onClick={() => setOpenItem(openItem === item.id ? null : item.id)}
              className={`w-full flex items-center justify-between p-6 text-left ${
                index !== 0 ? 'border-t border-gray-200' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <item.icon className="h-6 w-6 text-blue-500" />
                <span className="text-lg font-medium text-gray-900">{item.title}</span>
              </div>
              <ChevronDown
                className={`h-5 w-5 text-gray-500 transition-transform ${
                  openItem === item.id ? 'transform rotate-180' : ''
                }`}
              />
            </button>
            
            <div
              className={`overflow-hidden transition-all duration-200 ease-in-out ${
                openItem === item.id ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="p-6 pt-0 text-gray-700">
                {item.content}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-6 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">Need more help?</h2>
        <p className="text-blue-800">
          If you can't find the answer you're looking for, please contact your system administrator
          for additional support and guidance.
        </p>
      </div>
    </div>
  );
}

export { Help as default };