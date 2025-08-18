export const formatDate = (date: string | Date): string => {
  return new Date(date).toISOString().split('T')[0];
};

export const formatTime = (time: string | Date | null | undefined): string | null => {
  if (!time) return null;
  const date = typeof time === 'string' ? new Date(`2040-01-01T${time}`) : new Date(time);
  return date.toTimeString().slice(0, 5);
};