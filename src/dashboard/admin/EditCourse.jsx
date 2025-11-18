import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import NewLesson from "./NewLesson";
import axios from "axios";
import {
  DeleteCourseById,
  GetCourseById,
  UpdateCourseById,
} from "../../service/api";
import NoLesson from "../../assets/no-lesson-illustration.svg";
import { ArrowLeft, Edit, Trash } from "lucide-react";

// CSS for file input
const fileInputStyles = `
  .file-input-wrapper {
    position: relative;
    display: inline-block;
    width: 100%;
  }
  .file-input-wrapper input[type="file"] {
    opacity: 0;
    position: absolute;
    width: 100%;
    height: 100%;
    cursor: pointer;
  }
  .file-input-label {
    display: block;
    padding: 0.75rem;
    width: 100%;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    background-color: #fff;
    color: #374151;
    text-align: left;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .file-input-label.disabled {
    background-color: #f3f4f6;
    cursor: not-allowed;
  }
`;

const EditCourse = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [popupOpen, setPopupOpen] = useState({ open: false, data: null });
  const [editCourse, setEditCourse] = useState(false);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false); // New state for deletion loading
  const [currentOverview, setCurrentOverview] = useState({
    heading: "",
    content: "",
    updateIndex: null,
  });
  const [currentWhatYouGet, setWhatYouGet] = useState([]);
  const [currentGet, setCurrentGet] = useState({ title: "", description: "" });
  const [editIndexGet, setEditIndexGet] = useState(null);
  const [whoIsThisFor, setWhoIsThisFor] = useState([]);
  const [currentWho, setCurrentWho] = useState({ text: "" });
  const [editIndexWho, setEditIndexWho] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState("");

  const [courseData, setCourseData] = useState({
    _id: "", // Added to store course ID
    title: "",
    description: "",
    price: null,
    thumbnail: null,
    overviewPoints: [],
    lessons: [],
    whatYouGet: [],
    whoIsThisFor: [],
  });

  // Scroll to top when popup opens
  useEffect(() => {
    if (popupOpen.open) window.scrollTo(0, 0);
  }, [popupOpen]);

  // Fetch course details on mount
  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        const res = await GetCourseById(id);
        const safeCourseData = {
          _id: res._id || id, // Set _id from response or fallback to URL id
          title: res.title || "",
          description: res.description || "",
          price: res.price || null,
          thumbnail: res.thumbnail || null,
          overviewPoints: Array.isArray(res.overviewPoints) ? res.overviewPoints : [],
          lessons: Array.isArray(res.lessons)
            ? res.lessons.map(lesson => ({
                ...lesson,
                chapter: Array.isArray(lesson.chapter)
                  ? lesson.chapter.map(video => ({
                      title: video.title || "",
                      duration: video.duration || "",
                      url: video.url || "",
                    }))
                  : [],
              }))
            : [],
          whatYouGet: Array.isArray(res.whatYouGet) ? res.whatYouGet : [],
          whoIsThisFor: Array.isArray(res.whoIsThisFor) ? res.whoIsThisFor : [],
        };
        setCourseData(safeCourseData);
        setSelectedFileName(res.thumbnail ? "Current Thumbnail" : "");
      } catch (error) {
        console.error("Failed to fetch course:", error);
        setError("Failed to load course data. Please try again.");
      }
    };
    fetchCourseDetails();
  }, [id]);

  // Validate course data before updating
  const validateCourseData = () => {
    const errors = {};
    if (!courseData.title) errors.title = "Course title is required";
    if (!courseData.description) errors.description = "Description is required";
    if (!courseData.price || isNaN(courseData.price) || courseData.price <= 0) {
      errors.price = "Valid price is required";
    }
    return errors;
  };

  // Handle direct input changes (title, description, price)
  const handledirectInput = (type, value) => {
    if (type === "price") {
      const numericValue = parseFloat(value);
      setCourseData({
        ...courseData,
        [type]: isNaN(numericValue) ? "" : numericValue,
      });
    } else {
      setCourseData({ ...courseData, [type]: value });
    }
  };

  // Handle overview input changes
  const handleOverviewInput = (type, value) => {
    setCurrentOverview({ ...currentOverview, [type]: value });
  };

  // Handle "What You Get" input changes
  const handleWhatYouGetInput = (key, value) => {
    setCurrentGet({ ...currentGet, [key]: value });
  };

  // Handle "Who Is This For" input changes
  const handleWhoIsThisForInput = (value) => {
    setCurrentWho({ text: value });
  };

  // Add or update overview point
  const addNewOverview = () => {
    if (currentOverview.heading && currentOverview.content) {
      const newOverview = [...courseData.overviewPoints];
      if (currentOverview.updateIndex === null || currentOverview.updateIndex === undefined) {
        newOverview.push({
          ...currentOverview,
          updateIndex: newOverview.length > 0 ? newOverview.length : 0,
        });
      } else {
        newOverview[currentOverview.updateIndex] = currentOverview;
      }
      setCourseData({ ...courseData, overviewPoints: newOverview });
      setCurrentOverview({ heading: "", content: "", updateIndex: null });
    }
  };

  // Add or update "What You Get" item
  const addNewWhatYouGet = () => {
    if (currentGet.title && currentGet.description) {
      const newWhatYouGet = [...courseData.whatYouGet];
      if (editIndexGet === null) {
        newWhatYouGet.push({
          title: currentGet.title,
          description: currentGet.description,
        });
      } else {
        newWhatYouGet[editIndexGet] = {
          title: currentGet.title,
          description: currentGet.description,
        };
      }
      setCourseData({ ...courseData, whatYouGet: newWhatYouGet });
      setCurrentGet({ title: "", description: "" });
      setEditIndexGet(null);
    }
  };

  // Add or update "Who Is This For" item
  const addNewWhoIsThisFor = () => {
    if (currentWho.text) {
      const newWhoIsThisFor = [...courseData.whoIsThisFor];
      if (editIndexWho === null) {
        newWhoIsThisFor.push({ text: currentWho.text });
      } else {
        newWhoIsThisFor[editIndexWho] = { text: currentWho.text };
      }
      setCourseData({ ...courseData, whoIsThisFor: newWhoIsThisFor });
      setCurrentWho({ text: "" });
      setEditIndexWho(null);
    }
  };

  // Remove overview point
  const handleRemoveOverview = (index) => {
    const newOverviews = [...courseData.overviewPoints];
    newOverviews.splice(index, 1);
    setCourseData({ ...courseData, overviewPoints: newOverviews });
  };

  // Remove "What You Get" item
  const handleRemoveWhatYouGet = (index) => {
    const newWhatYouGet = [...courseData.whatYouGet];
    newWhatYouGet.splice(index, 1);
    setCourseData({ ...courseData, whatYouGet: newWhatYouGet });
  };

  // Remove "Who Is This For" item
  const handleRemoveWhoIsThisFor = (index) => {
    const newWhoIsThisFor = [...courseData.whoIsThisFor];
    newWhoIsThisFor.splice(index, 1);
    setCourseData({ ...courseData, whoIsThisFor: newWhoIsThisFor });
  };

  // Set overview point for editing
  const setEditValues = (overview, index) => {
    overview.updateIndex = index;
    setCurrentOverview(overview);
  };

  // Set "What You Get" item for editing
  const setEditValuesGet = (item, index) => {
    setCurrentGet(item);
    setEditIndexGet(index);
  };

  // Set "Who Is This For" item for editing
  const setEditValuesWho = (item, index) => {
    setCurrentWho(item);
    setEditIndexWho(index);
  };

  // Add or update lesson
  const addLessontoCourse = (lesson) => {
    const safeLesson = {
      ...lesson,
      chapter: Array.isArray(lesson.chapter)
        ? lesson.chapter.map(video => ({
            title: video.title || "",
            duration: video.duration || "",
            url: video.url || "",
          }))
        : [],
    };
    const newLessons = [...courseData.lessons];
    if (safeLesson.updateIndex === null || safeLesson.updateIndex === undefined) {
      newLessons.push({
        ...safeLesson,
        updateIndex: newLessons.length > 0 ? newLessons.length : 0,
      });
    } else {
      newLessons[safeLesson.updateIndex] = safeLesson;
    }
    setCourseData({ ...courseData, lessons: newLessons });
    setPopupOpen({ open: false, data: null });
  };

  // Remove lesson
  const removeLessonFromCourse = (lesson) => {
    if (!lesson || lesson.updateIndex === undefined) return;
    const newLessons = [...courseData.lessons];
    newLessons.splice(lesson.updateIndex, 1);
    setCourseData({ ...courseData, lessons: newLessons });
  };

  // Open lesson edit modal
  const openEditLesson = (lesson, index) => {
    if (!lesson) {
      console.error("Invalid lesson data:", lesson);
      return;
    }
    const safeLesson = {
      ...lesson,
      chapter: Array.isArray(lesson.chapter)
        ? lesson.chapter.map(video => ({
            title: video.title || "",
            duration: video.duration || "",
            url: video.url || "",
          }))
        : [],
      updateIndex: index,
    };
    setPopupOpen({ open: true, data: safeLesson });
  };

  // Update course
  const uploadCourse = async () => {
    const errors = validateCourseData();
    if (Object.keys(errors).length > 0) {
      setError("Please fix: " + Object.values(errors).join(", "));
      return;
    }
    try {
      await UpdateCourseById(courseData, id);
      navigate("/admin/courses");
    } catch (error) {
      console.error("Failed to update course:", error);
      const errorMsg = error.response?.data?.message || "Failed to update course.";
      setError(errorMsg);
    }
  };

  // Delete course
  const deleteThisCourse = async () => {
    const confirm = window.confirm(
      "Confirm to delete this course. All lessons associated will be lost."
    );
    if (confirm) {
      // Validate course ID
      if (!id || typeof id !== "string" || id.trim() === "") {
        setError("Invalid course ID. Unable to delete course.");
        return;
      }
      setIsDeleting(true); // Set loading state
      try {
        await DeleteCourseById(id); // Use id from useParams
        navigate("/admin/courses");
      } catch (error) {
        console.error("Failed to delete course:", error);
        const errorMsg = error.response?.data?.message || "Failed to delete course. Please try again.";
        setError(errorMsg);
      } finally {
        setIsDeleting(false); // Reset loading state
      }
    }
  };

  // Handle file input for thumbnail
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setCourseData({ ...courseData, thumbnail: file });
    setSelectedFileName(file ? file.name : "");
  };

  return (
    <div
      className="course-list-cnt p-4 new-course overflow-auto md:overflow-scroll"
      style={{ overflow: popupOpen.open ? "hidden" : "scroll" }}
    >
      {/* Inject CSS styles */}
      <style>{fileInputStyles}</style>

      {error && (
        <div className="error-message bg-red-100 text-red-700 p-3 mb-4 rounded">
          {error}
        </div>
      )}
      <div className="top-header-cnt flex justify-between items-center mb-4">
        <div className="back-btn" onClick={() => navigate("/admin")}>
          <ArrowLeft className="h-4 w-4" />
        </div>
        {editCourse ? (
          <div className="top-btn-cnt flex space-x-4">
            <div
              className="course-delete-btn bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 cursor-pointer"
              onClick={() => {
                if (window.confirm("Discard changes?")) setEditCourse(false);
              }}
            >
              Cancel Edit
            </div>
            <div
              className="add-new-lesson-btn bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 cursor-pointer"
              onClick={uploadCourse}
            >
              Update Course
            </div>
          </div>
        ) : (
          <div className="top-btn-cnt flex space-x-4">
            <div
              className={`course-delete-btn bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 cursor-pointer ${isDeleting ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={deleteThisCourse}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Course"}
            </div>
            <div
              className="add-new-lesson-btn bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 cursor-pointer"
              onClick={() => setEditCourse(true)}
            >
              Edit Course
            </div>
          </div>
        )}
      </div>

      <div className="top-header-cnt mb-6">
        <h3 className="course-new-title text-2xl font-semibold">
          Course Details
        </h3>
        <p className="course-new-description text-gray-600">
          Edit course and publish
        </p>
      </div>

      <div className="input-split-cover flex flex-col md:flex-row gap-6">
        <form className="left-form flex-1">
          <div className="course-name-cnt mb-4">
            <p className="text-sm font-semibold">Enter course Name</p>
            <input
              type="text"
              className="name-input mt-2 p-3 w-full border border-gray-300 rounded-lg"
              value={courseData.title}
              readOnly={!editCourse}
              onChange={(e) => handledirectInput("title", e.target.value)}
            />
          </div>

          <div className="course-description-cnt mb-4">
            <p className="text-sm font-semibold">Describe course</p>
            <textarea
              className="description-input mt-2 p-3 w-full border border-gray-300 rounded-lg"
              readOnly={!editCourse}
              value={courseData.description}
              onChange={(e) => handledirectInput("description", e.target.value)}
            />
          </div>

          <div className="flex gap-6 mb-4">
            <div className="course-name-cnt responsive-input flex-1">
              <p className="text-sm font-semibold">Enter course price</p>
              <input
                type="number"
                className="name-input mt-2 p-3 w-full border border-gray-300 rounded-lg"
                placeholder="₹"
                value={courseData.price || ""}
                readOnly={!editCourse}
                onChange={(e) => handledirectInput("price", e.target.value)}
              />
            </div>

            <div className="course-name-cnt flex-1">
              <p className="text-sm font-semibold">Upload course thumbnail</p>
              <div className="file-input-wrapper mt-2">
                <input
                  type="file"
                  accept="image/*"
                  disabled={!editCourse}
                  onChange={handleFileChange}
                  id="thumbnail-upload"
                />
                <label
                  htmlFor="thumbnail-upload"
                  className={`file-input-label ${!editCourse ? "disabled" : ""}`}
                >
                  {selectedFileName || "Choose File"}
                </label>
              </div>
            </div>
          </div>

          <div className="course-description-cnt mb-4">
            <p className="text-sm font-semibold">Overview Points</p>
            {editCourse && (
              <div className="overview-input-cnt flex flex-col gap-4">
                <input
                  type="text"
                  className="name-input p-3 w-full border border-gray-300 rounded-lg"
                  value={currentOverview.heading}
                  placeholder="Heading"
                  onChange={(e) => handleOverviewInput("heading", e.target.value)}
                />
                <textarea
                  className="overview-input p-3 w-full border border-gray-300 rounded-lg"
                  placeholder="Description"
                  value={currentOverview.content}
                  onChange={(e) => handleOverviewInput("content", e.target.value)}
                />
                <div
                  className="overview-add-btn bg-green-500 text-white p-3 rounded cursor-pointer hover:bg-green-600"
                  onClick={addNewOverview}
                >
                  <p>Add</p>
                </div>
              </div>
            )}
            {courseData.overviewPoints.map((overview, index) => (
              <div className="overviewPoint-cnt mb-4" key={index}>
                <div className="overview-head-cnt flex justify-between items-center">
                  <p className="overviewPoint-heading text-lg font-semibold">
                    {overview.heading}
                  </p>
                  {editCourse && (
                    <div className="action-btn-cnt-overview flex space-x-2">
                      <Trash
                        className="h-4 w-4 cursor-pointer"
                        onClick={() => handleRemoveOverview(index)}
                      />
                      <Edit
                        className="h-4 w-4 cursor-pointer"
                        onClick={() => setEditValues(overview, index)}
                      />
                    </div>
                  )}
                </div>
                <p className="overviewPoint-content">{overview.content}</p>
              </div>
            ))}
          </div>
        </form>

        <form className="form-right flex-1">
          <div className="form-right-header flex justify-between items-center mb-6">
            <h3 className="course-new-title text-2xl font-semibold">
              List The Lessons
            </h3>
            {editCourse && (
              <div
                className="addgaanew-lesson-btn bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 cursor-pointer"
                onClick={() => setPopupOpen({ open: true, data: null })}
              >
                Add new lesson
              </div>
            )}
          </div>

          <div className="lesson-list-cnt">
            {courseData.lessons.length > 0 ? (
              courseData.lessons.map((lesson, index) => (
                <div
                  className="lesson bg-white p-4 mb-4 rounded shadow-lg cursor-pointer"
                  key={index}
                  style={{ pointerEvents: editCourse ? "all" : "none" }}
                  onClick={() => openEditLesson(lesson, index)}
                >
                  <h1 className="lesson-number text-xl font-semibold">
                    {index + 1}
                  </h1>
                  <div className="lesson-title-cnt mt-2">
                    <h3 className="lesson-title text-lg font-semibold">
                      {lesson.title}
                    </h3>
                  </div>
                  <ul className="lesson-subtitle-cnt mt-4">
                    {lesson.chapter.map((video, idx) => (
                      <li key={idx}>
                        <p className="lesson-subtitle text-sm">{video.title}</p>
                        <p className="lesson-duration-txt text-sm text-gray-600">
                          duration: {video.duration}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <div className="no-lesson-cnt flex justify-center items-center py-10">
                <img
                  src={NoLesson}
                  alt="no-lesson"
                  className="empty-lesson-img"
                />
              </div>
            )}
          </div>
        </form>
      </div>

      {popupOpen.open && (
        <NewLesson
          addLesson={addLessontoCourse}
          editData={popupOpen.data}
          cancel={() => setPopupOpen({ open: false, data: null })}
          removeThisLesson={removeLessonFromCourse}
        />
      )}
    </div>
  );
};

export default EditCourse;