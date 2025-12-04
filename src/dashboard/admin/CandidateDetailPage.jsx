import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  GetCourseEnrollment,
  GetUserTestResults,
  GetAllExamSubmissions,
  GetCourseProgress,
  GetAllCourseProgress
} from '../../service/api';
import {
  ArrowLeft,
  Calendar,
  BookOpen,
  Award,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
} from 'lucide-react';

export default function CandidateDetailPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [examResults, setExamResults] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchCandidateDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch all data in parallel
        const [progressRes, enrollmentRes, testResultsRes, examSubmissionsRes] = await Promise.all([
          GetAllCourseProgress().catch(() => []),
          GetCourseEnrollment({ userId }).catch(() => ({ enrolledCourses: [] })),
          GetUserTestResults(userId).catch(() => []),
          GetAllExamSubmissions().catch(() => [])
        ]);

        // Get username from progress response
        const userProgress = Array.isArray(progressRes)
          ? progressRes.find(user => user._id === userId)
          : null;
        const fetchedUsername = userProgress?.username || 'Unknown User';

        // Process enrolled courses
        const enrolled = enrollmentRes.enrolledCourses || [];
        const validEnrollments = enrolled.filter((item) => {
          const hasCourse = item.courseId && item.courseId._id;
          return hasCourse;
        });

        // Fetch progress for each course
        const coursesWithProgress = await Promise.all(
          validEnrollments.map(async (enrollment) => {
            let progress = 0;
            try {
              const progressRes = await GetCourseProgress(userId, enrollment.courseId._id);
              progress = progressRes.progress?.percentage || 0;
            } catch (err) {
              progress = 0;
            }
            return {
              courseId: enrollment.courseId._id,
              courseTitle: enrollment.courseId.title,
              thumbnail: enrollment.courseId.thumbnail,
              enrolledDate: enrollment.enrolledDate || enrollment.createdAt,
              expiryDate: enrollment.expiryDate,
              isApproved: enrollment.isApproved,
              progress,
            };
          })
        );

        // Process exam results
        const userExamSubmissions = Array.isArray(examSubmissionsRes)
          ? examSubmissionsRes.filter(submission =>
            submission.user?._id === userId || submission.user === userId
          )
          : [];

        const formattedExamResults = userExamSubmissions.map(submission => ({
          examId: submission.examId?._id || submission.examId,
          examTitle: submission.examTitle || submission.examId?.title || "Unknown Exam",
          courseId: submission.courseId?._id || submission.courseId,
          courseTitle: submission.courseTitle || "Unknown Course",
          attempts: submission.attempts || [],
          bestScore: submission.bestScore || 0,
          bestPercentage: submission.bestPercentage || 0,
          rank: submission.rank || null,
        }));

        // Set username
        setUsername(fetchedUsername);
        setEnrolledCourses(coursesWithProgress);
        setTestResults(Array.isArray(testResultsRes) ? testResultsRes : []);
        setExamResults(formattedExamResults);
      } catch (err) {
        setError(err.message || "Failed to load candidate details");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchCandidateDetails();
    }
  }, [userId]);

  // Calculate statistics
  const stats = {
    totalCourses: enrolledCourses.length,
    completedCourses: enrolledCourses.filter(c => c.progress === 100).length,
    totalTestAttempts: testResults.reduce((sum, test) => sum + (test.attempts?.length || 0), 0),
    totalExamAttempts: examResults.reduce((sum, exam) => sum + (exam.attempts?.length || 0), 0),
    bestTestScore: testResults.length > 0
      ? Math.max(...testResults.map(t => t.bestPercentage || 0))
      : 0,
    bestExamScore: examResults.length > 0
      ? Math.max(...examResults.map(e => e.bestPercentage || 0))
      : 0,
  };

  // Create timeline of all activities
  const timeline = [
    ...enrolledCourses.map(course => ({
      type: 'course_purchase',
      date: new Date(course.enrolledDate),
      title: `Enrolled in ${course.courseTitle}`,
      description: `Progress: ${course.progress}%`,
      data: course,
    })),
    ...testResults.flatMap(test =>
      (test.attempts || []).map(attempt => ({
        type: 'test_attempt',
        date: new Date(attempt.submittedAt),
        title: `Test: ${test.sublessonTitle}`,
        description: `Score: ${attempt.percentage}%`,
        data: { test, attempt },
      }))
    ),
    ...examResults.flatMap(exam =>
      (exam.attempts || []).map(attempt => ({
        type: 'exam_attempt',
        date: new Date(attempt.submittedAt),
        title: `Exam: ${exam.examTitle}`,
        description: `Score: ${attempt.percentage}%`,
        data: { exam, attempt },
      }))
    ),
  ].sort((a, b) => b.date - a.date);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading candidate details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="text-red-500 mb-4 mx-auto" size={48} />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/admin/progress')}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 md:p-6 shadow-md">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate('/admin/progress')}
            className="flex items-center gap-2 text-white hover:text-blue-100 mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Progress Report</span>
          </button>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Performance Analysis Report</h1>
          <p className="text-blue-100 text-base md:text-lg">{username}</p>
          <p className="text-blue-200 text-xs md:text-sm mt-1">
            Generated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-xs md:text-sm text-gray-600 mb-1">Total Courses</p>
              <p className="text-2xl md:text-3xl font-bold text-blue-600">{stats.totalCourses}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <p className="text-xs md:text-sm text-gray-600 mb-1">Completed</p>
              <p className="text-2xl md:text-3xl font-bold text-green-600">{stats.completedCourses}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <p className="text-xs md:text-sm text-gray-600 mb-1">Test Attempts</p>
              <p className="text-2xl md:text-3xl font-bold text-purple-600">{stats.totalTestAttempts}</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <p className="text-xs md:text-sm text-gray-600 mb-1">Exam Attempts</p>
              <p className="text-2xl md:text-3xl font-bold text-orange-600">{stats.totalExamAttempts}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200 overflow-x-auto">
            <div className="flex space-x-1 px-4 md:px-6 min-w-max">
              {[
                { id: 'overview', label: 'Overview', icon: TrendingUp },
                { id: 'courses', label: 'Courses', icon: BookOpen },
                { id: 'tests', label: 'Tests', icon: Award },
                { id: 'exams', label: 'Exams', icon: Award },
                { id: 'timeline', label: 'Timeline', icon: Calendar },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 md:px-6 py-3 md:py-4 flex items-center gap-2 border-b-2 transition-colors text-sm md:text-base ${activeTab === tab.id
                      ? 'border-purple-600 text-purple-600 font-semibold'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                >
                  {tab.icon && <tab.icon size={18} />}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-4 md:p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg md:text-xl font-semibold mb-4">Overall Performance</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 md:p-6">
                      <p className="text-sm text-gray-600 mb-2">Average Course Progress</p>
                      <p className="text-3xl md:text-4xl font-bold text-blue-600">
                        {enrolledCourses.length > 0
                          ? Math.round(enrolledCourses.reduce((sum, c) => sum + c.progress, 0) / enrolledCourses.length)
                          : 0}%
                      </p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 md:p-6">
                      <p className="text-sm text-gray-600 mb-2">Best Test Score</p>
                      <p className="text-3xl md:text-4xl font-bold text-green-600">
                        {stats.bestTestScore > 0 ? `${stats.bestTestScore}%` : 'N/A'}
                      </p>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 md:p-6">
                      <p className="text-sm text-gray-600 mb-2">Best Exam Score</p>
                      <p className="text-3xl md:text-4xl font-bold text-purple-600">
                        {stats.bestExamScore > 0 ? `${stats.bestExamScore}%` : 'N/A'}
                      </p>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 md:p-6">
                      <p className="text-sm text-gray-600 mb-2">Total Activities</p>
                      <p className="text-3xl md:text-4xl font-bold text-orange-600">{timeline.length}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'courses' && (
              <div className="space-y-4">
                <h3 className="text-lg md:text-xl font-semibold mb-4">Course Purchases & Progress</h3>
                {enrolledCourses.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No courses purchased</p>
                ) : (
                  enrolledCourses.map((course, index) => (
                    <div key={course.courseId} className="bg-gray-50 border rounded-lg p-4 md:p-6 hover:shadow-md transition-shadow">
                      <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                        <div className="flex-1 w-full">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm font-semibold whitespace-nowrap">
                              Course {index + 1}
                            </span>
                            <h4 className="text-lg md:text-xl font-semibold break-words">{course.courseTitle}</h4>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Enrolled Date</p>
                              <p className="text-sm font-medium flex items-center gap-1">
                                <Calendar size={14} className="text-gray-400" />
                                {new Date(course.enrolledDate).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Expiry Date</p>
                              <p className="text-sm font-medium flex items-center gap-1">
                                <Calendar size={14} className="text-gray-400" />
                                {new Date(course.expiryDate).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Progress</p>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${course.progress === 100 ? 'bg-green-500' : 'bg-blue-500'
                                      }`}
                                    style={{ width: `${course.progress}%` }}
                                  />
                                </div>
                                <span className="text-sm font-semibold">{course.progress}%</span>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Status</p>
                              <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${course.isApproved
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                {course.isApproved ? 'Approved' : 'Pending'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'tests' && (
              <div className="space-y-4">
                <h3 className="text-lg md:text-xl font-semibold mb-4">Test Attempts</h3>
                {testResults.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No test attempts found</p>
                ) : (
                  testResults.map((test, idx) => (
                    <div key={idx} className="bg-white border-l-4 border-blue-500 rounded-lg p-4 md:p-6 shadow-sm">
                      <div className="flex flex-col sm:flex-row justify-between items-start mb-3 gap-2">
                        <div>
                          <h4 className="font-semibold text-base md:text-lg">{test.sublessonTitle}</h4>
                          <p className="text-sm text-gray-600">Course: {test.courseTitle}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Attempts: {test.attempts?.length || 0}
                          </p>
                        </div>
                        <div className="text-left sm:text-right w-full sm:w-auto">
                          <p className="text-xl md:text-2xl font-bold text-blue-600">{test.bestPercentage}%</p>
                          <p className="text-xs text-gray-500">Best Score</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {test.attempts?.slice(0, 5).map((attempt, attemptIdx) => (
                          <div key={attemptIdx} className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-50 p-3 rounded text-sm gap-2">
                            <div className="flex items-center gap-2">
                              <Clock size={14} className="text-gray-400" />
                              <span>{new Date(attempt.submittedAt).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="font-semibold">{attempt.percentage}%</span>
                              <span className="text-gray-500">{attempt.score}/{test.totalMarks}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'exams' && (
              <div className="space-y-4">
                <h3 className="text-lg md:text-xl font-semibold mb-4">Mock Exam Attempts</h3>
                {examResults.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No exam attempts found</p>
                ) : (
                  examResults.map((exam, idx) => (
                    <div key={idx} className="bg-white border-l-4 border-green-500 rounded-lg p-4 md:p-6 shadow-sm">
                      <div className="flex flex-col sm:flex-row justify-between items-start mb-3 gap-2">
                        <div>
                          <h4 className="font-semibold text-base md:text-lg">{exam.examTitle}</h4>
                          <p className="text-sm text-gray-600">Course: {exam.courseTitle}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <p className="text-xs text-gray-500">
                              Attempts: {exam.attempts?.length || 0}
                            </p>
                            {exam.rank && (
                              <p className="text-xs text-purple-600 font-semibold">
                                Rank: #{exam.rank}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-left sm:text-right w-full sm:w-auto">
                          <p className="text-xl md:text-2xl font-bold text-green-600">{exam.bestPercentage}%</p>
                          <p className="text-xs text-gray-500">Best Score</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {exam.attempts?.slice(0, 5).map((attempt, attemptIdx) => (
                          <div key={attemptIdx} className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-50 p-3 rounded text-sm gap-2">
                            <div className="flex items-center gap-2">
                              <Clock size={14} className="text-gray-400" />
                              <span>{new Date(attempt.submittedAt).toLocaleString()}</span>
                              {attempt.completedDuration && (
                                <span className="text-gray-500">
                                  ({Math.round(attempt.completedDuration / 60)} min)
                                </span>
                              )}
                            </div>
                            <span className="font-semibold">{attempt.percentage}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'timeline' && (
              <div className="space-y-4">
                <h3 className="text-lg md:text-xl font-semibold mb-4">Activity Timeline</h3>
                {timeline.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No activities found</p>
                ) : (
                  <div className="relative">
                    {timeline.map((item, index) => (
                      <div key={index} className="flex gap-4 pb-6 relative">
                        <div className="flex flex-col items-center">
                          <div className={`w-4 h-4 rounded-full border-2 border-white flex-shrink-0 ${item.type === 'course_purchase' ? 'bg-blue-500' :
                              item.type === 'test_attempt' ? 'bg-purple-500' :
                                'bg-green-500'
                            }`} />
                          {index < timeline.length - 1 && (
                            <div className="w-0.5 h-full bg-gray-300 mt-2" />
                          )}
                        </div>
                        <div className="flex-1 bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                {item.type === 'course_purchase' && <BookOpen size={16} className="text-blue-500 flex-shrink-0" />}
                                {item.type === 'test_attempt' && <Award size={16} className="text-purple-500 flex-shrink-0" />}
                                {item.type === 'exam_attempt' && <Award size={16} className="text-green-500 flex-shrink-0" />}
                                <span className="font-semibold text-sm md:text-base">{item.title}</span>
                              </div>
                              <p className="text-xs md:text-sm text-gray-600">{item.description}</p>
                            </div>
                            <span className="text-xs text-gray-500 whitespace-nowrap">
                              {item.date.toLocaleDateString()} {item.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

