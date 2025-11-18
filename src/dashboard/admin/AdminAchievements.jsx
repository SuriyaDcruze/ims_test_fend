import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import QRCode from "qrcode";
import { Download, Eye } from "lucide-react";

import {
  CreateCourseAchievement,
  GetAllCourseAchievements,
  UpdateCourseAchievement,
  DeleteCourseAchievement,
  GetAllUsers,
  GetAllCourses,
} from '../../service/api';

const AdminCourseAchievements = () => {
  const [achievements, setAchievements] = useState([]);
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formMode, setFormMode] = useState('create');
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const canvasRef = useRef(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const [achievementsData, usersData, coursesData] = await Promise.all([
          GetAllCourseAchievements(),
          GetAllUsers(),
          GetAllCourses(),
        ]);
        setAchievements(achievementsData);
        setUsers(usersData);
        setCourses(coursesData);
      } catch (err) {
        setError(err.message || 'Failed to fetch data.');
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
   
    fetchInitialData();
  }, []);

  

  // useEffect(() => {
  //   if (previewData && canvasRef.current) {
  //     const canvas = canvasRef.current;
  //     const ctx = canvas.getContext('2d');
  //     ctx.clearRect(0, 0, canvas.width, canvas.height);
  //     ctx.fillStyle = '#fef3c7';
  //     ctx.fillRect(0, 0, canvas.width, canvas.height);
  //     ctx.fillStyle = '#1f2937';
  //     ctx.font = '20px Arial';
  //     ctx.textAlign = 'center';
  //     ctx.fillText('Certificate of Completion', canvas.width / 2, 60);
  //     ctx.font = '16px Arial';
  //     ctx.fillText(`Awarded to ${previewData.username}`, canvas.width / 2, 100);
  //     ctx.fillText(`for completing ${previewData.courseTitle}`, canvas.width / 2, 130);
  //     ctx.fillText(`Mentor: ${previewData.mentorName}`, canvas.width / 2, 170);
  //     ctx.fillText(`Authorized by: ${previewData.authorityName}`, canvas.width / 2, 200);
  //   }
  // }, [previewData]);
  
  
useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const templateImage = new Image();
    templateImage.src = "/assets/LMS Certificate.png"; // Make sure image is in public/assets
    // templateImage.src = "/Template_certificat.png"; // Make sure image is in public/assets
    // templateImage.src = "../../assets/Template_certificate.jpg"; // Make sure image is in public/assets

    // QR code content
    const qrContent = `
    Certificate ID: ${previewData.certificateId}
    Name: ${previewData.username}
    Course: ${previewData.courseTitle}
    Date: ${new Date(previewData.completedAt).toLocaleDateString()}
    Mentor: ${previewData.mentorName || "-"}
    Authority: ${previewData.authorityName || "-"}
    `.trim();

    const certificateDate = new Date(previewData.completedAt).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    templateImage.onload = async () => {
      canvas.width = templateImage.width;
      canvas.height = templateImage.height;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(templateImage, 0, 0);

      ctx.fillStyle = "#333";
      ctx.textAlign = "center";

      ctx.font = "bold 28px Poppins, sans-serif";
      // ctx.fillText(courseTitle, canvas.width / 2, 230);

      ctx.fillStyle = "#a37531";
      ctx.font = "bold 120px Allura, cursive";
      ctx.fillText(previewData.username, canvas.width / 2, 680);

      ctx.fillStyle = "#000";
      ctx.font = "bold 40px Poppins, sans-serif";
      ctx.fillText(
        `For Participation in ${previewData.courseTitle},  `,
        canvas.width / 2,
        780
      );

      ctx.font = "bold 40px Poppins, sans-serif";
      ctx.fillText(`on ${certificateDate}`, canvas.width / 2, 840);

      ctx.font = "Medium 40px Poppins, sans-serif";
      ctx.fillText(
        // previewData.mentorName || "-",
        "Cahaya Dewi",
        canvas.width / 2 - 550,
        canvas.height - 280
      );
      ctx.fillText(
        // previewData.authorityName || "-",
        "R K Prasad",
        canvas.width / 2 + 550,
        canvas.height - 280
      );
      ctx.fillStyle = "#fff";
      ctx.font = "16px Poppins, sans-serif";
      ctx.fillText(
        `Certificate Id: ${previewData.certificateId}`,
        canvas.width / 2 + 650,
        canvas.height - 40
      );

      try {
        const qrDataURL = await QRCode.toDataURL(qrContent);
        const qrImage = new Image();
        qrImage.src = qrDataURL;

        qrImage.onload = () => {
          const qrSize = 100;
          ctx.drawImage(
            qrImage,
            canvas.width - qrSize - 40,
            canvas.height - qrSize - 40,
            qrSize,
            qrSize
          );
          // setTemplateLoaded();
        };
      } catch (err) {
        console.error("QR code generation failed:", err);
        // setTemplateLoaded(true);
      }
    };

    templateImage.onerror = () => {
      console.error("Failed to load certificate template.");
      setTemplateLoaded(false);
    };
  }, [previewData]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      if (formMode === 'edit' && editingId) {
        await UpdateCourseAchievement(editingId, {
          userId: data.userId,
          courseId: data.courseId,
          mentorName: data.mentorName,
          authorityName: data.authorityName,
        });
      } else {
        await CreateCourseAchievement({
          userId: data.userId,
          courseId: data.courseId,
          mentorName: data.mentorName,
          authorityName: data.authorityName,
        });
      }
      reset();
      setFormMode('create');
      setEditingId(null);
      setShowForm(false);
      const updated = await GetAllCourseAchievements();
      setAchievements(updated);
    } catch (err) {
      setError(err.message || 'Submission failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const startEdit = (achievement) => {
    reset({
      userId: achievement.user,
      courseId: achievement.courseId,
      mentorName: achievement.mentorName,
      authorityName: achievement.authorityName,
    });
    setFormMode('edit');
    setEditingId(achievement._id);
    setShowForm(true);
  };

  const deleteCertificate = async(a)=> {
    const res = await DeleteCourseAchievement(a._id)
    fetchInitialData()
    console.log(res.data);
    
  }
  
  const cancelForm = () => {
    reset();
    setFormMode('create');
    setEditingId(null);
    setError(null);
    setShowForm(false);
  };

  const showPreview = (achievement) => {
    setPreviewData(achievement);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Course Certificate Management</h2>
      {error && <div className="text-red-500 mb-4">{error}</div>}

      <button
        onClick={() => setShowForm(!showForm)}
        className="mb-6 bg-blue-600 text-white px-4 py-2 rounded"
      >
        {showForm ? 'Hide Form' : 'Create Achievement'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mb-8 bg-gray-50 p-4 rounded-lg shadow">
          <div>
            <label className="block mb-1">User</label>
            <select {...register('userId', { required: true })} className="w-full border px-3 py-2 rounded">
              <option value="">Select user</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>{u.username}</option>
              ))}
            </select>
            {errors.userId && <p className="text-red-500 text-sm">User is required</p>}
          </div>

          <div>
            <label className="block mb-1">Course</label>
            <select {...register('courseId', { required: true })} className="w-full border px-3 py-2 rounded">
              <option value="">Select course</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>{c.title}</option>
              ))}
            </select>
            {errors.courseId && <p className="text-red-500 text-sm">Course is required</p>}
          </div>

          <div>
            <label className="block mb-1">Mentor Name</label>
            <input type="text" {...register('mentorName', { required: true })} className="w-full border px-3 py-2 rounded" />
            {errors.mentorName && <p className="text-red-500 text-sm">Mentor name is required</p>}
          </div>

          <div>
            <label className="block mb-1">Authority Name</label>
            <input type="text" {...register('authorityName', { required: true })} className="w-full border px-3 py-2 rounded" />
            {errors.authorityName && <p className="text-red-500 text-sm">Authority name is required</p>}
          </div>

          <div className="flex space-x-3">
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">
              {formMode === 'edit' ? 'Update' : 'Create'} Achievement
            </button>
            <button type="button" onClick={cancelForm} className="bg-gray-300 px-4 py-2 rounded">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Existing Achievements</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((a) => (
            <div
              key={a._id}
              className="bg-white p-4 shadow-md rounded-xl flex flex-col justify-between"
            >
              <div>
                <h4 className="text-lg font-semibold">{a.courseTitle}</h4>
                <p className="text-sm text-gray-700">User: {a.username}</p>
                <p className="text-sm text-gray-500">Mentor: {a.mentorName}</p>
                <p className="text-sm text-gray-500">Authority: {a.authorityName}</p>
              </div>
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => startEdit(a)}
                  className="text-blue-600 hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => showPreview(a)}
                  className="text-green-600 hover:underline"
                >
                  Preview
                </button>
                 <button
                  onClick={() =>deleteCertificate(a)}
                  className="text-red-600 hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

     {previewData && (
  <div className="fixed inset-0 bg-black/40 bg-opacity-60 z-50 flex items-center justify-center transition-opacity duration-300">
    <div className="relative bg-white rounded-2xl shadow-2xl w-[90%] max-w-3xl p-6 animate-fadeIn">
      <button
        onClick={() => setPreviewData(null)}
        className="absolute top-3 right-3 text-gray-500 hover:text-red-500 text-xl"
        aria-label="Close"
      >
        &times;
      </button>
      <h3 className="text-2xl font-semibold text-center mb-4 text-gray-800">
        🎓 Certificate Preview
      </h3>
      <div className="flex justify-center">
        <canvas
        ref={canvasRef}
        className="shadow-lg border rounded w-full max-w-[500px] mx-auto relative overflow-hidden max-h-[300px] "
      />
      </div>
      <div className="mt-6 flex justify-center">
        <button
          onClick={() => {
            const canvas = canvasRef.current;
            const link = document.createElement('a');
            link.download = 'certificate.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
          }}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition"
        >
          Download as PNG
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
};

export default AdminCourseAchievements;
