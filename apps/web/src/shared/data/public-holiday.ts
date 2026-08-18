export const PUBLIC_HOLIDAYS: Record<number, { day: string; name: string }[]> = {
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

export function getIsHoliday(date: string): boolean {
    const [, month, day] = date.split('-');

    return PUBLIC_HOLIDAYS[Number(month)]?.some(
        (holiday) => holiday.day === day,
    ) ?? false;
}

export function getHoliday(date: string) {
    const [, month, day] = date.split('-');

    return PUBLIC_HOLIDAYS[Number(month)]?.find(
        (holiday) => holiday.day === day,
    );
}