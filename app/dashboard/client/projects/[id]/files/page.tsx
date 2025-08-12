"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, FileText, Image, File, Calendar, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { DeleteFileDialog } from "@/components/dashboard/delete-file-dialog"
import { formatFileSize, getFileIconColor } from "@/lib/utils"

export default function ClientProjectFilesPage() {
  const { id } = useParams()
  const { data: session } = useSession()
  const [project, setProject] = useState<any>(null)
  const [files, setFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteFile, setDeleteFile] = useState<any>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  useEffect(() => {
    if (session?.user?.id && id) {
      loadProjectAndFiles()
    }
  }, [session?.user?.id, id])

  const loadProjectAndFiles = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/projects?id=${id}`)
      if (!res.ok) throw new Error("Failed to fetch project")
      const data = await res.json()
      setProject(data)
      setFiles(data.File || [])
    } catch (error) {
      toast.error("Failed to load project files")
    } finally {
      setLoading(false)
    }
  }, [id])

  const getFileIcon = (file: any) => {
    const type = file.type || ''
    const iconColor = getFileIconColor(type)
    
    if (type === 'Image') {
      return <Image className={`h-5 w-5 ${iconColor}`} />
    }
    
    return <FileText className={`h-5 w-5 ${iconColor}`} />
  }



  const handleDownload = (file: any) => {
    // Create a temporary link to download the file
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
      loadProjectAndFiles()
    } catch (error: any) {
      throw error
    }
  }, [deleteFile, loadProjectAndFiles])

  const openDeleteDialog = (file: any) => {
    setDeleteFile(file)
    setDeleteDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <DashboardHeader 
          title="Project Files" 
          breadcrumbs={[
            { label: "Client", href: "/dashboard/client" },
            { label: "Projects", href: "/dashboard/client/projects" },
            { label: "Files", href: "#" }
          ]} 
        />
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                    <Skeleton className="h-10 w-10 rounded" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-8 w-20 rounded" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <DashboardHeader 
          title="Project Not Found" 
          breadcrumbs={[
            { label: "Client", href: "/dashboard/client" },
            { label: "Projects", href: "/dashboard/client/projects" }
          ]} 
        />
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Project not found or you don't have access to it.</p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/client/projects">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Projects
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <DashboardHeader 
        title={`${project.name} - Files`} 
        breadcrumbs={[
          { label: "Client", href: "/dashboard/client" },
          { label: "Projects", href: "/dashboard/client/projects" },
          { label: project.name, href: `/dashboard/client/projects/${project.id}` },
          { label: "Files", href: "#" }
        ]} 
      />

      <div className="flex gap-2 mb-4">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/client/projects/${project.id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Project
          </Link>
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Project Files</CardTitle>
                <CardDescription>
                  Files and documents related to {project.name}
                </CardDescription>
              </div>
              <Badge variant="secondary">
                {files.length} file{files.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {files.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No files uploaded yet.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Files will appear here once they are uploaded by the project team.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {files.map((file) => (
                  <div key={file.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                         <div className="flex-shrink-0">
                       {getFileIcon(file)}
                     </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.name}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span>{formatFileSize(file.size || 0)}</span>
                        <span>•</span>
                        <span>{file.type || 'Unknown type'}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(file.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownload(file)}
                      >
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
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* File Categories */}
        {files.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>File Categories</CardTitle>
              <CardDescription>Files organized by type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(() => {
                  const categories = files.reduce((acc: any, file) => {
                    const type = file.type || 'Other'
                    acc[type] = (acc[type] || 0) + 1
                    return acc
                  }, {})

                  return Object.entries(categories).map(([type, count]) => (
                    <div key={type} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      {getFileIcon({ type, mimeType: '' })}
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

        <DeleteFileDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          fileName={deleteFile?.name || ""}
          onDelete={handleDeleteFile}
        />
      </div>
    </div>
  )
} 