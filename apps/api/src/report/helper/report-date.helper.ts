import { ReportDatePresetEnum } from '@repo/contracts';

export interface ResolvedDateRange {
  startDate: string;
  endDate: string;
  prevStartDate: string;
  prevEndDate: string;
}

export function resolveDateRange(
  preset?: ReportDatePresetEnum,
  startDateQuery?: string,
  endDateQuery?: string,
): ResolvedDateRange {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  if (preset === ReportDatePresetEnum.TODAY) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yestStr = yesterday.toISOString().slice(0, 10);
    return {
      startDate: todayStr,
      endDate: todayStr,
      prevStartDate: yestStr,
      prevEndDate: yestStr,
    };
  }

  if (preset === ReportDatePresetEnum.LAST_MONTH) {
    const prevMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const start = new Date(Date.UTC(prevMonthYear, prevMonth, 1));
    const end = new Date(Date.UTC(prevMonthYear, prevMonth + 1, 0));

    // 2 months ago for comparison
    const twoMonthsAgoYear = prevMonth === 0 ? prevMonthYear - 1 : prevMonthYear;
    const twoMonthsAgo = prevMonth === 0 ? 11 : prevMonth - 1;
    const prevStart = new Date(Date.UTC(twoMonthsAgoYear, twoMonthsAgo, 1));
    const prevEnd = new Date(Date.UTC(twoMonthsAgoYear, twoMonthsAgo + 1, 0));

    return {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      prevStartDate: prevStart.toISOString().slice(0, 10),
      prevEndDate: prevEnd.toISOString().slice(0, 10),
    };
  }

  if (preset === ReportDatePresetEnum.THIS_QUARTER) {
    const currentQuarter = Math.floor(now.getMonth() / 3);
    const start = new Date(Date.UTC(now.getFullYear(), currentQuarter * 3, 1));
    const end = new Date(Date.UTC(now.getFullYear(), (currentQuarter + 1) * 3, 0));

    const prevQuarter = currentQuarter === 0 ? 3 : currentQuarter - 1;
    const prevYear = currentQuarter === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const prevStart = new Date(Date.UTC(prevYear, prevQuarter * 3, 1));
    const prevEnd = new Date(Date.UTC(prevYear, (prevQuarter + 1) * 3, 0));

    return {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      prevStartDate: prevStart.toISOString().slice(0, 10),
      prevEndDate: prevEnd.toISOString().slice(0, 10),
    };
  }

  if (preset === ReportDatePresetEnum.THIS_YEAR) {
    const start = new Date(Date.UTC(now.getFullYear(), 0, 1));
    const end = new Date(Date.UTC(now.getFullYear(), 11, 31));

    const prevStart = new Date(Date.UTC(now.getFullYear() - 1, 0, 1));
    const prevEnd = new Date(Date.UTC(now.getFullYear() - 1, 11, 31));

    return {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      prevStartDate: prevStart.toISOString().slice(0, 10),
      prevEndDate: prevEnd.toISOString().slice(0, 10),
    };
  }

  if (startDateQuery && endDateQuery) {
    const start = new Date(startDateQuery);
    const end = new Date(endDateQuery);
    const durationDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

    const prevStart = new Date(start);
    prevStart.setDate(prevStart.getDate() - durationDays);
    const prevEnd = new Date(start);
    prevEnd.setDate(prevEnd.getDate() - 1);

    return {
      startDate: startDateQuery,
      endDate: endDateQuery,
      prevStartDate: prevStart.toISOString().slice(0, 10),
      prevEndDate: prevEnd.toISOString().slice(0, 10),
    };
  }

  // Default: THIS_MONTH
  const start = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  const end = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0));

  const prevMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  const prevStart = new Date(Date.UTC(prevMonthYear, prevMonth, 1));
  const prevEnd = new Date(Date.UTC(prevMonthYear, prevMonth + 1, 0));

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
    prevStartDate: prevStart.toISOString().slice(0, 10),
    prevEndDate: prevEnd.toISOString().slice(0, 10),
  };
}
