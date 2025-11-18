import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { GetAllCourseProgress } from "../../service/api";

// Simple PageHeader component
const PageHeader = ({ title }) => (
  <div className="bg-gray-100 py-6 px-4 lg:px-8">
    <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
  </div>
);

// ProgressReportTable component
const ProgressReportTable = ({ progressData, isLoading, error, username }) => {
  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block">
        <table className="w-full rounded-md">
          <thead>
            <tr className="bg-green-600 text-white text-sm font-medium h-10 text-left divide-x divide-gray-200">
              <th className="px-2">COURSE</th>
              <th className="px-2 w-24">PROGRESS</th>
              <th className="px-2 w-50">COMPLETED LESSONS</th>
              <th className="px-2 w-56">USERNAME</th>
              <th className="px-2 w-24">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-x divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan="5" className="text-center text-gray-500 py-4">
                  Loading...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="5" className="text-center text-red-700 py-4">
                  {error}
                </td>
              </tr>
            ) : progressData.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center text-gray-500 py-4">
                  No progress data available.
                </td>
              </tr>
            ) : (
              progressData.map((progressItem) => (
                <tr
                  key={`${progressItem.userId}-${progressItem.progress.courseId}`}
                  className="bg-white text-black font-base h-10 divide-x divide-gray-200"
                >
                  <td className="px-2" data-cell="course">
                    {progressItem.progress.courseTitle}
                  </td>
                  <td className="px-2" data-cell="progress">
                    {progressItem.progress.percentage}%
                  </td>
                  <td className="px-2" data-cell="completedLessons">
                    {progressItem.progress.completedLessonCount || 0}
                  </td>
                  <td className="px-2" data-cell="username">
                    {username}
                  </td>
                  <td className="px-2" data-cell="status">
                    {progressItem.progress.isCompleted ? "Completed" : "In Progress"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Grid View */}
      <div className="md:hidden flex flex-col gap-4">
        {isLoading ? (
          <div className="text-center text-gray-500 py-4">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-700 py-4">{error}</div>
        ) : progressData.length === 0 ? (
          <div className="text-center text-gray-500 py-4">No progress data available.</div>
        ) : (
          progressData.map((progressItem) => (
            <div
              key={`${progressItem.userId}-${progressItem.progress.courseId}`}
              className="grid grid-cols-2 shadow rounded-md p-4 gap-2 text-sm w-full bg-white"
            >
              <label className="font-semibold">Course</label>
              <p>{progressItem.progress.courseTitle}</p>
              <label className="font-semibold">Progress</label>
              <p>{progressItem.progress.percentage}%</p>
              <label className="font-semibold">Completed Lessons</label>
              <p>{progressItem.progress.completedLessonCount || 0}</p>
              <label className="font-semibold">Username</label>
              <p>{username}</p>
              <label className="font-semibold">Status</label>
              <p>{progressItem.progress.isCompleted ? "Completed" : "In Progress"}</p>
            </div>
          ))
        )}
      </div>
    </>
  );
};

// Main CourseProgressReport component
function CourseProgressReport() {
  const navigate = useNavigate();
  const [progressData, setProgressData] = useState([]);
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
        // Fetch all course progress
        const response = await GetAllCourseProgress();
        // Filter for the logged-in user
        const userProgress = response.find((user) => user._id === userData.user._id);
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

        setProgressData(progressArray);
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
      <PageHeader title="Course Progress" />
      <div className="px-4 lg:px-8">
        <div className="mb-4">
          <h3 className="text-base font-medium">Your Progress Report</h3>
        </div>
        <ProgressReportTable
          progressData={progressData}
          isLoading={isLoading}
          error={error}
          username={username}
        />
      </div>
    </>
  );
}

export default CourseProgressReport;