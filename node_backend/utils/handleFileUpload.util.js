import uploadToCloudinary from '../services/cloudinary.service.js';

const handleMultipleUploads = async (req) => {
    try {
        const fileMetaMap = {};
        
        if (!req.files) {
            return fileMetaMap;
        }
        
        for (const [fieldName, files] of Object.entries(req.files)) {
            fileMetaMap[fieldName] = [];
            
            const fileArray = Array.isArray(files) ? files : [files];
            
            for (const file of fileArray) {
                try {
                    console.log(`Processing ${file.originalname} with MIME type: ${file.mimetype}`);
                    
                    // FIXED: Pass the file object as second parameter
                    const result = await uploadToCloudinary(file.path, file);
                    
                    fileMetaMap[fieldName].push({
                        publicId: result.public_id,
                        fileType: result.resource_type, // This will now be 'image' for images
                        originalName: file.originalname,
                        fieldName: fieldName,
                        url: result.secure_url
                    });
                    
                } catch (uploadError) {
                    console.error(`Error uploading ${fieldName}:`, uploadError);
                    throw uploadError;
                }
            }
        }
        
        return fileMetaMap;
        
    } catch (error) {
        console.error('Error in handleMultipleUploads:', error);
        throw error;
    }
};

export default handleMultipleUploads;