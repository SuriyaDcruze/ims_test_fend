import {
  AppWindowMac,
  ArrowLeft,
  Award,
  BookOpen,
  PlayCircle,
  FileText,
  FolderOpen,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router";

function CourseDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const course = location.state?.course || null;

  const handleStart = () => {
    if (!course || !course._id) return;
    navigate(`/student/course/${course._id}/content`, {
      state: { course },
    });
  };

  // Show loading or error if course is not available
  if (!course) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 w-full">
        <div className="text-gray-500 text-center">
          <p className="text-lg mb-2">Course not found</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-[calc(100vh-4rem)] flex flex-col  p-4 w-full">
        <div className="h-[300px] relative rounded-md overflow-hidden">
          <button
            className="absolute top-4 left-4 text-white bg-green-600 font-semibold text-sm px-3 py-2 rounded-md flex items-center gap-2 z-20"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
            Courses
          </button>
          <img
            src={course.thumbnail}
            alt={course.title}
            className="bg-green-50 object-cover object-center w-full h-full rounded-md overflow-hidden shadow-sm"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/vite.svg";
            }}
          />
          <div className="absolute bottom-0 bg-gradient-to-t from-neutral-900/60 from-10% to-green-50/0 z-10 w-full h-full"></div>

          <div className="absolute bottom-10 left-10 z-10 text-white pr-4">
            <h2 className="text-2xl font-semibold">{course.title}</h2>
            <p className="text-base font-medium">{course.description}</p>
          </div>
        </div>
        <div className="flex-1 w-full py-4 md:px-4">
          <div className="flex flex-col-reverse lg:flex-row gap-4 justify-between  items-start w-full">
            <div className="flex-1 w-full">
              <div className="flex flex-col gap-4 w-full">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-lg">Course Content</h2>
                  <div className="text-sm text-gray-600">
                    {(() => {
                      if (!course) return "No content";
                      if (course.chapters?.length > 0) {
                        const totalTopics = course.chapters.reduce((total, chapter) => 
                          total + (chapter.topics?.length || 0), 0
                        );
                        const totalLessons = course.chapters.reduce((total, chapter) => 
                          total + (chapter.topics?.reduce((topicTotal, topic) => 
                            topicTotal + (topic.lessons?.length || 0), 0) || 0), 0
                        );
                        return `${course.chapters.length} Chapter${course.chapters.length > 1 ? 's' : ''} • ${totalTopics} Topic${totalTopics !== 1 ? 's' : ''} • ${totalLessons} Lesson${totalLessons !== 1 ? 's' : ''}`;
                      } else if (course.topics?.length > 0) {
                        const totalLessons = course.topics.reduce((total, topic) => 
                          total + (topic.chapters?.reduce((chapTotal, chapter) => 
                            chapTotal + (chapter.lessons?.length || 0), 0) || 0), 0
                        );
                        return `${course.topics.length} Topic${course.topics.length > 1 ? 's' : ''} • ${totalLessons} Lesson${totalLessons !== 1 ? 's' : ''}`;
                      } else if (course.subjects?.length > 0) {
                        return `${course.subjects.length} Subject${course.subjects.length > 1 ? 's' : ''}`;
                      } else if (course.lessons?.length > 0) {
                        const totalSublessons = course.lessons.reduce((total, lesson) => 
                          total + (lesson.sublessons?.length || 0), 0
                        );
                        return `${course.lessons.length} Lesson${course.lessons.length > 1 ? 's' : ''} • ${totalSublessons} Sub-lesson${totalSublessons !== 1 ? 's' : ''}`;
                      }
                      return "No content";
                    })()}
                  </div>
                </div>
                <Accordion course={course} navigate={navigate} />
              </div>
            </div>
            <div className="lg:max-w-[300px] p-4 flex flex-col gap-4 w-full bg-white shadow rounded-md">
              <div className="flex items-center justify-center">
                <p className="font-bold text-2xl text-green-600">
                  Free
                </p>
              </div>
              <button
                onClick={handleStart}
                className="w-full px-5 py-2 rounded-md text-white bg-green-700 hover:bg-green-600 transition-colors"
              >
                Start
              </button>
              <div className="border-t-2 border-neutral-300 py-4">
                <h3 className="font-semibold text-base">
                  This course includes
                </h3>

                <div className="text-sm flex flex-col gap-2 mt-2 text-neutral-400">
                  <p className="flex items-center gap-2">
                    <AppWindowMac />
                    <span className="font-medium">
                      Access on mobile and Desktop
                    </span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Award />
                    <span className="font-medium">
                      Achievement of completion
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default CourseDetail;

