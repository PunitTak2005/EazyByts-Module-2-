import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import AvatarCropModal from '@/components/profile/AvatarCropModal';
import { getAvatarUrl } from '@/utils/avatarUtils';

// Helper to get initials
const getInitials = (user) => {
  if (!user) return 'U';
  const name = user.name || user.email?.split('@')[0] || 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name[0].toUpperCase();
};

const ProfileAvatarCard = ({ phone = '', bio = '', name: nameProp = '', language = '' }) => {
  const { user, uploadAvatar, removeAvatar } = useAuth();
  const fileInputRef = useRef(null);
  
  const [dragActive, setDragActive] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null); // original image data url for cropping
  const [isUploading, setIsUploading] = useState(false);

  // Validate and read file
  const handleFile = (file) => {
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload a JPG, PNG, or WEBP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image exceeds 5MB. Please choose a smaller file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result);
    };
    reader.readAsDataURL(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handlePaste = useCallback((e) => {
    if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
      handleFile(e.clipboardData.files[0]);
    }
  }, []);

  React.useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  const handleUpload = async (croppedFile) => {
    setSelectedImage(null);
    setIsUploading(true);
    
    try {
      await uploadAvatar(croppedFile);
      toast.success('Profile picture updated successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to upload avatar.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!window.confirm('Are you sure you want to remove your profile picture?')) return;
    setIsUploading(true);
    try {
      await removeAvatar();
      toast.success('Profile picture removed.');
    } catch (error) {
      toast.error(error.message || 'Failed to remove avatar.');
    } finally {
      setIsUploading(false);
    }
  };

  const avatarUrl = getAvatarUrl(user?.avatar);

  // --- Profile Completion ---
  const completionCriteria = [
    { label: 'Full name',        met: !!(nameProp || user?.name) },
    { label: 'Email address',    met: !!user?.email },
    { label: 'Profile picture',  met: !!avatarUrl },
    { label: 'Phone number',     met: phone.replace(/\D/g, '').length === 10 },
    { label: 'Bio / about me',   met: bio.trim().length > 0 },
    { label: 'Language set',     met: !!(language && language !== '') },
  ];
  const completionPct = Math.round(
    (completionCriteria.filter(c => c.met).length / completionCriteria.length) * 100
  );
  const missing = completionCriteria.filter(c => !c.met).map(c => c.label);
  const barColor =
    completionPct === 100 ? 'bg-emerald-500' :
    completionPct >= 66   ? 'bg-blue-500'    :
    completionPct >= 33   ? 'bg-amber-500'   : 'bg-rose-500';
  const textColor =
    completionPct === 100 ? 'text-emerald-600 dark:text-emerald-400' :
    completionPct >= 66   ? 'text-blue-600 dark:text-blue-400'       :
    completionPct >= 33   ? 'text-amber-600 dark:text-amber-400'     : 'text-rose-500';

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 dark:border-dark-border dark:bg-dark-card shadow-sm flex flex-col items-center">
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg, image/jpg, image/png, image/webp"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />

      {/* Avatar Container with Drag and Drop */}
      <div 
        className={`relative group cursor-pointer p-2 rounded-full transition-all ${
          dragActive ? 'bg-blue-50 dark:bg-blue-900/20 scale-105' : 'hover:scale-105'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <div className={`h-36 w-36 sm:h-44 sm:w-44 rounded-full border-[4px] border-white dark:border-dark-card shadow-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center transition-opacity ${isUploading ? 'opacity-50' : ''}`}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            <span className="text-5xl font-black text-slate-400 dark:text-slate-500">
              {getInitials(user)}
            </span>
          )}
        </div>

        {/* Hover overlay (Edit) */}
        {!isUploading && (
          <div className="absolute inset-2 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="h-8 w-8 text-white" />
          </div>
        )}

        {/* Loading Spinner */}
        {isUploading && (
          <div className="absolute inset-2 rounded-full flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
          </div>
        )}
        
        {/* Offline Status indicator badge (Optional) */}
        <div className="absolute bottom-4 right-4 h-5 w-5 bg-emerald-500 border-4 border-white dark:border-dark-card rounded-full" title="Online"></div>
      </div>

      {/* User Info & Actions */}
      <div className="mt-6 text-center w-full">
        <h3 className="text-xl font-bold text-slate-800 dark:text-white truncate px-2">{user?.name || 'User'}</h3>
        <p className="text-sm text-slate-400 dark:text-slate-500 truncate px-2">{user?.email}</p>
        
        {/* Profile Completion */}
        <div className="mt-4 px-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-500 dark:text-slate-400 font-semibold">Profile Completion</span>
            <span className={`font-bold ${textColor}`}>{completionPct}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
              style={{ width: `${completionPct}%` }}
            />
          </div>
          {/* Missing items hint */}
          {missing.length > 0 && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
              Complete: {missing.join(', ')}
            </p>
          )}
          {completionPct === 100 && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1.5 font-semibold">🎉 Profile complete!</p>
          )}
        </div>

        <div className="mt-8 flex flex-col gap-3 w-full px-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full flex justify-center items-center gap-2 rounded-xl bg-slate-100 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 dark:bg-dark-bg dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
          >
            <Camera className="h-3.5 w-3.5" />
            Change Picture
          </button>
          
          {avatarUrl && (
            <button
              onClick={handleRemove}
              disabled={isUploading}
              className="w-full flex justify-center items-center gap-2 rounded-xl py-2 text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove Picture
            </button>
          )}
        </div>
      </div>

      {/* Crop Modal */}
      <AnimatePresence>
        {selectedImage && (
          <AvatarCropModal
            imageSrc={selectedImage}
            onCancel={() => setSelectedImage(null)}
            onComplete={handleUpload}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileAvatarCard;
