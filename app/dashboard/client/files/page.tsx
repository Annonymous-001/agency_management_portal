"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { FileText, Download, Upload, Search, Calendar, User, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { FileUpload } from "@/components/dashboard/file-upload"
import { DeleteFileDialog } from "@/components/dashboard/delete-file-dialog"
import { formatFileSize, getFileIconColor } from "@/lib/utils"

interface File {
  id: string
  name: string
  url: string
  type: string
  size: number
  mimeType: string
  createdAt: string
  User: {
    id: string
    name: string
    email: string
  }
  Project: {
    id: string
    name: string
  }
}

export default function ClientFilesPage() {
  const { data: session } = useSession()
  const [files, setFiles] = useState<File[]>([])
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [uploadOpen, setUploadOpen] = useState(false)
  const [deleteFile, setDeleteFile] = useState<File | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  useEffect(() => {
    if (session?.user?.id) {
      loadFiles()
      loadProjects()
    }
  }, [session?.user?.id])

  const loadFiles = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/files")
      if (!res.ok) throw new Error("Failed to fetch files")
      const data = await res.json()
      setFiles(data ?? [])
    } catch (error) {
      toast.error("Failed to load files")
    } finally {
      setLoading(false)
    }
  }, [])

  const loadProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects")
      if (!res.ok) throw new Error("Failed to fetch projects")
      const data = await res.json()
      setProjects(data ?? [])
    } catch (error) {
      toast.error("Failed to load projects")
    }
  }, [])

  const handleDownload = (file: File) => {
    const link = document.createElement('a')
    link.href = file.url
    link.download = file.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDeleteFile = useCallback(async () => {
    if (!deleteFile) return

    try {
      const response = await fetch(`/api/files?id=${deleteFile.id}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete file")
      }

      // Refresh the files list
      loadFiles()
    } catch (error: any) {
      throw error
    }
  }, [deleteFile, loadFiles])

  const openDeleteDialog = (file: File) => {
    setDeleteFile(file)
    setDeleteDialogOpen(true)
  }

  const getFileIcon = (file: File) => {
    const type = file.type || ''
    const iconColor = getFileIconColor(type)
    return <FileText className={`h-5 w-5 ${iconColor}`} />
  }



  const filteredFiles = files.filter((file) =>
    file.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.Project?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.User?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <DashboardHeader title="Files" breadcrumbs={[{ label: "Client", href: "/dashboard/client" }]} />
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4 flex-1 max-w-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input placeholder="Search files..." className="pl-10" disabled />
            </div>
          </div>
          <Button disabled>
            <Upload className="h-4 w-4 mr-2" />
            Upload File
          </Button>
        </div>
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded" />
                    <div>
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-16 rounded" />
                    <Skeleton className="h-8 w-20 rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <DashboardHeader title="Files" breadcrumbs={[{ label: "Client", href: "/dashboard/client" }]} />

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4 flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Button onClick={() => setUploadOpen(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Upload File
        </Button>
      </div>

      <div className="grid gap-4">
        {filteredFiles.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? "No files found matching your search" : "No files found"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {searchTerm ? "Try adjusting your search terms" : "Upload your first file to get started"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredFiles.map((file) => (
            <Card key={file.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                                       <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                     {getFileIcon(file)}
                   </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{file.name}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {file.User?.name || "Unknown"}
                        </span>
                        <span>•</span>
                        <span>{file.Project?.name || "Unknown Project"}</span>
                        <span>•</span>
                        <span>{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(file.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{file.type || "Unknown"}</Badge>
                    <Button variant="outline" size="sm" onClick={() => handleDownload(file)}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => openDeleteDialog(file)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* File Categories */}
      {filteredFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>File Categories</CardTitle>
            <CardDescription>Files organized by type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(() => {
                const categories = filteredFiles.reduce((acc: any, file) => {
                  const type = file.type || 'Other'
                  acc[type] = (acc[type] || 0) + 1
                  return acc
                }, {})

                return Object.entries(categories).map(([type, count]) => (
                  <div key={type} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    {getFileIcon({ type, mimeType: '' } as File)}
                    <div>
                      <p className="font-medium">{type}</p>
                      <p className="text-sm text-muted-foreground">{String(count)} file{Number(count) !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                ))
              })()}
            </div>
          </CardContent>
        </Card>
      )}

      <FileUpload
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        projects={projects}
        onUploadComplete={loadFiles}
      />

      <DeleteFileDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        fileName={deleteFile?.name || ""}
        onDelete={handleDeleteFile}
      />
    </div>
  )
}
