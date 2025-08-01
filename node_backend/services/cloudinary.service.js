import { v2 as cloudinary } from 'cloudinary'
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
    cloud_name : process.env.CLOUDINARY_CLOUD_NAME,
    api_key : process.env.CLOUDINARY_API_KEY,
    api_secret : process.env.CLOUDINARY_API_SECRET,
});

// Function to determine resource type based on file
const getResourceType = (file) => {
    // Image MIME types
    const imageMimeTypes = [
        'image/png',
        'image/jpeg', 
        'image/jpg',
        'image/JPG',
        'image/gif',
        'image/bmp',
        'image/webp',
        'image/svg+xml',
        'image/x-png'
    ];
    
    // Check by MIME type first
    if (file.mimetype && imageMimeTypes.includes(file.mimetype)) {
        return 'image';
    }
    
    // Check by file extension as backup
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
    const fileName = file.originalname || file.name || '';
    const fileExtension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    
    if (imageExtensions.includes(fileExtension)) {
        return 'image';
    }
    
    // Default to raw for documents
    return 'raw';
};

const uploadToCloudinary = async(localFilePath, file = null, resourceType = null) => {
    // Auto-determine resource type if not provided
    const finalResourceType = resourceType || (file ? getResourceType(file) : 'raw');
    
    const uploadOptions = {
        type: 'authenticated',
        folder: 'agriSure',
        resource_type: finalResourceType,
        image_metadata: true
    };
    
    // Add image-specific optimizations for image types
    if (finalResourceType === 'image') {
        uploadOptions.quality = 'auto';
        uploadOptions.fetch_format = 'auto';
        uploadOptions.flags = 'progressive';
    }
    
    console.log(`Uploading ${file?.originalname || 'file'} as ${finalResourceType} type`);
    
    return await cloudinary.uploader.upload(localFilePath, uploadOptions);
};

export default uploadToCloudinary;