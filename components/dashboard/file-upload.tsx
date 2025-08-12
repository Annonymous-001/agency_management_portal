"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, X, FileText, Image, File } from "lucide-react"
import { toast } from "sonner"
import { formatFileSize, getFileType, getFileIconColor } from "@/lib/utils"

interface FileUploadProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projects: Array<{ id: string; name: string }>
  onUploadComplete: () => void
}

export function FileUpload({ open, onOpenChange, projects, onUploadComplete }: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [selectedProject, setSelectedProject] = useState("")
  const [fileName, setFileName] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setUploadedFiles(prev => [...prev, ...acceptedFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'text/plain': ['.txt'],
      'application/zip': ['.zip'],
      'application/x-rar-compressed': ['.rar']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true
  })

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const getFileIcon = (file: File) => {
    const fileType = getFileType(file.name, file.type)
    const iconColor = getFileIconColor(fileType)
    
    if (fileType === 'Image') {
      return <Image className={`h-4 w-4 ${iconColor}`} />
    }
    
    return <FileText className={`h-4 w-4 ${iconColor}`} />
  }



  const handleUpload = async () => {
    if (!selectedProject) {
      toast.error("Please select a project")
      return
    }

    if (uploadedFiles.length === 0) {
      toast.error("Please select files to upload")
      return
    }

    setUploading(true)

    try {
      const uploadPromises = uploadedFiles.map(async (file) => {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("projectId", selectedProject)
        formData.append("name", fileName || file.name)

        const response = await fetch("/api/files", {
          method: "POST",
          body: formData
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Upload failed")
        }

        return response.json()
      })

      await Promise.all(uploadPromises)
      toast.success("Files uploaded successfully")
      onUploadComplete()
      onOpenChange(false)
      resetForm()
    } catch (error: any) {
      toast.error(error.message || "Failed to upload files")
    } finally {
      setUploading(false)
    }
  }

  const resetForm = () => {
    setSelectedProject("")
    setFileName("")
    setUploadedFiles([])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
          <DialogDescription>
            Upload files to your project. Maximum file size is 10MB.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Project Selection */}
          <div>
            <Label htmlFor="project">Project</Label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* File Name (Optional) */}
          <div>
            <Label htmlFor="fileName">Custom File Name (Optional)</Label>
            <Input
              id="fileName"
              placeholder="Enter custom name for uploaded files"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
            />
          </div>

          {/* File Drop Zone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-sm text-muted-foreground">Drop the files here...</p>
            ) : (
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Drag & drop files here, or click to select files
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports: Images, PDFs, Documents, Spreadsheets, Presentations, Archives
                </p>
              </div>
            )}
          </div>

          {/* File List */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Files ({uploadedFiles.length})</Label>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                    {getFileIcon(file)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={uploading || uploadedFiles.length === 0}>
            {uploading ? "Uploading..." : "Upload Files"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 