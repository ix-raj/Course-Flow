//Centralized date formatting to ensure consistency across the application.

const formatLocalDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Returns the full weekday name (e.g., "Monday")
export const getTodayDay = () => {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' });
};

// Returns standard YYYY-MM-DD string
export const getTodayDateStr = () => {
  return formatLocalDateKey(new Date());
};

// Returns formatted string (e.g., "March 31, 2026")
export const formatFullDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

// Returns a local-date key array from today through N days ahead, inclusive.
export const getFutureDateArray = (daysFromNow) => {
  return Array.from({ length: daysFromNow + 1 }, (_, offset) => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return formatLocalDateKey(date);
  });
};
