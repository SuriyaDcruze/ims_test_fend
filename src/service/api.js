import axios from "axios";
// const baseUrl = "https://lawcoach.in/api";
const baseUrl = "http://localhost:5001";
export const baseUrl1 = "http://localhost:5001";
// export const baseUrl1 = "https://lawcoach.in/api";
// const baseUrl = "https://lms-test-back.onrender.com";
// export const baseUrl1 = "https://lms-test-back.onrender.com";
const Token = JSON.parse(localStorage.getItem("loginData"));

axios.defaults.headers.common["Authorization"] = `Bearer ${Token?.token}`;

// ================================= Authentication section ========================

// Create Axios instance
const api = axios.create({
  baseURL: baseUrl,
});

// Add request interceptor to dynamically attach token
api.interceptors.request.use(
  (config) => {
    const loginData = JSON.parse(localStorage.getItem("loginData"));
    const token = loginData?.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // config.headers.Authorization = Bearer `${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Helper function to extract error message from response
const extractErrorMessage = (error) => {
  if (error.response?.data) {
    const data = error.response.data;
    // Check for specific error fields and return the first available message
    if (data.error) return Array.isArray(data.error) ? data.error[0] : data.error;
    if (data.password) return Array.isArray(data.password) ? data.password[0] : data.password;
    if (data.email) return Array.isArray(data.email) ? data.email[0] : data.email;
    if (data.username) return Array.isArray(data.username) ? data.username[0] : data.username;
    if (data.message) return Array.isArray(data.message) ? data.message[0] : data.message;
    // Fallback: return a generic message if no specific fields are found
    return "An unexpected error occurred. Please try again.";
  }
  return error.message || "An unexpected error occurred.";
};
// Helper function to extract error message from response
// const extractErrorMessage = (error) => {
//   if (error.response?.data) {
//     const data = error.response.data;
//     if (data.password) return data.password;
//     if (data.email) return data.email;
//     if (data.username) return data.username;
//     if (data.message) return data.message;
//     return JSON.stringify(data);
//   }
//   return error.message || "An unexpected error occurred.";
// };

// ================================= Authentication Section ========================

// Register
export const AuthRegister = async (data) => {
  try {
    const res = await api.post("/api/auth/signup", data);
    localStorage.setItem("loginData", JSON.stringify(res.data));
    return res.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

// Login
export const AuthLogin = async (data) => {
  try {
    const res = await api.post("/api/auth/login", data);
    localStorage.setItem("loginData", JSON.stringify(res.data));
    return res.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

// Google Login
export const AuthGoogleLogin = async ({ code }) => {
  try {
    const res = await api.post("/auth/google", { code });
    localStorage.setItem("loginData", JSON.stringify(res.data));
    return res.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

// Google Signup
export const AuthGoogleSignup = async ({ code, username }) => {
  try {
    const res = await api.post("/api/auth/google", { code });
    localStorage.setItem("loginData", JSON.stringify(res.data));
    return res.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};

// forgot password
export const AuthForgotPassword = async (data) => {
  try {
    const res = await api.post("/api/auth/forgot-password", data);
    return res.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};


// Reset Password
export const AuthResetPassword = async ({ token, newPassword }) => {
  try {
    const res = await api.post(`/api/auth/reset-password/${token}`, { newPassword });
    return res.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
};


// Logout
export const Logout = async () => {
  try {
    const res = await axios.post(`${baseUrl}/api/auth/logout`);
    localStorage.removeItem("loginData");
    return res.data.message;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to logout";
  }
};

// ================================= Authentication section ========================

// ================================= User section ========================

// Get all users
export const GetAllUsers = async () => {
  try {
    const res = await axios.get(`${baseUrl}/api/users`);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to fetch users";
  }
};

// Get user by ID
export const GetUserById = async (userId) => {
  try {
    if (!userId || typeof userId !== "string" || userId === "[object Object]") {
      throw new Error("Valid user ID (non-empty string) is required");
    }
    const res = await axios.get(`${baseUrl}/api/users/${userId}`);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to fetch user";
  }
};

// Update user by ID
export const UpdateUserById = async (userId, userData) => {
  try {
    if (!userId || typeof userId !== "string" || userId === "[object Object]") {
      throw new Error("Valid user ID (non-empty string) is required");
    }
    if (!userData || typeof userData !== "object" || Object.keys(userData).length === 0) {
      throw new Error("Valid user data is required");
    }
    const res = await axios.put(`${baseUrl}/api/users/${userId}`, userData);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to update user";
  }
};

// Update user approval status
export const UpdateUserApproval = async (userId, isApproved) => {
  try {
    if (!userId || typeof userId !== "string" || userId === "[object Object]") {
      throw new Error("Valid user ID (non-empty string) is required");
    }
    if (typeof isApproved !== "boolean") throw new Error("isApproved must be a boolean");
    const res = await axios.put(`${baseUrl}/api/users/approve/${userId}`, { isApproved });
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to update approval status";
  }
};

export const UpdateUserApproval1 = async (userId, isApproved) => {
  try {
    const res = await axios.put(`${baseUrl}/api/users/approve/${userId}`, { isApproved });
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to update approval status";
  }
};

// Delete user by ID
export const DeleteUserById = async (userId) => {
  try {
    if (!userId || typeof userId !== "string" || userId === "[object Object]") {
      throw new Error("Valid user ID (non-empty string) is required");
    }
    const res = await axios.delete(`${baseUrl}/api/users/${userId}`);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to delete user";
  }
};

// Change user role (Mentor, Student)
export const ChangeUserRole = async (userId, role) => {
  try {
    if (!userId || typeof userId !== "string" || userId === "[object Object]") {
      throw new Error("Valid user ID (non-empty string) is required");
    }
    if (!["Mentor", "Student"].includes(role)) throw new Error("Role must be 'Mentor' or 'Student'");
    const res = await axios.put(`${baseUrl}/api/users/change-role/${userId}`, { role });
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to change user role";
  }
};

// Approve user's course enrollment
export const ApproveCourseEnrollment = async (userId, courseId) => {
  try {
    if (!userId || typeof userId !== "string" || userId === "[object Object]") {
      throw new Error("Valid user ID (non-empty string) is required");
    }
    if (!courseId || typeof courseId !== "string" || courseId === "[object Object]") {
      throw new Error("Valid course ID (non-empty string) is required");
    }
    const res = await axios.put(`${baseUrl}/api/users/approve/${userId}/${courseId}`, { isApproved: true });
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to approve course enrollment";
  }
};

// Update expiry date of enrollment
export const UpdateEnrollmentExpiry = async (userId, courseId, expiryDate) => {
  try {
    if (!userId || typeof userId !== "string" || userId === "[object Object]") {
      throw new Error("Valid user ID (non-empty string) is required");
    }
    if (!courseId || typeof courseId !== "string" || courseId === "[object Object]") {
      throw new Error("Valid course ID (non-empty string) is required");
    }
    if (!expiryDate || isNaN(new Date(expiryDate).getTime())) {
      throw new Error("Valid expiry date is required");
    }
    const res = await axios.put(`${baseUrl}/api/users/update-expiry/${userId}/${courseId}`, { expiryDate });
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to update enrollment expiry";
  }
};

// List all users with expired enrollments
export const GetUsersWithExpiredEnrollments = async () => {
  try {
    const res = await axios.get(`${baseUrl}/api/users/expired`);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to fetch users with expired enrollments";
  }
};

// ================================= User section ========================

// ================================= Course section ========================

// Get all courses
export const GetAllCourses = async () => {
  try {
    const res = await axios.get(`${baseUrl}/api/courses`);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to fetch courses";
  }
};

// Get course by ID
export const GetCourseById = async (id) => {
  try {
    if (!id || typeof id !== "string" || id === "[object Object]") {
      throw new Error("Valid course ID (non-empty string) is required");
    }
    const res = await axios.get(`${baseUrl}/api/courses/${id}`);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to fetch course";
  }
};

// Add new course
export const AddNewCourseApi = async (courseData) => {
  try {
    const res = await axios.post(`${baseUrl}/api/courses`, courseData);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to add course";
  }
};

// Update course by ID
export const UpdateCourseById = async (courseData, id) => {
  try {
    if (!id || typeof id !== "string" || id === "[object Object]") {
      throw new Error("Valid course ID (non-empty string) is required");
    }
    const res = await axios.put(`${baseUrl}/api/courses/${id}`, courseData);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to update course";
  }
};

// Delete course by ID
export const DeleteCourseById = async (id) => {
  try {
    if (!id || typeof id !== "string" || id === "[object Object]") {
      throw new Error("Valid course ID (non-empty string) is required");
    }
    const res = await axios.delete(`${baseUrl}/api/courses/${id}`);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to delete course";
  }
};

// Create Course Enrollment
export const CreateCourseEnrollment = async ({ courseId }) => {
  try {
    if (!courseId || typeof courseId !== "string" || courseId === "[object Object]") {
      throw new Error("Valid course ID (non-empty string) is required");
    }
    const res = await axios.post(`${baseUrl}/api/enrollments/${courseId}`);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to create course enrollment";
  }
};

// Get Course Enrollment
export const GetCourseEnrollment = async ({ userId }) => {
  try {
    if (!userId || typeof userId !== "string" || userId === "[object Object]") {
      throw new Error("Valid user ID (non-empty string) is required");
    }
    const res = await axios.get(`${baseUrl}/api/enrollments/${userId}`);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to fetch course enrollment";
  }
};

// Update Course Enrollment
export const UpdateCourseEnrollment = async ({ userId, courseId }) => {
  try {
    if (!userId || typeof userId !== "string" || userId === "[object Object]") {
      throw new Error("Valid user ID (non-empty string) is required");
    }
    if (!courseId || typeof courseId !== "string" || courseId === "[object Object]") {
      throw new Error("Valid course ID (non-empty string) is required");
    }
    const res = await axios.put(`${baseUrl}/api/enrollments/${userId}/${courseId}`);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to update course enrollment";
  }
};

// Create or update course progress
export const UpdateCourseProgress = async (userId, courseId, progressData) => {
  try {
    if (!userId || typeof userId !== "string" || userId === "[object Object]") {
      throw new Error("Valid user ID (non-empty string) is required");
    }
    if (!courseId || typeof courseId !== "string" || courseId === "[object Object]") {
      throw new Error("Valid course ID (non-empty string) is required");
    }
    const res = await axios.post(`${baseUrl}/api/courseProgress/${userId}/${courseId}`, progressData);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to update course progress";
  }
};

// Alias for backward compatibility with CourseContent.jsx
export const CourseProgressPost = UpdateCourseProgress;

// Get course progress for a specific user and course
export const GetCourseProgress = async (userId, courseId) => {
  try {
    if (!userId || typeof userId !== "string") {
      throw new Error("Valid user ID (non-empty string) is required");
    }
    if (!courseId || typeof courseId !== "string") {
      throw new Error("Valid course ID (non-empty string) is required");
    }

    const res = await axios.get(`${baseUrl}/api/courseProgress/${userId}/${courseId}`);
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || "Failed to fetch course progress");
  }
};

// export const GetCourseProgress = async (userId, courseId) => {
//   try {
//     if (!userId || typeof userId !== "string" || userId === "[object Object]") {
//       throw new Error("Valid user ID (non-empty string) is required");
//     }
//     if (!courseId || typeof courseId !== "string" || courseId === "[object Object]") {
//       throw new Error("Valid course ID (non-empty string) is required");
//     }
//     const res = await axios.get(`${baseUrl}/api/courseProgress/${userId}/${courseId}`);
//     return res.data;
//   } catch (error) {
//     throw error.response?.data?.message || error.message || "Failed to fetch course progress";
//   }
// };

// Alias for backward compatibility with components expecting CourseProgressGet
export const CourseProgressGet = GetCourseProgress;

// Get all course progress for all users and courses
export const GetAllCourseProgress = async () => {
  try {
    const res = await axios.get(`${baseUrl}/api/courseProgress`);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to fetch all course progress";
  }
};

// Submit answers for a sublesson
export const SubmitAnswers = async ({ courseId, sublessonIndex, payload }) => {
  try {
    if (!courseId || typeof courseId !== "string" || courseId === "[object Object]") {
      throw new Error("Valid course ID (non-empty string) is required");
    }
    const res = await axios.post(`${baseUrl}/api/answers/${courseId}/${sublessonIndex}`, payload);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to submit answers";
  }
};

// Get all test results for the user
export const GetUserTestResults = async (userId) => {
  try {
    if (!userId || typeof userId !== "string" || userId === "[object Object]") {
      throw new Error("Valid user ID (non-empty string) is required");
    }
    const res = await axios.get(`${baseUrl}/api/answers/${userId}`);
    return res.data.answers;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to fetch test results";
  }
};

// ================================= Course section ========================

// ================================= Upload file section ========================

// without type
export const UploadFile = async (file) => {
  try {
    const res = await axios.post(`${baseUrl}/api/upload`, file, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    console.log(res.data);

    if (res.status === 200) {
      return res;
    }
  } catch (error) {
    console.log(error);
    return error.message;
  }
};

// with type
export const UploadFileWithType = async (file) => {
  try {
    const res = await axios.post(`https://z-backend-2xag.onrender.com/api/upload/type`, file, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    console.log(res.data);

    if (res.status === 200) {
      return res;
    }
  } catch (error) {
    console.log(error);
    return error?.response?.data?.message || error.message || "Upload failed";
  }
};

// ================================= Upload file section ========================

// ================================= Announcement section ========================

// Create announcement
export const CreateAnnouncement = async (announcementData) => {
  try {
    const res = await axios.post(`${baseUrl}/api/announcements`, announcementData);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to create announcement";
  }
};

// Get all announcements
export const GetAllAnnouncements = async () => {
  try {
    const res = await axios.get(`${baseUrl}/api/announcements/all`);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to fetch announcements";
  }
};

// Get announcement by ID
export const GetAnnouncementById = async (id) => {
  try {
    const res = await axios.get(`${baseUrl}/api/announcements/${id}`);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to fetch announcement";
  }
};

// Update announcement
export const UpdateAnnouncement = async (id, updateData) => {
  try {
    const res = await axios.put(`${baseUrl}/api/announcements/${id}`, updateData);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to update announcement";
  }
};
// Delete announcement by ID
export const DeleteAnnouncement = async (id) => {
  try {
    if (!id || typeof id !== "string" || id === "[object Object]") {
      throw new Error("Valid announcement ID (non-empty string) is required");
    }
    const res = await axios.delete(`${baseUrl}/api/announcements/${id}`);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to delete announcement";
  }
};

// ================================= Announcement section ========================

// ================================= Calendar section ========================

// Create calendar event
export const CreateCalendarEvent = async (eventData) => {
  try {
    const res = await axios.post(`${baseUrl}/api/calender`, eventData);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to create calendar event";
  }
};

// Get all calendar events
export const GetAllCalendarEvents = async () => {
  try {
    const res = await axios.get(`${baseUrl}/api/calender`);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to fetch calendar events";
  }
};

// Get calendar event by ID
export const GetCalendarEventById = async (id) => {
  try {
    const res = await axios.get(`${baseUrl}/api/calender/${id}`);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to fetch calendar event";
  }
};

// Update calendar event by ID
export const UpdateCalendarEventById = async (id, eventData) => {
  try {
    const res = await axios.put(`${baseUrl}/api/calender/${id}`, eventData);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to update calendar event";
  }
};

// Delete calendar event by ID
export const DeleteCalendarEventById = async (id) => {
  try {
    const res = await axios.delete(`${baseUrl}/api/calender/${id}`);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to delete calendar event";
  }
};

// ================================= Calendar section ========================

// ================================= Query Section ========================

// Get all queries
export const GetAllQueries = async () => {
  try {
    const res = await axios.get(`${baseUrl}/api/queries`);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to fetch queries";
  }
};

// Create a new query/ticket
export const CreateQuery = async (queryData) => {
  try {
    const res = await axios.post(`${baseUrl}/api/queries`, queryData);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to create query";
  }
};

// Get a single query by ID
export const GetQueryById = async (queryId) => {
  try {
    const res = await axios.get(`${baseUrl}/api/queries/${queryId}`);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to fetch query";
  }
};

// Get queries from current student
export const GetQueriesByCurrentStudent = async (queryId) => {
  try {
    const res = await axios.get(`${baseUrl}/api/queries/${queryId}`);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to fetch student queries";
  }
};

// Update a query by ID (Accept ticket)
export const UpdateQuery = async (queryId, queryData) => {
  try {
    const res = await axios.put(`${baseUrl}/api/queries/accept/${queryId}`, queryData);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to update query";
  }
};

// Delete a query by ID
export const DeleteQuery = async (queryId) => {
  try {
    const res = await axios.delete(`${baseUrl}/api/queries/${queryId}`);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to delete query";
  }
};

// ================================= Query Section ========================

// ================================= Notification Section ========================

// Create a new notification
export const CreateNotification = async (notificationData) => {
  try {
    const res = await axios.post(`${baseUrl}/api/notifications`, notificationData);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to create notification";
  }
};

// Get all notifications
export const GetAllNotifications = async () => {
  try {
    const res = await axios.get(`${baseUrl}/api/notifications`);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to fetch notifications";
  }
};

// Mark a notification as read
export const MarkNotificationAsRead = async (notificationId) => {
  try {
    const res = await axios.put(`${baseUrl}/api/notifications/${notificationId}`, {});
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to mark notification as read";
  }
};

// ================================= Notification Section ========================

// ================================= Forum Section ========================

// Create a new forum post
export const CreateForumPost = async (postData) => {
  try {
    const res = await axios.post(`${baseUrl}/api/forum/`, postData);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to create forum post";
  }
};

// Get all forum posts
export const GetAllForumPosts = async () => {
  try {
    const res = await axios.get(`${baseUrl}/api/forum/`);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to fetch forum posts";
  }
};

// Get a single forum post by ID
export const GetForumPostById = async (postId) => {
  try {
    const res = await axios.get(`${baseUrl}/api/forum/${postId}`);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to fetch forum post";
  }
};

// Add a reply to a forum post
export const AddForumReply = async (postId, replyData) => {
  try {
    const res = await axios.post(`${baseUrl}/api/forum/${postId}/reply`, replyData);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to add reply";
  }
};

// Update a forum post
export const UpdateForumPost = async (postId, postData) => {
  try {
    const res = await axios.put(`${baseUrl}/api/forum/${postId}`, postData);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to update forum post";
  }
};

// Update a reply
export const UpdateForumReply = async (postId, replyId, replyData) => {
  try {
    const res = await axios.put(`${baseUrl}/api/forum/${postId}/reply/${replyId}`, replyData);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to update reply";
  }
};

// Like a forum post
export const LikeForumPost = async (postId) => {
  try {
    const res = await axios.put(`${baseUrl}/api/forum/${postId}/like`);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to like forum post";
  }
};

// Delete a forum post
export const DeleteForumPost = async (postId) => {
  try {
    const res = await axios.delete(`${baseUrl}/api/forum/${postId}`);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to delete forum post";
  }
};

// Delete a reply
export const DeleteForumReply = async (postId, replyId) => {
  try {
    const res = await axios.delete(`${baseUrl}/api/forum/${postId}/reply/${replyId}`);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to delete reply";
  }
};

// Toggle forum post approval
export const ToggleForumPostApproval = async (postId, approved) => {
  try {
    const res = await axios.put(`${baseUrl}/api/forum/${postId}/approve`, { approved });
    return res.data;
  } catch (error) {
    throw error.response?.data?.error || error.message || "Failed to toggle approval status";
  }
};

// ================================= Forum Section ========================

// ================================= Message section ========================

// Get conversation messages with a user
export const GetConversationMessages = async (userId) => {
  try {
    const res = await axios.get(`${baseUrl}/api/message/conversation/${userId}`);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to fetch messages";
  }
};

// Send a new message
export const SendMessage = async (messageData) => {
  try {
    const res = await axios.post(`${baseUrl}/api/message`, messageData);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to send message";
  }
};

// Get inbox (latest message per sender)
export const GetInbox = async () => {
  try {
    const res = await axios.get(`${baseUrl}/api/message/inbox`);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to fetch inbox";
  }
};

// ================================= Message section ========================

// ================================= Task Achievement Section ========================

// Create a new task achievement
export const CreateTaskAchievement = async (achievementData) => {
  try {
    const res = await axios.post(`${baseUrl}/api/taskAchievements`, achievementData);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to create task achievement";
  }
};

// Get all task achievements
export const GetAllTaskAchievements = async () => {
  try {
    const res = await axios.get(`${baseUrl}/api/taskAchievements`);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to fetch task achievements";
  }
};

// Get task achievements by user ID
export const GetTaskAchievementsByUserId = async (userId) => {
  try {
    const res = await axios.get(`${baseUrl}/api/taskAchievements/${userId}`);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to fetch task achievements for user";
  }
};

// Update a task achievement by ID
export const UpdateTaskAchievement = async (achievementId, achievementData) => {
  try {
    const res = await axios.put(`${baseUrl}/api/taskAchievements/${achievementId}`, achievementData);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to update task achievement";
  }
};

// Delete a task achievement by ID
export const DeleteTaskAchievement = async (achievementId) => {
  try {
    const res = await axios.delete(`${baseUrl}/api/taskAchievements/${achievementId}`);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to delete task achievement";
  }
};

// ================================= Task Achievement Section ========================

// ================================= Course Achievement Section ========================

// Create a new course achievement
export const CreateCourseAchievement = async (achievementData) => {
  try {
    const res = await axios.post(`${baseUrl}/api/courseAchievements`, achievementData);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to create course achievement";
  }
};

// Get all course achievements
export const GetAllCourseAchievements = async () => {
  try {
    const res = await axios.get(`${baseUrl}/api/courseAchievements`);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to fetch course achievements";
  }
};

// Get course achievements by user ID
export const GetCourseAchievementsByUserId = async (userId) => {
  try {
    if (!userId || typeof userId !== "string" || userId === "[object Object]") {
      throw new Error("Valid user ID (non-empty string) is required");
    }
    const res = await axios.get(`${baseUrl}/api/courseAchievements/${userId}`);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to fetch course achievements for user";
  }
};

// Update a course achievement by ID
export const UpdateCourseAchievement = async (achievementId, achievementData) => {
  try {
    const res = await axios.put(`${baseUrl}/api/courseAchievements/${achievementId}`, achievementData);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to update course achievement";
  }
};

export const DeleteCourseAchievement = async (achievementId) => {
  try {
    const res = await axios.delete(`${baseUrl}/api/courseAchievements/${achievementId}`);
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || "Failed to update course achievement";
  }
};
// ================================= Course Achievement Section ========================


// ================================= Todo Section =======================================
export const getTodos = async (params = {}) => {
  try {
    const response = await axios.get(`${baseUrl}/api/todo`, { params });
    return response.data;
  } catch (error) {
    throw new Error("Error fetching todos");
  }
};

export const addTodo = async (text) => {
  try {
    const response = await axios.post(`${baseUrl}/api/todo`, {
      text,
      date: new Date().toISOString().split("T")[0], // Current date in YYYY-MM-DD format
    });
    return response.data;
  } catch (error) {
    throw new Error("Error adding todo");
  }
};

export const toggleTodo = async (id) => {
  try {
    const response = await axios.put(`${baseUrl}/api/todo/toggle/${id}`);
    return response.data;
  } catch (error) {
    throw new Error("Error toggling todo");
  }
};

export const deleteTodo = async (id) => {
  try {
    await axios.delete(`${baseUrl}/api/todo/${id}`);
  } catch (error) {
    throw new Error("Error deleting todo");
  }
};

// ================================= Todo Section =======================================
//==================================Exam================================================
// Create a new exam
export const CreateExam = async (examData) => {
  try {
    if (!examData || typeof examData !== "object" || Object.keys(examData).length === 0) {
      throw new Error("Valid exam data is required");
    }
    const res = await axios.post(`${baseUrl}/api/exam`, examData);
    return res.data;
  } catch (error) {
    throw error.response?.data?.error || error.message || "Failed to create exam";
  }
};

// Get all exams
export const GetAllExams = async () => {
  try {
    const res = await axios.get(`${baseUrl}/api/exam`);
    return res.data;
  } catch (error) {
    throw error.response?.data?.error || error.message || "Failed to fetch exams";
  }
};

// Get exam by ID
export const GetExamById = async (examId) => {
  try {
    if (!examId || typeof examId !== "string" || examId === "[object Object]") {
      throw new Error("Valid exam ID (non-empty string) is required");
    }
    const res = await axios.get(`${baseUrl}/api/exam/${examId}`);
    return res.data;
  } catch (error) {
    throw error.response?.data?.error || error.message || "Failed to fetch exam";
  }
};

// Update exam by ID
export const UpdateExamById = async (examId, examData) => {
  try {
    if (!examId || typeof examId !== "string" || examId === "[object Object]") {
      throw new Error("Valid exam ID (non-empty string) is required");
    }
    if (!examData || typeof examData !== "object" || Object.keys(examData).length === 0) {
      throw new Error("Valid exam data is required");
    }
    const res = await axios.put(`${baseUrl}/api/exam/${examId}`, examData);
    return res.data;
  } catch (error) {
    throw error.response?.data?.error || error.message || "Failed to update exam";
  }
};

// Delete exam by ID
export const DeleteExamById = async (examId) => {
  try {
    if (!examId || typeof examId !== "string" || examId === "[object Object]") {
      throw new Error("Valid exam ID (non-empty string) is required");
    }
    const res = await axios.delete(`${baseUrl}/api/exam/${examId}`);
    return res.data;
  } catch (error) {
    throw error.response?.data?.error || error.message || "Failed to delete exam";
  }
};

// Toggle exam publish status
export const ToggleExamPublish = async (examId) => {
  try {
    if (!examId || typeof examId !== "string" || examId === "[object Object]") {
      throw new Error("Valid exam ID (non-empty string) is required");
    }
    const res = await axios.put(`${baseUrl}/api/exam/toggle/${examId}`);
    return res.data;
  } catch (error) {
    throw error.response?.data?.error || error.message || "Failed to toggle exam publish status";
  }
};

//=========================================Exam====================================================

//========================================Answer===================================================
// Submit answers for an exam
export const SubmitExamAnswers = async (examId, submissionData) => {
  try {
    if (!examId || typeof examId !== "string" || examId === "[object Object]") {
      throw new Error("Valid exam ID (non-empty string) is required");
    }
    if (!submissionData || typeof submissionData !== "object" || Object.keys(submissionData).length === 0) {
      throw new Error("Valid submission data is required");
    }
    const res = await axios.post(`${baseUrl}/api/useranswer/submit/${examId}`, submissionData);
    return res.data;
  } catch (error) {
    throw error.response?.data?.error || error.message || "Failed to submit exam answers";
  }
};

// Get current user's exam results
export const GetUserExamResults = async (examId) => {
  try {
    if (!examId || typeof examId !== "string" || examId === "[object Object]") {
      throw new Error("Valid exam ID (non-empty string) is required");
    }
    const res = await axios.get(`${baseUrl}/api/useranswer/result/${examId}`);
    return res.data;
  } catch (error) {
    throw error.response?.data?.error || error.message || "Failed to fetch exam results";
  }
};

// Get ranking for an exam
export const GetExamRankings = async (examId) => {
  try {
    if (!examId || typeof examId !== "string" || examId === "[object Object]") {
      throw new Error("Valid exam ID (non-empty string) is required");
    }
    const res = await axios.get(`${baseUrl}/api/useranswer/ranking/${examId}`);
    return res.data;
  } catch (error) {
    throw error.response?.data?.error || error.message || "Failed to fetch exam rankings";
  }
};

// Get all exam submissions (mentor-only)
export const GetAllExamSubmissions = async () => {
  try {
    const res = await axios.get(`${baseUrl}/api/useranswer/all`);
    return res.data;
  } catch (error) {
    throw error.response?.data?.error || error.message || "Failed to fetch all exam submissions";
  }
};

//=========================================Answer==================================================+
