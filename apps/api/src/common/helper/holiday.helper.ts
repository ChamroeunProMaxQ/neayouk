export const CAMBODIA_PUBLIC_HOLIDAYS: Record<number, { day: string; name: string }[]> = {
  1: [
    { day: '01', name: "New Year's Day" },
    { day: '07', name: 'Victory Day' },
  ],
  3: [
    { day: '08', name: "International Women's Day" },
  ],
  4: [
    { day: '14', name: "Khmer New Year's Day" },
    { day: '15', name: "Khmer New Year's Day" },
    { day: '16', name: "Khmer New Year's Day" },
  ],
  5: [
    { day: '01', name: 'Labour Day' },
    { day: '05', name: 'Royal Ploughing Ceremony' },
    { day: '14', name: "King Norodom Sihamoni's Birthday" },
  ],
  6: [
    { day: '18', name: "Queen Mother's Birthday" },
  ],
  9: [
    { day: '10', name: 'Pchum Ben' },
    { day: '11', name: 'Pchum Ben' },
    { day: '12', name: 'Pchum Ben' },
    { day: '24', name: 'Constitution Day' },
  ],
  10: [
    { day: '15', name: 'Commemoration of Late King Father' },
    { day: '29', name: "King Norodom Sihamoni's Coronation Day" },
  ],
  11: [
    { day: '09', name: 'Independence Day' },
    { day: '23', name: 'Bon Om Touk' },
    { day: '24', name: 'Bon Om Touk' },
    { day: '25', name: 'Bon Om Touk' },
  ],
  12: [
    { day: '29', name: 'Peace Day' },
  ],
};

export function isCambodiaHoliday(dateStr: string): boolean {
  const parts = dateStr.split('-');
  if (parts.length < 3) return false;
  const month = Number(parts[1]);
  const day = parts[2];
  return CAMBODIA_PUBLIC_HOLIDAYS[month]?.some((h) => h.day === day) ?? false;
}

export function getCambodiaHolidaysInMonth(year: number, month: number) {
  return CAMBODIA_PUBLIC_HOLIDAYS[month] ?? [];
}

export function calculateWorkingDaysInMonth(year: number, month: number) {
  const totalDays = new Date(year, month, 0).getDate();
  const holidays = getCambodiaHolidaysInMonth(year, month);
  let sundaysCount = 0;
  let holidaysCount = 0;

  for (let day = 1; day <= totalDays; day++) {
    const dayStr = String(day).padStart(2, '0');
    const dateObj = new Date(year, month - 1, day);
    const dayOfWeek = dateObj.getDay(); // 0 = Sunday

    const isHoliday = holidays.some((h) => h.day === dayStr);

    if (dayOfWeek === 0) {
      sundaysCount++;
    } else if (isHoliday) {
      holidaysCount++;
    }
  }

  const netWorkingDays = totalDays - sundaysCount - holidaysCount;

  return {
    totalDays,
    sundaysCount,
    holidaysCount,
    netWorkingDays,
  };
}
