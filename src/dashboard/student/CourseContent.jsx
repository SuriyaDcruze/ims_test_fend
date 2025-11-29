import React, { useEffect, useState, useRef } from "react";
import {
  ArrowLeft,
  BookCheck,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  PlayCircle,
  Maximize2,
  Minimize2,
  FileText,
} from "lucide-react";
// import * as pdfjsLib from "pdfjs-dist";
// import pdfjsWorker from "pdfjs-dist/build/pdf.worker.entry";

import { useParams } from "react-router";
import {
  GetCourseProgress,
  CourseProgressPost,
  GetCourseById,
  SubmitAnswers,
} from "../../service/api";

const UserInfo = JSON.parse(localStorage.getItem("loginData"));

function CourseContent() {
  const { id } = useParams();
  const videoRef = useRef(null);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentContent, setCurrentContent] = useState(null);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [currentSubLessonIndex, setCurrentSubLessonIndex] = useState(0);
  // For new hierarchical structure: Course → Chapter → Topic → Lesson
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
  const [currentLessonIndexInTopic, setCurrentLessonIndexInTopic] = useState(0);
  // For old hierarchical structure: Course → Topic → Chapter → Lesson
  const [currentTopicIndexOld, setCurrentTopicIndexOld] = useState(0);
  const [currentChapterIndexOld, setCurrentChapterIndexOld] = useState(0);
  const [currentLessonIndexInChapter, setCurrentLessonIndexInChapter] = useState(0);
  // For old hierarchical structure: Course → Subject → Topic → SubTopic
  const [currentSubjectIndex, setCurrentSubjectIndex] = useState(0);
  const [currentSubjectTopicIndex, setCurrentSubjectTopicIndex] = useState(0);
  const [currentSubTopicIndex, setCurrentSubTopicIndex] = useState(0);
  const [activeAccordion, setActiveAccordion] = useState(null);
  const [completedExercises, setCompletedExercises] = useState(new Set());
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [isPdfMaximized, setIsPdfMaximized] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [marks, setMarks] = useState(0);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        if (!id) {
          throw new Error("Course ID is required");
        }

        // Check for authentication
        if (!UserInfo?.token) {
          throw new Error("Please log in to access this course");
        }

        const courseData = await GetCourseById(id);
        if (!courseData) {
          throw new Error("Course not found");
        }

        // Normalize course data - support all structures
        const normalizedData = {
          _id: courseData._id,
          title: courseData.title || "Untitled Course",
          thumbnail: courseData.thumbnail || "",
          description: courseData.description || "",
          // New hierarchical structure: Course → Chapter → Topic → Lesson
          chapters: courseData.chapters?.map((chapter) => ({
            title: chapter.title || "Untitled Chapter",
            topics: chapter.topics?.map((topic) => ({
              title: topic.title || "Untitled Topic",
              lessons: topic.lessons?.map((lesson) => ({
                title: lesson.title || "Untitled Lesson",
                file: lesson.file
                  ? {
                      url: lesson.file.url,
                      type: lesson.file.type.includes("pdf")
                        ? "pdf"
                        : lesson.file.type.includes("video")
                        ? "video"
                        : lesson.file.type.includes("audio")
                        ? "audio"
                        : lesson.file.type,
                    }
                  : undefined,
                test: lesson.test
                  ? { questions: lesson.test.questions || [] }
                  : { questions: [] },
              })) || [],
            })) || [],
          })) || [],
          // Old hierarchical structure: Course → Topic → Chapter → Lesson
          topics: courseData.topics?.map((topic) => ({
            title: topic.title || "Untitled Topic",
            chapters: topic.chapters?.map((chapter) => ({
              title: chapter.title || "Untitled Chapter",
              lessons: chapter.lessons?.map((lesson) => ({
                title: lesson.title || "Untitled Lesson",
                file: lesson.file
                  ? {
                      url: lesson.file.url,
                      type: lesson.file.type.includes("pdf")
                        ? "pdf"
                        : lesson.file.type.includes("video")
                        ? "video"
                        : lesson.file.type.includes("audio")
                        ? "audio"
                        : lesson.file.type,
                    }
                  : undefined,
                test: lesson.test
                  ? { questions: lesson.test.questions || [] }
                  : { questions: [] },
              })) || [],
            })) || [],
          })) || [],
          // Old hierarchical structure: Course → Subject → Topic → SubTopic (for backward compatibility)
          subjects: courseData.subjects?.map((subject) => ({
            title: subject.title || "Untitled Subject",
            topics: subject.topics?.map((topic) => ({
              title: topic.title || "Untitled Topic",
              subTopics: topic.subTopics?.map((subTopic) => ({
                title: subTopic.title || "Untitled SubTopic",
                file: subTopic.file
                  ? {
                      url: subTopic.file.url,
                      type: subTopic.file.type.includes("pdf")
                        ? "pdf"
                        : subTopic.file.type.includes("video")
                        ? "video"
                        : subTopic.file.type.includes("audio")
                        ? "audio"
                        : subTopic.file.type,
                    }
                  : undefined,
                test: subTopic.test
                  ? { questions: subTopic.test.questions || [] }
                  : { questions: [] },
              })) || [],
            })) || [],
          })) || [],
          // Old structure: Course → Lesson → Sublesson (for backward compatibility)
          lessons: courseData.lessons?.map((lesson) => ({
            title: lesson.title || "Untitled Lesson",
            sublessons: lesson.sublessons?.map((sub) => ({
              title: sub.title || "Untitled Sublesson",
              file: sub.file
                ? {
                    url: sub.file.url,
                    type: sub.file.type.includes("pdf")
                      ? "pdf"
                      : sub.file.type.includes("video")
                      ? "video"
                      : sub.file.type.includes("audio")
                      ? "audio"
                      : sub.file.type,
                  }
                : undefined,
              test: sub.test
                ? { questions: sub.test.questions || [] }
                : { questions: [] },
            })) || [],
          })) || [],
        };

        setCourse(normalizedData);
        
        // Initialize with first available content
        if (normalizedData?.chapters?.[0]?.topics?.[0]?.lessons?.[0]) {
          // New hierarchical structure: Course → Chapter → Topic → Lesson
          handleContentSelect(
            normalizedData.chapters[0].topics[0].lessons[0],
            0, // chapterIndex
            0, // topicIndex
            0  // lessonIndex
          );
        } else if (normalizedData?.topics?.[0]?.chapters?.[0]?.lessons?.[0]) {
          // Old hierarchical structure: Course → Topic → Chapter → Lesson
          handleContentSelect(
            normalizedData.topics[0].chapters[0].lessons[0],
            0, // topicIndex
            0, // chapterIndex
            0  // lessonIndex
          );
        } else if (normalizedData?.subjects?.[0]?.topics?.[0]?.subTopics?.[0]) {
          // Old hierarchical structure: Course → Subject → Topic → SubTopic
          handleContentSelect(
            normalizedData.subjects[0].topics[0].subTopics[0],
            0, // subjectIndex
            0, // topicIndex
            0  // subTopicIndex
          );
        } else if (normalizedData?.lessons?.[0]?.sublessons?.[0]) {
          // Old structure: Course → Lesson → Sublesson
          handleContentSelect(normalizedData.lessons[0].sublessons[0], 0, 0);
        } else {
          setError("No content available for this course");
        }
      } catch (err) {
        setError(err.message || "Failed to load course");
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id]);

  useEffect(() => {
  const fetchCourseProgress = async () => {
    try {
      const res = await GetCourseProgress(UserInfo.user._id, id);
      const completed = new Set();
      const progressData = res?.progress;
      
      // Handle different structure types for progress
      if (progressData) {
        // New structure: chapters -> topics -> lessons
        if (course?.chapters && progressData.completedLessons) {
          progressData.completedLessons.forEach((lesson) => {
            if (lesson.chapterIndex !== undefined && lesson.topicIndex !== undefined && lesson.lessonIndex !== undefined) {
              completed.add(`${lesson.chapterIndex}-${lesson.topicIndex}-${lesson.lessonIndex}`);
            }
          });
        }
        // Old structure: lessons -> sublessons
        else if (progressData.completedLessons && Array.isArray(progressData.completedLessons)) {
          progressData.completedLessons.forEach((lesson) => {
            if (lesson.sublessons && Array.isArray(lesson.sublessons)) {
              lesson.sublessons.forEach((subLesson) => {
                if (subLesson.isCompleted && lesson.lessonIndex !== undefined && subLesson.sublessonIndex !== undefined) {
                  completed.add(
                    `${lesson.lessonIndex}-${subLesson.sublessonIndex}`
                  );
                }
              });
            }
          });
        }
      }
      
      setCompletedExercises(completed);
    } catch (error) {
      console.error("Failed to fetch course progress:", error);
      // Set empty set on error to avoid breaking the UI
      setCompletedExercises(new Set());
    }
  };

  if (UserInfo?.user?._id && id && course) {
    fetchCourseProgress();
  }
}, [id, course]);


  // useEffect(() => {
  //   const fetchCourseProgress = async () => {
  //     try {
  //       const res = await GetCourseProgress({
  //         userId: UserInfo.user._id,
  //         courseId: id,
  //       });
  //       const completed = new Set();
  //       const progressData = res.progress;
  //       progressData.completedLessons.forEach((lesson) => {
  //         lesson.sublessons?.forEach((subLesson) => {
  //           if (subLesson.isCompleted) {
  //             completed.add(
  //               `${lesson.lessonIndex}-${subLesson.sublessonIndex}`
  //             );
  //           }
  //         });
  //       });
  //       setCompletedExercises(completed);
  //     } catch (error) {
  //       console.error("Failed to fetch course progress:", error);
  //       console.log("User ID:", UserInfo?.user?._id, "Course ID:", id);

  //     }
  //   };
  //   if (UserInfo?.user?._id && id) {
  //     fetchCourseProgress();
  //   }
  // }, [id]);

  const handleContentSelect = (content, index1, index2, index3 = null) => {
    if (!content || !course) return;
    
    // Determine structure type based on course data and indices
    const isNewHierarchical = course?.chapters && course.chapters.length > 0 && index3 !== null;
    const isOldTopicHierarchical = course?.topics && course.topics.length > 0 && index3 !== null && !isNewHierarchical;
    const isOldHierarchical = course?.subjects && course.subjects.length > 0 && index3 !== null && !isOldTopicHierarchical;
    
    const contentData = {
      ...content,
      lessonNo: isNewHierarchical ? index1 + 1 : isOldTopicHierarchical ? index1 + 1 : isOldHierarchical ? index1 + 1 : index1 + 1,
      exerciseNo: isNewHierarchical ? index3 + 1 : isOldTopicHierarchical ? index3 + 1 : isOldHierarchical ? index3 + 1 : index2 + 1,
      type: content.test?.questions?.length > 0 ? "test" : content.file?.type || "unknown",
      structureType: isNewHierarchical ? "new" : isOldTopicHierarchical ? "old_topic_hierarchical" : isOldHierarchical ? "old_hierarchical" : "old",
    };
    
    setCurrentContent(contentData);
    
    if (isNewHierarchical) {
      // New hierarchical structure: Course → Chapter → Topic → Lesson
      setCurrentChapterIndex(index1);
      setCurrentTopicIndex(index2);
      setCurrentLessonIndexInTopic(index3);
      setActiveAccordion(index1);
    } else if (isOldTopicHierarchical) {
      // Old hierarchical structure: Course → Topic → Chapter → Lesson
      setCurrentTopicIndexOld(index1);
      setCurrentChapterIndexOld(index2);
      setCurrentLessonIndexInChapter(index3);
      setActiveAccordion(index1);
    } else if (isOldHierarchical) {
      // Old hierarchical structure: Course → Subject → Topic → SubTopic
      setCurrentSubjectIndex(index1);
      setCurrentSubjectTopicIndex(index2);
      setCurrentSubTopicIndex(index3);
      setActiveAccordion(index1);
    } else {
      // Old structure: Course → Lesson → Sublesson
      setCurrentLessonIndex(index1);
      setCurrentSubLessonIndex(index2);
      setActiveAccordion(index1);
    }
    
    setAnswers({});
    setSubmitted(false);
    setIsPdfMaximized(false);
    setCurrentQuestionIndex(0);
    setMarks(0);
  };

  const handleAnswerChange = (questionIndex, option) => {
    if (!submitted) {
      setAnswers((prev) => ({ ...prev, [questionIndex]: option }));
      // Automatically move to next question or stay on last
      if (questionIndex < currentContent.test.questions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
      }
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < currentContent.test.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handleTestSubmit = async () => {
    setSubmitted(true);
    let calculatedMarks = 0;
    const answerPayload = currentContent.test.questions.map((q, i) => {
      const isCorrect = answers[i] === q.answer;
      if (isCorrect) {
        calculatedMarks += 1; // 1 mark per correct answer
      }
      return {
        question: q.question,
        selected: answers[i] || "",
        correct: q.answer,
      };
    });
    setMarks(calculatedMarks);

    // Submit answers to the API
    try {
      await SubmitAnswers({
        courseId: course._id,
        sublessonIndex: currentSubLessonIndex,
        payload: {
          answers: answerPayload,
          sublessonTitle: currentContent.title,
        },
      });
    } catch (error) {
      console.error("Failed to submit answers to API:", error);
    }

    // Store test result in localStorage
    const testResult = {
      courseId: course._id,
      courseTitle: course.title,
      sublessonTitle: currentContent.title,
      marks: calculatedMarks,
      totalMarks: currentContent.test.questions.length,
      timestamp: new Date().toISOString(),
    };

    const existingResults = JSON.parse(localStorage.getItem("testResults") || "[]");
    existingResults.push(testResult);
    localStorage.setItem("testResults", JSON.stringify(existingResults));

    // Mark as completed if all answers are correct
    if (calculatedMarks === currentContent.test.questions.length) {
      await markAsCompleted();
    }
  };

  const handleVideoClick = () => {
    if (videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.error("Video play error:", err);
      });
    }
  };

  const togglePdfMaximize = () => {
    setIsPdfMaximized((prev) => !prev);
  };

  const renderContent = () => {
    if (!currentContent) {
      return (
        <div className="flex items-center justify-center h-full">
          <p>Select a lesson to begin</p>
        </div>
      );
    }

    if (currentContent.type === "test") {
      if (!currentContent.test.questions?.length) {
        return (
          <div className="flex items-center justify-center h-full">
            <p>No test questions available</p>
          </div>
        );
      }

      const currentQuestion = currentContent.test.questions[currentQuestionIndex];
      const isFirstQuestion = currentQuestionIndex === 0;
      const isLastQuestion = currentQuestionIndex === currentContent.test.questions.length - 1;
      const totalQuestions = currentContent.test.questions.length;

      return (
        <div className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold mb-6 font-poppins">{currentContent.title}</h2>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-3 font-poppins">
                Question {currentQuestionIndex + 1} of {totalQuestions}:{" "}
                {currentQuestion.question}
              </h3>
              <ul className="space-y-2">
                {currentQuestion.options?.map((opt, j) => (
                  <li key={j} className="flex items-center">
                    <input
                      type="radio"
                      id={`q${currentQuestionIndex}-opt${j}`}
                      name={`question-${currentQuestionIndex}`}
                      className="mr-2"
                      checked={answers[currentQuestionIndex] === opt}
                      onChange={() => handleAnswerChange(currentQuestionIndex, opt)}
                      disabled={submitted}
                    />
                    <label
                      htmlFor={`q${currentQuestionIndex}-opt${j}`}
                      className={`flex-1 ${
                        submitted
                          ? opt === answers[currentQuestionIndex] &&
                            answers[currentQuestionIndex] === currentQuestion.answer
                            ? "text-green-600 font-semibold"
                            : answers[currentQuestionIndex] === opt
                            ? "text-red-600"
                            : ""
                          : ""
                      }`}
                    >
                      {opt}
                    </label>
                    {submitted &&
                      opt === answers[currentQuestionIndex] &&
                      answers[currentQuestionIndex] === currentQuestion.answer && (
                        <span className="ml-2 text-green-600">✓ Correct</span>
                      )}
                    {submitted &&
                      answers[currentQuestionIndex] === opt &&
                      answers[currentQuestionIndex] !== currentQuestion.answer && (
                        <span className="ml-2 text-red-600">✗ Incorrect</span>
                      )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-6 flex gap-4">
            {!isFirstQuestion && !submitted && (
              <button
                onClick={handlePreviousQuestion}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 font-poppins"
              >
                Previous
              </button>
            )}
            {!isLastQuestion && !submitted && (
              <button
                onClick={handleNextQuestion}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-poppins"
              >
                Next
              </button>
            )}
            {isLastQuestion && !submitted && (
              <button
                onClick={handleTestSubmit}
                disabled={Object.keys(answers).length !== totalQuestions}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 font-poppins"
              >
                Submit Test
              </button>
            )}
            {submitted && (
              <div className="text-lg font-semibold font-poppins">
                Marks: {marks} / {totalQuestions}
              </div>
            )}
            {submitted && (
              <button
                onClick={() => {
                  setSubmitted(false);
                  setAnswers({});
                  setCurrentQuestionIndex(0);
                  setMarks(0);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      );
    }

    if (currentContent.type === "video") {
      if (!currentContent.file?.url) {
        return (
          <div className="flex items-center justify-center h-full">
            <p>Video content unavailable</p>
          </div>
        );
      }
      return (
        <div className="w-full h-full relative flex flex-col">
          <video
            ref={videoRef}
            controls
            controlsList="nodownload"
            onContextMenu={(e) => e.preventDefault()}
            className="w-full h-full rounded-md"
            onClick={handleVideoClick}
            onEnded={() => markAsCompleted()}
          >
            <source src={currentContent.file.url} type="video/mp4" />
            Your browser doesn't support videos
          </video>
          {videoRef.current?.readyState < 2 && videoRef.current?.networkState === 2 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <p className="text-white">Loading video...</p>
            </div>
          )}
        </div>
      );
    }

    if (currentContent.type === "audio") {
      if (!currentContent.file?.url) {
        return (
          <div className="flex items-center justify-center h-full">
            <p>Audio content unavailable</p>
          </div>
        );
      }
      return (
        <div className="flex flex-col items-center justify-center h-full relative">
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover rounded-md"
          />
          <audio
            controls
            controlsList="nodownload"
            onContextMenu={(e) => e.preventDefault()}
            className="w-full absolute bottom-0 bg-white p-2"
            onEnded={() => markAsCompleted()}
          >
            <source src={currentContent.file.url} type="audio/mpeg" />
            Your browser doesn't support audio
          </audio>
        </div>
      );
    }

    if (currentContent.type === "pdf") {
      if (!currentContent.file?.url) {
        return (
          <div className="flex items-center justify-center h-full">
            <p>PDF content unavailable</p>
          </div>
        );
      }
      return (
        <div
          className={`flex flex-col ${
            isPdfMaximized ? "fixed inset-0 z-50 bg-white" : "h-full"
          }`}
        >
          <div className="flex justify-between items-center p-2">
            <button
              onClick={() => markAsCompleted()}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Mark as Complete
            </button>
            <button
              onClick={togglePdfMaximize}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
            >
              {isPdfMaximized ? (
                <>
                  <Minimize2 className="h-5 w-5" /> Minimize
                </>
              ) : (
                <>
                  <Maximize2 className="h-5 w-5" /> Maximize
                </>
              )}
            </button>
          </div>
          <iframe
            src={`${currentContent.file.url}#toolbar=0`}
            title="PDF Viewer"
            className={`w-full ${
              isPdfMaximized ? "h-[calc(100vh-4rem)]" : "h-full"
            } rounded-md`}
          />
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center h-full">
        <p>Unsupported content type: {currentContent.type}</p>
      </div>
    );
  };

  const markAsCompleted = async () => {
    const exerciseKey = `${currentLessonIndex}-${currentSubLessonIndex}`;
    setCompletedExercises((prev) => new Set([...prev, exerciseKey]));
    const payload = {
      lessonIndex: currentLessonIndex,
      sublessonIndex: currentSubLessonIndex,
    };
    try {
      await CourseProgressPost(
  UserInfo.user._id,
  id,
  payload
);
      // await CourseProgressPost({
      //   userId: UserInfo.user._id,
      //   courseId: id,
      //   payload: payload,
      // });
    } catch (error) {
      console.error("Failed to update course progress:", error);
    }
  };

  const calculateProgress = () => {
    let totalExercises = 0;
    
    // Check for new hierarchical structure: Course → Chapter → Topic → Lesson
    if (course?.chapters && course.chapters.length > 0) {
      course.chapters.forEach((chapter) => {
        chapter.topics?.forEach((topic) => {
          topic.lessons?.forEach(() => {
            totalExercises++;
          });
        });
      });
    } 
    // Check for old hierarchical structure: Course → Topic → Chapter → Lesson
    else if (course?.topics && course.topics.length > 0) {
      course.topics.forEach((topic) => {
        topic.chapters?.forEach((chapter) => {
          chapter.lessons?.forEach(() => {
            totalExercises++;
          });
        });
      });
    } 
    // Check for old hierarchical structure: Course → Subject → Topic → SubTopic
    else if (course?.subjects && course.subjects.length > 0) {
      course.subjects.forEach((subject) => {
        subject.topics?.forEach((topic) => {
          topic.subTopics?.forEach(() => {
            totalExercises++;
          });
        });
      });
    }
    // Check for old structure: Course → Lesson → Sublesson
    else if (course?.lessons) {
      totalExercises = course.lessons.reduce(
        (total, lesson) => total + (lesson.sublessons?.length || 0),
        0
      );
    }
    
    return totalExercises > 0
      ? Math.round((completedExercises.size / totalExercises) * 100)
      : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading course content...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <p className="text-red-500 mb-4">Error: {error}</p>
        <button
          onClick={() => (window.location.href = "/student/course")}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Go to Course List
        </button>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>No course data available</p>
      </div>
    );
  }

  const progress = calculateProgress();

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)] bg-gray-200 gap-4 p-2 sm:p-4 lg:grid lg:grid-cols-4 lg:gap-6 lg:p-6">
      <div className="flex flex-col gap-4 lg:col-span-1 lg:h-full">
        <div className="p-4 bg-white shadow-sm rounded-lg flex flex-col gap-2">
          <button
            className="flex items-center gap-2 text-green-800 font-semibold text-sm mb-2"
            onClick={() => (window.location.href = "/student/course")}
          >
            <ArrowLeft className="h-4 w-4" />
            Courses
          </button>
          <div className="h-40 sm:h-30 lg:h-48">
            <img
              src={course.thumbnail}
              alt={course.title}
              className="bg-green-50 object-cover object-center w-full h-full rounded-md shadow-sm"
            />
          </div>
          <h2 className="text-sm sm:text-base lg:text-lg font-semibold">{course.title}</h2>
          <div className="flex flex-col gap-2 items-end w-full">
            <p className="text-xs lg:text-sm">{progress}% Completed</p>
            <div className="h-3 bg-green-300 relative w-full rounded-full overflow-hidden">
              <div
                className="absolute bg-green-700 left-0 h-full transition-transform duration-300 ease-in-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
        <div className="bg-white shadow-sm rounded-lg flex flex-col flex-1 overflow-hidden">
          <h3 className="text-sm sm:text-base lg:text-lg uppercase font-semibold p-4">
            Contents
          </h3>
          <div className="overflow-y-auto max-h-[50vh] sm:max-h-[60vh] lg:max-h-[calc(100vh-20rem)] flex-1">
            {!course ? (
              <div className="p-4 text-center text-gray-500">
                Loading course content...
              </div>
            ) : (
              <>
            {/* New Hierarchical Structure: Course → Chapter → Topic */}
            {course?.chapters && course.chapters.length > 0 ? (
              course.chapters.map((chapter, chapterIndex) => {
                return (
                  <div key={`chapter-${chapterIndex}`} className="shadow-sm rounded mb-2 bg-white mx-2">
                    <button
                      onClick={() =>
                        setActiveAccordion(
                          activeAccordion === chapterIndex ? null : chapterIndex
                        )
                      }
                      className={`w-full flex justify-between items-center p-3 px-4 gap-2 text-left text-sm font-medium hover:bg-green-100 focus:outline-none ${
                        "bg-white text-gray-900"
                      }`}
                    >
                      <span className="flex items-center gap-2 text-sm lg:text-base font-semibold leading-6">
                        <BookOpen className="h-5 w-5" />
                        Chapter {chapterIndex + 1}: {chapter.title}
                      </span>
                      <svg
                        className={`w-4 h-4 transition-transform ${
                          activeAccordion === chapterIndex ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                    <div
                      className={`overflow-hidden transition-max-height duration-300 text-sm font-medium leading-6 tracking-wider text-gray-700 ${
                        activeAccordion === chapterIndex ? "max-h-full" : "max-h-0"
                      }`}
                    >
                      {chapter.topics?.map((topic, topicIndex) => (
                        <div key={`topic-${topicIndex}`} className="border-l-2 border-blue-200 ml-4">
                          <details className="px-2 py-1 bg-blue-50 border border-blue-100">
                            <summary className="cursor-pointer flex px-2 py-2 items-center justify-between gap-2 text-blue-800 font-semibold text-xs hover:bg-blue-100">
                              <div className="flex items-center gap-2">
                                <FileText className="h-3 w-3 text-blue-700" />
                                <span>Topic: {topic.title}</span>
                              </div>
                              <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                                {topic.lessons?.length || 0}
                              </span>
                            </summary>
                            <div className="pl-4 px-2 py-1">
                              {topic.lessons?.map((lesson, lessonIndex) => {
                                const isCompleted = completedExercises.has(
                                  `${chapterIndex}-${topicIndex}-${lessonIndex}`
                                );
                                const isActive =
                                  currentChapterIndex === chapterIndex &&
                                  currentTopicIndex === topicIndex &&
                                  currentLessonIndexInTopic === lessonIndex;
                                return (
                                  <button
                                    key={`lesson-${lessonIndex}`}
                                    onClick={() =>
                                      handleContentSelect(
                                        lesson,
                                        chapterIndex,
                                        topicIndex,
                                        lessonIndex
                                      )
                                    }
                                    className={`p-2 px-3 flex w-full text-xs sm:text-sm font-semibold items-center gap-2 hover:bg-green-200 rounded-md ${
                                      isCompleted ? "bg-green-100 text-green-800" : ""
                                    } ${
                                      isActive ? "bg-blue-100 text-blue-600" : ""
                                    }`}
                                  >
                                    {isCompleted ? (
                                      <Check className="h-3 w-3" />
                                    ) : lesson.test?.questions?.length > 0 ? (
                                      <BookCheck className="h-3 w-3" />
                                    ) : (
                                      <PlayCircle className="h-3 w-3" />
                                    )}
                                    <span className="text-left">Lesson {lessonIndex + 1}: {lesson.title}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </details>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            ) : course?.topics && course.topics.length > 0 ? (
              /* Old Hierarchical Structure: Course → Topic → Chapter → Lesson */
              course.topics.map((topic, topicIndex) => {
                return (
                  <div key={`topic-${topicIndex}`} className="shadow-sm rounded mb-2 bg-white mx-2">
                    <button
                      onClick={() =>
                        setActiveAccordion(
                          activeAccordion === topicIndex ? null : topicIndex
                        )
                      }
                      className={`w-full flex justify-between items-center p-3 px-4 gap-2 text-left text-sm font-medium hover:bg-green-100 focus:outline-none ${
                        "bg-white text-gray-900"
                      }`}
                    >
                      <span className="flex items-center gap-2 text-sm lg:text-base font-semibold leading-6">
                        <BookOpen className="h-5 w-5" />
                        Topic {topicIndex + 1}: {topic.title}
                      </span>
                      <svg
                        className={`w-4 h-4 transition-transform ${
                          activeAccordion === topicIndex ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                    <div
                      className={`overflow-hidden transition-max-height duration-300 text-sm font-medium leading-6 tracking-wider text-gray-700 ${
                        activeAccordion === topicIndex ? "max-h-full" : "max-h-0"
                      }`}
                    >
                      {topic.chapters?.map((chapter, chapterIndex) => (
                        <div key={`chapter-${chapterIndex}`} className="border-l-2 border-blue-200 ml-4">
                          <div className="p-2 bg-blue-50">
                            <p className="text-xs font-semibold text-blue-800">
                              Chapter {chapterIndex + 1}: {chapter.title}
                            </p>
                          </div>
                          {chapter.lessons?.map((lesson, lessonIndex) => {
                            const isCompleted = completedExercises.has(
                              `${topicIndex}-${chapterIndex}-${lessonIndex}`
                            );
                            const isActive =
                              currentTopicIndexOld === topicIndex &&
                              currentChapterIndexOld === chapterIndex &&
                              currentLessonIndexInChapter === lessonIndex;
                            return (
                              <button
                                key={`lesson-${lessonIndex}`}
                                onClick={() =>
                                  handleContentSelect(
                                    lesson,
                                    topicIndex,
                                    chapterIndex,
                                    lessonIndex
                                  )
                                }
                                className={`p-3 px-4 flex w-full text-xs sm:text-sm lg:text-base font-semibold items-center gap-2 hover:bg-green-200 ${
                                  isCompleted ? "bg-green-100 text-green-800" : ""
                                } ${
                                  isActive ? "bg-blue-100 text-blue-600" : ""
                                }`}
                              >
                                {isCompleted ? (
                                  <Check />
                                ) : lesson.test?.questions?.length > 0 ? (
                                  <BookCheck />
                                ) : (
                                  <PlayCircle />
                                )}
                                {lesson.title}
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            ) : course?.subjects && course.subjects.length > 0 ? (
              /* Old Hierarchical Structure: Course → Subject → Topic → SubTopic */
              course.subjects.map((subject, subjectIndex) => {
                return (
                  <div key={`subject-${subjectIndex}`} className="shadow-sm rounded mb-2 bg-white mx-2">
                    <button
                      onClick={() =>
                        setActiveAccordion(
                          activeAccordion === subjectIndex ? null : subjectIndex
                        )
                      }
                      className={`w-full flex justify-between items-center p-3 px-4 gap-2 text-left text-sm font-medium hover:bg-green-100 focus:outline-none ${
                        "bg-white text-gray-900"
                      }`}
                    >
                      <span className="flex items-center gap-2 text-sm lg:text-base font-semibold leading-6">
                        <BookOpen className="h-5 w-5" />
                        Subject {subjectIndex + 1}: {subject.title}
                      </span>
                      <svg
                        className={`w-4 h-4 transition-transform ${
                          activeAccordion === subjectIndex ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                    <div
                      className={`overflow-hidden transition-max-height duration-300 text-sm font-medium leading-6 tracking-wider text-gray-700 ${
                        activeAccordion === subjectIndex ? "max-h-full" : "max-h-0"
                      }`}
                    >
                      {subject.topics?.map((topic, topicIndex) => (
                        <div key={`topic-${topicIndex}`} className="border-l-2 border-blue-200 ml-4">
                          <div className="p-2 bg-blue-50">
                            <p className="text-xs font-semibold text-blue-800">
                              Topic {topicIndex + 1}: {topic.title}
                            </p>
                          </div>
                          {topic.subTopics?.map((subTopic, subTopicIndex) => {
                            const isCompleted = completedExercises.has(
                              `${subjectIndex}-${topicIndex}-${subTopicIndex}`
                            );
                            const isActive =
                              currentSubjectIndex === subjectIndex &&
                              currentSubjectTopicIndex === topicIndex &&
                              currentSubTopicIndex === subTopicIndex;
                            return (
                              <button
                                key={`subtopic-${subTopicIndex}`}
                                onClick={() =>
                                  handleContentSelect(
                                    subTopic,
                                    subjectIndex,
                                    topicIndex,
                                    subTopicIndex
                                  )
                                }
                                className={`p-3 px-4 flex w-full text-xs sm:text-sm lg:text-base font-semibold items-center gap-2 hover:bg-green-200 ${
                                  isCompleted ? "bg-green-100 text-green-800" : ""
                                } ${
                                  isActive ? "bg-blue-100 text-blue-600" : ""
                                }`}
                              >
                                {isCompleted ? (
                                  <Check />
                                ) : subTopic.test?.questions?.length > 0 ? (
                                  <BookCheck />
                                ) : (
                                  <PlayCircle />
                                )}
                                {subTopic.title}
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            ) : course?.lessons && course.lessons.length > 0 ? (
              /* Old Structure */
              course.lessons.map((lesson, lessonIndex) => {
                const isLessonCompleted = lesson.sublessons?.every(
                  (_, subLessonIndex) =>
                    completedExercises.has(`${lessonIndex}-${subLessonIndex}`)
                );
                return (
                  <div key={lessonIndex} className="shadow-sm rounded mb-2 bg-white mx-2">
                    <button
                      onClick={() =>
                        setActiveAccordion(
                          activeAccordion === lessonIndex ? null : lessonIndex
                        )
                      }
                      className={`w-full flex justify-between items-center p-3 px-4 gap-2 text-left text-sm font-medium hover:bg-green-100 focus:outline-none ${
                        isLessonCompleted
                          ? "bg-green-200 text-green-800 border border-green-300"
                          : "bg-white text-gray-900"
                      }`}
                    >
                      <span className="flex items-center gap-2 text-sm lg:text-base font-semibold leading-6">
                        {isLessonCompleted ? (
                          <BookCheck className="h-5 w-5" />
                        ) : (
                          <BookOpen className="h-5 w-5" />
                        )}
                        {lesson.title}
                      </span>
                      <svg
                        className={`w-4 h-4 transition-transform ${
                          activeAccordion === lessonIndex ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                    <div
                      className={`overflow-hidden transition-max-height duration-300 text-sm font-medium leading-6 tracking-wider text-gray-700 ${
                        activeAccordion === lessonIndex ? "max-h-full" : "max-h-0"
                      }`}
                    >
                      {lesson.sublessons?.map((subLesson, subLessonIndex) => {
                        const isCompleted = completedExercises.has(
                          `${lessonIndex}-${subLessonIndex}`
                        );
                        return (
                          <button
                            key={subLessonIndex}
                            onClick={() =>
                              handleContentSelect(
                                subLesson,
                                lessonIndex,
                                subLessonIndex
                              )
                            }
                            className={`p-3 px-4 flex w-full text-xs sm:text-sm lg:text-base font-semibold items-center gap-2 hover:bg-green-200 ${
                              isCompleted ? "bg-green-100 text-green-800" : ""
                            } ${
                              currentLessonIndex === lessonIndex &&
                              currentSubLessonIndex === subLessonIndex
                                ? "bg-blue-100 text-blue-600"
                                : ""
                            }`}
                          >
                            {isCompleted ? (
                              <Check />
                            ) : subLesson.test?.questions?.length > 0 ? (
                              <BookCheck />
                            ) : (
                              <PlayCircle />
                            )}
                            {subLesson.title}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-gray-500">
                No content available
              </div>
            )}
              </>
            )}
          </div>
        </div>
      </div>
      <div className="bg-white shadow-sm rounded-lg flex flex-col gap-4 h-auto lg:col-span-3 lg:h-full">
        <div className="flex justify-between items-center p-2 sm:p-4">
          <h2 className="text-sm sm:text-base lg:text-lg font-semibold">
            {currentContent?.title || course.title || "Course"}
            {currentContent && (
              <span className="text-gray-500 ml-2">
                {currentContent.lessonNo}.{currentContent.exerciseNo}
              </span>
            )}
          </h2>
          <div className="flex items-center gap-2">
            <button
              className="p-2 hover:bg-green-500 hover:text-white rounded-full disabled:opacity-50"
              onClick={handlePrevious}
              disabled={isFirstContent()}
            >
              <ChevronLeft />
            </button>
            <button
              className="p-2 hover:bg-green-500 hover:text-white rounded-full disabled:opacity-50"
              onClick={handleNext}
              disabled={isLastContent()}
            >
              <ChevronRight />
            </button>
          </div>
        </div>
        <div className="w-full aspect-video rounded-md overflow-hidden bg-gray-100 relative lg:h-[calc(100%-4rem)]">
          {renderContent()}
        </div>
      </div>
    </div>
  );

  function handlePrevious() {
    if (!course) return;
    // Check if using new hierarchical structure (Course → Chapter → Topic → Lesson)
    if (course.chapters && course.chapters.length > 0) {
      // New hierarchical structure navigation
      if (currentLessonIndexInTopic > 0) {
        const newIndex = currentLessonIndexInTopic - 1;
        handleContentSelect(
          course.chapters[currentChapterIndex].topics[currentTopicIndex].lessons[newIndex],
          currentChapterIndex,
          currentTopicIndex,
          newIndex
        );
      } else if (currentTopicIndex > 0) {
        const newTopicIndex = currentTopicIndex - 1;
        const prevTopic = course.chapters[currentChapterIndex].topics[newTopicIndex];
        const newLessonIndex = prevTopic.lessons.length - 1;
        handleContentSelect(
          prevTopic.lessons[newLessonIndex],
          currentChapterIndex,
          newTopicIndex,
          newLessonIndex
        );
      } else if (currentChapterIndex > 0) {
        const newChapterIndex = currentChapterIndex - 1;
        const prevChapter = course.chapters[newChapterIndex];
        const lastTopicIndex = prevChapter.topics.length - 1;
        const lastLessonIndex = prevChapter.topics[lastTopicIndex].lessons.length - 1;
        handleContentSelect(
          prevChapter.topics[lastTopicIndex].lessons[lastLessonIndex],
          newChapterIndex,
          lastTopicIndex,
          lastLessonIndex
        );
      }
    } else if (course.topics && course.topics.length > 0) {
      // Old hierarchical structure navigation (Course → Topic → Chapter → Lesson)
      if (currentLessonIndexInChapter > 0) {
        const newIndex = currentLessonIndexInChapter - 1;
        handleContentSelect(
          course.topics[currentTopicIndexOld].chapters[currentChapterIndexOld].lessons[newIndex],
          currentTopicIndexOld,
          currentChapterIndexOld,
          newIndex
        );
      } else if (currentChapterIndexOld > 0) {
        const newChapterIndex = currentChapterIndexOld - 1;
        const prevChapter = course.topics[currentTopicIndexOld].chapters[newChapterIndex];
        const newLessonIndex = prevChapter.lessons.length - 1;
        handleContentSelect(
          prevChapter.lessons[newLessonIndex],
          currentTopicIndexOld,
          newChapterIndex,
          newLessonIndex
        );
      } else if (currentTopicIndexOld > 0) {
        const newTopicIndex = currentTopicIndexOld - 1;
        const prevTopic = course.topics[newTopicIndex];
        const lastChapterIndex = prevTopic.chapters.length - 1;
        const lastLessonIndex = prevTopic.chapters[lastChapterIndex].lessons.length - 1;
        handleContentSelect(
          prevTopic.chapters[lastChapterIndex].lessons[lastLessonIndex],
          newTopicIndex,
          lastChapterIndex,
          lastLessonIndex
        );
      }
    } else if (course.subjects && course.subjects.length > 0) {
      // Old hierarchical structure navigation (Course → Subject → Topic → SubTopic)
      if (currentSubTopicIndex > 0) {
        const newIndex = currentSubTopicIndex - 1;
        handleContentSelect(
          course.subjects[currentSubjectIndex].topics[currentSubjectTopicIndex].subTopics[newIndex],
          currentSubjectIndex,
          currentSubjectTopicIndex,
          newIndex
        );
      } else if (currentSubjectTopicIndex > 0) {
        const newTopicIndex = currentSubjectTopicIndex - 1;
        const prevTopic = course.subjects[currentSubjectIndex].topics[newTopicIndex];
        const newSubTopicIndex = prevTopic.subTopics.length - 1;
        handleContentSelect(
          prevTopic.subTopics[newSubTopicIndex],
          currentSubjectIndex,
          newTopicIndex,
          newSubTopicIndex
        );
      } else if (currentSubjectIndex > 0) {
        const newSubjectIndex = currentSubjectIndex - 1;
        const prevSubject = course.subjects[newSubjectIndex];
        const lastTopicIndex = prevSubject.topics.length - 1;
        const lastSubTopicIndex = prevSubject.topics[lastTopicIndex].subTopics.length - 1;
        handleContentSelect(
          prevSubject.topics[lastTopicIndex].subTopics[lastSubTopicIndex],
          newSubjectIndex,
          lastTopicIndex,
          lastSubTopicIndex
        );
      }
    } else {
      // Old structure navigation (Course → Lesson → Sublesson)
      if (currentSubLessonIndex > 0) {
        const newIndex = currentSubLessonIndex - 1;
        handleContentSelect(
          course.lessons[currentLessonIndex].sublessons[newIndex],
          currentLessonIndex,
          newIndex
        );
      } else if (currentLessonIndex > 0) {
        const newLessonIndex = currentLessonIndex - 1;
        const prevLesson = course.lessons[newLessonIndex];
        const newSubIndex = prevLesson.sublessons.length - 1;
        handleContentSelect(
          prevLesson.sublessons[newSubIndex],
          newLessonIndex,
          newSubIndex
        );
      }
    }
  }

  function handleNext() {
    if (!course) return;
    // Check if using new hierarchical structure (Course → Chapter → Topic → Lesson)
    if (course.chapters && course.chapters.length > 0) {
      // New hierarchical structure navigation
      const currentChapter = course.chapters[currentChapterIndex];
      const currentTopic = currentChapter.topics[currentTopicIndex];
      
      if (currentLessonIndexInTopic < currentTopic.lessons.length - 1) {
        const newIndex = currentLessonIndexInTopic + 1;
        handleContentSelect(
          currentTopic.lessons[newIndex],
          currentChapterIndex,
          currentTopicIndex,
          newIndex
        );
      } else if (currentTopicIndex < currentChapter.topics.length - 1) {
        const newTopicIndex = currentTopicIndex + 1;
        handleContentSelect(
          currentChapter.topics[newTopicIndex].lessons[0],
          currentChapterIndex,
          newTopicIndex,
          0
        );
      } else if (currentChapterIndex < course.chapters.length - 1) {
        const newChapterIndex = currentChapterIndex + 1;
        handleContentSelect(
          course.chapters[newChapterIndex].topics[0].lessons[0],
          newChapterIndex,
          0,
          0
        );
      }
    } else if (course.topics && course.topics.length > 0) {
      // Old hierarchical structure navigation (Course → Topic → Chapter → Lesson)
      const currentTopic = course.topics[currentTopicIndexOld];
      const currentChapter = currentTopic.chapters[currentChapterIndexOld];
      
      if (currentLessonIndexInChapter < currentChapter.lessons.length - 1) {
        const newIndex = currentLessonIndexInChapter + 1;
        handleContentSelect(
          currentChapter.lessons[newIndex],
          currentTopicIndexOld,
          currentChapterIndexOld,
          newIndex
        );
      } else if (currentChapterIndexOld < currentTopic.chapters.length - 1) {
        const newChapterIndex = currentChapterIndexOld + 1;
        handleContentSelect(
          currentTopic.chapters[newChapterIndex].lessons[0],
          currentTopicIndexOld,
          newChapterIndex,
          0
        );
      } else if (currentTopicIndexOld < course.topics.length - 1) {
        const newTopicIndex = currentTopicIndexOld + 1;
        handleContentSelect(
          course.topics[newTopicIndex].chapters[0].lessons[0],
          newTopicIndex,
          0,
          0
        );
      }
    } else if (course.subjects && course.subjects.length > 0) {
      // Old hierarchical structure navigation (Course → Subject → Topic → SubTopic)
      const currentSubject = course.subjects[currentSubjectIndex];
      const currentTopic = currentSubject.topics[currentSubjectTopicIndex];
      
      if (currentSubTopicIndex < currentTopic.subTopics.length - 1) {
        const newIndex = currentSubTopicIndex + 1;
        handleContentSelect(
          currentTopic.subTopics[newIndex],
          currentSubjectIndex,
          currentSubjectTopicIndex,
          newIndex
        );
      } else if (currentSubjectTopicIndex < currentSubject.topics.length - 1) {
        const newTopicIndex = currentSubjectTopicIndex + 1;
        handleContentSelect(
          currentSubject.topics[newTopicIndex].subTopics[0],
          currentSubjectIndex,
          newTopicIndex,
          0
        );
      } else if (currentSubjectIndex < course.subjects.length - 1) {
        const newSubjectIndex = currentSubjectIndex + 1;
        handleContentSelect(
          course.subjects[newSubjectIndex].topics[0].subTopics[0],
          newSubjectIndex,
          0,
          0
        );
      }
    } else {
      // Old structure navigation (Course → Lesson → Sublesson)
      const currentLesson = course.lessons[currentLessonIndex];
      if (currentSubLessonIndex < currentLesson.sublessons.length - 1) {
        const newIndex = currentSubLessonIndex + 1;
        handleContentSelect(
          currentLesson.sublessons[newIndex],
          currentLessonIndex,
          newIndex
        );
      } else if (currentLessonIndex < course.lessons.length - 1) {
        const newLessonIndex = currentLessonIndex + 1;
        handleContentSelect(
          course.lessons[newLessonIndex].sublessons[0],
          newLessonIndex,
          0
        );
      }
    }
  }

  function isFirstContent() {
    if (!course) return false;
    if (course.chapters && course.chapters.length > 0) {
      // New hierarchical structure: Course → Chapter → Topic → Lesson
      return (
        currentChapterIndex === 0 &&
        currentTopicIndex === 0 &&
        currentLessonIndexInTopic === 0
      );
    } else if (course.topics && course.topics.length > 0) {
      // Old hierarchical structure: Course → Topic → Chapter → Lesson
      return (
        currentTopicIndexOld === 0 &&
        currentChapterIndexOld === 0 &&
        currentLessonIndexInChapter === 0
      );
    } else if (course.subjects && course.subjects.length > 0) {
      // Old hierarchical structure: Course → Subject → Topic → SubTopic
      return (
        currentSubjectIndex === 0 &&
        currentSubjectTopicIndex === 0 &&
        currentSubTopicIndex === 0
      );
    } else {
      // Old structure: Course → Lesson → Sublesson
      return (
        currentLessonIndex === 0 &&
        currentSubLessonIndex === 0
      );
    }
  }

  function isLastContent() {
    if (!course) return false;
    if (course.chapters && course.chapters.length > 0) {
      // New hierarchical structure: Course → Chapter → Topic → Lesson
      const lastChapter = course.chapters[course.chapters.length - 1];
      const lastTopic = lastChapter.topics[lastChapter.topics.length - 1];
      return (
        currentChapterIndex === course.chapters.length - 1 &&
        currentTopicIndex === lastChapter.topics.length - 1 &&
        currentLessonIndexInTopic === lastTopic.lessons.length - 1
      );
    } else if (course.topics && course.topics.length > 0) {
      // Old hierarchical structure: Course → Topic → Chapter → Lesson
      const lastTopic = course.topics[course.topics.length - 1];
      const lastChapter = lastTopic.chapters[lastTopic.chapters.length - 1];
      return (
        currentTopicIndexOld === course.topics.length - 1 &&
        currentChapterIndexOld === lastTopic.chapters.length - 1 &&
        currentLessonIndexInChapter === lastChapter.lessons.length - 1
      );
    } else if (course.subjects && course.subjects.length > 0) {
      // Old hierarchical structure: Course → Subject → Topic → SubTopic
      const lastSubject = course.subjects[course.subjects.length - 1];
      const lastTopic = lastSubject.topics[lastSubject.topics.length - 1];
      return (
        currentSubjectIndex === course.subjects.length - 1 &&
        currentSubjectTopicIndex === lastSubject.topics.length - 1 &&
        currentSubTopicIndex === lastTopic.subTopics.length - 1
      );
    } else {
      // Old structure: Course → Lesson → Sublesson
      return (
        currentLessonIndex === course.lessons.length - 1 &&
        currentSubLessonIndex ===
          course.lessons[currentLessonIndex].sublessons.length - 1
      );
    }
  }
}

export default CourseContent;