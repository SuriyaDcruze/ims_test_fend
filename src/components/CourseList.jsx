// import { useNavigate } from "react-router";
// import CourseCard from "./CourseCard";
// import { useEffect, useState } from "react";
// import { GetCourseEnrollment } from "../service/api";
// const UserInfo = JSON.parse(localStorage.getItem("loginData"));
// function CourseList({ courses }) {
//   const navigate = useNavigate();
//   const [purchasedCoursesIds, setPurchasedCoursesIds] = useState([]);
//   useEffect(() => {
//     const fetchEnrolledCourses = async () => {
//       try {
//         const data = await GetCourseEnrollment({ userId: UserInfo.user._id });
//         const courseIds = data.enrolledCourses.map((item) => item.courseId._id);
//         setPurchasedCoursesIds(courseIds);
//       } catch (error) {
//         console.error("Error fetching enrolled courses:", error);
//       }
//     };
//     fetchEnrolledCourses();
//   }, []);

//   if (!Array.isArray(courses)) {
//     return <div>No courses available</div>;
//   }

//   return (
//     <div className="grid md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
//       {courses.map((course) => {
//         const isPurchased = purchasedCoursesIds.includes(course._id);
//         return (
//           <div
//             key={course._id}
//             onClick={() => {
//               navigate(
//                 isPurchased ? `${course._id}/content` : `${course._id}/detail`,
//                 { state: { course } }
//               );
//             }}
//             className="cursor-pointer"
//           >
//             <CourseCard course={course} isPurchased={isPurchased} />
//           </div>
//         );
//       })}
//     </div>
//   );
// }

// export default CourseList;

import { useNavigate } from "react-router";
import CourseCard from "./CourseCard";
import { useEffect, useState } from "react";
import { GetCourseEnrollment } from "../service/api";

// Fetching user info from localStorage
const UserInfo = JSON.parse(localStorage.getItem("loginData"));

function CourseList({ courses }) {
  const navigate = useNavigate();
  const [purchasedCoursesIds, setPurchasedCoursesIds] = useState([]);

  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      try {
        // Fetch user's enrolled courses
        const data = await GetCourseEnrollment({ userId: UserInfo.user._id });

        // Filter for only approved and not expired enrollments
        const validEnrollments = data.enrolledCourses.filter((item) => {
          const isApproved = item.isApproved === true;
          const notExpired = new Date(item.expiryDate) > new Date();
          return isApproved && notExpired;
        });

        // Extract only the valid course IDs
        const courseIds = validEnrollments.map((item) => item.courseId._id);
        setPurchasedCoursesIds(courseIds);
      } catch (error) {
        console.error("Error fetching enrolled courses:", error);
      }
    };

    fetchEnrolledCourses();
  }, []);

  // If courses are not an array or empty, show a message
  if (!Array.isArray(courses) || courses.length === 0) {
    return <div>No courses available</div>;
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
      {courses.map((course) => {
        const isPurchased = purchasedCoursesIds.includes(course._id);

        return (
          <div
            key={course._id}
            onClick={() => {
              // Navigate to the correct page based on purchase status
              navigate(
                isPurchased ? `${course._id}/content` : `${course._id}/detail`,
                { state: { course } }
              );
            }}
            className="cursor-pointer"
          >
            <CourseCard course={course} isPurchased={isPurchased} />
          </div>
        );
      })}
    </div>
  );
}

export default CourseList;
