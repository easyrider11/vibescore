import type { DateRange, Tier } from "../types";

interface FilterBarProps {
  dateRange: DateRange;
  tier: Tier;
  onDateRangeChange: (range: DateRange) => void;
  onTierChange: (tier: Tier) => void;
}

export function FilterBar({
  dateRange,
  tier,
  onDateRangeChange,
  onTierChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <label htmlFor="date-range" className="text-sm font-medium text-gray-600">
          Date Range
        </label>
        <select
          id="date-range"
          className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:border-indigo-300 focus:border-indigo-400 focus:outline-none"
          value={dateRange}
          onChange={(e) => onDateRangeChange(e.target.value as DateRange)}
        >
          <option value="all">All Time</option>
          <option value="6m">Last 6 Months</option>
          <option value="3m">Last 3 Months</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="plan-type" className="text-sm font-medium text-gray-600">
          Plan
        </label>
        <select
          id="plan-type"
          className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:border-indigo-300 focus:border-indigo-400 focus:outline-none"
          value={tier}
          onChange={(e) => onTierChange(e.target.value as Tier)}
        >
          <option value="all">All Plans</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>
    </div>
  );
}
