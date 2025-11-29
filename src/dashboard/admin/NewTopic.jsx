import { ArrowLeft, BookOpen, Clipboard, Edit, Trash, Plus } from "lucide-react";
import React, { useEffect, useState } from "react";
import { findFileType } from "../../hook/CourseFunction";
import { UploadFileWithType } from "../../service/api";
import AddTest from "./AddTest";

const NewTopic = ({ addTopic, cancel, editData, removeThisTopic }) => {
  const [openTest, setOpenTest] = useState({ open: false, data: null });
  const [errors, setErrors] = useState({});
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(null);
  const [selectedLessonIndex, setSelectedLessonIndex] = useState(null);

  const [currentTopic, setCurrentTopic] = useState({
    title: "",
    chapters: [],
    updateIndex: null,
  });

  const [currentChapter, setCurrentChapter] = useState({
    title: "",
    lessons: [],
    updateIndex: null,
  });

  const [currentLesson, setCurrentLesson] = useState({
    title: "",
    updateIndex: null,
    test: null,
    file: null,
  });

  const [lessonFile, setLessonFile] = useState(null);

  useEffect(() => {
    if (editData) {
      const sanitizedChapters = editData.chapters.map((chapter) => ({
        ...chapter,
        lessons: chapter.lessons.map((lesson) => ({
          ...lesson,
          file: lesson.file || null,
        })),
      }));
      setCurrentTopic({ ...editData, chapters: sanitizedChapters });
    }
  }, [editData]);

  const handleAddFile = (file) => {
    if (!file) return;
    const filetype = findFileType(file);
    setLessonFile(file);
    setCurrentLesson({
      ...currentLesson,
      file: { url: "", type: filetype },
      test: null,
    });
    setErrors((prev) => ({ ...prev, file: null }));
  };

  const handleLessonInput = (type, value) => {
    setCurrentLesson({ ...currentLesson, [type]: value });
    setErrors((prev) => ({ ...prev, [type]: null }));
  };

  const uploadFile = async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await UploadFileWithType(formData);
      if (res.error) throw new Error(res.error);
      return res.data;
    } catch (error) {
      throw new Error(`Failed to upload: ${error.message}`);
    }
  };

  const addLesson = async () => {
    try {
      setUploadingFile(true);
      setErrors({});

      if (!currentLesson.title) {
        setErrors((prev) => ({ ...prev, title: "Title is required" }));
        return;
      }
      if (!lessonFile && !currentLesson.file?.url && !currentLesson.test) {
        setErrors((prev) => ({
          ...prev,
          file: "Either a file or a test is required",
        }));
        return;
      }

      const newLessons = [...currentChapter.lessons];
      let lessonData = { ...currentLesson };

      if (lessonFile) {
        const link = await uploadFile(lessonFile);
        lessonData = {
          ...lessonData,
          file: {
            url: link.fileUrl,
            type: link.fileType,
          },
          test: null,
        };
      } else if (!lessonData.file?.url && !lessonData.test) {
        lessonData.file = null;
      }

      if (currentLesson.updateIndex === null) {
        newLessons.push(lessonData);
      } else {
        newLessons[currentLesson.updateIndex] = lessonData;
      }

      setCurrentChapter({ ...currentChapter, lessons: newLessons });
      setLessonFile(null);
      setCurrentLesson({
        title: "",
        updateIndex: null,
        file: null,
        test: null,
      });
      setSelectedLessonIndex(null);
    } catch (error) {
      setErrors((prev) => ({ ...prev, file: error.message }));
    } finally {
      setUploadingFile(false);
    }
  };

  const addChapter = () => {
    setErrors({});
    if (!currentChapter.title.trim()) {
      setErrors((prev) => ({ ...prev, chapterTitle: "Chapter title is required" }));
      return;
    }
    if (currentChapter.lessons.length === 0) {
      setErrors((prev) => ({
        ...prev,
        lessons: "At least one lesson is required",
      }));
      return;
    }

    const newChapters = [...currentTopic.chapters];
    if (currentChapter.updateIndex === null) {
      newChapters.push({ ...currentChapter, updateIndex: newChapters.length });
    } else {
      newChapters[currentChapter.updateIndex] = { ...currentChapter, updateIndex: currentChapter.updateIndex };
    }
    setCurrentTopic({ ...currentTopic, chapters: newChapters });
    setCurrentChapter({
      title: "",
      lessons: [],
      updateIndex: null,
    });
    setSelectedChapterIndex(null);
  };

  const validateAndUpdateTopic = () => {
    setErrors({});
    if (!currentTopic.title.trim()) {
      setErrors((prev) => ({ ...prev, topicTitle: "Topic title is required" }));
      return;
    }
    if (currentTopic.chapters.length === 0) {
      setErrors((prev) => ({
        ...prev,
        chapters: "At least one chapter is required",
      }));
      return;
    }
    addTopic(currentTopic);
  };

  const setEditLesson = (lesson, index) => {
    setCurrentLesson({ ...lesson, updateIndex: index });
    setLessonFile(null);
    setSelectedLessonIndex(index);
  };

  const setEditChapter = (chapter, index) => {
    setCurrentChapter({ ...chapter, updateIndex: index });
    setSelectedChapterIndex(index);
  };

  const handleRemoveLesson = (index) => {
    const newLessons = [...currentChapter.lessons];
    newLessons.splice(index, 1);
    setCurrentChapter({ ...currentChapter, lessons: newLessons });
  };

  const handleRemoveChapter = (index) => {
    const newChapters = [...currentTopic.chapters];
    newChapters.splice(index, 1);
    const updatedChapters = newChapters.map((chapter, idx) => ({
      ...chapter,
      updateIndex: idx,
    }));
    setCurrentTopic({ ...currentTopic, chapters: updatedChapters });
  };

  const handleDelete = () => {
    const confirm = window.confirm(
      "Confirm to delete this topic? All chapters and lessons will be deleted."
    );
    if (confirm && editData) {
      removeThisTopic(editData);
      cancel();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center overflow-y-auto py-6">
      <div className="bg-white max-w-5xl w-full rounded-lg shadow-lg p-6 flex flex-col overflow-y-auto max-h-screen">
        {openTest.open && (
          <AddTest
            testId={currentLesson?.test}
            addTest={(data) =>
              setCurrentLesson({
                ...currentLesson,
                test: data,
                file: null,
              })
            }
            closeTest={() => setOpenTest({ open: false })}
          />
        )}

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div onClick={cancel} className="cursor-pointer">
            <ArrowLeft className="w-6 h-6 text-gray-600 hover:text-gray-800" />
          </div>
          <div className="flex gap-3">
            {editData && (
              <button
                className="px-4 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200 flex items-center gap-2"
                onClick={handleDelete}
              >
                <Trash className="w-5 h-5" />
                Delete Topic
              </button>
            )}
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
              onClick={validateAndUpdateTopic}
            >
              {editData?.updateIndex != null ? "Update Topic" : "Add to Course"}
            </button>
          </div>
        </div>

        {/* Topic Title Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-green-600" />
            <h3 className="text-xl font-bold">Create New Topic</h3>
          </div>
          <div>
            <label htmlFor="topic-title" className="mb-1 block text-sm font-medium">
              Topic Title <span className="text-red-500">*</span>
            </label>
            <input
              id="topic-title"
              type="text"
              className={`w-full border rounded px-4 py-2 focus:ring-2 focus:ring-green-500 ${
                errors.topicTitle ? "border-red-500" : "border-gray-300"
              }`}
              value={currentTopic.title || ""}
              onChange={(e) => {
                setCurrentTopic({ ...currentTopic, title: e.target.value });
                setErrors((prev) => ({ ...prev, topicTitle: null }));
              }}
              placeholder="Enter topic title"
            />
            {errors.topicTitle && (
              <p className="text-red-500 text-sm mt-1">{errors.topicTitle}</p>
            )}
          </div>
        </div>

        {/* Chapter Section */}
        <div className="mb-6 border-t pt-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold">Chapters</h4>
            <button
              onClick={() => {
                setCurrentChapter({ title: "", lessons: [], updateIndex: null });
                setSelectedChapterIndex(null);
              }}
              className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              <Plus className="w-4 h-4" />
              Add New Chapter
            </button>
          </div>

          {/* Chapter Input */}
          <div className="mb-4 p-4 border rounded bg-gray-50">
            <div className="mb-3">
              <label htmlFor="chapter-title" className="mb-1 block text-sm font-medium">
                Chapter Title <span className="text-red-500">*</span>
              </label>
              <input
                id="chapter-title"
                type="text"
                className={`w-full border rounded px-4 py-2 focus:ring-2 focus:ring-green-500 ${
                  errors.chapterTitle ? "border-red-500" : "border-gray-300"
                }`}
                value={currentChapter.title || ""}
                onChange={(e) => {
                  setCurrentChapter({ ...currentChapter, title: e.target.value });
                  setErrors((prev) => ({ ...prev, chapterTitle: null }));
                }}
                placeholder="Enter chapter title"
              />
              {errors.chapterTitle && (
                <p className="text-red-500 text-sm mt-1">{errors.chapterTitle}</p>
              )}
            </div>

            {/* Lesson Input */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="lesson-title" className="mb-1 block text-sm font-medium">
                  Lesson Title
                </label>
                <input
                  id="lesson-title"
                  type="text"
                  className={`w-full border rounded px-4 py-2 focus:ring-2 focus:ring-green-500 ${
                    errors.title ? "border-red-500" : "border-gray-300"
                  }`}
                  value={currentLesson.title}
                  onChange={(e) => handleLessonInput("title", e.target.value)}
                  placeholder="Enter lesson title"
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label htmlFor="lesson-file" className="mb-1 block text-sm font-medium">
                  Upload Media
                </label>
                <div
                  className={`relative w-full border border-dashed border-gray-400 p-3 rounded bg-gray-50 ${
                    currentLesson.test ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <p className="text-sm text-gray-600 truncate">
                    {lessonFile?.name ||
                      currentLesson.file?.url ||
                      "Upload video, audio, PDF, or PowerPoint"}
                  </p>
                  <input
                    id="lesson-file"
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    accept="video/*,audio/*,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                    onChange={(e) => handleAddFile(e.target.files[0])}
                    disabled={uploadingFile || currentLesson.test}
                  />
                  {uploadingFile && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 rounded">
                      <svg
                        className="animate-spin h-5 w-5 text-green-600"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    </div>
                  )}
                </div>
                {errors.file && (
                  <p className="text-red-500 text-sm mt-1">{errors.file}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <button
                  className={`mt-3 flex items-center gap-2 bg-gray-100 p-3 rounded w-full text-left ${
                    (lessonFile || currentLesson.file?.url)
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-gray-200"
                  }`}
                  onClick={() =>
                    !(lessonFile || currentLesson.file?.url) &&
                    setOpenTest({ open: true, data: currentLesson.test })
                  }
                  disabled={lessonFile || currentLesson.file?.url}
                >
                  <Clipboard className="w-5 h-5 text-gray-600" />
                  <p className="text-sm text-gray-700">
                    {currentLesson.test
                      ? "Test - click to update"
                      : "Add a test for this lesson"}
                  </p>
                </button>
              </div>
              <div className="md:col-span-2">
                <button
                  className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  onClick={addLesson}
                  disabled={uploadingFile}
                >
                  {uploadingFile ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    "Add Lesson"
                  )}
                </button>
              </div>
            </div>

            {/* Lessons List */}
            {currentChapter.lessons.length > 0 && (
              <div className="mt-4">
                <h5 className="text-sm font-semibold mb-2">Lessons:</h5>
                {currentChapter.lessons.map((lesson, index) => (
                  <div
                    key={index}
                    className={`border rounded p-3 mb-2 ${
                      currentLesson.updateIndex === index ? "bg-gray-100" : "bg-white"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">{lesson.title}</p>
                        {lesson.file?.url && (
                          <p className="text-xs text-gray-500">File: {lesson.file.type}</p>
                        )}
                        {lesson.test && (
                          <p className="text-xs text-blue-500">Test Added</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRemoveLesson(index)}
                          className="p-1 text-red-600 hover:text-red-800"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditLesson(lesson, index)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Chapter Button */}
            <button
              className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              onClick={addChapter}
              disabled={!currentChapter.title || currentChapter.lessons.length === 0}
            >
              {currentChapter.updateIndex !== null ? "Update Chapter" : "Add Chapter"}
            </button>
          </div>

          {/* Chapters List */}
          {errors.chapters && (
            <p className="text-red-500 text-sm mb-2">{errors.chapters}</p>
          )}
          {errors.lessons && (
            <p className="text-red-500 text-sm mb-2">{errors.lessons}</p>
          )}
          {currentTopic.chapters.length > 0 && (
            <div className="mt-4 space-y-2">
              {currentTopic.chapters.map((chapter, index) => (
                <div
                  key={index}
                  className={`border rounded p-4 ${
                    selectedChapterIndex === index ? "bg-blue-50" : "bg-white"
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h5 className="font-semibold">{chapter.title}</h5>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRemoveChapter(index)}
                        className="p-1 text-red-600 hover:text-red-800"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditChapter(chapter, index)}
                        className="p-1 text-blue-600 hover:text-blue-800"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    {chapter.lessons.length} Lesson(s)
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

export default NewTopic;

