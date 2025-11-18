import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Clock, CheckCircle, AlertCircle, Circle, ArrowLeft } from 'lucide-react';
import { GetExamById, GetUserExamResults } from '../../service/api';

export default function ExamReview() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const examId = searchParams.get('examid');
  const submission = location.state || {};

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

      // Map questions data
      const mappedQuestions = examData.questions.map((q, index) => ({
        id: q._id || index + 1,
        text: q.question,
        marks: q.marks || 2,
        options: q.options,
        correctOptionId: q.options.findIndex((opt) => opt === q.correctAnswer) + 1,
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

      // Map answers to a lookup object for easier access
      const answersMap = {};
      latestAttempt.answers.forEach((answer, index) => {
        // Find matching question by text (or use _id if available)
        const question = mappedQuestions.find((q) => q.text === answer.question);
        if (question) {
          answersMap[question.id] = {
            selected: answer.selected,
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
      console.log('No questions or userResults available for calculation');
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

    console.log('Calculating results with questions:', questions);
    console.log('User answers:', userResults.answers);

    questions.forEach((q) => {
      totalPossible += q.marks;
      const userAnswer = userResults.answers[q.id];
      if (userAnswer !== undefined && userAnswer !== null) {
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

    const results = {
      totalMarks,
      totalPossible,
      percentage,
      accuracy,
      answeredCorrect,
      answeredWrong,
      questionsAttempted,
      questionsSkipped,
    };
    console.log('Calculated results:', results);
    return results;
  };

  const results = calculateResults();

  // Handle close button
  const handleClose = () => {
    if (window.confirm('Are you sure you want to leave the review page?')) {
      navigate('/student/exam');
    }
  };

  // Handle back button
  const handleBack = () => {
    navigate('/student/exam');
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-100 justify-center items-center">
        <p className="text-base sm:text-lg text-gray-600">Loading exam results...</p>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="flex min-h-screen bg-gray-100 justify-center items-center flex-col">
        <p className="text-base sm:text-lg text-red-600">{error}</p>
        <button
          className="mt-4 bg-blue-500 text-white py-2 px-4 rounded text-sm sm:text-base"
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
  if (!exam || !userResults) {
    return (
      <div className="flex min-h-screen bg-gray-100 justify-center items-center">
        <p className="text-base sm:text-lg text-gray-600">No exam data or submission available.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full min-h-screen bg-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between bg-blue-600 text-white p-3 sm:p-4 gap-2 sm:gap-0">
        <div className="flex items-center">
          <ArrowLeft
            className="cursor-pointer mr-2"
            onClick={handleBack}
            size={20}
            aria-label="Go back"
          />
          <div className="font-medium text-sm sm:text-base">Review - {exam.title}</div>
        </div>
        <div className="flex items-center gap-4">
          <div className="font-medium text-sm sm:text-base flex items-center">
            <Clock size={16} className="mr-2" />
            Time Taken: {formatTime(userResults.timeTaken)}
          </div>
          <div
            className="font-bold text-lg cursor-pointer"
            onClick={handleClose}
            aria-label="Close review"
          >
            ×
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow overflow-y-auto">
        <div className="p-4 sm:p- bordered-b border-gray-300">
          <div className="flex items-center mb-2">
            <h2 className="text-base sm:text-lg font-medium">Exercise Submitted</h2>
            <CheckCircle className="ml-2 text-green-500" size={18} />
          </div>
          <p className="text-gray-700 text-sm sm:text-base">
            Your exercise has been submitted successfully.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-gray-300">
          <div className="p-4 sm:p-6 flex flex-col items-center border-b sm:border-b-0 sm:border-r border-gray-300">
            <p className="text-gray-500 mb-2 text-sm sm:text-base">Marks Scored</p>
            <p className="text-lg sm:text-2xl font-medium">
              {results.totalMarks.toFixed(2)} / {results.totalPossible}
            </p>
          </div>
          <div className="p-4 sm:p-6 flex flex-col items-center border-b sm:border-b-0 sm:border-r border-gray-300">
            <p className="text-gray-500 mb-2 text-sm sm:text-base">Percentage</p>
            <p className="text-lg sm:text-2xl font-medium">{results.percentage.toFixed(2)} %</p>
          </div>
          <div className="p-4 sm:p-6 flex flex-col items-center">
            <p className="text-gray-500 mb-2 text-sm sm:text-base">Accuracy</p>
            <p className="text-lg sm:text-2xl font-medium">{results.accuracy.toFixed(2)} %</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-gray-300">
          <div className="p-4 sm:p-6 flex flex-col items-center border-b sm:border-b-0 sm:border-r border-gray-300">
            <p className="text-gray-500 mb-2 text-sm sm:text-base">Section Name</p>
            <p className="text-lg sm:text-2xl font-medium">{exam.section || 'Part A'}</p>
          </div>
          <div className="p-4 sm:p-6 flex flex-col items-center border-b sm:border-b-0 sm:border-r border-gray-300">
            <p className="text-gray-500 mb-2 text-sm sm:text-base">Section Marks</p>
            <p className="text-lg sm:text-2xl font-medium">
              {results.totalMarks.toFixed(2)} / {results.totalPossible}
            </p>
          </div>
          <div className="p-4 sm:p-6 flex flex-col items-center">
            <p className="text-gray-500 mb-2 text-sm sm:text-base">Section Time</p>
            <p className="text-lg sm:text-2xl font-medium">
              {formatTime(userResults.timeTaken)}
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-center py-2 sm:py-3">
            <div className="flex items-center">
              <Clock className="text-gray-500 mr-2" size={16} />
              <span className="text-gray-700 text-sm sm:text-base">Time Taken</span>
            </div>
            <span className="font-medium text-sm sm:text-base">
              {formatTime(userResults.timeTaken)}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 sm:py-3">
            <div className="flex items-center">
              <div className="h-4 w-4 rounded-full bg-gray-600 mr-2"></div>
              <span className="text-gray-700 text-sm sm:text-base">Questions Attempted</span>
            </div>
            <span className="font-medium text-sm sm:text-base">{results.questionsAttempted}</span>
          </div>
          <div className="flex justify-between items-center py-2 sm:py-3">
            <div className="flex items-center">
              <Circle className="text-gray-500 mr-2" size={16} />
              <span className="text-gray-700 text-sm sm:text-base">Questions Skipped</span>
            </div>
            <span className="font-medium text-sm sm:text-base">{results.questionsSkipped}</span>
          </div>
          <div className="flex justify-between items-center py-2 sm:py-3">
            <div className="flex items-center">
              <CheckCircle className="text-green-500 mr-2" size={16} />
              <span className="text-green-500 text-sm sm:text-base">Answered Correct</span>
            </div>
            <span className="font-medium text-green-500 text-sm sm:text-base">
              {results.answeredCorrect} / {questions.length}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 sm:py-3">
            <div className="flex items-center">
              <AlertCircle className="text-red-500 mr-2" size={16} />
              <span className="text-red-500 text-sm sm:text-base">Answered Wrong</span>
            </div>
            <span className="font-medium text-red-500 text-sm sm:text-base">
              {results.answeredWrong} / {questions.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}