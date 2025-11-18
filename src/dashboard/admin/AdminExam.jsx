import React, { useState, useEffect, useRef } from 'react';
import { CreateExam, GetAllExams, GetExamById, UpdateExamById, DeleteExamById, ToggleExamPublish, GetAllCourses } from '../../service/api';

const AdminExam = () => {
  // State for exams
  const [exams, setExams] = useState([]);
  // State for courses
  const [courses, setCourses] = useState([]);
  // State for new exam form in sidebar
  const [addingExam, setAddingExam] = useState(false);
  const [newExam, setNewExam] = useState({
    title: '',
    subject: '',
    courseId: '',
    duration: '',
    isPublished: false,
    tags: '',
    questions: [],
  });
  // State for new question form
  const [newQuestion, setNewQuestion] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: '',
  });
  // State for selected exam to edit
  const [selectedExam, setSelectedExam] = useState(null);
  // State for question form visibility and editing
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  // Ref for the new exam form
  const newExamFormRef = useRef(null);

  // Fetch exams and courses on component mount
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const response = await GetAllExams();
        const mappedExams = response.map((exam, index) => ({
          id: exam._id,
          title: exam.title,
          subject: exam.subject || '',
          courseId: exam.courseId,
          courseTitle: exam.courseTitle,
          duration: exam.duration,
          totalMarks: exam.questions.length,
          questions: exam.questions.map((q, qIndex) => ({
            id: `${exam._id}-${qIndex}`,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || '',
          })),
          isPublished: exam.isPublished,
          tags: exam.tags || [],
          createdBy: exam.createdBy,
        }));
        setExams(mappedExams);
      } catch (error) {
        console.error('Failed to fetch exams:', error);
        alert('Failed to load exams. Please try again.');
      }
    };

    const fetchCourses = async () => {
      try {
        const response = await GetAllCourses();
        setCourses(response);
      } catch (error) {
        console.error('Failed to fetch courses:', error);
        alert('Failed to load courses. Please try again.');
      }
    };

    fetchExams();
    fetchCourses();
  }, []);

  // Scroll to new exam form when addingExam is true
  useEffect(() => {
    if (addingExam && newExamFormRef.current) {
      newExamFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [addingExam]);

  // Handle adding a new exam
  const handleAddExam = async (e) => {
    e.preventDefault();
    if (!newExam.title.trim() || !newExam.courseId || !newExam.duration) {
      alert('Please fill all required exam fields (including Course)');
      return;
    }
    const selectedCourse = courses.find((course) => course._id === newExam.courseId);
    if (!selectedCourse) {
      alert('Selected course is invalid');
      return;
    }
    const examData = {
      title: newExam.title,
      subject: newExam.subject,
      courseId: newExam.courseId,
      courseTitle: selectedCourse.title,
      duration: parseInt(newExam.duration),
      questions: [],
      isPublished: newExam.isPublished,
      tags: newExam.tags.split(',').map((tag) => tag.trim()).filter((tag) => tag),
    };
    try {
      const response = await CreateExam(examData);
      const newExamFromApi = response.exam;
      setExams((prev) => [
        ...prev,
        {
          id: newExamFromApi._id,
          title: newExamFromApi.title,
          subject: newExamFromApi.subject || '',
          courseId: newExamFromApi.courseId,
          courseTitle: newExamFromApi.courseTitle,
          duration: newExamFromApi.duration,
          totalMarks: newExamFromApi.questions.length,
          questions: newExamFromApi.questions.map((q, qIndex) => ({
            id: `${newExamFromApi._id}-${qIndex}`,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || '',
          })),
          isPublished: newExamFromApi.isPublished,
          tags: newExamFromApi.tags || [],
          createdBy: newExamFromApi.createdBy,
        },
      ]);
      setNewExam({
        title: '',
        subject: '',
        courseId: '',
        duration: '',
        isPublished: false,
        tags: '',
        questions: [],
      });
      setAddingExam(false);
    } catch (error) {
      console.error('Failed to create exam:', error);
      alert(error.message || 'Failed to create exam. Please try again.');
    }
  };

  // Handle canceling new exam form
  const handleCancelAddExam = () => {
    setNewExam({
      title: '',
      subject: '',
      courseId: '',
      duration: '',
      isPublished: false,
      tags: '',
      questions: [],
    });
    setAddingExam(false);
  };

  // Handle editing an exam
  const handleEditExam = (exam) => {
    setSelectedExam(exam);
    setNewExam({
      title: exam.title,
      subject: exam.subject || '',
      courseId: exam.courseId,
      duration: exam.duration.toString(),
      isPublished: exam.isPublished,
      tags: exam.tags.join(', '),
      questions: exam.questions,
    });
    setAddingExam(false);
    setShowQuestionForm(false);
    setEditingQuestion(null);
  };

  // Handle updating an exam
  const handleUpdateExam = async (e) => {
    e.preventDefault();
    if (!newExam.title.trim() || !newExam.courseId || !newExam.duration) {
      alert('Please fill all required exam fields (including Course)');
      return;
    }
    const selectedCourse = courses.find((course) => course._id === newExam.courseId);
    if (!selectedCourse) {
      alert('Selected course is invalid');
      return;
    }
    const examData = {
      title: newExam.title,
      subject: newExam.subject,
      courseId: newExam.courseId,
      courseTitle: selectedCourse.title,
      duration: parseInt(newExam.duration),
      questions: selectedExam.questions.map((q) => ({
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || '',
      })),
      isPublished: newExam.isPublished,
      tags: newExam.tags.split(',').map((tag) => tag.trim()).filter((tag) => tag),
    };
    try {
      const response = await UpdateExamById(selectedExam.id, examData);
      const updatedExamFromApi = response.exam;
      setExams((prev) =>
        prev.map((exam) =>
          exam.id === selectedExam.id
            ? {
                ...exam,
                title: updatedExamFromApi.title,
                subject: updatedExamFromApi.subject || '',
                courseId: updatedExamFromApi.courseId,
                courseTitle: updatedExamFromApi.courseTitle,
                duration: updatedExamFromApi.duration,
                totalMarks: updatedExamFromApi.questions.length,
                questions: updatedExamFromApi.questions.map((q, qIndex) => ({
                  id: `${updatedExamFromApi._id}-${qIndex}`,
                  question: q.question,
                  options: q.options,
                  correctAnswer: q.correctAnswer,
                  explanation: q.explanation || '',
                })),
                isPublished: updatedExamFromApi.isPublished,
                tags: updatedExamFromApi.tags || [],
              }
            : exam
        )
      );
      setSelectedExam(null);
      setNewExam({
        title: '',
        subject: '',
        courseId: '',
        duration: '',
        isPublished: false,
        tags: '',
        questions: [],
      });
      setShowQuestionForm(false);
      setEditingQuestion(null);
    } catch (error) {
      console.error('Failed to update exam:', error);
      alert(error.message || 'Failed to update exam. Please try again.');
    }
  };

  // Handle deleting an exam
  const handleDeleteExam = async (examId) => {
    if (!window.confirm('Are you sure you want to delete this exam?')) return;
    try {
      await DeleteExamById(examId);
      setExams((prev) => prev.filter((exam) => exam.id !== examId));
      if (selectedExam && selectedExam.id === examId) {
        setSelectedExam(null);
        setNewExam({
          title: '',
          subject: '',
          courseId: '',
          duration: '',
          isPublished: false,
          tags: '',
          questions: [],
        });
        setShowQuestionForm(false);
        setEditingQuestion(null);
      }
    } catch (error) {
      console.error('Failed to delete exam:', error);
      alert(error.message || 'Failed to delete exam. Please try again.');
    }
  };

  // Handle toggling exam publish status
  const handleTogglePublish = async (examId) => {
    try {
      const response = await ToggleExamPublish(examId);
      const updatedExamFromApi = response.exam;
      setExams((prev) =>
        prev.map((exam) =>
          exam.id === examId
            ? { ...exam, isPublished: updatedExamFromApi.isPublished }
            : exam
        )
      );
      if (selectedExam && selectedExam.id === examId) {
        setSelectedExam((prev) => ({ ...prev, isPublished: updatedExamFromApi.isPublished }));
        setNewExam((prev) => ({ ...prev, isPublished: updatedExamFromApi.isPublished }));
      }
    } catch (error) {
      console.error('Failed to toggle publish status:', error);
      alert(error.message || 'Failed to toggle publish status. Please try again.');
    }
  };

  // Handle adding a new question
  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (
      !newQuestion.question.trim() ||
      newQuestion.options.some((opt) => !opt.trim()) ||
      !newQuestion.correctAnswer
    ) {
      alert('Please fill all required question fields');
      return;
    }
    if (!newQuestion.options.includes(newQuestion.correctAnswer)) {
      alert('Correct answer must be one of the provided options');
      return;
    }
    const question = {
      id: Date.now(),
      question: newQuestion.question,
      options: newQuestion.options,
      correctAnswer: newQuestion.correctAnswer,
      explanation: newQuestion.explanation || '',
    };
    const updatedQuestions = [...selectedExam.questions, question];
    const examData = {
      title: selectedExam.title,
      subject: selectedExam.subject,
      courseId: selectedExam.courseId,
      courseTitle: courses.find((course) => course._id === selectedExam.courseId)?.title || '',
      duration: selectedExam.duration,
      questions: updatedQuestions.map((q) => ({
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || '',
      })),
      isPublished: selectedExam.isPublished,
      tags: selectedExam.tags,
    };
    try {
      const response = await UpdateExamById(selectedExam.id, examData);
      const updatedExamFromApi = response.exam;
      setExams((prev) =>
        prev.map((exam) =>
          exam.id === selectedExam.id
            ? {
                ...exam,
                questions: updatedExamFromApi.questions.map((q, qIndex) => ({
                  id: `${updatedExamFromApi._id}-${qIndex}`,
                  question: q.question,
                  options: q.options,
                  correctAnswer: q.correctAnswer,
                  explanation: q.explanation || '',
                })),
                totalMarks: updatedExamFromApi.questions.length,
              }
            : exam
        )
      );
      setSelectedExam((prev) => ({
        ...prev,
        questions: updatedQuestions,
        totalMarks: updatedQuestions.length,
      }));
      setNewQuestion({
        question: '',
        options: ['', '', '', ''],
        correctAnswer: '',
        explanation: '',
      });
      setShowQuestionForm(false);
    } catch (error) {
      console.error('Failed to add question:', error);
      alert(error.message || 'Failed to add question. Please try again.');
    }
  };

  // Handle updating a question
  const handleUpdateQuestion = async (e) => {
    e.preventDefault();
    if (
      !newQuestion.question.trim() ||
      newQuestion.options.some((opt) => !opt.trim()) ||
      !newQuestion.correctAnswer
    ) {
      alert('Please fill all required question fields');
      return;
    }
    if (!newQuestion.options.includes(newQuestion.correctAnswer)) {
      alert('Correct answer must be one of the provided options');
      return;
    }
    const updatedQuestions = selectedExam.questions.map((q) =>
      q.id === editingQuestion.id
        ? {
            ...q,
            question: newQuestion.question,
            options: newQuestion.options,
            correctAnswer: newQuestion.correctAnswer,
            explanation: newQuestion.explanation || '',
          }
        : q
    );
    const examData = {
      title: selectedExam.title,
      subject: selectedExam.subject,
      courseId: selectedExam.courseId,
      courseTitle: courses.find((course) => course._id === selectedExam.courseId)?.title || '',
      duration: selectedExam.duration,
      questions: updatedQuestions.map((q) => ({
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || '',
      })),
      isPublished: selectedExam.isPublished,
      tags: selectedExam.tags,
    };
    try {
      const response = await UpdateExamById(selectedExam.id, examData);
      const updatedExamFromApi = response.exam;
      setExams((prev) =>
        prev.map((exam) =>
          exam.id === selectedExam.id
            ? {
                ...exam,
                questions: updatedExamFromApi.questions.map((q, qIndex) => ({
                  id: `${updatedExamFromApi._id}-${qIndex}`,
                  question: q.question,
                  options: q.options,
                  correctAnswer: q.correctAnswer,
                  explanation: q.explanation || '',
                })),
                totalMarks: updatedExamFromApi.questions.length,
              }
            : exam
        )
      );
      setSelectedExam((prev) => ({
        ...prev,
        questions: updatedQuestions,
        totalMarks: updatedQuestions.length,
      }));
      setNewQuestion({
        question: '',
        options: ['', '', '', ''],
        correctAnswer: '',
        explanation: '',
      });
      setEditingQuestion(null);
      setShowQuestionForm(false);
    } catch (error) {
      console.error('Failed to update question:', error);
      alert(error.message || 'Failed to update question. Please try again.');
    }
  };

  // Handle clearing question form
  const handleClearQuestion = () => {
    setNewQuestion({
      question: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      explanation: '',
    });
    setEditingQuestion(null);
    setShowQuestionForm(false);
  };

  // Handle editing a question
  const handleEditQuestion = (question) => {
    setEditingQuestion(question);
    setNewQuestion({
      question: question.question,
      options: question.options,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation || '',
    });
    setShowQuestionForm(true);
  };

  // Handle form input changes for exam
  const handleExamInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewExam((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Handle form input changes for question
  const handleQuestionInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('option')) {
      const index = parseInt(name.replace('option', '')) - 1;
      setNewQuestion((prev) => ({
        ...prev,
        options: prev.options.map((opt, i) => (i === index ? value : opt)),
      }));
    } else {
      setNewQuestion((prev) => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="flex relative h-full bg-gray-100">
      {/* Sidebar */}
      <div className="w-72 h-screen sticky top-0 bg-white border-r border-gray-200 overflow-y-auto">
        <nav className="p-4">
          {/* Exam List */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Exams</h3>
            <ul className="mt-2 space-y-1">
              {exams.map((exam) => (
                <li
                  key={exam.id}
                  className={exam.id === selectedExam?.id ? 'bg-green-50' : ''}
                >
                  <div className="flex items-center justify-between px-2 py-3 cursor-pointer">
                    <div
                      className="flex items-center flex-1"
                      onClick={() => handleEditExam(exam)}
                    >
                      <div className="mr-3 flex-shrink-0">
                        <div className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{exam.title}</p>
                        <p className="text-xs text-gray-500">{exam.courseTitle}</p>
                      </div>
                    </div>
                    <button
                      className="text-red-600 hover:bg-red-100 p-1 rounded"
                      onClick={() => handleDeleteExam(exam.id)}
                      aria-label={`Delete exam: ${exam.title}`}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
              <li>
                <button
                  className="w-full text-left px-2 py-2 text-green-600 hover:bg-green-100"
                  onClick={() => setAddingExam(true)}
                  aria-label="Add new exam"
                >
                  <svg
                    className="w-5 h-5 inline-block"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add New Exam
                </button>
              </li>
              {addingExam && (
                <li className="px-2 py-3 bg-green-50" ref={newExamFormRef}>
                  <form onSubmit={handleAddExam}>
                    <div className="space-y-2">
                      <input
                        type="text"
                        name="title"
                        className="w-full p-1 border border-gray-300 rounded text-sm"
                        placeholder="Exam title"
                        value={newExam.title}
                        onChange={handleExamInputChange}
                        required
                      />
                      <input
                        type="text"
                        name="subject"
                        className="w-full p-1 border border-gray-300 rounded text-sm"
                        placeholder="Subject (optional)"
                        value={newExam.subject}
                        onChange={handleExamInputChange}
                      />
                      <select
                        name="courseId"
                        className="w-full p-1 border border-gray-300 rounded text-sm"
                        value={newExam.courseId}
                        onChange={handleExamInputChange}
                        required
                      >
                        <option value="">Select a course</option>
                        {courses.map((course) => (
                          <option key={course._id} value={course._id}>
                            {course.title}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        name="duration"
                        className="w-full p-1 border border-gray-300 rounded text-sm"
                        placeholder="Duration (minutes)"
                        value={newExam.duration}
                        onChange={handleExamInputChange}
                        min="1"
                        required
                      />
                      <input
                        type="text"
                        name="tags"
                        className="w-full p-1 border border-gray-300 rounded text-sm"
                        placeholder="Tags (comma-separated)"
                        value={newExam.tags}
                        onChange={handleExamInputChange}
                      />
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="isPublished"
                          className="mr-2"
                          checked={newExam.isPublished}
                          onChange={handleExamInputChange}
                        />
                        <span className="text-sm text-gray-600">Publish Exam</span>
                      </label>
                    </div>
                    <div className="mt-2 flex space-x-2">
                      <button
                        type="submit"
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm py-1 rounded"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        className="flex-1 bg-gray-500 hover:bg-gray-600 text-white text-sm py-1 rounded"
                        onClick={handleCancelAddExam}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </li>
              )}
            </ul>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1  bg-white">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-gray-900">
              {selectedExam ? `Edit Exam: ${selectedExam.title}` : 'Edit Exam'}
            </h1>
            <p className="text-sm text-gray-500">Manage exam details</p>
          </div>

          {/* Edit Exam Form */}
          {selectedExam && (
            <div className="mb-8">
              <form onSubmit={handleUpdateExam}>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div>
                    <label className="block text-sm text-gray-500">Exam Title</label>
                    <input
                      type="text"
                      name="title"
                      className="w-full p-2 border border-gray-300 rounded text-sm"
                      placeholder="Enter exam title"
                      value={newExam.title}
                      onChange={handleExamInputChange}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500">Subject (optional)</label>
                    <input
                      type="text"
                      name="subject"
                      className="w-full p-2 border border-gray-300 rounded text-sm"
                      placeholder="Enter subject"
                      value={newExam.subject}
                      onChange={handleExamInputChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500">Course</label>
                    <select
                      name="courseId"
                      className="w-full p-2 border border-gray-300 rounded text-sm"
                      value={newExam.courseId}
                      onChange={handleExamInputChange}
                      required
                    >
                      <option value="">Select a course</option>
                      {courses.map((course) => (
                        <option key={course._id} value={course._id}>
                          {course.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500">Duration (minutes)</label>
                    <input
                      type="number"
                      name="duration"
                      className="w-full p-2 border border-gray-300 rounded text-sm"
                      placeholder="Enter duration in minutes"
                      value={newExam.duration}
                      onChange={handleExamInputChange}
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500">Tags (comma-separated)</label>
                    <input
                      type="text"
                      name="tags"
                      className="w-full p-2 border border-gray-300 rounded text-sm"
                      placeholder="Enter tags"
                      value={newExam.tags}
                      onChange={handleExamInputChange}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="isPublished"
                        className="mr-2"
                        checked={newExam.isPublished}
                        onChange={(e) => {
                          handleExamInputChange(e);
                          handleTogglePublish(selectedExam.id);
                        }}
                      />
                      <span className="text-sm text-gray-600">Publish Exam</span>
                    </label>
                  </div>
                </div>
                <div className="mt-4 flex space-x-4">
                  <button
                    type="submit"
                    className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-6 rounded"
                  >
                    Update Exam
                  </button>
                  <button
                    type="button"
                    className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-6 rounded"
                    onClick={() => {
                      setSelectedExam(null);
                      setNewExam({
                        title: '',
                        subject: '',
                        courseId: '',
                        duration: '',
                        isPublished: false,
                        tags: '',
                        questions: [],
                      });
                      setShowQuestionForm(false);
                      setEditingQuestion(null);
                    }}
                  >
                    Cancel Edit
                  </button>
                  <button
                    type="button"
                    className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-6 rounded"
                    onClick={() => handleDeleteExam(selectedExam.id)}
                  >
                    Delete Exam
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Add Question Icon and Form */}
          {selectedExam && (
            <div className="mt-10">
              <h2 className="text-lg font-medium mb-4">Manage Questions</h2>
              {!showQuestionForm && (
                <button
                  className="text-green-600 hover:bg-green-100 p-2 rounded"
                  onClick={() => setShowQuestionForm(true)}
                  aria-label="Add new question"
                >
                  <svg
                    className="w-6 h-6 inline-block"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span className="ml-2 text-sm font-medium">Add Question</span>
                </button>
              )}
              {showQuestionForm && (
                <div className="p-4 bg-gray-50 rounded">
                  <form onSubmit={editingQuestion ? handleUpdateQuestion : handleAddQuestion}>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-gray-500">Question</label>
                        <textarea
                          name="question"
                          className="w-full p-2 border border-gray-300 rounded text-sm"
                          placeholder="Enter question"
                          value={newQuestion.question}
                          onChange={handleQuestionInputChange}
                          rows="4"
                          required
                          aria-describedby="question-help"
                        />
                        <p id="question-help" className="text-xs text-gray-400 mt-1">
                          Enter the question to be displayed.
                        </p>
                      </div>
                      {[1, 2, 3, 4].map((num) => (
                        <div key={num}>
                          <label className="block text-sm text-gray-500">Option {num}</label>
                          <input
                            type="text"
                            name={`option${num}`}
                            className="w-full p-2 border border-gray-300 rounded text-sm"
                            placeholder={`Enter option ${num}`}
                            value={newQuestion.options[num - 1]}
                            onChange={handleQuestionInputChange}
                            required
                          />
                        </div>
                      ))}
                      <div>
                        <label className="block text-sm text-gray-500">Correct Answer</label>
                        <select
                          name="correctAnswer"
                          className="w-full p-2 border border-gray-300 rounded text-sm"
                          value={newQuestion.correctAnswer}
                          onChange={handleQuestionInputChange}
                          required
                        >
                          <option value="">Select correct answer</option>
                          {newQuestion.options
                            .filter((opt) => opt.trim())
                            .map((opt, index) => (
                              <option key={index} value={opt}>
                                {opt}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-500">Explanation (optional)</label>
                        <textarea
                          name="explanation"
                          className="w-full p-2 border border-gray-300 rounded text-sm"
                          placeholder="Enter explanation"
                          value={newQuestion.explanation}
                          onChange={handleQuestionInputChange}
                          rows="3"
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex space-x-4">
                      <button
                        type="submit"
                        className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-6 rounded"
                      >
                        {editingQuestion ? 'Update Question' : 'Add Question'}
                      </button>
                      <button
                        type="button"
                        className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-6 rounded"
                        onClick={handleClearQuestion}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Questions List */}
              {selectedExam && (
                <div className="mt-6 max-h-96 overflow-y-auto">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Added Questions</h3>
                  {selectedExam.questions.length > 0 ? (
                    <ul className="space-y-4">
                      {selectedExam.questions.map((question) => (
                        <li key={question.id} className="p-4 bg-white border border-gray-200 rounded">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{question.question}</p>
                              <ul className="mt-2 space-y-1">
                                {question.options.map((option, index) => (
                                  <li key={index} className="text-sm text-gray-600">
                                    {index + 1}. {option}
                                    {option === question.correctAnswer && (
                                      <span className="ml-2 text-green-600 font-medium">(Correct)</span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                              {question.explanation && (
                                <p className="mt-2 text-sm text-gray-500">
                                  <span className="font-medium">Explanation:</span> {question.explanation}
                                </p>
                              )}
                            </div>
                            <button
                              className="text-green-600 hover:bg-green-100 p-1 rounded"
                              onClick={() => handleEditQuestion(question)}
                              aria-label={`Edit question: ${question.question}`}
                            >
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No questions added yet.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminExam;