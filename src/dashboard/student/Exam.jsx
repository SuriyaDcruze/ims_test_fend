import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GetAllExams, GetUserExamResults } from '../../service/api';

const Exam = () => {
  const navigate = useNavigate();

  // Get current user ID from localStorage
  let userInfo = {};
  try {
    userInfo = JSON.parse(localStorage.getItem('loginData')) || {};
  } catch (e) {
    console.error('Failed to parse loginData:', e);
  }
  const currentUserId = userInfo.user?._id;

  // State to manage visibility of each course's exams
  const [openCourses, setOpenCourses] = useState({});

  // State for exams, loading, and error
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State to track selected exam
  const [selectedExam, setSelectedExam] = useState(null);

  // State for exam results
  const [examResults, setExamResults] = useState(null);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsError, setResultsError] = useState(null);

  // State for mobile sidebar visibility
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Fetch exams on component mount
  useEffect(() => {
    const fetchExams = async () => {
      try {
        setLoading(true);
        const response = await GetAllExams();
        const mappedExams = response.map((exam) => ({
          id: exam._id,
          courseId: exam.courseId || '68106bc6718dc1d25cb43deb',
          title: exam.title,
          subject: exam.subject || '',
          courseTitle: exam.courseTitle,
          duration: exam.duration,
          totalMarks: exam.totalMarks,
          questions: exam.questions.map((q, qIndex) => ({
            id: `${exam._id}-${qIndex}`,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || '',
          })),
          isPublished: exam.isPublished,
          tags: exam.tags || [],
          createdAt: exam.createdAt,
          attempted: exam.attempted || false,
        }));
        setExams(mappedExams);

        // Initialize openCourses state with all courseIds closed
        const uniqueCourseIds = [...new Set(mappedExams.map((exam) => exam.courseId))];
        setOpenCourses(
          uniqueCourseIds.reduce((acc, courseId) => ({ ...acc, [courseId]: courseId === '68106bc6718dc1d25cb43deb' }), {}),
        );

        // Set default selected exam (most recent)
        const defaultExam = mappedExams.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] || null;
        setSelectedExam(defaultExam);
      } catch (err) {
        console.error('Failed to fetch exams:', err);
        setError(err.message || 'Failed to load exams. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  // Fetch exam results when selectedExam changes
  useEffect(() => {
    const fetchExamResults = async () => {
      if (!selectedExam || !currentUserId) {
        setExamResults(null);
        return;
      }
      try {
        setResultsLoading(true);
        setResultsError(null);
        const results = await GetUserExamResults(selectedExam.id);
        setExamResults(results);
      } catch (err) {
        console.error('Failed to fetch exam results:', err);
        setResultsError(err.message || 'Failed to load exam results.');
      } finally {
        setResultsLoading(false);
      }
    };
    fetchExamResults();
  }, [selectedExam, currentUserId]);

  // Toggle course visibility
  const toggleCourse = (courseId) => {
    setOpenCourses((prev) => ({
      ...prev,
      [courseId]: !prev[courseId],
    }));
  };

  // Toggle sidebar visibility on mobile
  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  // Handle Attempt Now button click
  // const handleAttemptNow = () => {
  //   if (selectedExam && !selectedExam.attempted && examResults?.attempts?.length < 5) {
  //     navigate(`/student/examquestion?examid=${selectedExam.id}`);
  //   }
  // };

 const handleAttemptNow = () => {
  const attempts = examResults?.attempts || [];

  if (selectedExam && selectedExam.isPublished && attempts.length < 5) {
    navigate(`/student/examquestion?examid=${selectedExam.id}`);
  }
};



  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get course title for a courseId
  const getCourseTitle = (courseId) => {
    const exam = exams.find((e) => e.courseId === courseId);
    return exam ? exam.courseTitle : 'Unknown Course';
  };

  // Render loading or error states for exams
  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-100 justify-center items-center pt-16">
        <p className="text-base sm:text-lg text-gray-600">Loading exams...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-gray-100 justify-center items-center flex-col pt-16">
        <p className="text-base sm:text-lg text-red-600">{error}</p>
        <button
          className="mt-4 bg-blue-500 text-white py-2 px-4 rounded text-sm sm:text-base"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  // Get unique courseIds
  const uniqueCourseIds = [...new Set(exams.map((exam) => exam.courseId))];

  // Check if attempt limit is reached
  const isAttemptLimitReached = examResults?.attempts?.length >= 5;

  return (
    <div className="flex min-h-screen bg-gray-100 pt-16">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 overflow-y-auto transform transition-transform duration-300 md:static md:transform-none ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:w-72 z-40`}
      >
        <nav className="p-4">
          {uniqueCourseIds.map((courseId) => (
            <div key={courseId} className="mb-4">
              <div
                role="button"
                className="flex items-center justify-between py-2 text-sm font-medium cursor-pointer"
                onClick={() => {
                  toggleCourse(courseId);
                  if (window.innerWidth < 768) setIsSidebarOpen(false);
                }}
                onKeyDown={(e) => e.key === 'Enter' && toggleCourse(courseId)}
                tabIndex={0}
                aria-expanded={openCourses[courseId]}
                aria-controls={`course-${courseId}-list`}
              >
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M7 3a1 1 0 011 1v1a1 1 0 11-2 0V4a1 1 0 011-1zm3 0a1 1 0 011 1v1a1 1 0 11-2 0V4a1 1 0 011-1z" />
                    <path d="M5 0a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V2a2 2 0 00-2-2H5zm11 18H4V2h12v16z" />
                  </svg>
                  <span>{getCourseTitle(courseId)}</span>
                  <svg
                    className={`w-4 h-4 ml-2 transform ${openCourses[courseId] ? 'rotate-90' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <div className="text-xs text-gray-500">
                  {exams.filter((e) => e.courseId === courseId && e.attempted).length} /{' '}
                  {exams.filter((e) => e.courseId === courseId).length}
                </div>
              </div>
              {openCourses[courseId] && (
                <ul id={`course-${courseId}-list`} className="mt-2 space-y-1">
                  {exams
                    .filter((exam) => exam.courseId === courseId)
                    .map((exam) => (
                      <li
                        key={exam.id}
                        role="button"
                        tabIndex={0}
                        className={exam.id === selectedExam?.id ? 'bg-rose-50' : ''}
                        onClick={() => {
                          setSelectedExam(exam);
                          if (window.innerWidth < 768) setIsSidebarOpen(false);
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && setSelectedExam(exam)}
                      >
                        <div className="flex items-center px-2 py-3 cursor-pointer">
                          <div className="mr-3 flex-shrink-0">
                            <div
                              className={`h-4 w-4 rounded-full ${
                                exam.attempted ? 'bg-green-500' : 'bg-red-500'
                              } flex items-center justify-center`}
                            >
                              {exam.attempted && (
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium">{exam.title}</p>
                            <p className="text-xs text-gray-500">{exam.courseTitle}</p>
                          </div>
                        </div>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Main content area */}
      <div className="flex-1 bg-white">
        {/* Header with Sidebar Toggle and Exam Title */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center">
            <button
              className="md:hidden mr-3 bg-gray-800 text-white p-2 rounded focus:outline-none"
              onClick={toggleSidebar}
              aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d={isSidebarOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
                />
              </svg>
            </button>
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
              {selectedExam?.title || 'Select an Exam'}
            </h1>
          </div>
        </div>

        {/* Exam details */}
        <div className="p-4 sm:p-6">
          <div className="mb-6">
            <p className="text-xs sm:text-sm text-gray-500">{selectedExam?.courseTitle || 'No course selected'}</p>
          </div>

          <div className="flex flex-col space-y-4">
            <div className="flex flex-col sm:flex-row sm:space-x-8 space-y-4 sm:space-y-0">
              <div className="flex flex-col space-y-4">
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Course Title:</p>
                  <p className="text-base sm:text-lg font-medium">{selectedExam?.courseTitle || 'N/A'}</p>
                </div>
                {selectedExam?.subject && (
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Subject:</p>
                    <p className="text-base sm:text-lg font-medium">{selectedExam?.subject}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Total Questions:</p>
                  <p className="text-base sm:text-lg font-medium">{selectedExam?.questions.length || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Duration:</p>
                  <p className="text-base sm:text-lg font-medium">
                    {selectedExam?.duration ? `${selectedExam.duration} minutes` : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Created On:</p>
                  <p className="text-base sm:text-lg font-medium">
                    {selectedExam ? formatDate(selectedExam.createdAt) : 'N/A'}
                  </p>
                </div>
                {selectedExam?.tags?.length > 0 && (
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Tags:</p>
                    <p className="text-base sm:text-lg font-medium">{selectedExam.tags.join(', ')}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="self-start">
              {/* <button
                className={`bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-6 rounded text-sm sm:text-base ${
                  !selectedExam || selectedExam.attempted || !selectedExam.isPublished || isAttemptLimitReached
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
                onClick={handleAttemptNow}
                disabled={!selectedExam || selectedExam.attempted || !selectedExam.isPublished || isAttemptLimitReached}
                aria-label={
                  isAttemptLimitReached
                    ? 'Maximum 5 attempts reached'
                    : selectedExam?.attempted
                    ? 'Exam already attempted'
                    : !selectedExam?.isPublished
                    ? 'Exam not published'
                    : 'Attempt exam now'
                }
              >
                {isAttemptLimitReached
                  ? 'Attempt Limit Reached'
                  : selectedExam?.attempted
                  ? 'Attempted'
                  : !selectedExam?.isPublished
                  ? 'Not Published'
                  : 'Attempt Now'}
              </button> */}
              <button
  className={`bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-6 rounded text-sm sm:text-base ${
    !selectedExam || !selectedExam.isPublished || isAttemptLimitReached
      ? 'opacity-50 cursor-not-allowed'
      : ''
  }`}
  onClick={handleAttemptNow}
  disabled={
    !selectedExam || !selectedExam.isPublished || isAttemptLimitReached
  }
>
  {isAttemptLimitReached
    ? 'Attempt Limit Reached'
    : !selectedExam?.isPublished
    ? 'Not Published'
    : 'Attempt Now'}
</button>

            </div>

            {/* Past Attempts Section */}
            <div className="mt-8">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Past Attempts</h2>
              {resultsLoading ? (
                <p className="text-base sm:text-lg text-gray-600">Loading past attempts...</p>
              ) : resultsError ? (
                <div className="flex flex-col items-start">
                  <p className="text-base sm:text-lg text-red-600">{resultsError}</p>
                  <button
                    className="mt-4 bg-blue-500 text-white py-2 px-4 rounded text-sm sm:text-base"
                    onClick={() => fetchExamResults()}
                  >
                    Retry
                  </button>
                </div>
              ) : !examResults || !examResults.attempts?.length ? (
                <p className="text-base sm:text-lg text-gray-600">No past attempts for this exam.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="py-2 px-4 text-left text-sm font-medium text-gray-500" scope="col">Attempt</th>
                        <th className="py-2 px-4 text-left text-sm font-medium text-gray-500" scope="col">Score</th>
                        <th className="py-2 px-4 text-left text-sm font-medium text-gray-500" scope="col">Percentage</th>
                        <th className="py-2 px-4 text-left text-sm font-medium text-gray-500" scope="col">Duration (min)</th>
                        <th className="py-2 px-4 text-left text-sm font-medium text-gray-500" scope="col">Correct Answers</th>
                        <th className="py-2 px-4 text-left text-sm font-medium text-gray-500" scope="col">Submitted On</th>
                      </tr>
                    </thead>
                    <tbody>
                      {examResults.attempts.map((attempt, index) => {
                        const correctAnswers = attempt.answers.filter((a) => a.isCorrect).length;
                        const totalQuestions = attempt.answers.length;
                        return (
                          <tr key={index} className="border-t border-gray-200">
                            <td className="py-2 px-4 text-sm text-gray-900">{index + 1}</td>
                            <td className="py-2 px-4 text-sm text-gray-900">{attempt.score}/{examResults.totalMarks}</td>
                            <td className="py-2 px-4 text-sm text-gray-900">{attempt.percentage.toFixed(2)}%</td>
                            <td className="py-2 px-4 text-sm text-gray-900">{attempt.completedDuration || 'N/A'}</td>
                            <td className="py-2 px-4 text-sm text-gray-900">{correctAnswers}/{totalQuestions}</td>
                            <td className="py-2 px-4 text-sm text-gray-900">{formatDate(attempt.submittedAt)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="mt-4">
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Best Score:</span> {examResults.bestScore}/{examResults.totalMarks}
                    </p>
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Best Percentage:</span> {examResults.bestPercentage.toFixed(2)}%
                    </p>
                    {examResults.rank && (
                      <p className="text-sm text-gray-500">
                        <span className="font-medium">Rank:</span> {examResults.rank}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Exam;