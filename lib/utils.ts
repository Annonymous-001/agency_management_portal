import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFileSize(bytes: number): string {
  if (!bytes) return "0 B"
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function getFileType(fileName: string, mimeType: string): string {
  const fileExtension = fileName.split('.').pop()?.toLowerCase() || ''
  
  // Map common file extensions to readable types
  const typeMap: { [key: string]: string } = {
    // Images
    'jpg': 'Image', 'jpeg': 'Image', 'png': 'Image', 'gif': 'Image', 'webp': 'Image', 'svg': 'Image',
    // Documents
    'pdf': 'PDF', 'doc': 'Word', 'docx': 'Word', 'txt': 'Text',
    // Spreadsheets
    'xls': 'Excel', 'xlsx': 'Excel', 'csv': 'CSV',
    // Presentations
    'ppt': 'PowerPoint', 'pptx': 'PowerPoint',
    // Archives
    'zip': 'Archive', 'rar': 'Archive', '7z': 'Archive', 'tar': 'Archive', 'gz': 'Archive',
    // Code
    'js': 'Code', 'ts': 'Code', 'jsx': 'Code', 'tsx': 'Code', 'html': 'Code', 'css': 'Code', 'json': 'Code',
    // Videos
    'mp4': 'Video', 'avi': 'Video', 'mov': 'Video', 'wmv': 'Video', 'flv': 'Video',
    // Audio
    'mp3': 'Audio', 'wav': 'Audio', 'flac': 'Audio', 'aac': 'Audio'
  }
  
  // Try to get type from extension first
  if (typeMap[fileExtension]) {
    return typeMap[fileExtension]
  }
  
  // Fallback to MIME type mapping
  if (mimeType.startsWith('image/')) return 'Image'
  if (mimeType.startsWith('video/')) return 'Video'
  if (mimeType.startsWith('audio/')) return 'Audio'
  if (mimeType.includes('pdf')) return 'PDF'
  if (mimeType.includes('word') || mimeType.includes('document')) return 'Word'
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'Excel'
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'PowerPoint'
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive')) return 'Archive'
  if (mimeType.includes('text/')) return 'Text'
  
  return 'Other'
}

export function getFileIconColor(type: string): string {
  switch (type) {
    case 'Image': return 'text-blue-500'
    case 'PDF': return 'text-red-500'
    case 'Word': return 'text-blue-600'
    case 'Excel': return 'text-green-600'
    case 'PowerPoint': return 'text-orange-500'
    case 'Archive': return 'text-purple-500'
    case 'Code': return 'text-yellow-600'
    case 'Video': return 'text-pink-500'
    case 'Audio': return 'text-indigo-500'
    case 'Text': return 'text-gray-600'
    default: return 'text-gray-500'
  }
}
