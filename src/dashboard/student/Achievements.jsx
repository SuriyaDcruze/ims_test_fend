import React, { useEffect, useRef, useState } from "react";
import { GetCourseAchievementsByUserId } from "../../service/api";
import QRCode from "qrcode";
import { Download, Eye } from "lucide-react";

const CertificateRenderer = ({ achievement }) => {
  const canvasRef = useRef(null);
  const [templateLoaded, setTemplateLoaded] = useState(false);

  const {
    courseTitle,
    username,
    certificateId,
    completedAt,
    mentorName,
    authorityName,
  } = achievement;

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
    Certificate ID: ${certificateId}
    Name: ${username}
    Course: ${courseTitle}
    Date: ${new Date(completedAt).toLocaleDateString()}
    Mentor: ${mentorName || "-"}
    Authority: ${authorityName || "-"}
    `.trim();

    const certificateDate = new Date(completedAt).toLocaleDateString("en-GB", {
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
      ctx.fillText(username, canvas.width / 2, 680);

      ctx.fillStyle = "#000";
      ctx.font = "bold 40px Poppins, sans-serif";
      ctx.fillText(
        `For Participation in ${courseTitle},  `,
        canvas.width / 2,
        780
      );

      ctx.font = "bold 40px Poppins, sans-serif";
      ctx.fillText(`on ${certificateDate}`, canvas.width / 2, 840);

      ctx.font = "Medium 40px Poppins, sans-serif";
      ctx.fillText(
        mentorName || "-",
        // "Cahaya Dewi",
        canvas.width / 2 - 550,
        canvas.height - 280
      );
      ctx.fillText(
        authorityName || "-",
        // "R K Prasad",
        canvas.width / 2 + 550,
        canvas.height - 280
      );
      ctx.fillStyle = "#fff";
      ctx.font = "16px Poppins, sans-serif";
      ctx.fillText(
        `Certificate Id: ${certificateId}`,
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
          setTemplateLoaded(true);
        };
      } catch (err) {
        console.error("QR code generation failed:", err);
        setTemplateLoaded(true);
      }
    };

    templateImage.onerror = () => {
      console.error("Failed to load certificate template.");
      setTemplateLoaded(false);
    };
  }, [achievement]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `${courseTitle.replace(/\s+/g, "_")}_certificate.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="my-8 relative overflow-hidden group">
      <canvas
        ref={canvasRef}
        className="shadow-lg border rounded w-full max-w-4xl mx-auto relative overflow-hidden"
      />
      <div className="bg-neutral-600/0  absolute inset-0 group-hover:backdrop-blur-xs"></div>
      <div className="absolute top-4 right-4 gap-4 hidden group-hover:flex cursor-pointer">
        {/* <div className="  bg-neutral-50 text-neutral-700 p-2 rounded-md">
          <Eye />
        </div> */}
        <div
          className=" bg-green-600 text-green-100 p-2 rounded-md"
          onClick={handleDownload}
        >
          <Download />
        </div>
      </div>
      {/* {templateLoaded && (
        <div className="mt-4 text-center top-0 left-0">
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            Download Certificate
          </button>
        </div>
      )} */}
    </div>
  );
};

export default function Achievements() {
  const [authToken, setAuthToken] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const loginData = JSON.parse(localStorage.getItem("loginData"));
      setAuthToken(loginData?.token || null);
      setCurrentUserId(loginData?.user?._id || null);
    } catch {
      setAuthToken(null);
      setCurrentUserId(null);
    }
  }, []);

  useEffect(() => {
    const fetchAchievements = async () => {
      if (!currentUserId || !authToken) {
        setError("Please log in to view achievements");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await GetCourseAchievementsByUserId(
          currentUserId,
          authToken
        );
        const validAchievements = Array.isArray(data)
          ? data.filter((a) => a && a._id && a.courseTitle)
          : [];
        setAchievements(validAchievements);
      } catch (err) {
        if (err.response?.status === 401) {
          setError("Session expired. Please log in again.");
        } else {
          setError(err.message || "Failed to load course achievements");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchAchievements();
  }, [currentUserId, authToken]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 font-poppins">
        Course Certificates
      </h1>

      {isLoading && <p className="text-gray-500">Loading...</p>}

      {error && <div className="text-red-600 mb-4">{error}</div>}

      {!isLoading && !error && achievements.length === 0 && (
        <p className="text-center text-gray-500">No course certificates yet.</p>
      )}

      <div className="grid grid-cols-4 gap-10">
        {!isLoading &&
          achievements.map((achievement) => (
            <CertificateRenderer
              key={achievement._id}
              achievement={achievement}
            />
          ))}
      </div>
    </div>
  );
}
