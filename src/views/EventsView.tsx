import React, { useState, useMemo } from 'react';
import { SecurityEvent, SeverityLevel } from '../types/security';
import { Search, Filter, Download, Eye, X, Terminal, Clock, Shield } from 'lucide-react';

interface EventsViewProps {
  events: SecurityEvent[];
}

export const EventsView: React.FC<EventsViewProps> = ({ events }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [inspectedEvent, setInspectedEvent] = useState<SecurityEvent | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Extract unique event types for filtering
  const eventTypes = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => set.add(e.event_type));
    return Array.from(set);
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const matchSearch =
        searchTerm === '' ||
        e.account.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.source_ip.includes(searchTerm) ||
        e.event_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.event_id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchSev = selectedSeverity === 'ALL' || e.severity === selectedSeverity;
      const matchType = selectedType === 'ALL' || e.event_type === selectedType;

      return matchSearch && matchSev && matchType;
    });
  }, [events, searchTerm, selectedSeverity, selectedType]);

  const totalPages = Math.ceil(filteredEvents.length / pageSize) || 1;
  const paginatedEvents = filteredEvents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredEvents, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `redsentinel-events-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="relative z-10 max-w-7xl mx-auto py-6 px-4 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#292F3B]">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Security Telemetry Explorer</h1>
          <p className="text-xs text-[#9CA7B8] mt-0.5">
            Normalized cloud and endpoint log records received through Flask ingestion
          </p>
        </div>

        <button
          onClick={handleExportJSON}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#F4F6FA] bg-[#151A23] hover:bg-[#1B2230] border border-[#292F3B] rounded-lg transition-colors cursor-pointer self-start md:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Filtered JSON</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-[#11151D] border border-[#292F3B] rounded-xl flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#9CA7B8] absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search account, IP address, event ID, or type..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#151A23] border border-[#292F3B] rounded-lg text-white focus:outline-none focus:border-[#FF334F] font-mono transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Severity Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-[#151A23] rounded-lg border border-[#292F3B] text-xs">
            {['ALL', 'CRITICAL', 'HIGH', 'LOW', 'INFO'].map((sev) => (
              <button
                key={sev}
                onClick={() => {
                  setSelectedSeverity(sev);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                  selectedSeverity === sev
                    ? 'bg-[#FF334F] text-white shadow-sm'
                    : 'text-[#9CA7B8] hover:text-white'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          {/* Event Type Select */}
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 text-xs bg-[#151A23] border border-[#292F3B] rounded-lg text-white focus:outline-none focus:border-[#FF334F]"
          >
            <option value="ALL">All Event Types</option>
            {eventTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-[#11151D] border border-[#292F3B] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#151A23] text-[#9CA7B8] font-mono uppercase text-[10px] border-b border-[#292F3B]">
              <tr>
                <th className="py-3 px-4">Event ID</th>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Account / Identity</th>
                <th className="py-3 px-4">Source IP</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#292F3B]">
              {paginatedEvents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#9CA7B8]">
                    No security events match the current filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedEvents.map((evt) => (
                  <tr
                    key={evt.event_id}
                    className="hover:bg-[#151A23]/60 transition-colors cursor-pointer group"
                    onClick={() => setInspectedEvent(evt)}
                  >
                    <td className="py-3 px-4 font-mono text-[#9CA7B8]">{evt.event_id}</td>
                    <td className="py-3 px-4 font-mono text-white whitespace-nowrap">
                      {new Date(evt.timestamp).toISOString().replace('T', ' ').substring(0, 19)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-white">{evt.event_type}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[#F4F6FA]">{evt.account}</td>
                    <td className="py-3 px-4 font-mono text-[#9CA7B8]">{evt.source_ip}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          evt.severity === 'CRITICAL'
                            ? 'bg-[#FF334F]/20 text-[#FF5C6C] border border-[#FF334F]/30'
                            : evt.severity === 'HIGH'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : evt.severity === 'LOW'
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-slate-700/30 text-slate-400'
                        }`}
                      >
                        {evt.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setInspectedEvent(evt);
                        }}
                        className="p-1 text-[#9CA7B8] hover:text-white rounded hover:bg-[#292F3B] transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#151A23] border-t border-[#292F3B] text-xs text-[#9CA7B8]">
          <span className="font-mono">
            Showing {(currentPage - 1) * pageSize + 1}–
            {Math.min(currentPage * pageSize, filteredEvents.length)} of {filteredEvents.length} events
          </span>
          <div className="flex items-center gap-1 font-mono">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 bg-[#11151D] border border-[#292F3B] rounded hover:text-white transition-colors disabled:opacity-40 cursor-pointer"
            >
              Previous
            </button>
            <span className="px-2">
              {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 bg-[#11151D] border border-[#292F3B] rounded hover:text-white transition-colors disabled:opacity-40 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Raw Event Inspection Modal */}
      {inspectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-3xl bg-[#11151D] border border-[#292F3B] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#292F3B] bg-[#151A23]">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#FF334F]" />
                <h3 className="text-sm font-semibold text-white">Event Telemetry Inspector</h3>
                <span className="text-xs font-mono text-[#9CA7B8]">[{inspectedEvent.event_id}]</span>
              </div>
              <button
                onClick={() => setInspectedEvent(null)}
                className="p-1 text-[#9CA7B8] hover:text-white rounded hover:bg-[#292F3B] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto font-mono text-xs">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-[#151A23] border border-[#292F3B] rounded-lg">
                  <span className="text-[10px] text-[#9CA7B8] block">EVENT TYPE</span>
                  <span className="text-white font-bold">{inspectedEvent.event_type}</span>
                </div>
                <div className="p-3 bg-[#151A23] border border-[#292F3B] rounded-lg">
                  <span className="text-[10px] text-[#9CA7B8] block">TARGET IDENTITY</span>
                  <span className="text-white truncate block">{inspectedEvent.account}</span>
                </div>
                <div className="p-3 bg-[#151A23] border border-[#292F3B] rounded-lg">
                  <span className="text-[10px] text-[#9CA7B8] block">SOURCE IP</span>
                  <span className="text-[#FF334F]">{inspectedEvent.source_ip}</span>
                </div>
                <div className="p-3 bg-[#151A23] border border-[#292F3B] rounded-lg">
                  <span className="text-[10px] text-[#9CA7B8] block">SEVERITY TIER</span>
                  <span className="text-[#35D49A] font-bold">{inspectedEvent.severity}</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-white mb-1.5 block">Normalized Schema Representation</span>
                <pre className="p-3 bg-[#090B10] border border-[#292F3B] rounded-lg text-slate-300 overflow-x-auto text-[11px] leading-relaxed">
                  {JSON.stringify(inspectedEvent.normalized_event, null, 2)}
                </pre>
              </div>

              <div>
                <span className="text-xs font-semibold text-white mb-1.5 block">Raw Ingestion JSON Payload</span>
                <pre className="p-3 bg-[#090B10] border border-[#292F3B] rounded-lg text-slate-400 overflow-x-auto text-[11px] leading-relaxed">
                  {JSON.stringify(inspectedEvent.raw_event, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
