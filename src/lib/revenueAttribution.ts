import { Period } from '@/hooks/revenue/useRevenueState';

const PERIOD_DISPLAY_NAMES: Record<Period, string> = {
  morning: 'صباحية',
  evening: 'مسائية',
  night: 'ليلية',
  ahmad_rajili: 'احمد الرجيلي',
  abdulwahab: 'عبدالوهاب',
};

const ROLE_TO_PERIOD: Record<string, Period> = {
  morning_shift: 'morning',
  evening_shift: 'evening',
  night_shift: 'night',
  abdulwahab: 'abdulwahab',
  ahmad_rajili: 'ahmad_rajili',
};

export const getPeriodDisplayName = (period: Period | string) => {
  return PERIOD_DISPLAY_NAMES[period as Period] || period;
};

export const getRevenueDisplayName = (createdBy: string | null | undefined, period: string) => {
  return createdBy?.trim() || getPeriodDisplayName(period);
};

export const getSelectedPeriodAttribution = ({
  userRole,
  period,
  canSelectAnyPeriod,
}: {
  userRole?: string;
  period: Period;
  canSelectAnyPeriod: boolean;
}) => {
  const userDefaultPeriod = userRole ? ROLE_TO_PERIOD[userRole] : undefined;

  if (canSelectAnyPeriod || (userDefaultPeriod && userDefaultPeriod !== period)) {
    return getPeriodDisplayName(period);
  }

  return undefined;
};

export const getRevenueAttributionKey = (revenue: { period: string; createdBy?: string | null }) => {
  return `${revenue.period}::${getRevenueDisplayName(revenue.createdBy, revenue.period)}`;
};

export const getVerificationKey = (period: string, targetUserId: string) => {
  return `${period}::${targetUserId}`;
};