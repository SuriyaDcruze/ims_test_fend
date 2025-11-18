import { ArrowLeft, BookOpen, Clipboard, Edit, Trash, Plus } from "lucide-react";
import React, { useEffect, useState } from "react";
import { findFileType } from "../../hook/CourseFunction";
import { UploadFileWithType } from "../../service/api";
import AddTest from "./AddTest";

const NewSubject = ({ addSubject, cancel, editData, removeThisSubject }) => {
  const [openTest, setOpenTest] = useState({ open: false, data: null });
  const [errors, setErrors] = useState({});
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedTopicIndex, setSelectedTopicIndex] = useState(null);
  const [selectedSubTopicIndex, setSelectedSubTopicIndex] = useState(null);

  const [currentSubject, setCurrentSubject] = useState({
    title: "",
    topics: [],
    updateIndex: null,
  });

  const [currentTopic, setCurrentTopic] = useState({
    title: "",
    subTopics: [],
    updateIndex: null,
  });

  const [currentSubTopic, setCurrentSubTopic] = useState({
    title: "",
    updateIndex: null,
    test: null,
    file: null,
  });

  const [subTopicFile, setSubTopicFile] = useState(null);

  useEffect(() => {
    if (editData) {
      const sanitizedTopics = editData.topics.map((topic) => ({
        ...topic,
        subTopics: topic.subTopics.map((subTopic) => ({
          ...subTopic,
          file: subTopic.file || null,
        })),
      }));
      setCurrentSubject({ ...editData, topics: sanitizedTopics });
    }
  }, [editData]);

  const handleAddFile = (file) => {
    if (!file) return;
    const filetype = findFileType(file);
    setSubTopicFile(file);
    setCurrentSubTopic({
      ...currentSubTopic,
      file: { url: "", type: filetype },
      test: null,
    });
    setErrors((prev) => ({ ...prev, file: null }));
  };

  const handleSubTopicInput = (type, value) => {
    setCurrentSubTopic({ ...currentSubTopic, [type]: value });
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

  const addSubTopic = async () => {
    try {
      setUploadingFile(true);
      setErrors({});

      if (!currentSubTopic.title) {
        setErrors((prev) => ({ ...prev, title: "Title is required" }));
        return;
      }
      if (!subTopicFile && !currentSubTopic.file?.url && !currentSubTopic.test) {
        setErrors((prev) => ({
          ...prev,
          file: "Either a file or a test is required",
        }));
        return;
      }

      const newSubTopics = [...currentTopic.subTopics];
      let subTopicData = { ...currentSubTopic };

      if (subTopicFile) {
        const link = await uploadFile(subTopicFile);
        subTopicData = {
          ...subTopicData,
          file: {
            url: link.fileUrl,
            type: link.fileType,
          },
          test: null,
        };
      } else if (!subTopicData.file?.url && !subTopicData.test) {
        subTopicData.file = null;
      }

      if (currentSubTopic.updateIndex === null) {
        newSubTopics.push(subTopicData);
      } else {
        newSubTopics[currentSubTopic.updateIndex] = subTopicData;
      }

      setCurrentTopic({ ...currentTopic, subTopics: newSubTopics });
      setSubTopicFile(null);
      setCurrentSubTopic({
        title: "",
        updateIndex: null,
        file: null,
        test: null,
      });
      setSelectedSubTopicIndex(null);
    } catch (error) {
      setErrors((prev) => ({ ...prev, file: error.message }));
    } finally {
      setUploadingFile(false);
    }
  };

  const addTopic = () => {
    setErrors({});
    if (!currentTopic.title.trim()) {
      setErrors((prev) => ({ ...prev, topicTitle: "Topic title is required" }));
      return;
    }
    if (currentTopic.subTopics.length === 0) {
      setErrors((prev) => ({
        ...prev,
        subTopics: "At least one subTopic is required",
      }));
      return;
    }

    const newTopics = [...currentSubject.topics];
    if (currentTopic.updateIndex === null) {
      newTopics.push({ ...currentTopic, updateIndex: newTopics.length });
    } else {
      newTopics[currentTopic.updateIndex] = { ...currentTopic, updateIndex: currentTopic.updateIndex };
    }
    setCurrentSubject({ ...currentSubject, topics: newTopics });
    setCurrentTopic({
      title: "",
      subTopics: [],
      updateIndex: null,
    });
    setSelectedTopicIndex(null);
  };

  const validateAndUpdateSubject = () => {
    setErrors({});
    if (!currentSubject.title.trim()) {
      setErrors((prev) => ({ ...prev, subjectTitle: "Subject title is required" }));
      return;
    }
    if (currentSubject.topics.length === 0) {
      setErrors((prev) => ({
        ...prev,
        topics: "At least one topic is required",
      }));
      return;
    }
    addSubject(currentSubject);
  };

  const setEditSubTopic = (subTopic, index) => {
    setCurrentSubTopic({ ...subTopic, updateIndex: index });
    setSubTopicFile(null);
    setSelectedSubTopicIndex(index);
  };

  const setEditTopic = (topic, index) => {
    setCurrentTopic({ ...topic, updateIndex: index });
    setSelectedTopicIndex(index);
  };

  const handleRemoveSubTopic = (index) => {
    const newSubTopics = [...currentTopic.subTopics];
    newSubTopics.splice(index, 1);
    setCurrentTopic({ ...currentTopic, subTopics: newSubTopics });
  };

  const handleRemoveTopic = (index) => {
    const newTopics = [...currentSubject.topics];
    newTopics.splice(index, 1);
    const updatedTopics = newTopics.map((topic, idx) => ({
      ...topic,
      updateIndex: idx,
    }));
    setCurrentSubject({ ...currentSubject, topics: updatedTopics });
  };

  const handleDelete = () => {
    const confirm = window.confirm(
      "Confirm to delete this subject, all topics and subTopics will be deleted"
    );
    if (confirm && editData) {
      removeThisSubject(editData);
      cancel();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center overflow-y-auto py-6">
      <div className="bg-white max-w-5xl w-full rounded-lg shadow-lg p-6 flex flex-col overflow-y-auto max-h-screen">
        {openTest.open && (
          <AddTest
            testId={currentSubTopic?.test}
            addTest={(data) =>
              setCurrentSubTopic({
                ...currentSubTopic,
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
                Delete Subject
              </button>
            )}
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
              onClick={validateAndUpdateSubject}
            >
              {editData?.updateIndex != null ? "Update Subject" : "Add to Course"}
            </button>
          </div>
        </div>

        {/* Subject Title Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-green-600" />
            <h3 className="text-xl font-bold">Create New Subject</h3>
          </div>
          <div>
            <label htmlFor="subject-title" className="mb-1 block text-sm font-medium">
              Subject Title <span className="text-red-500">*</span>
            </label>
            <input
              id="subject-title"
              type="text"
              className={`w-full border rounded px-4 py-2 focus:ring-2 focus:ring-green-500 ${
                errors.subjectTitle ? "border-red-500" : "border-gray-300"
              }`}
              value={currentSubject.title || ""}
              onChange={(e) => {
                setCurrentSubject({ ...currentSubject, title: e.target.value });
                setErrors((prev) => ({ ...prev, subjectTitle: null }));
              }}
              placeholder="Enter subject title"
            />
            {errors.subjectTitle && (
              <p className="text-red-500 text-sm mt-1">{errors.subjectTitle}</p>
            )}
          </div>
        </div>

        {/* Topic Section */}
        <div className="mb-6 border-t pt-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold">Topics</h4>
            <button
              onClick={() => {
                setCurrentTopic({ title: "", subTopics: [], updateIndex: null });
                setSelectedTopicIndex(null);
              }}
              className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              <Plus className="w-4 h-4" />
              Add New Topic
            </button>
          </div>

          {/* Topic Input */}
          <div className="mb-4 p-4 border rounded bg-gray-50">
            <div className="mb-3">
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

            {/* SubTopic Input */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="subtopic-title" className="mb-1 block text-sm font-medium">
                  SubTopic Title
                </label>
                <input
                  id="subtopic-title"
                  type="text"
                  className={`w-full border rounded px-4 py-2 focus:ring-2 focus:ring-green-500 ${
                    errors.title ? "border-red-500" : "border-gray-300"
                  }`}
                  value={currentSubTopic.title}
                  onChange={(e) => handleSubTopicInput("title", e.target.value)}
                  placeholder="Enter subtopic title"
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label htmlFor="subtopic-file" className="mb-1 block text-sm font-medium">
                  Upload Media
                </label>
                <div
                  className={`relative w-full border border-dashed border-gray-400 p-3 rounded bg-gray-50 ${
                    currentSubTopic.test ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <p className="text-sm text-gray-600 truncate">
                    {subTopicFile?.name ||
                      currentSubTopic.file?.url ||
                      "Upload video, audio, PDF, or PowerPoint"}
                  </p>
                  <input
                    id="subtopic-file"
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    accept="video/*,audio/*,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                    onChange={(e) => handleAddFile(e.target.files[0])}
                    disabled={uploadingFile || currentSubTopic.test}
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
                    (subTopicFile || currentSubTopic.file?.url)
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-gray-200"
                  }`}
                  onClick={() =>
                    !(subTopicFile || currentSubTopic.file?.url) &&
                    setOpenTest({ open: true, data: currentSubTopic.test })
                  }
                  disabled={subTopicFile || currentSubTopic.file?.url}
                >
                  <Clipboard className="w-5 h-5 text-gray-600" />
                  <p className="text-sm text-gray-700">
                    {currentSubTopic.test
                      ? "Test - click to update"
                      : "Add a test for this subtopic"}
                  </p>
                </button>
              </div>
              <div className="md:col-span-2">
                <button
                  className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  onClick={addSubTopic}
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
                    "Add SubTopic"
                  )}
                </button>
              </div>
            </div>

            {/* SubTopics List */}
            {currentTopic.subTopics.length > 0 && (
              <div className="mt-4">
                <h5 className="text-sm font-semibold mb-2">SubTopics:</h5>
                {currentTopic.subTopics.map((subTopic, index) => (
                  <div
                    key={index}
                    className={`border rounded p-3 mb-2 ${
                      currentSubTopic.updateIndex === index ? "bg-gray-100" : "bg-white"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">{subTopic.title}</p>
                        {subTopic.file?.url && (
                          <p className="text-xs text-gray-500">File: {subTopic.file.type}</p>
                        )}
                        {subTopic.test && (
                          <p className="text-xs text-blue-500">Test Added</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRemoveSubTopic(index)}
                          className="p-1 text-red-600 hover:text-red-800"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditSubTopic(subTopic, index)}
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

            {/* Add Topic Button */}
            <button
              className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              onClick={addTopic}
              disabled={!currentTopic.title || currentTopic.subTopics.length === 0}
            >
              {currentTopic.updateIndex !== null ? "Update Topic" : "Add Topic"}
            </button>
          </div>

          {/* Topics List */}
          {errors.topics && (
            <p className="text-red-500 text-sm mb-2">{errors.topics}</p>
          )}
          {currentSubject.topics.length > 0 && (
            <div className="mt-4 space-y-2">
              {currentSubject.topics.map((topic, index) => (
                <div
                  key={index}
                  className={`border rounded p-4 ${
                    selectedTopicIndex === index ? "bg-blue-50" : "bg-white"
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h5 className="font-semibold">{topic.title}</h5>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRemoveTopic(index)}
                        className="p-1 text-red-600 hover:text-red-800"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditTopic(topic, index)}
                        className="p-1 text-blue-600 hover:text-blue-800"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    {topic.subTopics.length} SubTopic(s)
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

export default NewSubject;

