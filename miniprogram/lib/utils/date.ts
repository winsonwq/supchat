import dayjs from 'dayjs'

export function formatTime(
  input: number | string | Date,
  format: string = 'YYYY-MM-DD HH:mm',
): string {
  const d = dayjs(input)
  return d.isValid() ? d.format(format) : ''
}

export default {
  formatTime,
}
