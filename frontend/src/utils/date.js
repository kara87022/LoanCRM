// Shared date utilities for consistent display formatting
// CSV-style date format: DD/MM/YYYY

export function formatCSVDate(value) {
  if (value === null || value === undefined || value === '') return '';

  // If already ISO YYYY-MM-DD string
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-');
    return `${d}/${m}/${y}`;
  }

  // If already CSV-style DD/MM/YYYY
  if (typeof value === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    return value;
  }

  // Try parsing as Date
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);

  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// Optionally: convert CSV-style date (DD/MM/YYYY) to ISO (YYYY-MM-DD)
// Useful when sending back to APIs that expect ISO dates.
export function toISODateFromCSV(csvDate) {
  if (!csvDate) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(csvDate)) return csvDate; // already ISO
  const parts = String(csvDate).split(/[\/\-\.]/);
  if (parts.length === 3) {
    // Assume DD/MM/YYYY
    const [dd, mm, yyyy] = parts;
    if (yyyy && mm && dd) {
      return `${yyyy.padStart(4, '0')}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
    }
  }
  // Fallback parse
  const d = new Date(csvDate);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${yyyy}-${mm}-${dd}`;
}
