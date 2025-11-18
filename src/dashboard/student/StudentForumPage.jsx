"use client";

import { useEffect, useState, useMemo, createContext, useContext } from "react";
import {
  Search,
  MessageSquare,
  Send,
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
  Heart,
  ImagePlus,
  X,
} from "lucide-react";
import {
  GetAllForumPosts,
  AddForumReply,
  UpdateForumPost,
  DeleteForumPost,
  LikeForumPost,
  UpdateForumReply,
  DeleteForumReply,
  CreateForumPost,
  UploadFile,
} from "../../service/api";

// Auth Context
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUserFromLocalStorage = () => {
      try {
        const loginData = localStorage.getItem('loginData');
        if (loginData) {
          const parsedData = JSON.parse(loginData);
          setCurrentUser(parsedData.user || {
            _id: 'guest',
            username: 'guest',
            role: 'guest',
            isApproved: false
          });
        } else {
          setCurrentUser({
            _id: 'guest',
            username: 'guest',
            role: 'guest',
            isApproved: false
          });
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
        setCurrentUser({
          _id: 'guest',
          username: 'guest',
          role: 'guest',
          isApproved: false
        });
      } finally {
        setLoading(false);
      }
    };

    getUserFromLocalStorage();
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// NewForumPostForm component
const NewForumPostForm = ({ onSubmit, onCancel, onRefresh }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Only image files are allowed");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      const res = await UploadFile(formData);
      setImageUrl(res.data.fileUrl);
      setPreviewUrl(res.data.fileUrl);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to upload image");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !description.trim()) return;

    const payload = {
      title,
      content: description,
      files: imageUrl ? [imageUrl] : [],
      approved: false,
    };

    try {
      setLoading(true);
      const newPost = await CreateForumPost(payload);
      setError(null);
      setTitle("");
      setDescription("");
      setImageUrl(null);
      setPreviewUrl(null);
      if (onSubmit) {
        onSubmit(newPost);
      }
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err) {
      setError(err.message || "Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setTitle("");
    setDescription("");
    setImageUrl(null);
    setPreviewUrl(null);
    setError(null);
    if (onCancel) {
      onCancel();
    }
  };

  const removeImage = () => {
    setImageUrl(null);
    setPreviewUrl(null);
  };

  return (
    <div className="border border-gray-200 rounded-lg shadow-sm bg-white">
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <h2 className="text-lg font-semibold">Create a new post</h2>
        {error && (
          <div className="p-2 bg-red-100 text-red-600 text-sm">{error}</div>
        )}
        <div className="space-y-2">
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700"
          >
            Title
          </label>
          <input
            id="title"
            type="text"
            placeholder="What's your question or topic?"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700"
          >
            Description
          </label>
          <textarea
            id="description"
            placeholder="Provide details about your question or topic..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md min-h-[8rem] focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Image (optional)
          </label>
          {previewUrl ? (
            <div className="relative w-full h-48 rounded-md overflow-hidden border">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={removeImage}
                disabled={loading}
                className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="image-upload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <ImagePlus className="w-8 h-8 mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500">
                    Click to upload an image
                  </p>
                </div>
                <input
                  id="image-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={loading}
                />
              </label>
            </div>
          )}
        </div>
        <div className="flex justify-between pt-2">
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !title.trim() || !description.trim()}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Posting..." : "Post"}
          </button>
        </div>
      </form>
    </div>
  );
};

// ForumPostCard component
const ForumPostCard = ({ post, onUpdate, onDelete, onRefresh }) => {
  const { currentUser } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedPost, setEditedPost] = useState({
    title: post.title,
    content: post.content,
    tags: post.tags?.join(", ") || "",
  });
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editedReplyContent, setEditedReplyContent] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const safeUser = currentUser || {
    _id: 'guest',
    username: 'guest',
    role: 'guest',
    isApproved: false
  };

  const canEditOrDelete = safeUser._id === post.user?._id && safeUser.isApproved;

  const handleLike = async () => {
    if (safeUser.role === 'guest') {
      setError("Please login to like posts");
      return;
    }

    try {
      const updatedPost = {
        ...post,
        likes: post.likes?.includes(safeUser._id)
          ? post.likes.filter((id) => id !== safeUser._id)
          : [...(post.likes || []), safeUser._id],
      };
      onUpdate(updatedPost);
      await LikeForumPost(post._id);
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err) {
      setError(err.message || "Failed to like post");
      onUpdate(post);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      await AddForumReply(post._id, { message: newComment, files: [] });
      setNewComment("");
      setShowComments(true);
      setSuccess("Reply added successfully");
      setTimeout(() => setSuccess(null), 2000);
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err) {
      setError(err.message || "Failed to add reply");
    }
  };

  const handleEdit = async () => {
    if (isEditing) {
      try {
        const tagsArray = editedPost.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean);
        const updatedPost = await UpdateForumPost(post._id, {
          title: editedPost.title,
          content: editedPost.content,
          files: post.files,
          tags: tagsArray,
          postType: post.postType,
          visibility: post.visibility,
          pinned: post.pinned,
          approved: post.approved,
        });
        setIsEditing(false);
        setSuccess("Post updated successfully");
        setTimeout(() => setSuccess(null), 2000);
        onUpdate(updatedPost);
        if (onRefresh) {
          await onRefresh();
        }
      } catch (err) {
        setError(err.message || "Failed to update post");
      }
    } else {
      setIsEditing(true);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        await DeleteForumPost(post._id);
        onDelete(post._id);
        setSuccess("Post deleted successfully");
        setTimeout(() => setSuccess(null), 2000);
        if (onRefresh) {
          await onRefresh();
        }
      } catch (err) {
        setError(err.message || "Failed to delete post");
      }
    }
  };

  const handleEditReply = async (replyId, currentMessage) => {
    if (editingReplyId === replyId) {
      try {
        await UpdateForumReply(post._id, replyId, {
          message: editedReplyContent,
          files: [],
        });
        setEditingReplyId(null);
        setEditedReplyContent("");
        setSuccess("Reply updated successfully");
        setTimeout(() => setSuccess(null), 2000);
        if (onRefresh) {
          await onRefresh();
        }
      } catch (err) {
        setError(err.message || "Failed to update reply");
      }
    } else {
      setEditingReplyId(replyId);
      setEditedReplyContent(currentMessage);
    }
  };

  const handleCancelEditReply = () => {
    setEditingReplyId(null);
    setEditedReplyContent("");
  };

  const handleDeleteReply = async (replyId) => {
    if (window.confirm("Are you sure you want to delete this reply?")) {
      try {
        await DeleteForumReply(post._id, replyId);
        setSuccess("Reply deleted successfully");
        setTimeout(() => setSuccess(null), 2000);
        if (onRefresh) {
          await onRefresh();
        }
      } catch (err) {
        setError(err.message || "Failed to delete reply");
      }
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 flex items-start gap-4">
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={handleLike}
            className={`p-1 rounded-full hover:bg-gray-100 ${
              post.likes?.includes(safeUser._id) ? "text-red-500" : "text-gray-600"
            }`}
          >
            <Heart className="h-5 w-5" />
          </button>
          <span className="font-medium text-sm">{post.likes?.length || 0}</span>
        </div>
        <div className="flex-1">
          <div className="text-sm text-gray-500 flex items-center gap-2 mb-1 font-poppins">
            <span>Posted by u/{post.user?.username || 'unknown'}</span>•
            <span>{new Date(post.createdAt).toLocaleString()}</span>
          </div>
          <h3 className="text-lg font-semibold font-poppins">{post.title}</h3>
          <div className="flex gap-2 mt-1">
            {post.tags?.map((tag) => (
              <span key={tag} className="text-xs bg-gray-200 px-2 py-1 rounded">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="p-4 pt-0 ml-12">
        {isEditing ? (
          <div className="space-y-4">
            <input
              type="text"
              value={editedPost.title}
              onChange={(e) => setEditedPost({ ...editedPost, title: e.target.value })}
              placeholder="Post title"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none font-poppins"
            />
            <textarea
              value={editedPost.content}
              onChange={(e) => setEditedPost({ ...editedPost, content: e.target.value })}
              placeholder="Post content"
              className="w-full min-h-[100px] p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
            <input
              type="text"
              value={editedPost.tags}
              onChange={(e) => setEditedPost({ ...editedPost, tags: e.target.value })}
              placeholder="Tags (comma-separated)"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
          </div>
        ) : (
          <p className="mb-4 text-gray-800">{post.content}</p>
        )}
        {post.files?.length > 0 && (
          <div className="relative w-full h-64 mb-4 rounded-md overflow-hidden">
            <img
              src={post.files[0] || "/placeholder.svg"}
              alt={post.title}
              className="object-cover w-full h-full"
            />
          </div>
        )}
      </div>
      <div className="p-4 pt-0 ml-12 text-sm">
        {error && <p className="text-red-600 mb-2">{error}</p>}
        {success && <p className="text-green-600 mb-2">{success}</p>}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1 text-gray-600 hover:text-gray-800 font-poppins"
          >
            <MessageSquare className="h-4 w-4" />
            <span>{post.replies?.length || 0} Comments</span>
            {showComments ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {canEditOrDelete && (
            <>
              <button
                onClick={handleEdit}
                className="flex items-center gap-1 text-gray-600 hover:text-gray-800"
              >
                <Edit className="h-4 w-4" />
                <span>{isEditing ? "Save" : "Edit"}</span>
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-1 text-gray-600 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>
            </>
          )}
        </div>
        {showComments && (
          <div className="mt-4 space-y-4">
            {safeUser.role !== 'guest' && (
              <div className="flex gap-2 items-start">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-xs font-semibold text-white">
                  {safeUser.username?.slice(0, 2).toUpperCase() || "GU"}
                </div>
                <div className="flex-1 flex gap-2">
                  <textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full min-h-[2.5rem] p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className="p-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
            <div className="space-y-3 pl-10">
              {post.replies?.map((reply) => (
                <div key={reply._id} className="text-sm">
                  <div className="flex items-center gap-2 text-gray-500">
                    <span>u/{reply.user?.username || "Unknown"}</span>•
                    <span>{new Date(reply.createdAt).toLocaleString()}</span>
                    {safeUser._id === reply.user?._id && (
                      <div className="flex gap-2 ml-2">
                        <button
                          onClick={() => handleEditReply(reply._id, reply.message)}
                          className="flex items-center gap-1 text-gray-600 hover:text-gray-800"
                        >
                          <Edit className="h-4 w-4" />
                          <span>{editingReplyId === reply._id ? "Save" : "Edit"}</span>
                        </button>
                        {editingReplyId === reply._id && (
                          <button
                            onClick={handleCancelEditReply}
                            className="flex items-center gap-1 text-gray-600 hover:text-gray-800"
                          >
                            <X className="h-4 w-4" />
                            <span>Cancel</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteReply(reply._id)}
                          className="flex items-center gap-1 text-gray-600 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                  {editingReplyId === reply._id ? (
                    <textarea
                      value={editedReplyContent}
                      onChange={(e) => setEditedReplyContent(e.target.value)}
                      className="w-full min-h-[2.5rem] p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none"
                    />
                  ) : (
                    <p>{reply.message}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// StudentForumPage component
const StudentForumPage = () => {
  const { currentUser, loading } = useAuth();
  const [posts, setPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const refreshPosts = async () => {
    try {
      const fetchedPosts = await GetAllForumPosts();
      setPosts(fetchedPosts.filter((post) => post.approved));
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to fetch posts");
    }
  };

  useEffect(() => {
    refreshPosts();
  }, []);

  const handlePostUpdate = (updatedPost) => {
    setPosts(posts.map((post) => (post._id === updatedPost._id ? updatedPost : post)));
  };

  const handlePostDelete = (postId) => {
    setPosts(posts.filter((post) => post._id !== postId));
  };

  const handlePostCreate = (newPost) => {
    setShowCreateForm(false);
    refreshPosts();
  };

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      return (
        post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    });
  }, [posts, searchQuery]);

  if (loading) {
    return (
      <div className="container mx-auto py-6 max-w-4xl px-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl px-4">
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold">Student Forum</h1>
          {currentUser?.firstName && (
            <p className="text-lg">Welcome, {currentUser.firstName}!</p>
          )}
          <div className="flex justify-between items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search posts or tags..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {currentUser?.isApproved && (
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                {showCreateForm ? "Hide Form" : "Create Post"}
              </button>
            )}
          </div>
        </header>

        {showCreateForm && (
          <NewForumPostForm
            onSubmit={handlePostCreate}
            onCancel={() => setShowCreateForm(false)}
            onRefresh={refreshPosts}
          />
        )}

        {error && <p className="text-red-600">{error}</p>}

        <div className="space-y-4">
          {filteredPosts.length === 0 ? (
            <p className="text-gray-500 text-center py-10">
              {searchQuery ? "No matching posts found" : "No posts available yet"}
            </p>
          ) : (
            filteredPosts.map((post) => (
              <ForumPostCard
                key={post._id}
                post={post}
                onUpdate={handlePostUpdate}
                onDelete={handlePostDelete}
                onRefresh={refreshPosts}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Wrap with AuthProvider
const ForumPageWithAuth = () => (
  <AuthProvider>
    <StudentForumPage />
  </AuthProvider>
);

export default ForumPageWithAuth;