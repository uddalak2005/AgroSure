import uploadToCloudinary from '../services/cloudinary.service.js';
import fs from 'fs';

async function handleMultipleUploads(req, resourceType = 'raw') {
    if (!req.files || Object.keys(req.files).length === 0) return [];

    const uploadedFiles = {};

    for (const fieldName in req.files) {
        uploadedFiles[fieldName] = [];

        for (const file of req.files[fieldName]) {
            const filePath = file.path;

            try {
                const type = resourceType || (file.mimetype.startsWith('image/') ? 'image' : 'raw');
                const result = await uploadToCloudinary(filePath, type);

                fs.unlinkSync(filePath);

                const savedUpload = {
                    publicId: result.public_id,
                    fileType: type,
                    originalName: file.originalname,
                    fieldName: file.fieldname,
                };

                uploadedFiles[fieldName].push(savedUpload);

            } catch (err) {
                fs.unlinkSync(filePath);
                console.error(`Failed to upload ${file.originalname}: ${err.message}`);
            }
        }
    }

    console.log('UPLOADED FILES META:', uploadedFiles);
    return uploadedFiles;
}

export default handleMultipleUploads;