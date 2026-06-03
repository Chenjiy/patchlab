import { supabase, supabaseUrl, supabaseAnonKey } from './supabase'
import type { FabricTexture, DesignProject, MaskShape, CustomTemplate } from '../types'
import { generateId } from '../utils/id'

// ── In-memory cache ──
let fabricsCache: FabricTexture[] = []
let projectsCache: DesignProject[] = []
let customShapesCache: MaskShape[] = []
let customTemplatesCache: CustomTemplate[] = []

// ── Init ──
export async function initializeStore(): Promise<void> {
  const [fabRes, projRes, shapeRes, tmplRes] = await Promise.all([
    supabase.from('fabrics').select('data').order('created_at', { ascending: false }),
    supabase.from('projects').select('data').order('updated_at', { ascending: false }),
    supabase.from('custom_shapes').select('data').order('created_at', { ascending: false }),
    supabase.from('custom_templates').select('data').order('created_at', { ascending: false }),
  ])
  if (fabRes.error) throw fabRes.error
  if (projRes.error) throw projRes.error
  if (shapeRes.error) throw shapeRes.error
  if (tmplRes.error) throw tmplRes.error

  fabricsCache = fabRes.data.map((r: any) => r.data as FabricTexture)
  projectsCache = projRes.data.map((r: any) => r.data as DesignProject)
  customShapesCache = shapeRes.data.map((r: any) => r.data as MaskShape)
  customTemplatesCache = tmplRes.data.map((r: any) => r.data as CustomTemplate)
}

// ── Image upload ──
async function uploadImage(bucket: string, path: string, filePath: string): Promise<string> {
  if (!filePath.startsWith('http') && !filePath.startsWith('data:')) {
    // #ifdef MP-WEIXIN
    const url = `${supabaseUrl}/storage/v1/object/${bucket}/${path}`
    return new Promise((resolve, reject) => {
      uni.uploadFile({
        url,
        filePath,
        name: 'file',
        header: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'x-upsert': 'true',
        },
        success(res) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(`${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`)
          } else {
            reject(new Error(`Upload failed: ${res.statusCode}`))
          }
        },
        fail(err) { reject(new Error(err.errMsg)) },
      })
    })
    // #endif
  }

  // #ifdef H5
  if (filePath.startsWith('data:')) {
    const [header, b64] = filePath.split(',')
    const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
    const binary = atob(b64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    const blob = new Blob([bytes], { type: mime })
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, blob, { upsert: true, contentType: blob.type })
    if (error) throw error
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
  }
  // #endif

  return filePath
}

// ── Fabric CRUD ──
export function getFabrics(): FabricTexture[] { return fabricsCache }
export function getFabricById(id: string): FabricTexture | undefined { return fabricsCache.find((f) => f.id === id) }

export async function saveFabric(fabric: FabricTexture): Promise<void> {
  const [originalImage, processedImage] = await Promise.all([
    uploadImage('fabric-images', `${fabric.id}/original`, fabric.originalImage),
    uploadImage('fabric-images', `${fabric.id}/processed`, fabric.processedImage),
  ])
  const toStore: FabricTexture = { ...fabric, originalImage, processedImage }
  const { error } = await supabase
    .from('fabrics')
    .upsert({ id: toStore.id, data: toStore, created_at: toStore.createdAt })
  if (error) throw error
  const idx = fabricsCache.findIndex((f) => f.id === toStore.id)
  if (idx >= 0) fabricsCache[idx] = toStore
  else fabricsCache.unshift(toStore)
}

export async function deleteFabric(id: string): Promise<void> {
  await supabase.storage.from('fabric-images').remove([`${id}/original`, `${id}/processed`])
  const { error } = await supabase.from('fabrics').delete().eq('id', id)
  if (error) throw error
  fabricsCache = fabricsCache.filter((f) => f.id !== id)
}

// ── Project CRUD ──
export function getProjects(): DesignProject[] { return projectsCache }
export function getProjectById(id: string): DesignProject | undefined { return projectsCache.find((p) => p.id === id) }

export function cacheProject(project: DesignProject): void {
  const idx = projectsCache.findIndex((p) => p.id === project.id)
  if (idx >= 0) projectsCache[idx] = project
}

export async function saveProject(project: DesignProject): Promise<void> {
  let previewImage = project.previewImage
  if (previewImage && !previewImage.startsWith('http')) {
    previewImage = await uploadImage('project-previews', `${project.id}/preview`, previewImage)
  }
  const toStore: DesignProject = { ...project, previewImage }
  const { error } = await supabase
    .from('projects')
    .upsert({ id: toStore.id, data: toStore, updated_at: toStore.updatedAt })
  if (error) throw error
  const idx = projectsCache.findIndex((p) => p.id === toStore.id)
  if (idx >= 0) projectsCache[idx] = toStore
  else projectsCache.unshift(toStore)
}

export async function deleteProject(id: string): Promise<void> {
  await supabase.storage.from('project-previews').remove([`${id}/preview`])
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) throw error
  projectsCache = projectsCache.filter((p) => p.id !== id)
}

export async function duplicateProject(id: string): Promise<DesignProject> {
  const original = projectsCache.find((p) => p.id === id)
  if (!original) throw new Error('Project not found')
  const now = new Date().toISOString()
  const copy: DesignProject = { ...original, id: generateId(), name: `${original.name} 副本`, createdAt: now, updatedAt: now }
  await saveProject(copy)
  return copy
}

// ── Custom Shapes ──
export function getCustomShapes(): MaskShape[] { return customShapesCache }

export async function saveCustomShape(shape: MaskShape): Promise<void> {
  const { error } = await supabase
    .from('custom_shapes')
    .upsert({ id: shape.id, data: shape, created_at: new Date().toISOString() })
  if (error) throw error
  const idx = customShapesCache.findIndex((s) => s.id === shape.id)
  if (idx >= 0) customShapesCache[idx] = shape
  else customShapesCache.unshift(shape)
}

export async function deleteCustomShape(id: string): Promise<void> {
  const { error } = await supabase.from('custom_shapes').delete().eq('id', id)
  if (error) throw error
  customShapesCache = customShapesCache.filter((s) => s.id !== id)
}

// ── Custom Templates ──
export function getCustomTemplates(): CustomTemplate[] { return customTemplatesCache }

export async function saveCustomTemplate(template: CustomTemplate): Promise<void> {
  const { error } = await supabase
    .from('custom_templates')
    .upsert({ id: template.id, data: template, created_at: new Date().toISOString() })
  if (error) throw error
  customTemplatesCache.unshift(template)
}

export async function deleteCustomTemplate(id: string): Promise<void> {
  const { error } = await supabase.from('custom_templates').delete().eq('id', id)
  if (error) throw error
  customTemplatesCache = customTemplatesCache.filter((t) => t.id !== id)
}
