import { useState, useEffect } from 'react';
import { fetchTemplates } from '../../api/templates';
import type { Template, DayType } from '../../types';
import TemplateDetail from './TemplateDetail';

const TABS: { value: DayType; label: string }[] = [
  { value: 'weekday', label: 'Weekday' },
  { value: 'weekend', label: 'Weekend' },
  { value: 'holiday', label: 'Holiday' },
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DayType>('weekday');

  useEffect(() => {
    setLoading(true);
    fetchTemplates()
      .then(setTemplates)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const activeTemplate = templates.find((t) => t.dayType === activeTab);

  return (
    <div className="flex-1 overflow-auto p-6">
      {/* Top bar */}
      <div className="mb-6">
        <h2 className="text-xl font-heading font-semibold text-primary">Schedule Templates</h2>
        <p className="text-sm text-secondary mt-1">
          Define staffing requirements for each day type
        </p>
      </div>

      {/* Tab pills */}
      <div className="flex items-center gap-2 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
              activeTab === tab.value
                ? 'bg-accent text-white'
                : 'bg-surface text-secondary border border-border hover:text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <p className="text-sm text-secondary">Loading templates…</p>
      ) : activeTemplate ? (
        <TemplateDetail template={activeTemplate} />
      ) : (
        <p className="text-sm text-secondary">No template found for this day type.</p>
      )}
    </div>
  );
}
