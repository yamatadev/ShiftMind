import { Sun, CloudSun, Moon } from 'lucide-react';
import type { Template, Shift } from '../../types';
import RoleBadge from '../../components/RoleBadge';

const SHIFT_META: Record<Shift, { label: string; time: string; Icon: typeof Sun }> = {
  morning:   { label: 'Morning',   time: '6 AM – 2 PM',  Icon: Sun },
  afternoon: { label: 'Afternoon', time: '2 PM – 10 PM', Icon: CloudSun },
  night:     { label: 'Night',     time: '10 PM – 6 AM', Icon: Moon },
};

const DAY_TYPE_LABEL: Record<string, string> = {
  weekday: 'Weekday',
  weekend: 'Weekend',
  holiday: 'Holiday',
};

interface TemplateDetailProps {
  template: Template;
}

export default function TemplateDetail({ template }: TemplateDetailProps) {
  const totalStaff = template.slots.reduce((sum, s) => sum + s.requiredCount, 0);

  const slotsByShift = (['morning', 'afternoon', 'night'] as Shift[]).map((shift) => {
    const slots = template.slots.filter((s) => s.shift === shift);
    const count = slots.reduce((sum, s) => sum + s.requiredCount, 0);
    return { shift, slots, count };
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <h3 className="text-lg font-heading font-semibold text-primary">{template.name}</h3>
        <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full bg-accent/10 text-accent">
          {DAY_TYPE_LABEL[template.dayType] ?? template.dayType}
        </span>
        <span className="text-sm text-secondary">
          {totalStaff} staff total
        </span>
      </div>

      {/* 3-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {slotsByShift.map(({ shift, slots, count }) => {
          const { label, time, Icon } = SHIFT_META[shift];

          return (
            <div
              key={shift}
              className="bg-surface border border-border rounded-xl p-5 flex flex-col"
            >
              {/* Shift header */}
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-5 h-5 text-accent" />
                <span className="font-heading font-semibold text-primary">{label}</span>
              </div>
              <p className="text-xs text-secondary mb-4">{time}</p>

              {/* Roles */}
              <div className="flex-1 space-y-2">
                {slots.length === 0 ? (
                  <p className="text-sm text-secondary italic">No roles defined</p>
                ) : (
                  slots.map((slot) => (
                    <div key={slot.id} className="flex items-center justify-between">
                      <RoleBadge role={slot.role} />
                      <span className="text-sm font-medium text-primary">{slot.requiredCount}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Total */}
              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                <span className="text-xs font-medium text-secondary uppercase tracking-wider">Total</span>
                <span className="text-sm font-semibold text-primary">{count}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
