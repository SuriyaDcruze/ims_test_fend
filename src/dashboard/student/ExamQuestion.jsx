import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Clock, RefreshCw, User, Flag } from 'lucide-react';
import { GetAllExams, SubmitExamAnswers } from '../../service/api';

export default function ExamQuestion() {
  const [showExplanation, setShowExplanation] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [markedForReview, setMarkedForReview] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submissionError, setSubmissionError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // New state for sidebar
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const examId = queryParams.get('examid');

  // Check if all questions are answered
  const allQuestionsAnswered = Object.keys(selectedOptions).length === questions.length;

  // Fetch exam data
  const fetchExam = async () => {
    if (!examId || !/^[0-9a-f]{24}$/i.test(examId)) {
      setError('Invalid exam ID.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await GetAllExams();
      const foundExam = response.find((e) => e._id === examId);

      if (!foundExam || !foundExam.isPublished) {
        setError('Exam not found or not published.');
        setLoading(false);
        return;
      }

      const mappedExam = {
        id: foundExam._id,
        title: foundExam.title,
        questions: foundExam.totalMarks,
        duration: `${Math.floor(foundExam.duration / 60)}:${(foundExam.duration % 60).toString().padStart(2, '0')}:00`,
      };

      const mappedQuestions = foundExam.questions.map((q, index) => ({
        id: index + 1,
        text: q.question,
        marks: 2,
        options: q.options.map((opt, optIndex) => ({
          id: optIndex + 1,
          text: opt,
          correct: opt === q.correctAnswer,
        })),
        explanation: q.explanation || 'No explanation provided.',
      }));

      setExam(mappedExam);
      setQuestions(mappedQuestions);

      const totalSeconds = foundExam.duration;
      setTimeRemaining(totalSeconds);
    } catch (err) {
      console.error('Failed to fetch exam:', err);
      setError(err.message || 'Failed to load exam. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExam();
  }, [examId]);

  // Timer logic
  useEffect(() => {
    if (exam && timeRemaining !== null && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 0) {
            clearInterval(timer);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [exam, timeRemaining]);

  // Format time for display
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  // Track stats
  const stats = {
    notVisited: questions.length - Object.keys(selectedOptions).length,
    notAnswered: questions.length - Object.keys(selectedOptions).length,
    answered: Object.keys(selectedOptions).length,
    markedForReview: Object.keys(markedForReview).filter((qId) => markedForReview[qId]).length,
  };

  // Handle option selection
  const handleOptionSelect = (questionId, optionId) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  // Handle mark for review
  const handleMarkForReview = (questionId) => {
    setMarkedForReview((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  // Navigate to previous/next question
  const handlePreviousQuestion = () => {
    setCurrentQuestionIndex((prev) => Math.max(0, prev - 1));
    setShowExplanation(false);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex === questions.length - 1) {
      handleSubmit();
    } else {
      setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1));
      setShowExplanation(false);
    }
  };

  // Handle sidebar question click
  const handleQuestionClick = (index) => {
    setCurrentQuestionIndex(index);
    setShowExplanation(false);
    if (window.innerWidth < 768) setIsSidebarOpen(false); // Close sidebar on mobile
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  // Handle exam submission
  const handleSubmit = async () => {
    if (!examId) {
      setSubmissionError('No exam ID provided.');
      return;
    }

    if (!allQuestionsAnswered) {
      setSubmissionError('Please answer all questions before submitting.');
      return;
    }

    if (!window.confirm('Are you sure you want to submit the exam?')) {
      return;
    }

    const answers = {};
    Object.entries(selectedOptions).forEach(([questionId, optionId]) => {
      answers[questionId] = optionId;
    });

    const totalDurationSeconds =
      exam?.duration
        ? parseInt(exam.duration.split(':')[0]) * 3600 +
          parseInt(exam.duration.split(':')[1]) * 60
        : 0;
    const completedDuration = totalDurationSeconds - timeRemaining;
    const timeTaken = formatTime(completedDuration);

    const questionsAttempted = Object.keys(selectedOptions).length;
    const questionsSkipped = questions.length - questionsAttempted;

    const submission = {
      examId,
      answers,
      timeTaken,
      questionsAttempted,
      questionsSkipped,
      completedDuration,
    };

    try {
      setLoading(true);
      setSubmissionError(null);
      const backendAnswers = Object.entries(selectedOptions).map(([questionId, optionId]) => {
        const question = questions.find((q) => q.id === parseInt(questionId));
        const selectedOption = question.options.find((opt) => opt.id === optionId);
        return {
          question: question.text,
          selected: selectedOption?.text || '',
        };
      });
      const backendSubmission = {
        answers: backendAnswers,
        completedDuration,
      };
      const response = await SubmitExamAnswers(examId, backendSubmission);
      console.log('Submission successful:', response);
      navigate(`/student/examreview?examid=${examId}`, {
        state: { submission },
      });
    } catch (err) {
      console.error('Submission failed:', err);
      setSubmissionError(err.message || 'Failed to submit exam. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle header close button
  const handleClose = () => {
    if (!allQuestionsAnswered) {
      window.alert('Please answer all questions before submitting.');
      return;
    }
    if (window.confirm('Are you sure you want to submit the exam?')) {
      handleSubmit();
    }
  };

  // Render loading or error states
  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-100 justify-center items-center">
        <p className="text-base sm:text-lg text-gray-600">Loading exam...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-gray-100 justify-center items-center flex-col">
        <p className="text-base sm:text-lg text-red-600">{error}</p>
        <button
          className="mt-4 bg-blue-500 text-white py-2 px-4 rounded text-sm sm:text-base"
          onClick={() => {
            setError(null);
            setLoading(true);
            fetchExam();
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (submissionError) {
    return (
      <div className="flex min-h-screen bg-gray-100 justify-center items-center flex-col">
        <p className="text-base sm:text-lg text-red-600">{submissionError}</p>
        <button
          className="mt-4 bg-blue-500 text-white py-2 px-4 rounded text-sm sm:text-base"
          onClick={handleSubmit}
        >
          Retry Submission
        </button>
      </div>
    );
  }

  if (!exam || !questions.length) {
    return (
      <div className="flex min-h-screen bg-gray-100 justify-center items-center">
        <p className="text-base sm:text-lg text-gray-600">No exam data available.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full min-h-screen bg-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between bg-blue-600 text-white p-3 sm:p-4">
        <div className="font-medium text-sm sm:text-base">{exam.title || 'Exam'}</div>
        <div className="flex items-center gap-4">
          <div className="font-medium text-sm sm:text-base flex items-center">
            <Clock size={16} className="mr-2" />
            Time Remaining: {timeRemaining !== null ? formatTime(timeRemaining) : 'N/A'}
          </div>
          <div
            className="font-bold text-lg sm:text-xl cursor-pointer"
            onClick={handleClose}
            aria-label="Close exam"
          >
            ×
          </div>
        </div>
      </div>

      {/* Section Navigation */}
      <div className="flex items-center border-b border-gray-300 p-3 bg-gray-100">
        <div className="text-gray-600 mr-4 text-sm sm:text-base">SECTIONS:</div>
        <div className="bg-blue-600 text-white px-3 py-1 rounded text-sm">Part A</div>
        <div className="ml-auto flex gap-2">
          <button className="p-1 border border-gray-400 rounded" aria-label="Refresh">
            <RefreshCw size={16} />
          </button>
          <button className="p-1 border border-gray-400 rounded md:hidden" onClick={toggleSidebar} aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}>
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
        </div>
      </div>

      <div className="flex flex-grow relative">
        {/* Main Content */}
        <div className="flex-grow overflow-y-auto">
          <div className="p-4 sm:p-6">
            {questions.length > 0 ? (
              <>
                <div className="flex justify-between mb-4">
                  <div className="font-medium text-sm sm:text-base">
                    Question {questions[currentQuestionIndex].id}
                  </div>
                  <div className="font-medium text-sm sm:text-base">
                    Marks: {questions[currentQuestionIndex].marks}
                  </div>
                </div>

                <div className="mb-6">
                  <p className="mb-4 text-sm sm:text-base">{questions[currentQuestionIndex].text}</p>

                  <div className="space-y-3">
                    {questions[currentQuestionIndex].options.map((option) => (
                      <div
                        key={option.id}
                        className={`flex items-center p-3 cursor-pointer rounded border ${
                          selectedOptions[questions[currentQuestionIndex].id] === option.id
                            ? 'bg-green-100 border-green-300'
                            : 'border-gray-200'
                        }`}
                        onClick={() =>
                          handleOptionSelect(questions[currentQuestionIndex].id, option.id)
                        }
                      >
                        <div
                          className={`h-5 w-5 rounded-full mr-3 flex items-center justify-center ${
                            selectedOptions[questions[currentQuestionIndex].id] === option.id
                              ? 'bg-green-700'
                              : 'border border-gray-400'
                          }`}
                        >
                          {selectedOptions[questions[currentQuestionIndex].id] === option.id && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                        <div className="text-sm sm:text-base">{option.text}</div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 mt-4">
                    <button
                      className="text-blue-600 hover:underline text-sm sm:text-base"
                      onClick={() => setShowExplanation(!showExplanation)}
                    >
                      {showExplanation ? 'Hide Explanation' : 'Show Explanation'}
                    </button>
                    <button
                      className={`flex items-center text-purple-600 hover:underline text-sm sm:text-base ${
                        markedForReview[questions[currentQuestionIndex].id]
                          ? 'text-purple-800 font-semibold'
                          : ''
                      }`}
                      onClick={() => handleMarkForReview(questions[currentQuestionIndex].id)}
                    >
                      <Flag size={16} className="mr-1" />
                      {markedForReview[questions[currentQuestionIndex].id]
                        ? 'Unmark for Review'
                        : 'Mark for Review'}
                    </button>
                  </div>

                  {showExplanation && (
                    <div className="mt-4 p-3 bg-gray-100 rounded text-sm sm:text-base">
                      <p>{questions[currentQuestionIndex].explanation}</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-4 text-gray-600 text-sm sm:text-base">
                No questions available for this exam.
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-center p-4 bg-white border-t border-gray-300 sticky bottom-0">
            <button
              className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50 mb-2 sm:mb-0 w-full sm:w-auto"
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </button>
            <div className="flex flex-col items-center sm:items-end gap-2 w-full sm:w-auto">
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <button
                  className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50 w-full sm:w-auto"
                  onClick={handleNextQuestion}
                  disabled={currentQuestionIndex === questions.length - 1}
                >
                  Next
                </button>
                <button
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed w-full sm:w-auto"
                  onClick={handleSubmit}
                  disabled={!allQuestionsAnswered}
                  title={
                    !allQuestionsAnswered
                      ? 'Please answer all questions before submitting'
                      : ''
                  }
                >
                  Submit Exam
                </button>
              </div>
              {!allQuestionsAnswered && (
                <p className="text-sm text-red-600 text-center sm:text-right">
                  Please answer all questions to enable submission.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div
          className={`fixed inset-y-0 right-0 w-64 bg-gray-50 border-l border-gray-300 overflow-y-auto transform transition-transform duration-300 md:static md:transform-none ${
            isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
          } md:translate-x-0 md:w-72 z-40`}
        >
          <div className="p-4 border-b border-gray-300">
            <div className="text-sm font-medium mb-2">
              Total Questions: {questions.length}
            </div>
            <div className="grid grid-cols-2 gap-2 text-center text-xs sm:text-sm">
              <div className="flex flex-col items-center">
                <div className="bg-gray-300 px-2 py-1 w-8 mb-1">{stats.notVisited}</div>
                <div className="text-gray-600">Not Visited</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-red-500 text-white px-2 py-1 w-8 mb-1">{stats.notAnswered}</div>
                <div className="text-gray-600">Not Answered</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-green-500 text-white px-2 py-1 w-8 mb-1">{stats.answered}</div>
                <div className="text-gray-600">Answered</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-purple-900 text-white px-2 py-1 w-8 mb-1">{stats.markedForReview}</div>
                <div className="text-gray-600">Marked for Review</div>
              </div>
            </div>
          </div>

          <div className="py-2">
            <div className="grid grid-cols-4 px-4 py-2 text-xs sm:text-sm font-medium">
              <div>Q.No.</div>
              <div className="col-span-2">Type</div>
              <div>Mark</div>
            </div>

            {questions.map((q, index) => (
              <div
                key={q.id}
                className={`grid grid-cols-4 items-center px-4 py-2 border-t border-gray-200 cursor-pointer ${
                  currentQuestionIndex === index ? 'bg-rose-50' : ''
                }`}
                onClick={() => handleQuestionClick(index)}
              >
                <div>
                  <span
                    className={`
                      inline-flex items-center justify-center w-6 h-6 rounded-md text-white text-xs
                      ${
                        markedForReview[q.id]
                          ? 'bg-purple-900'
                          : selectedOptions[q.id]
                          ? 'bg-green-500'
                          : 'bg-red-500'
                      }
                    `}
                  >
                    {q.id}
                  </span>
                </div>
                <div className="col-span-2 text-xs">
                  <div>MCQ - Single Correct</div>
                  <div className="text-gray-500">Max. Marks: {q.marks}</div>
                </div>
                <div>
                  <div className="border border-gray-300 w-10 h-6 flex items-center justify-center rounded bg-white">
                    {q.marks}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}