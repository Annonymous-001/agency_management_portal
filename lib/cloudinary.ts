import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export default cloudinary

export const uploadImage = async (file: Buffer, folder: string = 'avatars'): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' },
          { quality: 'auto' }
        ]
      },
      (error, result) => {
        if (error) {
          reject(error)
        } else {
          resolve(result?.secure_url || '')
        }
      }
    )

    uploadStream.end(file)
  })
}

export const uploadFile = async (
  file: Buffer, 
  folder: string = 'files',
  fileName?: string,
  resourceType: 'auto' | 'image' | 'video' | 'raw' = 'auto'
): Promise<{ secure_url: string; public_id: string; format: string; bytes: number }> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        public_id: fileName ? `${Date.now()}_${fileName.replace(/\.[^/.]+$/, "")}` : undefined,
        overwrite: false,
        use_filename: !fileName,
        unique_filename: true
      },
      (error, result) => {
        if (error) {
          reject(error)
        } else if (result) {
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
            format: result.format,
            bytes: result.bytes
          })
        } else {
          reject(new Error('Upload failed - no result returned'))
        }
      }
    )

    uploadStream.end(file)
  })
}

export const uploadProjectFile = async (
  file: Buffer,
  projectId: string,
  fileName?: string,
  resourceType: 'auto' | 'image' | 'video' | 'raw' = 'auto'
): Promise<{ secure_url: string; public_id: string; format: string; bytes: number }> => {
  const folder = `projects/${projectId}/files`
  return uploadFile(file, folder, fileName, resourceType)
}

export const uploadReceipt = async (
  file: Buffer,
  fileName?: string,
  resourceType: 'auto' | 'image' | 'video' | 'raw' = 'auto'
): Promise<{ success: boolean; url: string; public_id?: string; error?: string }> => {
  try {
    const folder = 'receipts'
    const result = await uploadFile(file, folder, fileName, resourceType)
    return {
      success: true,
      url: result.secure_url,
      public_id: result.public_id
    }
  } catch (error: any) {
    return {
      success: false,
      url: '',
      error: error.message || 'Upload failed'
    }
  }
}

export const deleteFile = async (publicId: string, resourceType: 'image' | 'video' | 'raw' = 'image'): Promise<void> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, { resource_type: resourceType }, (error, result) => {
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    })
  })
}

export const deleteImage = async (publicId: string): Promise<void> => {
  return deleteFile(publicId, 'image')
}

export const getFileInfo = async (publicId: string, resourceType: 'image' | 'video' | 'raw' = 'image') => {
  return new Promise((resolve, reject) => {
    cloudinary.api.resource(publicId, { resource_type: resourceType }, (error, result) => {
      if (error) {
        reject(error)
      } else {
        resolve(result)
      }
    })
  })
}

export const listFiles = async (folder: string, maxResults: number = 50) => {
  return new Promise((resolve, reject) => {
    cloudinary.api.resources(
      {
        type: 'upload',
        prefix: folder,
        max_results: maxResults,
        resource_type: 'auto'
      },
      (error, result) => {
        if (error) {
          reject(error)
        } else {
          resolve(result)
        }
      }
    )
  })
} 