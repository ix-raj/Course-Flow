// Filters tasks from the weekly plan based on completion status

export const getTaskCompletionStats = (allTasks, completionLog, dateStr) => {
  if (!allTasks || allTasks.length === 0) return { total: 0, completed: 0 };
  
  const completedCount = allTasks.filter(
    task => completionLog?.[`${dateStr}_${task.id}`]
  ).length;
  
  return {
    total: allTasks.length,
    completed: completedCount
  };
};

/**
 * Generates a unique ID for new tasks or subjects
 */
export const generateId = () => Date.now().toString();