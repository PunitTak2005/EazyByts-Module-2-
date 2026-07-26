import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import { uploadAvatarToCloudinary } from '../services/cloudinaryService.js';
import { isCloudinaryConfigured } from '../config/cloudinary.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const migrateAvatars = async () => {
  console.log('--- Starting Avatar Cloudinary Migration ---');
  
  if (!isCloudinaryConfigured()) {
    console.warn('[Migration Warning] Cloudinary credentials not configured in environment. Legacy /uploads/ paths will be reset to empty string.');
  }

  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/stock_simulator';
  
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(mongoUri);
      console.log('[Migration Log] Connected to MongoDB');
    }

    // Find users with legacy local upload paths
    const usersWithLocalAvatars = await User.find({
      $or: [
        { avatar: { $regex: '^\/uploads\/' } },
        { avatar: { $regex: '^uploads\/' } },
        { profileImage: { $regex: '^\/uploads\/' } },
        { profileImage: { $regex: '^uploads\/' } }
      ]
    });

    console.log(`[Migration Log] Found ${usersWithLocalAvatars.length} users with legacy local avatar paths.`);

    let migratedCount = 0;
    let resetCount = 0;

    for (const user of usersWithLocalAvatars) {
      const rawPath = user.avatar || user.profileImage || '';
      const cleanPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
      const localFilePath = path.join(__dirname, '..', '..', 'public', cleanPath);

      console.log(`[Migration Processing] User ${user._id} (${user.email}) -> Legacy Path: ${rawPath}`);

      if (fs.existsSync(localFilePath) && isCloudinaryConfigured()) {
        try {
          const fileBuffer = fs.readFileSync(localFilePath);
          const ext = path.extname(localFilePath).toLowerCase().replace('.', '') || 'png';
          const mimeType = ext === 'webp' ? 'image/webp' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
          
          const { url: cloudinaryUrl } = await uploadAvatarToCloudinary(fileBuffer, mimeType);
          user.avatar = cloudinaryUrl;
          await user.save();
          migratedCount++;
          console.log(`[Migration Success] User ${user._id} migrated to Cloudinary: ${cloudinaryUrl}`);
        } catch (err) {
          console.error(`[Migration Error] Failed uploading file for user ${user._id}:`, err.message);
          user.avatar = '';
          await user.save();
          resetCount++;
        }
      } else {
        console.warn(`[Migration Reset] Local file missing at ${localFilePath} or Cloudinary unconfigured. Resetting avatar.`);
        user.avatar = '';
        await user.save();
        resetCount++;
      }
    }

    console.log(`--- Migration Finished ---`);
    console.log(`Total Processed: ${usersWithLocalAvatars.length}`);
    console.log(`Successfully Uploaded to Cloudinary: ${migratedCount}`);
    console.log(`Reset to Default Avatar: ${resetCount}`);
  } catch (err) {
    console.error('[Migration Fatal Error]', err);
  } finally {
    if (process.argv[1] === fileURLToPath(import.meta.url)) {
      await mongoose.disconnect();
      console.log('[Migration Log] Disconnected from MongoDB');
      process.exit(0);
    }
  }
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  migrateAvatars();
}
