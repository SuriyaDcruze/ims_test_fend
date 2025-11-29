import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { GetAllCourseProgress, GetUserTestResults, GetAllExamSubmissions, GetAllExams, GetUserExamResults } from "../../service/api";
import { ChevronDown, ChevronUp, Award, Clock, BookOpen, TrendingUp } from "lucide-react";

// Simple PageHeader component
const PageHeader = ({ title }) => (
  <div className="bg-gray-100 py-6 px-4 lg:px-8">
    <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
  </div>
);

// Expandable Course Detail Component
const CourseDetailRow = ({ courseData, testResults, examResults }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const courseTests = testResults.filter(test => test.courseId === courseData.progress.courseId);
  const courseExams = examResults.filter(exam => exam.courseId === courseData.progress.courseId);
  
  const totalTestAttempts = courseTests.reduce((sum, test) => sum + (test.attempts?.length || 0), 0);
  const totalExamAttempts = courseExams.reduce((sum, exam) => sum + (exam.attempts?.length || 0), 0);
  const bestTestScore = courseTests.length > 0 
    ? Math.max(...courseTests.map(t => t.bestPercentage || 0))
    : 0;
  const bestExamScore = courseExams.length > 0
    ? Math.max(...courseExams.map(e => e.bestPercentage || 0))
    : 0;

  return (
    <>
      <tr className="bg-white text-black font-base h-12 divide-x divide-gray-200 hover:bg-gray-50 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}>
        <td className="px-4">
          <div className="flex items-center gap-2">
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4 rotate-180" />}
            {courseData.progress.courseTitle}
          </div>
        </td>
        <td className="px-4">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${courseData.progress.percentage}%` }}
              />
            </div>
            <span className="text-sm font-semibold">{courseData.progress.percentage}%</span>
          </div>
        </td>
        <td className="px-4 text-center">{courseData.progress.completedLessonCount || 0}</td>
        <td className="px-4 text-center">
          <span className="inline-flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            {totalTestAttempts}
          </span>
        </td>
        <td className="px-4 text-center">
          <span className="inline-flex items-center gap-1">
            <Award className="w-4 h-4" />
            {totalExamAttempts}
          </span>
        </td>
        <td className="px-4">
          <div className="flex flex-col gap-1">
            {bestTestScore > 0 && (
              <span className="text-xs text-blue-600">Test: {bestTestScore}%</span>
            )}
            {bestExamScore > 0 && (
              <span className="text-xs text-green-600">Exam: {bestExamScore}%</span>
            )}
            {(bestTestScore === 0 && bestExamScore === 0) && (
              <span className="text-xs text-gray-400">No attempts</span>
            )}
          </div>
        </td>
        <td className="px-4">
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
            courseData.progress.isCompleted 
              ? "bg-green-100 text-green-800" 
              : "bg-yellow-100 text-yellow-800"
          }`}>
            {courseData.progress.isCompleted ? "Completed" : "In Progress"}
          </span>
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-gray-50">
          <td colSpan="7" className="px-4 py-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Test Results Section */}
              <div className="bg-white rounded-lg shadow p-4">
                <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  Course Tests ({courseTests.length})
                </h4>
                {courseTests.length === 0 ? (
                  <p className="text-gray-500 text-sm">No test attempts yet</p>
                ) : (
                  <div className="space-y-3">
                    {courseTests.map((test, idx) => (
                      <div key={idx} className="border-l-4 border-blue-500 pl-3 py-2 bg-blue-50 rounded">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium text-sm">{test.sublessonTitle}</p>
                            <p className="text-xs text-gray-600">Attempts: {test.attempts?.length || 0}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-blue-600">{test.bestPercentage}%</p>
                            <p className="text-xs text-gray-500">Best Score</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {test.attempts?.slice(0, 5).map((attempt, attemptIdx) => (
                            <div key={attemptIdx} className="text-xs bg-white px-2 py-1 rounded border">
                              <span className="font-medium">{attempt.percentage}%</span>
                              <span className="text-gray-500 ml-1">
                                ({new Date(attempt.submittedAt).toLocaleDateString()})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Exam Results Section */}
              <div className="bg-white rounded-lg shadow p-4">
                <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Award className="w-5 h-5 text-green-600" />
                  Mock Exams ({courseExams.length})
                </h4>
                {courseExams.length === 0 ? (
                  <p className="text-gray-500 text-sm">No exam attempts yet</p>
                ) : (
                  <div className="space-y-3">
                    {courseExams.map((exam, idx) => (
                      <div key={idx} className="border-l-4 border-green-500 pl-3 py-2 bg-green-50 rounded">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium text-sm">{exam.examTitle}</p>
                            <p className="text-xs text-gray-600">Attempts: {exam.attempts?.length || 0}</p>
                            {exam.rank && (
                              <p className="text-xs text-purple-600">Rank: #{exam.rank}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-green-600">{exam.bestPercentage}%</p>
                            <p className="text-xs text-gray-500">Best Score</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {exam.attempts?.slice(0, 5).map((attempt, attemptIdx) => (
                            <div key={attemptIdx} className="text-xs bg-white px-2 py-1 rounded border">
                              <div className="flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                <span className="font-medium">{attempt.percentage}%</span>
                              </div>
                              <span className="text-gray-500 text-xs block mt-1">
                                {new Date(attempt.submittedAt).toLocaleDateString()}
                              </span>
                              {attempt.completedDuration && (
                                <span className="text-gray-400 text-xs block">
                                  <Clock className="w-3 h-3 inline" /> {Math.round(attempt.completedDuration / 60)} min
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Summary Statistics */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-blue-100 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-blue-600">{totalTestAttempts}</p>
                <p className="text-xs text-gray-600 mt-1">Total Test Attempts</p>
              </div>
              <div className="bg-green-100 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-green-600">{totalExamAttempts}</p>
                <p className="text-xs text-gray-600 mt-1">Total Exam Attempts</p>
              </div>
              <div className="bg-purple-100 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {bestTestScore > 0 || bestExamScore > 0 
                    ? Math.max(bestTestScore, bestExamScore) 
                    : 0}%
                </p>
                <p className="text-xs text-gray-600 mt-1">Overall Best Score</p>
              </div>
              <div className="bg-yellow-100 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {courseData.progress.completedLessonCount || 0}
                </p>
                <p className="text-xs text-gray-600 mt-1">Lessons Completed</p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

// ProgressReportTable component
const ProgressReportTable = ({ progressData, isLoading, error, username, testResults, examResults }) => {
  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full rounded-md border border-gray-200">
          <thead>
            <tr className="bg-green-600 text-white text-sm font-medium h-12 text-left">
              <th className="px-4">COURSE</th>
              <th className="px-4 w-48">PROGRESS</th>
              <th className="px-4 w-32 text-center">COMPLETED LESSONS</th>
              <th className="px-4 w-32 text-center">TEST ATTEMPTS</th>
              <th className="px-4 w-32 text-center">EXAM ATTEMPTS</th>
              <th className="px-4 w-40">BEST SCORES</th>
              <th className="px-4 w-32 text-center">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan="7" className="text-center text-gray-500 py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    <span className="ml-2">Loading progress data...</span>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="7" className="text-center text-red-700 py-8">
                  {error}
                </td>
              </tr>
            ) : progressData.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center text-gray-500 py-8">
                  No progress data available.
                </td>
              </tr>
            ) : (
              progressData.map((progressItem) => (
                <CourseDetailRow 
                  key={`${progressItem.userId}-${progressItem.progress.courseId}`}
                  courseData={progressItem}
                  testResults={testResults}
                  examResults={examResults}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Grid View */}
      <div className="md:hidden flex flex-col gap-4">
        {isLoading ? (
          <div className="text-center text-gray-500 py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-2">Loading progress data...</p>
          </div>
        ) : error ? (
          <div className="text-center text-red-700 py-8">{error}</div>
        ) : progressData.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No progress data available.</div>
        ) : (
          progressData.map((progressItem) => {
            const courseTests = testResults.filter(test => test.courseId === progressItem.progress.courseId);
            const courseExams = examResults.filter(exam => exam.courseId === progressItem.progress.courseId);
            const totalTestAttempts = courseTests.reduce((sum, test) => sum + (test.attempts?.length || 0), 0);
            const totalExamAttempts = courseExams.reduce((sum, exam) => sum + (exam.attempts?.length || 0), 0);
            
            return (
              <div
                key={`${progressItem.userId}-${progressItem.progress.courseId}`}
                className="shadow-lg rounded-lg p-4 bg-white border border-gray-200"
              >
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg">{progressItem.progress.courseTitle}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${progressItem.progress.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold">{progressItem.progress.percentage}%</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <label className="font-semibold text-gray-600">Completed Lessons</label>
                      <p className="text-lg font-bold">{progressItem.progress.completedLessonCount || 0}</p>
                    </div>
                    <div>
                      <label className="font-semibold text-gray-600">Status</label>
                      <p className={`text-xs font-semibold px-2 py-1 rounded-full inline-block ${
                        progressItem.progress.isCompleted 
                          ? "bg-green-100 text-green-800" 
                          : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {progressItem.progress.isCompleted ? "Completed" : "In Progress"}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm pt-2 border-t">
                    <div>
                      <label className="font-semibold text-gray-600 flex items-center gap-1">
                        <BookOpen className="w-4 h-4" /> Test Attempts
                      </label>
                      <p className="text-lg font-bold text-blue-600">{totalTestAttempts}</p>
                    </div>
                    <div>
                      <label className="font-semibold text-gray-600 flex items-center gap-1">
                        <Award className="w-4 h-4" /> Exam Attempts
                      </label>
                      <p className="text-lg font-bold text-green-600">{totalExamAttempts}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
};

// Main CourseProgressReport component
function CourseProgressReport() {
  const navigate = useNavigate();
  const [progressData, setProgressData] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [examResults, setExamResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [username, setUsername] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      const storedData = localStorage.getItem("loginData");

      if (!storedData) {
        console.error("No login data found in localStorage");
        setError("Please log in to view your course progress.");
        navigate("/login");
        setIsLoading(false);
        return;
      }

      let userData;
      try {
        userData = JSON.parse(storedData);
      } catch (error) {
        console.error("Error parsing loginData:", error);
        setError("Invalid login data. Please log in again.");
        navigate("/login");
        setIsLoading(false);
        return;
      }

      if (!userData?.user?._id || typeof userData.user._id !== "string" || userData.user._id.trim() === "") {
        console.error("Invalid or missing user ID in loginData");
        setError("Invalid user ID. Please log in again.");
        navigate("/login");
        setIsLoading(false);
        return;
      }

      try {
        // Fetch all course progress and test results
        const [courseProgressResponse, testResultsResponse] = await Promise.all([
          GetAllCourseProgress(),
          GetUserTestResults(userData.user._id).catch(err => {
            console.warn("Failed to fetch test results:", err);
            return [];
          })
        ]);

        // Try to fetch exam submissions (may fail if mentor-only)
        let examSubmissionsResponse = [];
        try {
          examSubmissionsResponse = await GetAllExamSubmissions();
        } catch (err) {
          console.warn("Failed to fetch exam submissions (may be mentor-only):", err);
          // Try alternative: fetch all exams and get user results
          try {
            const allExams = await GetAllExams();
            const examResultsPromises = allExams.map(exam => 
              GetUserExamResults(exam._id).catch(() => null)
            );
            const examResults = await Promise.all(examResultsPromises);
            examSubmissionsResponse = examResults.filter(result => result !== null);
          } catch (altErr) {
            console.warn("Alternative exam fetch also failed:", altErr);
          }
        }

        // Filter for the logged-in user
        const userProgress = courseProgressResponse.find((user) => user._id === userData.user._id);
        const progressArray = userProgress
          ? userProgress.courseProgress.map((progress) => ({
              userId: userProgress._id,
              progress: {
                courseId: progress.courseId,
                courseTitle: progress.courseTitle,
                percentage: progress.percentage || 0,
                completedLessonCount: progress.completedLessonCount || 0,
                isCompleted: progress.isCompleted || false,
              },
            }))
          : [];

        // Filter and format exam submissions for current user
        let formattedExamResults = [];
        
        if (Array.isArray(examSubmissionsResponse)) {
          // Handle GetAllExamSubmissions response format
          const userExamSubmissions = examSubmissionsResponse.filter(submission => 
            submission.user?._id === userData.user._id || 
            submission.user === userData.user._id ||
            (submission.user && typeof submission.user === 'string' && submission.user === userData.user._id)
          );

          formattedExamResults = userExamSubmissions.map(submission => ({
            examId: submission.examId?._id || submission.examId,
            examTitle: submission.examTitle || submission.examId?.title || "Unknown Exam",
            courseId: submission.courseId?._id || submission.courseId,
            courseTitle: submission.courseTitle || "Unknown Course",
            attempts: submission.attempts || [],
            bestScore: submission.bestScore || 0,
            bestPercentage: submission.bestPercentage || 0,
            rank: submission.rank || null,
          }));
        } else if (examSubmissionsResponse && typeof examSubmissionsResponse === 'object') {
          // Handle GetUserExamResults response format (single exam result)
          formattedExamResults = [{
            examId: examSubmissionsResponse.examId?._id || examSubmissionsResponse.examId,
            examTitle: examSubmissionsResponse.examTitle || examSubmissionsResponse.examId?.title || "Unknown Exam",
            courseId: examSubmissionsResponse.courseId?._id || examSubmissionsResponse.courseId,
            courseTitle: examSubmissionsResponse.courseTitle || "Unknown Course",
            attempts: examSubmissionsResponse.attempts || [],
            bestScore: examSubmissionsResponse.bestScore || 0,
            bestPercentage: examSubmissionsResponse.bestPercentage || 0,
            rank: examSubmissionsResponse.rank || null,
          }];
        }

        setProgressData(progressArray);
        setTestResults(Array.isArray(testResultsResponse) ? testResultsResponse : []);
        setExamResults(formattedExamResults);
        setUsername(userData.user.username || "Unknown");
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(error.message || "Failed to fetch course progress.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  return (
    <>
      <PageHeader title="Course Progress Report" />
      <div className="px-4 lg:px-8 py-6">
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Complete Progress Report</h3>
          <p className="text-sm text-gray-600">View detailed progress including course completion, test attempts, and exam results</p>
        </div>
        <ProgressReportTable
          progressData={progressData}
          isLoading={isLoading}
          error={error}
          username={username}
          testResults={testResults}
          examResults={examResults}
        />
      </div>
    </>
  );
}

export default CourseProgressReport;
