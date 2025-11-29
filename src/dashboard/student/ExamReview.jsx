import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Clock, CheckCircle, AlertCircle, Circle, ArrowLeft, XCircle, Award, BookOpen } from 'lucide-react';
import { GetExamById, GetUserExamResults } from '../../service/api';

export default function ExamReview() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const examId = searchParams.get('examid');
  const submission = location.state || {};
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [userResults, setUserResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Format time from seconds to HH:MM:SS
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Fetch exam and user results
  const fetchExamData = async () => {
    if (!examId) {
      console.error('No examId provided in URL query');
      setError('No exam ID provided.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Fetch exam details
      const examData = await GetExamById(examId);
      console.log('Exam data:', examData);
      if (!examData) {
        throw new Error('Exam not found.');
      }

      // Map exam data
      const mappedExam = {
        id: examData._id,
        title: examData.title,
        totalMarks: examData.totalMarks || examData.questions.reduce((sum, q) => sum + (q.marks || 2), 0),
        duration: formatTime(examData.duration),
      };

      // Map questions data with correct answer
      const mappedQuestions = examData.questions.map((q, index) => ({
        id: index + 1,
        questionId: q._id || `q${index + 1}`,
        text: q.question,
        marks: q.marks || 2,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || 'No explanation provided.',
      }));

      // Fetch user results
      const resultData = await GetUserExamResults(examId);
      console.log('User results:', resultData);
      if (!resultData || !resultData.attempts?.length) {
        throw new Error('No submission found for this exam.');
      }

      // Select the latest attempt
      const latestAttempt = resultData.attempts.sort(
        (a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)
      )[0];

      // Map answers to questions
      const answersMap = {};
      latestAttempt.answers.forEach((answer) => {
        // Find matching question by question text
        const question = mappedQuestions.find((q) => q.text === answer.question);
        if (question) {
          answersMap[question.id] = {
            selected: answer.selected,
            correct: answer.correct || answer.correctAnswer,
            isCorrect: answer.isCorrect,
          };
        }
      });

      setExam(mappedExam);
      setQuestions(mappedQuestions);
      setUserResults({
        timeTaken: latestAttempt.completedDuration || 0,
        answers: answersMap,
        score: latestAttempt.score,
        percentage: latestAttempt.percentage,
        submittedAt: latestAttempt.submittedAt,
      });
    } catch (err) {
      console.error('Failed to fetch exam data:', err);
      setError(err.message || 'Failed to load exam results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExamData();
  }, [examId]);

  // Calculate result stats
  const calculateResults = () => {
    if (!questions.length || !userResults) {
      return {
        totalMarks: 0,
        totalPossible: 0,
        percentage: 0,
        accuracy: 0,
        answeredCorrect: 0,
        answeredWrong: 0,
        questionsAttempted: 0,
        questionsSkipped: 0,
      };
    }

    let totalMarks = 0;
    let totalPossible = 0;
    let answeredCorrect = 0;
    let answeredWrong = 0;
    let questionsAttempted = 0;

    questions.forEach((q) => {
      totalPossible += q.marks;
      const userAnswer = userResults.answers[q.id];
      if (userAnswer !== undefined && userAnswer !== null && userAnswer.selected) {
        questionsAttempted += 1;
        if (userAnswer.isCorrect) {
          totalMarks += q.marks;
          answeredCorrect += 1;
        } else {
          answeredWrong += 1;
        }
      }
    });

    const questionsSkipped = questions.length - questionsAttempted;
    const percentage = totalPossible ? (totalMarks / totalPossible) * 100 : 0;
    const accuracy = questionsAttempted ? (answeredCorrect / questionsAttempted) * 100 : 0;

    return {
      totalMarks,
      totalPossible,
      percentage,
      accuracy,
      answeredCorrect,
      answeredWrong,
      questionsAttempted,
      questionsSkipped,
    };
  };

  const results = calculateResults();

  // Get question status
  const getQuestionStatus = (questionId) => {
    const answer = userResults?.answers[questionId];
    if (!answer || !answer.selected) return 'not-attempted';
    return answer.isCorrect ? 'correct' : 'wrong';
  };

  // Navigate to question
  const handleQuestionNavigation = (index) => {
    setCurrentQuestionIndex(index);
    const element = document.getElementById(`question-${index + 1}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Handle close button
  const handleClose = () => {
    navigate('/student/mockexam');
  };

  // Handle back button
  const handleBack = () => {
    navigate('/student/mockexam');
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-100 justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-base sm:text-lg text-gray-600">Loading exam results...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="flex min-h-screen bg-gray-100 justify-center items-center flex-col">
        <AlertCircle className="text-red-500 mb-4" size={48} />
        <p className="text-base sm:text-lg text-red-600 mb-4">{error}</p>
        <button
          className="bg-blue-500 text-white py-2 px-4 rounded text-sm sm:text-base hover:bg-blue-600"
          onClick={() => {
            setError(null);
            fetchExamData();
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  // Render no data state
  if (!exam || !userResults || !questions.length) {
    return (
      <div className="flex min-h-screen bg-gray-100 justify-center items-center">
        <p className="text-base sm:text-lg text-gray-600">No exam data or submission available.</p>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = userResults.answers[currentQuestion?.id];

  return (
    <div className="flex flex-col w-full min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <ArrowLeft
              className="cursor-pointer hover:text-blue-200 transition-colors"
              onClick={handleBack}
              size={24}
              aria-label="Go back"
            />
            <div>
              <h1 className="font-semibold text-lg sm:text-xl">Review - {exam.title}</h1>
              <p className="text-blue-100 text-sm">
                Submitted on {new Date(userResults.submittedAt).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-blue-700 px-3 py-2 rounded">
              <Clock size={18} />
              <span className="text-sm sm:text-base">{formatTime(userResults.timeTaken)}</span>
            </div>
            <button
              onClick={handleClose}
              className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded transition-colors"
              aria-label="Close review"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="text-green-500" size={24} />
            <h2 className="text-xl font-semibold">Exercise Submitted Successfully</h2>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">Marks Scored</p>
              <p className="text-2xl font-bold text-blue-600">
                {results.totalMarks.toFixed(1)} / {results.totalPossible}
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">Percentage</p>
              <p className="text-2xl font-bold text-green-600">{results.percentage.toFixed(1)}%</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">Accuracy</p>
              <p className="text-2xl font-bold text-purple-600">{results.accuracy.toFixed(1)}%</p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">Time Taken</p>
              <p className="text-lg font-bold text-orange-600">{formatTime(userResults.timeTaken)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded">
              <CheckCircle className="text-green-500" size={20} />
              <div>
                <p className="text-sm text-gray-600">Correct</p>
                <p className="text-lg font-semibold text-green-600">
                  {results.answeredCorrect}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded">
              <XCircle className="text-red-500" size={20} />
              <div>
                <p className="text-sm text-gray-600">Wrong</p>
                <p className="text-lg font-semibold text-red-600">
                  {results.answeredWrong}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded">
              <Circle className="text-gray-500" size={20} />
              <div>
                <p className="text-sm text-gray-600">Attempted</p>
                <p className="text-lg font-semibold text-gray-600">
                  {results.questionsAttempted}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded">
              <AlertCircle className="text-orange-500" size={20} />
              <div>
                <p className="text-sm text-gray-600">Skipped</p>
                <p className="text-lg font-semibold text-orange-600">
                  {results.questionsSkipped}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Question Review */}
      <div className="flex-1 p-4 sm:p-6">
        <div className="max-w-5xl mx-auto">
          {/* Question Navigation */}
          <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <BookOpen size={20} />
              Question Navigator
            </h3>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {questions.map((q, index) => {
                const status = getQuestionStatus(q.id);
                return (
                  <button
                    key={q.id}
                    onClick={() => handleQuestionNavigation(index)}
                    className={`p-2 rounded border-2 transition-all ${
                      currentQuestionIndex === index
                        ? 'border-blue-500 bg-blue-50 scale-110'
                        : status === 'correct'
                        ? 'border-green-500 bg-green-50'
                        : status === 'wrong'
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-300 bg-gray-50'
                    }`}
                    title={`Question ${q.id}: ${status === 'correct' ? 'Correct' : status === 'wrong' ? 'Wrong' : 'Not Attempted'}`}
                  >
                    <div className="text-center">
                      <div className={`text-xs font-bold ${
                        status === 'correct' ? 'text-green-600' :
                        status === 'wrong' ? 'text-red-600' :
                        'text-gray-500'
                      }`}>
                        {q.id}
                      </div>
                      {status === 'correct' && <CheckCircle className="w-4 h-4 mx-auto mt-1 text-green-600" />}
                      {status === 'wrong' && <XCircle className="w-4 h-4 mx-auto mt-1 text-red-600" />}
                      {status === 'not-attempted' && <Circle className="w-4 h-4 mx-auto mt-1 text-gray-400" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detailed Question Review */}
          <div className="space-y-6">
            {questions.map((question, index) => {
              const answer = userResults.answers[question.id];
              const isCorrect = answer?.isCorrect;
              const selectedAnswer = answer?.selected;
              const correctAnswer = question.correctAnswer;
              const hasAnswered = answer && selectedAnswer;

              return (
                <div
                  key={question.id}
                  id={`question-${question.id}`}
                  className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
                    isCorrect ? 'border-green-500' : hasAnswered ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  {/* Question Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold text-sm">
                        Question {question.id}
                      </span>
                      <span className="text-sm text-gray-600">
                        {question.marks} {question.marks === 1 ? 'mark' : 'marks'}
                      </span>
                      {isCorrect && (
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                          <CheckCircle size={14} /> Correct
                        </span>
                      )}
                      {hasAnswered && !isCorrect && (
                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                          <XCircle size={14} /> Wrong
                        </span>
                      )}
                      {!hasAnswered && (
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                          <Circle size={14} /> Not Attempted
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question Text */}
                  <p className="text-lg font-medium mb-4 text-gray-800">{question.text}</p>

                  {/* Options */}
                  <div className="space-y-3 mb-4">
                    {question.options.map((option, optIndex) => {
                      const isSelected = hasAnswered && selectedAnswer === option;
                      const isCorrectOption = option === correctAnswer;
                      
                      let bgColor = 'bg-white border-gray-200';
                      let textColor = 'text-gray-800';
                      let borderColor = 'border-gray-200';

                      if (isCorrectOption) {
                        bgColor = 'bg-green-50 border-green-300';
                        textColor = 'text-green-800';
                        borderColor = 'border-green-400';
                      } else if (isSelected && !isCorrect) {
                        bgColor = 'bg-red-50 border-red-300';
                        textColor = 'text-red-800';
                        borderColor = 'border-red-400';
                      }

                      return (
                        <div
                          key={optIndex}
                          className={`p-4 rounded-lg border-2 ${bgColor} ${borderColor} ${textColor} transition-all`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`mt-1 h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                              isCorrectOption
                                ? 'bg-green-500 border-green-600'
                                : isSelected
                                ? 'bg-red-500 border-red-600'
                                : 'border-gray-300 bg-white'
                            }`}>
                              {(isCorrectOption || isSelected) && (
                                <div className={`w-2 h-2 rounded-full ${
                                  isCorrectOption ? 'bg-white' : 'bg-white'
                                }`} />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{option}</span>
                                {isCorrectOption && (
                                  <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded flex items-center gap-1">
                                    <Award size={12} /> Correct Answer
                                  </span>
                                )}
                                {isSelected && !isCorrectOption && (
                                  <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded">
                                    Your Answer
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  {question.explanation && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                        <BookOpen size={16} />
                        Explanation
                      </h4>
                      <p className="text-blue-900">{question.explanation}</p>
                    </div>
                  )}

                  {/* Answer Summary */}
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Your Answer: </span>
                        <span className={`font-semibold ${
                          isCorrect ? 'text-green-600' : hasAnswered ? 'text-red-600' : 'text-gray-500'
                        }`}>
                          {hasAnswered ? selectedAnswer : 'Not Attempted'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Correct Answer: </span>
                        <span className="font-semibold text-green-600">{correctAnswer}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
