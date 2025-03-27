import React, { useState, useEffect } from 'react';
import { FileText, Download, Building2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { supabase } from '../lib/supabase';
import type { Organisation } from '../lib/types';
import PageTransition from '../components/PageTransition';

interface Report {
  id: string;
  title: string;
  description: string;
  component: React.FC;
}

interface CurrentStatusReportData {
  organisations: Organisation[];
  loading: boolean;
}

const CurrentStatusReport: React.FC = () => {
  const [data, setData] = useState<CurrentStatusReportData>({
    organisations: [],
    loading: true
  });

  useEffect(() => {
    async function loadOrganisations() {
      try {
        const { data: organisations, error } = await supabase
          .from('organisations')
          .select('*')
          .order('name');

        if (error) throw error;

        setData({
          organisations: organisations || [],
          loading: false
        });
      } catch (error) {
        console.error('Error loading organisations:', error);
        setData(prev => ({ ...prev, loading: false }));
      }
    }

    loadOrganisations();
  }, []);

  const generatePDF = () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    
    // Add header
    pdf.setFontSize(20);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Current Status Report', pageWidth / 2, 20, { align: 'center' });
    pdf.setFontSize(12);
    pdf.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, 30, { align: 'center' });

    // Add organisations
    let yPos = 50;
    data.organisations.forEach((org, index) => {
      // Check if we need a new page
      if (yPos > 250) {
        pdf.addPage();
        yPos = 20;
      }

      // Organisation name
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text(org.name, 20, yPos);
      yPos += 10;

      // Current status
      if (org.current_status) {
        pdf.setFontSize(12);
        pdf.setTextColor(80, 80, 80);
        const lines = pdf.splitTextToSize(org.current_status, pageWidth - 40);
        pdf.text(lines, 20, yPos);
        yPos += (lines.length * 7) + 10;
      } else {
        pdf.setFontSize(12);
        pdf.setTextColor(150, 150, 150);
        pdf.text('No status provided', 20, yPos);
        yPos += 20;
      }

      // Add separator line
      if (index < data.organisations.length - 1) {
        pdf.setDrawColor(200, 200, 200);
        pdf.line(20, yPos - 5, pageWidth - 20, yPos - 5);
      }
    });

    // Open PDF in new tab
    window.open(URL.createObjectURL(pdf.output('blob')));
  };

  if (data.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6f5192]"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Current Status Report</h2>
        <button
          onClick={generatePDF}
          className="flex items-center px-4 py-2 bg-[#6f5192] text-white rounded-lg hover:bg-[#5d4379] focus:outline-none focus:ring-2 focus:ring-[#6f5192] focus:ring-offset-2"
        >
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </button>
      </div>

      <div className="space-y-6">
        {data.organisations.map((org) => (
          <div key={org.id} className="border-b border-gray-200 pb-6 last:border-0">
            <div className="flex items-center space-x-3 mb-3">
              <Building2 className="h-5 w-5 text-[#6f5192]" />
              <h3 className="text-lg font-medium text-gray-900">{org.name}</h3>
            </div>
            <p className="text-gray-600">
              {org.current_status || 'No status provided'}
            </p>
          </div>
        ))}

        {data.organisations.length === 0 && (
          <p className="text-gray-500 text-center py-8">
            No organisations found
          </p>
        )}
      </div>
    </div>
  );
};

const reports: Report[] = [
  {
    id: 'current-status',
    title: 'Current Status Report',
    description: 'Overview of current status for all organisations',
    component: CurrentStatusReport
  }
];

export function Reports() {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-800">Reports</h1>
        </div>

        {!selectedReport ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map((report) => (
              <div
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <FileText className="h-6 w-6 text-[#6f5192]" />
                  <h2 className="text-lg font-medium text-gray-900">{report.title}</h2>
                </div>
                <p className="text-gray-600">{report.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <button
              onClick={() => setSelectedReport(null)}
              className="text-[#6f5192] hover:text-[#5d4379] font-medium"
            >
              ← Back to Reports
            </button>
            <selectedReport.component />
          </div>
        )}
      </div>
    </PageTransition>
  );
}

export { Reports as default };