export function formatDate(value: string | null | undefined): string {
    if (!value) return '—';
    const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00+08:00`) : new Date(value);
    return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Manila' }).format(date);
}

export function formatDateTime(value: string | null | undefined): string {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Manila' }).format(date);
}

export function formatAmount(value: string | number | null | undefined): string {
    const amount = Number(value);
    return Number.isFinite(amount) ? new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount) : '—';
}

export function formatTime12Hour(value: string | null | undefined): string {
    if (!value) return '—';
    const match = /^(\d{2}):(\d{2})$/.exec(value.trim());
    if (!match) return value;
    const hours24 = Number(match[1]);
    const minutes = match[2];
    const period = hours24 >= 12 ? 'PM' : 'AM';
    const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;

    return `${hours12}:${minutes} ${period}`;
}

export function formatHoursFlexibility(canHoursChange: boolean | null | undefined): string {
    if (canHoursChange === true) return 'Yes — hours can change around classes';
    if (canHoursChange === false) return 'No — fixed schedule';

    return 'Not specified';
}
