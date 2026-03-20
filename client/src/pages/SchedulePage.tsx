import WeekNavigator from '../features/calendar/WeekNavigator';

export default function SchedulePage() {
  return (
    <>
      <WeekNavigator />
      <div className="flex-1 overflow-auto p-6">
        <h2 className="text-xl font-heading font-semibold text-text-primary">Schedule</h2>
        <p className="text-text-secondary mt-2">Schedule view coming soon.</p>
      </div>
    </>
  );
}
