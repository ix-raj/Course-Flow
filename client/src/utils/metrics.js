//Centralized logic for calculating course progress and study time.


// Safely calculates the percentage of completed videos in a course
export const calculateCourseProgress = (course, courseUserData) => {
  if (!course || !course.videoCount || course.videoCount === 0) return 0;
  
  const data = courseUserData || {};
  
  // Count files marked as 'completed' (ignoring metadata keys like '_COURSE_GOALS_')
  const completedVideos = Object.keys(data).filter(
    fileName => fileName !== '_COURSE_GOALS_' && data[fileName] && data[fileName].completed === true
  ).length;

  return Math.round((completedVideos / course.videoCount) * 100);
};

// Converts raw seconds into a formatted "Hours" string (e.g., "1.5")
export const formatStudyHours = (totalSeconds) => {
  return (totalSeconds / 3600).toFixed(1);
};