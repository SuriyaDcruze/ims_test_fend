import {
  AppWindowMac,
  ArrowLeft,
  Award,
  BookOpen,
  PlayCircle,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router";

function CourseDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const course = location.state?.course || null;

  const handleStart = () => {
    navigate(`/student/course/${course._id}/content`, {
      state: { course },
    });
  };

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
                <h2 className="font-semibold text-lg">Content</h2>
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

const AccordionItem = ({ title, children }) => (
  <details className="px-4 py-2 rounded-md transition-all duration-300 [open]:bg-green-400 shadow w-full bg-white">
    <summary className="cursor-pointer flex px-3 py-2 items-center gap-2 text-green-800 font-semibold">
      <BookOpen className="h-5 w-5" />
      <span>{title}</span>
    </summary>
    <div className="pl-10 px-3 py-2 text-sm text-gray-700 flex flex-col gap-2">
      {children}
    </div>
  </details>
);

const Accordion = ({ course, navigate }) => {
  const handleSubTopicClick = () => {
    navigate(`/student/course/${course._id}/content`, {
      state: { course },
    });
  };

  // Check if course uses hierarchical structure
  const hasSubjects = course.subjects && course.subjects.length > 0;
  const hasLessons = course.lessons && course.lessons.length > 0;

  if (hasSubjects) {
    // Hierarchical structure: Subject -> Topic -> SubTopic
    return (
      <div className="flex flex-col gap-1">
        {course.subjects.map((subject, subjectIndex) => (
          <AccordionItem
            key={`subject-${subjectIndex}`}
            title={`Subject ${subjectIndex + 1}: ${subject.title}`}
            className="bg-green-100"
          >
            {subject.topics?.map((topic, topicIndex) => (
              <div key={`topic-${topicIndex}`} className="mb-2">
                <details className="px-2 py-1 rounded-md bg-blue-50">
                  <summary className="cursor-pointer flex px-2 py-1 items-center gap-2 text-blue-800 font-semibold text-sm">
                    <BookOpen className="h-4 w-4" />
                    <span>Topic {topicIndex + 1}: {topic.title}</span>
                  </summary>
                  <div className="pl-6 px-2 py-1">
                    {topic.subTopics?.map((subTopic, subTopicIndex) => (
                      <div
                        key={`subtopic-${subTopicIndex}`}
                        onClick={handleSubTopicClick}
                        className="px-3 py-2 flex items-center gap-2 text-green-800 font-semibold w-full cursor-pointer hover:bg-green-200 rounded-md transition-colors"
                      >
                        <PlayCircle className="h-5 w-5 text-green-800" />
                        <span className="text-green-800 font-medium w-full font-poppins">
                          {subTopic.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            ))}
          </AccordionItem>
        ))}
      </div>
    );
  } else if (hasLessons) {
    // Old structure: Lesson -> Sublesson
    return (
      <div className="flex flex-col gap-1">
        {course.lessons.map((lesson, index) => (
          <AccordionItem
            key={index + 1}
            title={lesson.title}
            className="bg-green-100"
          >
            {lesson.sublessons?.map((sublesson, index) => (
              <div
                key={index}
                onClick={handleSubTopicClick}
                className="px-3 py-2 flex items-center gap-2 text-green-800 font-semibold w-full cursor-pointer hover:bg-green-200 rounded-md transition-colors"
              >
                <PlayCircle className="h-5 w-5 text-green-800" />
                <span className="text-green-800 font-medium w-full font-poppins">
                  {sublesson.title}
                </span>
              </div>
            ))}
          </AccordionItem>
        ))}
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