const AccordionItem = ({ title, children, count, icon: Icon = BookOpen }) => (
  <details className="px-4 py-3 rounded-md transition-all duration-300 [open]:bg-green-50 shadow-md w-full bg-white border border-gray-200">
    <summary className="cursor-pointer flex px-3 py-2 items-center justify-between gap-2 text-green-800 font-semibold hover:bg-green-50 rounded-md">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-green-700" />
        <span>{title}</span>
      </div>
      {count !== undefined && (
        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
          {count}
        </span>
      )}
    </summary>
    <div className="pl-10 px-3 py-3 text-sm text-gray-700 flex flex-col gap-2 mt-2">
      {children}
    </div>
  </details>
);

const Accordion = ({ course, navigate }) => {
  // Check if course exists
  if (!course) {
    return (
      <div className="text-gray-500 text-center py-4">
        No course data available
      </div>
    );
  }

  const handleLessonClick = () => {
    if (!course._id) return;
    navigate(`/student/course/${course._id}/content`, {
      state: { course },
    });
  };

  // Check if course uses new hierarchical structure (Course → Chapter → Topic)
  const hasChapters = course?.chapters && course.chapters.length > 0;
  // Check for old hierarchical structure (Course → Topic → Chapter → Lesson)
  const hasTopics = course?.topics && course.topics.length > 0;
  // Check for old hierarchical structure (Course → Subject → Topic → SubTopic)
  const hasSubjects = course?.subjects && course.subjects.length > 0;
  // Check for old structure (Course → Lesson → Sublesson)
  const hasLessons = course?.lessons && course.lessons.length > 0;

  if (hasChapters) {
    // New hierarchical structure: Course → Chapter → Topic → Lesson
    return (
      <div className="flex flex-col gap-3">
        {course.chapters.map((chapter, chapterIndex) => {
          const topicCount = chapter.topics?.length || 0;
          const totalLessons = chapter.topics?.reduce((total, topic) => 
            total + (topic.lessons?.length || 0), 0) || 0;
          
          return (
            <AccordionItem
              key={`chapter-${chapterIndex}`}
              title={`Chapter ${chapterIndex + 1}: ${chapter.title}`}
              count={`${topicCount} Topic${topicCount !== 1 ? 's' : ''} • ${totalLessons} Lesson${totalLessons !== 1 ? 's' : ''}`}
              icon={FolderOpen}
            >
              {chapter.topics?.map((topic, topicIndex) => (
                <div key={`topic-${topicIndex}`} className="mb-3 border-l-4 border-blue-300 pl-4">
                  <details className="px-3 py-2 rounded-md bg-blue-50 border border-blue-100">
                    <summary className="cursor-pointer flex px-2 py-2 items-center justify-between gap-2 text-blue-800 font-semibold text-sm hover:bg-blue-100 rounded-md">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-700" />
                        <span>Topic: {topic.title}</span>
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        {topic.lessons?.length || 0} Lesson{(topic.lessons?.length || 0) !== 1 ? 's' : ''}
                      </span>
                    </summary>
                    <div className="pl-8 px-2 py-2 mt-2 space-y-1">
                      {topic.lessons?.map((lesson, lessonIndex) => (
                        <div
                          key={`lesson-${lessonIndex}`}
                          onClick={handleLessonClick}
                          className="px-3 py-2 flex items-center gap-2 text-green-800 font-semibold w-full cursor-pointer hover:bg-green-100 rounded-md transition-colors border-l-2 border-green-300 bg-white"
                        >
                          <PlayCircle className="h-4 w-4 text-green-700 flex-shrink-0" />
                          <span className="text-green-800 font-medium w-full font-poppins text-sm">
                            Lesson {lessonIndex + 1}: {lesson.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              ))}
            </AccordionItem>
          );
        })}
      </div>
    );
  } else if (hasTopics) {
    // Old hierarchical structure: Course → Topic → Chapter → Lesson
    return (
      <div className="flex flex-col gap-3">
        {course.topics.map((topic, topicIndex) => {
          const totalChapters = topic.chapters?.length || 0;
          const totalLessons = topic.chapters?.reduce((total, chapter) => 
            total + (chapter.lessons?.length || 0), 0) || 0;
          
          return (
            <AccordionItem
              key={`topic-${topicIndex}`}
              title={`Topic ${topicIndex + 1}: ${topic.title}`}
              count={`${totalChapters} Chapters • ${totalLessons} Lessons`}
              icon={FolderOpen}
            >
              {topic.chapters?.map((chapter, chapterIndex) => {
                const lessonCount = chapter.lessons?.length || 0;
                return (
                  <div key={`chapter-${chapterIndex}`} className="mb-3 border-l-4 border-blue-300 pl-4">
                    <details className="px-3 py-2 rounded-md bg-blue-50 border border-blue-100">
                      <summary className="cursor-pointer flex px-2 py-2 items-center justify-between gap-2 text-blue-800 font-semibold text-sm hover:bg-blue-100 rounded-md">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-700" />
                          <span>Chapter {chapterIndex + 1}: {chapter.title}</span>
                        </div>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          {lessonCount} Lesson{lessonCount !== 1 ? 's' : ''}
                        </span>
                      </summary>
                      <div className="pl-8 px-2 py-2 mt-2 space-y-1">
                        {chapter.lessons?.map((lesson, lessonIndex) => (
                          <div
                            key={`lesson-${lessonIndex}`}
                            onClick={handleLessonClick}
                            className="px-3 py-2 flex items-center gap-2 text-green-800 font-semibold w-full cursor-pointer hover:bg-green-100 rounded-md transition-colors border-l-2 border-green-300 bg-white"
                          >
                            <PlayCircle className="h-4 w-4 text-green-700 flex-shrink-0" />
                            <span className="text-green-800 font-medium w-full font-poppins text-sm">
                              Lesson {lessonIndex + 1}: {lesson.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                );
              })}
            </AccordionItem>
          );
        })}
      </div>
    );
  } else if (hasSubjects) {
    // Old hierarchical structure: Subject -> Topic -> SubTopic
    return (
      <div className="flex flex-col gap-3">
        {course.subjects.map((subject, subjectIndex) => {
          const totalTopics = subject.topics?.length || 0;
          const totalSubTopics = subject.topics?.reduce((total, topic) => 
            total + (topic.subTopics?.length || 0), 0) || 0;
          
          return (
            <AccordionItem
              key={`subject-${subjectIndex}`}
              title={`Subject ${subjectIndex + 1}: ${subject.title}`}
              count={`${totalTopics} Topics • ${totalSubTopics} Sub-topics`}
              icon={FolderOpen}
            >
              {subject.topics?.map((topic, topicIndex) => {
                const subTopicCount = topic.subTopics?.length || 0;
                return (
                  <div key={`topic-${topicIndex}`} className="mb-3 border-l-4 border-blue-300 pl-4">
                    <details className="px-3 py-2 rounded-md bg-blue-50 border border-blue-100">
                      <summary className="cursor-pointer flex px-2 py-2 items-center justify-between gap-2 text-blue-800 font-semibold text-sm hover:bg-blue-100 rounded-md">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-700" />
                          <span>Topic {topicIndex + 1}: {topic.title}</span>
                        </div>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          {subTopicCount} Sub-topic{subTopicCount !== 1 ? 's' : ''}
                        </span>
                      </summary>
                      <div className="pl-8 px-2 py-2 mt-2 space-y-1">
                        {topic.subTopics?.map((subTopic, subTopicIndex) => (
                          <div
                            key={`subtopic-${subTopicIndex}`}
                            onClick={handleLessonClick}
                            className="px-3 py-2 flex items-center gap-2 text-green-800 font-semibold w-full cursor-pointer hover:bg-green-100 rounded-md transition-colors border-l-2 border-green-300 bg-white"
                          >
                            <PlayCircle className="h-4 w-4 text-green-700 flex-shrink-0" />
                            <span className="text-green-800 font-medium w-full font-poppins text-sm">
                              {subTopicIndex + 1}. {subTopic.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                );
              })}
            </AccordionItem>
          );
        })}
      </div>
    );
  } else if (hasLessons) {
    // Old structure: Lesson -> Sublesson
    return (
      <div className="flex flex-col gap-3">
        {course.lessons.map((lesson, index) => {
          const sublessonCount = lesson.sublessons?.length || 0;
          return (
            <AccordionItem
              key={index + 1}
              title={`Lesson ${index + 1}: ${lesson.title}`}
              count={`${sublessonCount} Sub-lesson${sublessonCount !== 1 ? 's' : ''}`}
              icon={BookOpen}
            >
              {lesson.sublessons?.map((sublesson, subIndex) => (
                <div
                  key={subIndex}
                  onClick={handleLessonClick}
                  className="px-3 py-2 flex items-center gap-2 text-green-800 font-semibold w-full cursor-pointer hover:bg-green-100 rounded-md transition-colors border-l-2 border-green-300 bg-white"
                >
                  <PlayCircle className="h-4 w-4 text-green-700 flex-shrink-0" />
                  <span className="text-green-800 font-medium w-full font-poppins text-sm">
                    {subIndex + 1}. {sublesson.title}
                  </span>
                </div>
              ))}
            </AccordionItem>
          );
        })}
      </div>
    );
  } else {
    return (
      <div className="text-gray-500 text-center py-4">
        No content available
      </div>
    );
  }
};
