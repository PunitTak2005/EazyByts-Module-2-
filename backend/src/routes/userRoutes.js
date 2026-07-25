import express from 'express';
import { getProfile, updateProfile, changePassword, deleteAccount, getPreferences, updateThemePreference, uploadAvatar, removeAvatar, resetBalance } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { updateProfileValidator, passwordValidator } from '../validators/validators.js';
import { uploadAvatarMiddleware } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfileValidator, updateProfile);
router.post('/profile/avatar', protect, uploadAvatarMiddleware.single('avatar'), uploadAvatar);
router.delete('/profile/avatar', protect, removeAvatar);
router.patch('/password', protect, passwordValidator, changePassword);
router.delete('/account', protect, deleteAccount);

router.get('/preferences', protect, getPreferences);
router.put('/preferences/theme', protect, updateThemePreference);
router.post('/reset-balance', protect, resetBalance);

export default router;
