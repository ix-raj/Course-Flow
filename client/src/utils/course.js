const toNumber = (value, fallback = 0) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
};

const normalizeCourseType = (courseType, isExternal, externalUrl) => {
  if (courseType === 'external' || courseType === 'local') {
    return courseType;
  }

  if (typeof isExternal === 'boolean') {
    return isExternal ? 'external' : 'local';
  }

  return externalUrl ? 'external' : 'local';
};

export const normalizeCourse = (course = {}) => {
  const id = course.id || course._id || '';
  const externalUrl = typeof course.externalUrl === 'string' ? course.externalUrl.trim() : '';
  const courseType = normalizeCourseType(course.courseType, course.isExternal, externalUrl);

  return {
    ...course,
    id,
    _id: course._id || id,
    title: course.title || '',
    description: course.description || '',
    cover: course.cover || '',
    folderName: courseType === 'external'
      ? (course.folderName || 'External')
      : (course.folderName || ''),
    courseType,
    isExternal: courseType === 'external',
    externalUrl: courseType === 'external' ? externalUrl : '',
    videoCount: toNumber(course.videoCount, 0),
    noteCount: toNumber(course.noteCount, 0),
    customLinks: Array.isArray(course.customLinks) ? course.customLinks : [],
    tags: Array.isArray(course.tags) ? course.tags : []
  };
};

export const normalizeCourseList = (courses = []) => (
  Array.isArray(courses) ? courses.map(normalizeCourse).filter(Boolean) : []
);

export const isExternalCourse = (course) => normalizeCourse(course).isExternal;
