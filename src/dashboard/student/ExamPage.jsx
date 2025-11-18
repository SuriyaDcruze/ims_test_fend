import React, { useEffect, useState, useRef } from "react";
import PageHeader from "../../components/PageHeader";
import { GetUserTestResults, GetCourseEnrollment } from "../../service/api";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";

const UserInfo = JSON.parse(localStorage.getItem("loginData"));

function ExamPage() {
  const navigate = useNavigate();
  const [marksData, setMarksData] = useState([]);
  const [purchasedCourses, setPurchasedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const resultsRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (!UserInfo || !UserInfo.user || !UserInfo.user._id) {
          setError("Please log in to view your exam results");
          return;
        }

        const enrollmentData = await GetCourseEnrollment({ userId: UserInfo.user._id });
        const enrolledCourses = enrollmentData.enrolledCourses || [];
        const courseData = enrolledCourses.map((item) => ({
          id: item.courseId._id,
          title: item.courseId.title,
          thumbnail: item.courseId.thumbnail,
        }));
        setPurchasedCourses(courseData);

        const results = await GetUserTestResults(UserInfo.user._id);
        const formattedResults = results.flatMap((result) =>
          result.attempts.map((attempt) => ({
            courseId: result.courseId,
            courseTitle: result.courseTitle,
            sublessonTitle: result.sublessonTitle,
            marks: attempt.score,
            totalMarks: result.totalMarks,
            percentage: attempt.percentage,
            bestPercentage: result.bestPercentage,
            rank: result.rank,
            timestamp: attempt.submittedAt,
          }))
        );
        setMarksData(formattedResults);
      } catch (err) {
        setError("No attempts found");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const bestMarksByCourse = purchasedCourses.map((course) => {
    const courseResults = marksData.filter((result) => result.courseId === course.id);
    const bestPercentage = courseResults.length > 0
      ? Math.max(...courseResults.map((result) => result.bestPercentage))
      : 0;
    return {
      courseId: course.id,
      courseTitle: course.title,
      bestPercentage,
    };
  });

  const clearResults = () => {
    setMarksData([]);
    setSelectedCourseId(null);
  };

  useEffect(() => {
    if (selectedCourseId && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedCourseId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen font-poppins text-gray-600">
        <p className="text-lg">Loading data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4 font-poppins">
        <div className="bg-white p-6 rounded-lg shadow-sm text-center">
          <p className="text-gray-600 text-lg">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Exam Results" />
      <div className="p-4 sm:p-6 max-w-7xl mx-auto font-poppins">
        {/* Purchased Courses Section */}
        <div className="mb-12">
          {/* <h2 className="text-2xl font-semibold mb-6 font-jakarta">Your Purchased Courses</h2> */}
          {purchasedCourses.length === 0 ? (
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <p className="text-gray-600">No courses purchased.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
              {purchasedCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  bestPercentage={bestMarksByCourse.find((c) => c.courseId === course.id)?.bestPercentage || 0}
                  setSelectedCourseId={setSelectedCourseId}
                />
              ))}
            </div>
          )}
        </div>

        {/* Detailed Results Section */}
        {selectedCourseId && (
          <div className="mb-8" ref={resultsRef} tabIndex={-1}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold font-jakarta">
                Test Results for {bestMarksByCourse.find((c) => c.courseId === selectedCourseId)?.courseTitle}
              </h2>
              <div className="flex gap-4">
                <button
                  onClick={() => setSelectedCourseId(null)}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 font-poppins text-gray-700"
                >
                  Close Details
                </button>
              </div>
            </div>
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              {marksData.filter((result) => result.courseId === selectedCourseId).length === 0 ? (
                <div className="p-6 text-center bg-gray-100 rounded-lg font-poppins">
                  <p className="text-gray-600 text-lg">No attempts found</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-jakarta">
                        Test
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-jakarta">
                        Marks
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-jakarta">
                        Best Percentage
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-jakarta">
                        Rank
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-jakarta">
                        Attempt Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {marksData
                      .filter((result) => result.courseId === selectedCourseId)
                      .map((result, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-poppins">
                            {result.sublessonTitle}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-poppins">
                            {result.marks} / {result.totalMarks} ({result.percentage}%)
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-poppins">
                            {result.bestPercentage}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-poppins">
                            {result.rank}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-poppins">
                            {new Date(result.timestamp).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// CourseCard component
const CourseCard = ({ course, bestPercentage, setSelectedCourseId }) => {
  return (
    <div
      className="group p-6 bg-white flex flex-col h-full w-full max-w-sm rounded-lg shadow-sm hover:shadow-md hover:scale-105 hover:border-green-300 border border-transparent transition-all duration-300 font-poppins"
      role="article"
      aria-label={`Course: ${course.title}`}
    >
      <div className="w-full h-40 rounded-md overflow-hidden mb-4">
        <img
          src={course.thumbnail || "/fallback-image.jpg"}
          alt={`${course.title} thumbnail`}
          className="h-full w-full object-cover object-center"
          loading="lazy"
        />
      </div>
      <p className="font-semibold font-jakarta text-lg line-clamp-2 flex-grow">{course.title}</p>
      <p className="text-sm text-gray-600 mt-2">Best Score: {bestPercentage}%</p>
      <button
        className="mt-4 bg-green-600 text-white px-2.5 py-0.5 flex items-center gap-1.5 rounded-md font-poppins text-xs sm:text-sm group-hover:bg-green-200 group-hover:text-green-800 transition-colors"
        onClick={() => setSelectedCourseId(course.id)}
      >
        <span>View Details</span>
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
};

export default ExamPage;