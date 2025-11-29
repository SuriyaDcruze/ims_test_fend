import { useState } from "react";
import {
  GetAllUsers,
  UpdateUserById,
  UpdateUserApproval,
  UpdateUserApproval1,
  DeleteUserById,
  ApproveCourseEnrollment,
  UpdateEnrollmentExpiry,
  ChangeUserRole,
  GetCourseEnrollment,
  GetCourseProgress,
} from "../../service/api";
import { useLoaderData } from "react-router";
import PageHeader from "../../components/PageHeader";

// Toggle Switch Component
function ToggleSwitch({ isApproved, userId, courseId, onToggle, disabled }) {
  const handleToggle = () => {
    onToggle(userId, courseId, !isApproved);
  };

  return (
    <label className="inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={isApproved}
        onChange={handleToggle}
        className="sr-only peer"
        disabled={disabled}
      />
      <div
        className={`relative w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 ${disabled ? 'opacity-50' : ''}`}
      ></div>
    </label>
  );
}

function UserManagement() {
  const initialUsers = useLoaderData();
  const [users, setUsers] = useState(initialUsers);
  const [editingUserId, setEditingUserId] = useState(null);
  const [viewingUserId, setViewingUserId] = useState(null);
  const [editedUserData, setEditedUserData] = useState({});
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [editedExpiryDates, setEditedExpiryDates] = useState({});
  const [courseActionLoading, setCourseActionLoading] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [courseDetailsModal, setCourseDetailsModal] = useState({
    open: false,
    user: null,
  });
  const [userCourseDetails, setUserCourseDetails] = useState([]);
  const [userCourseDetailsLoading, setUserCourseDetailsLoading] = useState(false);
  const [userCourseDetailsError, setUserCourseDetailsError] = useState("");

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Filter users based on search term
  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle toggle approval for user
  const handleToggleApproval = async (userId, newApprovalStatus) => {
    setIsLoading(true);
    try {
      await UpdateUserApproval1(userId, newApprovalStatus);
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === userId ? { ...user, isApproved: newApprovalStatus } : user
        )
      );
      setErrors({});
      window.location.reload();
    } catch (error) {
      setErrors({ general: error.message || "Failed to update approval status" });
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === userId ? { ...user, isApproved: !newApprovalStatus } : user
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle toggle approval for course enrollment
  const handleToggleCourseApproval = async (userId, courseId, newApprovalStatus) => {
    setCourseActionLoading((prev) => ({ ...prev, [`${userId}-${courseId}`]: true }));
    try {
      await ApproveCourseEnrollment(userId, courseId);
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === userId
            ? {
                ...user,
                enrolledCourses: user.enrolledCourses.map((course) =>
                  course.courseId === courseId ? { ...course, isApproved: newApprovalStatus } : course
                ),
              }
            : user
        )
      );
      setErrors({});
    } catch (error) {
      setErrors({ general: error.message || "Failed to update course approval status" });
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === userId
            ? {
                ...user,
                enrolledCourses: user.enrolledCourses.map((course) =>
                  course.courseId === courseId ? { ...course, isApproved: !newApprovalStatus } : course
                ),
              }
            : user
        )
      );
    } finally {
      setCourseActionLoading((prev) => ({ ...prev, [`${userId}-${courseId}`]: false }));
    }
  };

  // Handle expiry date change
  const handleExpiryDateChange = (courseId, value) => {
    setEditedExpiryDates((prev) => ({ ...prev, [courseId]: value }));
  };

  // Save expiry date
  const handleSaveExpiryDate = async (userId, courseId) => {
    const expiryDate = editedExpiryDates[courseId];
    if (!expiryDate) {
      setErrors({ general: "Please select a valid expiry date" });
      return;
    }
    const selectedDate = new Date(expiryDate);
    const now = new Date();
    if (selectedDate <= now) {
      setErrors({ general: "Expiry date must be in the future" });
      return;
    }

    setCourseActionLoading((prev) => ({ ...prev, [`${userId}-${courseId}-expiry`]: true }));
    try {
      await UpdateEnrollmentExpiry(userId, courseId, expiryDate);
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === userId
            ? {
                ...user,
                enrolledCourses: user.enrolledCourses.map((course) =>
                  course.courseId === courseId ? { ...course, expiryDate: expiryDate } : course
                ),
              }
            : user
        )
      );
      setEditedExpiryDates((prev) => {
        const newDates = { ...prev };
        delete newDates[courseId];
        return newDates;
      });
      setErrors({});
    } catch (error) {
      setErrors({ general: error.message || "Failed to update expiry date" });
    } finally {
      setCourseActionLoading((prev) => ({ ...prev, [`${userId}-${courseId}-expiry`]: false }));
    }
  };

  // Start editing
  const handleEdit = (userId) => {
    const user = users.find((u) => u._id === userId);
    setEditingUserId(userId);
    setEditedUserData({
      ...user,
      phone: user.phone || '',
      education: user.education || '',
      degreeName: user.degreeName || ''
    });
    setShowUserDetails(true);
    setIsViewing(false);
    setErrors({});
  };

  // Start viewing
  const handleView = (userId) => {
    setViewingUserId(userId);
    setShowUserDetails(true);
    setIsViewing(true);
    setErrors({});
    setEditedExpiryDates({});
  };

  const handleCloseCourseDetails = () => {
    setCourseDetailsModal({ open: false, user: null });
    setUserCourseDetails([]);
    setUserCourseDetailsError("");
  };

  const handleCourseDetailsView = async (user) => {
    setCourseDetailsModal({ open: true, user });
    setUserCourseDetails([]);
    setUserCourseDetailsError("");
    setUserCourseDetailsLoading(true);

    try {
      const enrollmentRes = await GetCourseEnrollment({ userId: user._id });
      const enrolledCourses = enrollmentRes.enrolledCourses || [];
      const validCourses = enrolledCourses.filter((enrollment) => {
        const hasCourse = enrollment.courseId && enrollment.courseId._id;
        const isApproved = enrollment.isApproved === true;
        const notExpired = new Date(enrollment.expiryDate) > new Date();
        return hasCourse && isApproved && notExpired;
      });

      if (validCourses.length === 0) {
        setUserCourseDetailsError("No active course purchases found for this user.");
        setUserCourseDetails([]);
        return;
      }

      const courseDetails = [];
      for (const enrollment of validCourses) {
        const courseInfo = enrollment.courseId;
        let percentage = 0;
        try {
          const progressRes = await GetCourseProgress(user._id, courseInfo._id);
          percentage = progressRes.progress?.percentage ?? 0;
        } catch (error) {
          percentage = 0;
        }

        courseDetails.push({
          id: courseInfo._id,
          title: courseInfo.title,
          thumbnail: courseInfo.thumbnail,
          expiryDate: enrollment.expiryDate,
          percentage,
        });
      }

      setUserCourseDetails(courseDetails);
    } catch (error) {
      setUserCourseDetailsError(
        error.message || "Failed to fetch course details. Please try again."
      );
      setUserCourseDetails([]);
    } finally {
      setUserCourseDetailsLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const nameRegex = /^[a-zA-Z\s]*$/; // Allows letters and spaces for firstName, lastName, education
    const degreeNameRegex = /^[a-zA-Z\s.]*$/; // Allows letters, spaces, and periods for degreeName
    const usernameRegex = /^[a-zA-Z0-9_]*$/; // Allows only letters for username
    const phoneRegex = /^[6-9]\d{0,9}$/; // Allows 10 digits starting with 6-9

    // Validate input based on field
    if (name === "firstName" || name === "lastName" || name === "education") {
      if (!nameRegex.test(value)) {
        setErrors((prev) => ({
          ...prev,
          [name]: "Only letters and spaces are allowed",
        }));
        return;
      }
    } else if (name === "degreeName") {
      if (!degreeNameRegex.test(value)) {
        setErrors((prev) => ({
          ...prev,
          degreeName: "Only letters, spaces, and periods are allowed",
        }));
        return;
      }
    } else if (name === "username") {
      if (!usernameRegex.test(value)) {
        setErrors((prev) => ({
          ...prev,
          [name]: "Only letters are allowed",
        }));
        return;
      }
    } else if (name === "dob") {
      const selectedDate = new Date(value);
      const now = new Date();
      if (selectedDate > now) {
        setErrors((prev) => ({
          ...prev,
          dob: "Date of Birth cannot be a future date",
        }));
        return;
      }
    } else if (name === "phone") {
      if (value && !phoneRegex.test(value)) {
        setErrors((prev) => ({
          ...prev,
          phone: "Phone number must start with 6, 7, 8, or 9 and contain only digits",
        }));
        return;
      }
    }

    setEditedUserData((prev) => ({ ...prev, [name]: value }));
    // Clear error for the field when valid input is provided
    if (value.trim()) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Save edited data
  const handleSave = async (userId) => {
    const newErrors = {};
    const nameRegex = /^[a-zA-Z\s]+$/; // Requires at least one letter or space for firstName, lastName, education
    const degreeNameRegex = /^[a-zA-Z\s.]+$/; // Requires at least one letter, space, or period for degreeName
    const usernameRegex = /^[a-zA-Z]+$/; // Requires at least one letter for username
    const phoneRegex = /^[6-9]\d{9}$/; // Requires exactly 10 digits starting with 6-9

    // Validate required fields
    if (!editedUserData.firstName || editedUserData.firstName.trim() === "") {
      newErrors.firstName = "First name is required";
    } else if (!nameRegex.test(editedUserData.firstName)) {
      newErrors.firstName = "First name must contain only letters and spaces";
    }
    if (!editedUserData.lastName || editedUserData.lastName.trim() === "") {
      newErrors.lastName = "Last name is required";
    } else if (!nameRegex.test(editedUserData.lastName)) {
      newErrors.lastName = "Last name must contain only letters and spaces";
    }
    if (!editedUserData.username || editedUserData.username.trim() === "") {
      newErrors.username = "Username is required";
    } else if (!usernameRegex.test(editedUserData.username)) {
      newErrors.username = "Username must contain only letters";
    }
    if (!editedUserData.email || editedUserData.email.trim() === "") {
      newErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(editedUserData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (!editedUserData.dob || editedUserData.dob.trim() === "") {
      newErrors.dob = "Date of Birth is required";
    } else {
      const selectedDate = new Date(editedUserData.dob);
      const now = new Date();
      if (selectedDate > now) {
        newErrors.dob = "Date of Birth cannot be a future date";
      }
    }
    if (!editedUserData.gender || editedUserData.gender.trim() === "") {
      newErrors.gender = "Gender is required";
    }
    if (!editedUserData.education || editedUserData.education.trim() === "") {
      newErrors.education = "Educational Qualification is required";
    } else if (!nameRegex.test(editedUserData.education)) {
      newErrors.education = "Educational Qualification must contain only letters and spaces";
    }
    // if (!editedUserData.degreeName || editedUserData.degreeName.trim() === "") {
    //   newErrors.degreeName = "Degree Name is required";
    // } else if (!degreeNameRegex.test(editedUserData.degreeName)) {
    //   newErrors.degreeName = "Degree Name must contain only letters, spaces, and periods";
    // }
    if (!editedUserData.phone || editedUserData.phone.trim() === "") {
      newErrors.phone = "Phone No is required";
    } else if (!phoneRegex.test(editedUserData.phone)) {
      newErrors.phone = "Phone No must be a 10-digit number starting with 6, 7, 8, or 9";
    }
    if (!editedUserData.address || editedUserData.address.trim() === "") {
      newErrors.address = "Present Address is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      console.log("Sending payload to UpdateUserById:", editedUserData); // Debug: Log payload
      const updatedUser = await UpdateUserById(userId, editedUserData);
      console.log("Received response from UpdateUserById:", updatedUser); // Debug: Log response

      // Ensure degreeName is preserved even if not returned by API
      const updatedUserWithDegree = {
        ...updatedUser,
        degreeName: editedUserData.degreeName || updatedUser.degreeName || '',
      };

      if (editedUserData.role && editedUserData.role !== users.find((u) => u._id === userId).role) {
        await ChangeUserRole(userId, editedUserData.role);
        updatedUserWithDegree.role = editedUserData.role;
      }

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === userId ? { ...user, ...updatedUserWithDegree } : user
        )
      );
      setEditingUserId(null);
      setEditedUserData({});
      setShowUserDetails(false);
      setErrors({});
    } catch (error) {
      console.error("Error in UpdateUserById:", error.response?.data || error.message); // Debug: Log error
      setErrors({ general: error.response?.data?.error || error.message || "Failed to update user" });
    } finally {
      setIsLoading(false);
    }
  };

  const renderCourseDetailsModal = () => {
    if (!courseDetailsModal.open) return null;

    const user = courseDetailsModal.user;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
        <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl">
          <div className="flex items-start justify-between border-b px-6 py-4">
            <div>
              <p className="text-xs uppercase text-gray-500">User Overview</p>
              <h3 className="text-xl font-semibold text-gray-900">{user?.username}</h3>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
            <button
              onClick={handleCloseCourseDetails}
              className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-200"
            >
              Close
            </button>
          </div>

          <div className="px-6 py-4">
            {userCourseDetailsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent"></div>
              </div>
            ) : userCourseDetailsError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                {userCourseDetailsError}
              </div>
            ) : userCourseDetails.length === 0 ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-600">
                This user has not purchased any courses yet.
              </div>
            ) : (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {userCourseDetails.map((course) => (
                  <div
                    key={course.id}
                    className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-gradient-to-r from-purple-50 via-white to-white p-4 shadow-sm md:flex-row"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-20 w-20 overflow-hidden rounded-lg border border-purple-100 bg-white shadow-sm">
                        <img
                          src={course.thumbnail || "/vite.svg"}
                          alt={course.title}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/vite.svg";
                          }}
                        />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">{course.title}</h4>
                        <p className="text-sm text-gray-500">
                          Expires:{" "}
                          {course.expiryDate
                            ? new Date(course.expiryDate).toLocaleDateString()
                            : "Not available"}
                        </p>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-700">Completion</span>
                        <span className="font-semibold text-purple-600">{course.percentage}%</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-gray-200">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-purple-700 transition-all"
                          style={{ width: `${Math.min(course.percentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Cancel editing or viewing
  const handleCancel = () => {
    setEditingUserId(null);
    setViewingUserId(null);
    setEditedUserData({});
    setShowUserDetails(false);
    setIsViewing(false);
    setErrors({});
    setEditedExpiryDates({});
  };

  // Delete user with confirmation
  const handleDelete = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      setIsLoading(true);
      try {
        await DeleteUserById(userId);
        setUsers((prevUsers) => prevUsers.filter((user) => user._id !== userId));
        setErrors({});
      } catch (error) {
        setErrors({ general: error.message || "Failed to delete user" });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <>
      {renderCourseDetailsModal()}
      <PageHeader title={showUserDetails ? (isViewing ? "View User Details" : "Edit User Details") : "User Management"} />
      {errors.general && (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg mb-4">
          {errors.general}
        </div>
      )}
      {isLoading && (
        <div className="p-4 bg-blue-100 text-blue-700 rounded-lg mb-4">
          Processing...
        </div>
      )}

      {showUserDetails ? (
        <div className="p-4">
          <div className="bg-white rounded-lg shadow border border-gray-300 max-w-3xl mx-auto">
            <div className="p-4 border-b bg-gray-100">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium">{isViewing ? "User Details" : "Edit User Details"}</h2>
                {!isViewing && (
                  <div className="flex">
                    <button
                      onClick={() => handleSave(editingUserId)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md mr-2 hover:bg-blue-700"
                      disabled={isLoading}
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="bg-gray-300 px-4 py-2 rounded-md hover:bg-gray-400"
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                  </div>
                )}
                {isViewing && (
                  <button
                    onClick={handleCancel}
                    className="bg-gray-300 px-4 py-2 rounded-md hover:bg-gray-400"
                    disabled={isLoading}
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
            <div className="p-6">
              <div className="grid gap-6">
                {isViewing ? (
                  (() => {
                    const user = users.find((u) => u._id === viewingUserId);
                    return (
                      <>
                        {/* Enrolled Courses */}
                        <div className="grid grid-cols-1 md:grid-cols-3 items-start">
                          <label className="font-medium text-gray-700">Enrolled Courses:</label>
                          <div className="md:col-span-2">
                            <h3 className="text-md font-semibold mb-2">Course Enrollments</h3>
                            {user.enrolledCourses && user.enrolledCourses.length > 0 ? (
                              user.enrolledCourses.map((course, index) => (
                                <div key={course._id} className="mb-4 border border-gray-300 rounded-md p-4 bg-gray-50">
                                  <div className="grid grid-cols-1 gap-2">
                                    <div className="flex">
                                      <span className="font-medium w-1/3">Course {index + 1} ID:</span>
                                      <span className="w-2/3 text-gray-700">{course.courseId}</span>
                                    </div>
                                    <div className="flex">
                                      <span className="font-medium w-1/3">Enrolled At:</span>
                                      <span className="w-2/3 text-gray-700">
                                        {new Date(course.enrolledAt).toLocaleString()}
                                      </span>
                                    </div>
                                    <div className="flex items-center">
                                      <span className="font-medium w-1/3">Approved:</span>
                                      <div className="w-2/3">
                                        <ToggleSwitch
                                          isApproved={course.isApproved}
                                          userId={user._id}
                                          courseId={course.courseId}
                                          onToggle={handleToggleCourseApproval}
                                          disabled={courseActionLoading[`${user._id}-${course.courseId}`] || isLoading}
                                        />
                                      </div>
                                    </div>
                                    <div className="flex items-center">
                                      <span className="font-medium w-1/3">Expiry Date:</span>
                                      <div className="w-2/3 flex items-center space-x-2">
                                        <input
                                          type="datetime-local"
                                          value={
                                            editedExpiryDates[course.courseId] ||
                                            (course.expiryDate ? new Date(course.expiryDate).toISOString().slice(0, 16) : "")
                                          }
                                          onChange={(e) => handleExpiryDateChange(course.courseId, e.target.value)}
                                          className="border border-gray-300 rounded-md p-1 bg-gray-100"
                                          disabled={courseActionLoading[`${user._id}-${course.courseId}-expiry`] || isLoading}
                                        />
                                        <button
                                          onClick={() => handleSaveExpiryDate(user._id, course.courseId)}
                                          className="bg-blue-600 text-white px-2 py-1 rounded-md hover:bg-blue-700"
                                          disabled={
                                            !editedExpiryDates[course.courseId] ||
                                            courseActionLoading[`${user._id}-${course.courseId}-expiry`] ||
                                            isLoading
                                          }
                                        >
                                          Save
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-gray-700">No enrolled courses</div>
                            )}
                          </div>
                        </div>
                        {/* Course Progress */}
                        <div className="grid grid-cols-1 md:grid-cols-3 items-start">
                          <label className="font-medium text-gray-700">Course Progress:</label>
                          <div className="md:col-span-2">
                            <h3 className="text-md font-semibold mb-2">Course Progress Details</h3>
                            {user.courseProgress && user.courseProgress.length > 0 ? (
                              user.courseProgress.map((progress, index) => (
                                <div key={progress.courseId} className="mb-4 border border-gray-300 rounded-md p-4 bg-gray-50">
                                  <div className="grid grid-cols-1 gap-2">
                                    <div className="flex">
                                      <span className="font-medium w-1/3">Course Title:</span>
                                      <span className="w-2/3 text-gray-700">{progress.courseTitle}</span>
                                    </div>
                                    <div className="flex">
                                      <span className="font-medium w-1/3">Percentage:</span>
                                      <span className="w-2/3 text-gray-700">{progress.percentage}%</span>
                                    </div>
                                    <div className="flex">
                                      <span className="font-medium w-1/3">Completed:</span>
                                      <span className="w-2/3 text-gray-700">{progress.isCompleted ? "Yes" : "No"}</span>
                                    </div>
                                    <div className="flex">
                                      <span className="font-medium w-1/3">Completed Lessons:</span>
                                      <span className="w-2/3 text-gray-700">{progress.completedLessonCount}</span>
                                    </div>
                                    <div className="flex">
                                      <span className="font-medium w-1/3">Lessons:</span>
                                      <div className="w-2/3 text-gray-700">
                                        {progress.completedLessons && progress.completedLessons.length > 0 ? (
                                          progress.completedLessons.map((lesson, lessonIndex) => (
                                            <div key={lessonIndex} className="ml-2">
                                              <div>Lesson {lesson.lessonIndex + 1}: {lesson.percentage}%</div>
                                              <div>Completed: {lesson.isLessonCompleted ? "Yes" : "No"}</div>
                                              {lesson.sublessons && lesson.sublessons.length > 0 && (
                                                <div>
                                                  Sublessons:
                                                  <ul className="list-disc ml-4">
                                                    {lesson.sublessons.map((sublesson, subIndex) => (
                                                      <li key={subIndex}>
                                                        Sublesson {sublesson.sublessonIndex + 1}:{" "}
                                                        {sublesson.isCompleted ? "Completed" : "Not Completed"}
                                                      </li>
                                                    ))}
                                                  </ul>
                                                </div>
                                              )}
                                            </div>
                                          ))
                                        ) : (
                                          "No lessons completed"
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-gray-700">No course progress</div>
                            )}
                          </div>
                        </div>
                      </>
                    );
                  })()
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 items-center">
                      <label className="font-medium text-gray-700">
                        First Name: <span className="text-red-500">*</span>
                      </label>
                      <div className="md:col-span-2">
                        <input
                          type="text"
                          name="firstName"
                          value={editedUserData.firstName || ""}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-md p-2 bg-gray-100"
                          disabled={isLoading}
                          required
                        />
                        {errors.firstName && (
                          <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 items-center">
                      <label className="font-medium text-gray-700">
                        Last Name: <span className="text-red-500">*</span>
                      </label>
                      <div className="md:col-span-2">
                        <input
                          type="text"
                          name="lastName"
                          value={editedUserData.lastName || ""}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-md p-2 bg-gray-100"
                          disabled={isLoading}
                          required
                        />
                        {errors.lastName && (
                          <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 items-center">
                      <label className="font-medium text-gray-700">
                        Username: <span className="text-red-500">*</span>
                      </label>
                      <div className="md:col-span-2">
                        <input
                          type="text"
                          name="username"
                          value={editedUserData.username || ""}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-md p-2 bg-gray-100"
                          disabled={isLoading}
                          required
                        />
                        {errors.username && (
                          <p className="text-red-500 text-sm mt-1">{errors.username}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 items-center">
                      <label className="font-medium text-gray-700">
                        Email: <span className="text-red-500">*</span>
                      </label>
                      <div className="md:col-span-2">
                        <input
                          type="email"
                          name="email"
                          value={editedUserData.email || ""}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-md p-2 bg-gray-100"
                          disabled={isLoading}
                          required
                        />
                        {errors.email && (
                          <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 items-center">
                      <label className="font-medium text-gray-700">
                        Date of Birth: <span className="text-red-500">*</span>
                      </label>
                      <div className="md:col-span-2">
                        <input
                          type="date"
                          name="dob"
                          value={editedUserData.dob ? new Date(editedUserData.dob).toISOString().split('T')[0] : ""}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-md p-2 bg-gray-100"
                          disabled={isLoading}
                          required
                        />
                        {errors.dob && (
                          <p className="text-red-500 text-sm mt-1">{errors.dob}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 items-center">
                      <label className="font-medium text-gray-700">
                        Gender: <span className="text-red-500">*</span>
                      </label>
                      <div className="md:col-span-2">
                        <select
                          name="gender"
                          value={editedUserData.gender || ""}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-md p-2 bg-gray-100"
                          disabled={isLoading}
                          required
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                        {errors.gender && (
                          <p className="text-red-500 text-sm mt-1">{errors.gender}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 items-center">
                      <label className="font-medium text-gray-700">Role:</label>
                      <div className="md:col-span-2">
                        <select
                          name="role"
                          value={editedUserData.role || ""}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-md p-2 bg-gray-100"
                          disabled={isLoading}
                        >
                          <option value="">Select Role</option>
                          <option value="Mentor">Mentor</option>
                          <option value="Student">Student</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 items-center">
                      <label className="font-medium text-gray-700">
                        Educational Qualification: <span className="text-red-500">*</span>
                      </label>
                      <div className="md:col-span-2">
                        <input
                          type="text"
                          name="education"
                          value={editedUserData.education || ""}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-md p-2 bg-gray-100"
                          disabled={isLoading}
                          required
                        />
                        {errors.education && (
                          <p className="text-red-500 text-sm mt-1">{errors.education}</p>
                        )}
                      </div>
                    </div>
                    {/* <div className="grid grid-cols-1 md:grid-cols-3 items-center">
                      <label className="font-medium text-gray-700">
                        Degree Name: <span className="text-red-500">*</span>
                      </label>
                      <div className="md:col-span-2">
                        <input
                          type="text"
                          name="degreeName"
                          value={editedUserData.degreeName || ""}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-md p-2 bg-gray-100"
                          disabled={isLoading}
                          required
                        />
                        {errors.degreeName && (
                          <p className="text-red-500 text-sm mt-1">{errors.degreeName}</p>
                        )}
                      </div>
                    </div> */}
                    <div className="grid grid-cols-1 md:grid-cols-3 items-center">
                      <label className="font-medium text-gray-700">
                        Phone No: <span className="text-red-500">*</span>
                      </label>
                      <div className="md:col-span-2">
                        <input
                          type="text"
                          name="phone"
                          value={editedUserData.phone || ""}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-md p-2 bg-gray-100"
                          disabled={isLoading}
                          required
                          maxLength="10"
                        />
                        {errors.phone && (
                          <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 items-center">
                      <label className="font-medium text-gray-700">
                        Present Address: <span className="text-red-500">*</span>
                      </label>
                      <div className="md:col-span-2">
                        <textarea
                          name="address"
                          value={editedUserData.address || ""}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-md p-2 bg-gray-100"
                          rows="2"
                          disabled={isLoading}
                          required
                        ></textarea>
                        {errors.address && (
                          <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4">
          <div className="mb-4">
            <input
              type="text"
              placeholder="Filter by username..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full md:w-1/3 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="block md:hidden">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user, index) => (
                <div key={user._id} className="mb-4 bg-white rounded-lg shadow border border-gray-300">
                  <div className="p-4 border-b flex justify-between items-center">
                    <span className="font-medium">{index + 1}. {user.username}</span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleCourseDetailsView(user)}
                        className="rounded-full border border-purple-200 px-3 py-1 text-sm font-semibold text-purple-600 hover:bg-purple-50"
                        title="View Course Details"
                        disabled={userCourseDetailsLoading}
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleView(user._id)}
                        className="text-green-600 hover:text-green-800"
                        title="View User Details"
                        disabled={isLoading}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleEdit(user._id)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit"
                        disabled={isLoading}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(user._id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                        disabled={isLoading}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4M9 7v12m6-12v12"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">Email:</span>
                      <span className="text-gray-700">{user.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Date of Birth:</span>
                      <span className="text-gray-700">{user.dob ? new Date(user.dob).toLocaleDateString() : ''}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Gender:</span>
                      <span className="text-gray-700">{user.gender}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Approved:</span>
                      <ToggleSwitch
                        isApproved={user.isApproved}
                        userId={user._id}
                        onToggle={handleToggleApproval}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 bg-white rounded-lg shadow border border-gray-300">
                No Users Found
              </div>
            )}
          </div>
          <div className="hidden md:block">
            <div className="w-full overflow-x-auto rounded-lg shadow">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-300 bg-white text-sm">
                <thead className="sticky top-0 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-900 min-w-[60px]">S.No</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900 min-w-[150px]">Username</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900 min-w-[200px]">Email</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900 min-w-[120px]">Date of Birth</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900 min-w-[100px]">Gender</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-900 min-w-[120px]">Course Details</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-900 min-w-[100px]">Approved</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-900 min-w-[100px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user, index) => (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-gray-700">{index + 1}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-700">{user.username}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-700">{user.email}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-700">{user.dob ? new Date(user.dob).toLocaleDateString() : ''}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-700">{user.gender}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <button
                            onClick={() => handleCourseDetailsView(user)}
                            className="inline-flex items-center justify-center rounded-full border border-purple-200 px-3 py-1 text-sm font-semibold text-purple-600 hover:bg-purple-50"
                            disabled={userCourseDetailsLoading}
                          >
                            View
                          </button>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <ToggleSwitch
                            isApproved={user.isApproved}
                            userId={user._id}
                            onToggle={handleToggleApproval}
                            disabled={isLoading}
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center flex justify-center space-x-2">
                          <button
                            onClick={() => handleView(user._id)}
                            className="text-green-600 hover:text-green-800"
                            title="View User Details"
                            disabled={isLoading}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleEdit(user._id)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit"
                            disabled={isLoading}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(user._id)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete"
                            disabled={isLoading}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4M9 7v12m6-12v12"></path>
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-4 py-3 text-center text-gray-700">
                        No Users Found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default UserManagement;