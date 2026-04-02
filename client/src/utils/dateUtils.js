//Centralized date formatting to ensure consistency across the application.

// Returns the full weekday name (e.g., "Monday")
export const getTodayDay = () => {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' });
};

// Returns standard YYYY-MM-DD string
export const getTodayDateStr = () => {
  return new Date().toISOString().split('T')[0];
};

// Returns formatted string (e.g., "March 31, 2026")
export const formatFullDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

// Returns the exact array format your GoalsPage was originally using for 10 days out
export const getFutureDateArray = (daysFromNow) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0]; 
};