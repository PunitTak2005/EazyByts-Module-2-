import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';

/**
 * Uploads an image buffer or file to Cloudinary in the 'avatars' folder.
 * Enforces transformation: 300x300 fill crop, face gravity.
 * 
 * @param {Buffer|string} fileInput - Image file buffer or path/base64 string
 * @param {string} mimeType - MIME type of the file (e.g. image/png)
 * @returns {Promise<{ url: string, publicId: string }>} - Upload result containing secure HTTPS URL
 */
export const uploadAvatarToCloudinary = async (fileInput, mimeType = 'image/png') => {
  if (!isCloudinaryConfigured()) {
    console.warn('[Cloudinary Service] Cloudinary credentials not configured. Storing Data URI as fallback.');
    if (Buffer.isBuffer(fileInput)) {
      const base64 = fileInput.toString('base64');
      const dataUrl = `data:${mimeType};base64,${base64}`;
      return { url: dataUrl, publicId: null };
    }
    if (typeof fileInput === 'string') {
      return { url: fileInput, publicId: null };
    }
    throw new Error('Cloudinary credentials missing and invalid file buffer provided');
  }

  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: 'avatars',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [
        {
          width: 300,
          height: 300,
          crop: 'fill',
          gravity: 'face',
        },
      ],
      resource_type: 'image',
    };

    if (Buffer.isBuffer(fileInput)) {
      const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
        if (error) {
          console.error('[Cloudinary Service Error] Buffer upload failed:', error.message);
          return reject(new Error(`Cloudinary upload failed: ${error.message}`));
        }
        console.log(`[Cloudinary Service Log] Upload success! URL: ${result.secure_url} | Public ID: ${result.public_id}`);
        return resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      });
      stream.end(fileInput);
    } else if (typeof fileInput === 'string') {
      cloudinary.uploader.upload(fileInput, uploadOptions, (error, result) => {
        if (error) {
          console.error('[Cloudinary Service Error] String upload failed:', error.message);
          return reject(new Error(`Cloudinary upload failed: ${error.message}`));
        }
        console.log(`[Cloudinary Service Log] Upload success! URL: ${result.secure_url} | Public ID: ${result.public_id}`);
        return resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      });
    } else {
      return reject(new Error('Unsupported file payload for Cloudinary upload'));
    }
  });
};

/**
 * Deletes an avatar asset from Cloudinary by public ID or URL.
 * 
 * @param {string} publicIdOrUrl - Cloudinary public ID or full URL
 */
export const deleteAvatarFromCloudinary = async (publicIdOrUrl) => {
  if (!publicIdOrUrl || !isCloudinaryConfigured()) return;

  try {
    let publicId = publicIdOrUrl;
    if (publicIdOrUrl.includes('cloudinary.com')) {
      const parts = publicIdOrUrl.split('/');
      const filenameWithExt = parts.pop();
      const folder = parts.pop();
      const filename = filenameWithExt.split('.')[0];
      publicId = `${folder}/${filename}`;
    }

    const result = await cloudinary.uploader.destroy(publicId);
    console.log(`[Cloudinary Service Log] Deleted publicId: ${publicId} | Result:`, result);
  } catch (err) {
    console.warn('[Cloudinary Service Warn] Cloudinary deletion failed (ignored):', err.message);
  }
};
