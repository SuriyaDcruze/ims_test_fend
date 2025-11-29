import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GetAllCourseProgress } from '../../service/api';
import { Eye } from 'lucide-react';

// Simple PageHeader component
const PageHeader = ({ title }) => (
  <div className="bg-gray-100 py-6 px-4 lg:px-8">
    <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
  </div>
);


// ProgressReportTable component with clickable rows
const ProgressReportTable = ({ progressData, isLoading, error, onRowClick }) => {
  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full rounded-md border border-gray-200">
          <thead>
            <tr className="bg-green-600 text-white text-sm font-medium h-12 text-left">
              <th className="px-4">USERNAME</th>
              <th className="px-4">COURSE</th>
              <th className="px-4 w-32">PROGRESS</th>
              <th className="px-4 w-40">COMPLETED LESSONS</th>
              <th className="px-4 w-32">STATUS</th>
              <th className="px-4 w-32 text-center">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan="6" className="text-center text-gray-500 py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    <span className="ml-2">Loading progress data...</span>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="6" className="text-center text-red-700 py-8">{error}</td>
              </tr>
            ) : progressData.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center text-gray-500 py-8">
                  No progress data available.
                </td>
              </tr>
            ) : (
              progressData.map(({ userId, username, progress }) => (
                <tr 
                  key={`${userId}-${progress.courseId}`} 
                  className="bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => onRowClick(userId, username)}
                >
                  <td className="px-4 py-3 font-medium">{username}</td>
                  <td className="px-4 py-3">{progress.courseTitle}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            progress.percentage === 100 ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${progress.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold w-12">{progress.percentage}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {progress.completedLessonCount || 0}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      progress.isCompleted 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {progress.isCompleted ? 'Completed' : 'In Progress'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRowClick(userId, username);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded flex items-center gap-1 text-sm transition-colors"
                    >
                      <Eye size={16} />
                      View Details
                    </button>
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
          <div className="text-center text-gray-500 py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
            Loading progress data...
          </div>
        ) : error ? (
          <div className="text-center text-red-700 py-8">{error}</div>
        ) : progressData.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No progress data available.</div>
        ) : (
          progressData.map(({ userId, username, progress }) => (
            <div
              key={`${userId}-${progress.courseId}`}
              onClick={() => onRowClick(userId, username)}
              className="shadow-lg rounded-lg p-4 bg-white border border-gray-200 cursor-pointer hover:shadow-xl transition-shadow"
            >
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-lg">{username}</h3>
                  <p className="text-gray-600">{progress.courseTitle}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        progress.percentage === 100 ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold">{progress.percentage}%</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-gray-600">
                    {progress.completedLessonCount || 0} lessons completed
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    progress.isCompleted 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {progress.isCompleted ? 'Completed' : 'In Progress'}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRowClick(userId, username);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center justify-center gap-2"
                >
                  <Eye size={16} />
                  View Full Report
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
};

// Main AdminProgress component
const AdminProgress = () => {
  const navigate = useNavigate();
  const [progressData, setProgressData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState(''); // 'users' or 'courses'
  const [selectedFilter, setSelectedFilter] = useState(''); // username or courseTitle
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);

  // Fetch all course progress
  useEffect(() => {
    const fetchProgressData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await GetAllCourseProgress();
        // Flatten the response to [{ userId, username, progress }, ...]
        const flattenedData = response.flatMap(user =>
          user.courseProgress.map(progress => ({
            userId: user._id,
            username: user.username,
            progress
          }))
        );
        setProgressData(flattenedData);
        setFilteredData(flattenedData);

        // Extract unique users and courses
        const uniqueUsers = [...new Set(response.map(user => user.username))].sort();
        const uniqueCourses = [...new Set(flattenedData.map(item => item.progress.courseTitle))].sort();
        setUsers(uniqueUsers);
        setCourses(uniqueCourses);
      } catch (err) {
        setError(err.message || "Failed to load progress data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProgressData();
  }, []);

  // Handle filter type change
  const handleFilterTypeChange = (e) => {
    setFilterType(e.target.value);
    setSelectedFilter('');
    setFilteredData(progressData); // Reset to all data
  };

  // Handle filter selection change
  const handleFilterChange = (e) => {
    const value = e.target.value;
    setSelectedFilter(value);

    if (!value || value === 'All') {
      setFilteredData(progressData);
    } else if (filterType === 'users') {
      setFilteredData(progressData.filter(item => item.username === value));
    } else if (filterType === 'courses') {
      setFilteredData(progressData.filter(item => item.progress.courseTitle === value));
    }
  };

  // Handle row click to navigate to detail page
  const handleRowClick = (userId, username) => {
    navigate(`/admin/progress/candidate/${userId}`);
  };

  // Calculate statistics
  const getStats = () => {
    if (!filterType || !selectedFilter || selectedFilter === 'All') {
      return null;
    }

    if (filterType === 'users') {
      const userCourses = progressData.filter(item => item.username === selectedFilter);
      const completedCourses = userCourses.filter(item => item.progress.isCompleted).length;
      const totalProgress = userCourses.reduce((sum, item) => sum + item.progress.percentage, 0);
      const avgProgress = userCourses.length > 0 ? Math.round(totalProgress / userCourses.length) : 0;
      
      return (
        <div className="mb-4 p-4 bg-white shadow rounded-md">
          <h3 className="text-lg font-semibold mb-2">User Statistics</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Completed Courses</p>
              <p className="text-xl font-bold text-green-600">{completedCourses}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Courses</p>
              <p className="text-xl font-bold text-blue-600">{userCourses.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Progress</p>
              <p className="text-xl font-bold text-purple-600">{avgProgress}%</p>
            </div>
          </div>
        </div>
      );
    } else if (filterType === 'courses') {
      const courseUsers = progressData.filter(item => item.progress.courseTitle === selectedFilter);
      const completedUsers = courseUsers.filter(item => item.progress.isCompleted).length;
      const inProgressUsers = courseUsers.filter(item => !item.progress.isCompleted).length;
      return (
        <div className="mb-4 p-4 bg-white shadow rounded-md">
          <h3 className="text-lg font-semibold mb-2">Course Statistics</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Completed by</p>
              <p className="text-xl font-bold text-green-600">{completedUsers}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-xl font-bold text-yellow-600">{inProgressUsers}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-xl font-bold text-blue-600">{courseUsers.length}</p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <PageHeader title="Course Progress Report" />
      <div className="px-4 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row items-start justify-between lg:items-center mb-6 gap-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-1">Complete Progress Report</h3>
            <p className="text-sm text-gray-600">Click on any row to view detailed candidate analysis</p>
          </div>
          <div className="flex gap-4">
            <select
              value={filterType}
              onChange={handleFilterTypeChange}
              className="bg-white px-4 py-2 text-black shadow rounded-md border border-gray-300"
            >
              <option value="">Select Filter Type</option>
              <option value="users">Users</option>
              <option value="courses">Courses</option>
            </select>
            {filterType && (
              <select
                value={selectedFilter}
                onChange={handleFilterChange}
                className="bg-white px-4 py-2 text-black shadow rounded-md border border-gray-300"
              >
                <option value="All">All</option>
                {(filterType === 'users' ? users : courses).map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {getStats()}

        <ProgressReportTable
          progressData={filteredData}
          isLoading={isLoading}
          error={error}
          onRowClick={handleRowClick}
        />
      </div>
    </>
  );
};

export default AdminProgress;
