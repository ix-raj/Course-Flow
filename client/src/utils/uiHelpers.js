// UI and performance optimization helpers.
 

// Delays function execution to prevent UI lag during rapid typing (e.g., Search bars)
export const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};