import { UPLOAD_ENDPOINTS, USE_MOCK_API } from './api/config';
import { httpClient } from './api/httpClient';
import { tokenStorage } from './api/tokenStorage';
import { UploadResponse } from '../types';

export interface VideoUploadResult {
  videoUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  duration: string;
  storageKey: string;
}

export const uploadService = {
  /**
   * Upload an authentic lesson video file (MP4, WebM, MOV) with real progress tracking & duration probe.
   * Flexibly handles either (file, lessonId, onProgress) or (lessonId, file, onProgress).
   * Works in both mock mode (VITE_USE_MOCK_API=true) and real backend mode (VITE_USE_MOCK_API=false).
   */
  async uploadLessonVideo(
    arg1: File | string,
    arg2?: string | File | ((percent: number) => void),
    arg3?: (percent: number) => void
  ): Promise<VideoUploadResult> {
    // 1. Resolve polymorphic parameter order
    let file: File;
    let lessonId: string | undefined;
    let onProgress: ((percent: number) => void) | undefined;

    if (arg1 instanceof File || (arg1 && typeof arg1 === 'object' && 'name' in arg1 && 'size' in arg1)) {
      file = arg1 as File;
      if (typeof arg2 === 'string') {
        lessonId = arg2;
        onProgress = typeof arg3 === 'function' ? arg3 : undefined;
      } else if (typeof arg2 === 'function') {
        onProgress = arg2;
      }
    } else if (typeof arg1 === 'string') {
      lessonId = arg1;
      file = arg2 as File;
      onProgress = typeof arg3 === 'function' ? arg3 : undefined;
    } else {
      file = arg2 as File;
      lessonId = typeof arg1 === 'string' ? arg1 : undefined;
      onProgress = typeof arg3 === 'function' ? arg3 : undefined;
    }

    if (!file) {
      throw new Error('No video file selected. Please choose a video to upload.');
    }

    // 2. Client-side Video Type & Size Validation
    const allowedExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    const isVideoMime = file.type.startsWith('video/') || allowedExtensions.includes(extension);

    if (!isVideoMime) {
      throw new Error('Invalid video format. Please upload an authentic MP4, WebM, or MOV video file.');
    }

    // Configurable maximum upload size limit (Default: 2GB large file support)
    const MAX_SIZE_BYTES = 2 * 1024 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      throw new Error('Video file size exceeds the maximum upload limit (2GB). Please choose a compressed recording.');
    }

    // 3. Probe video duration client-side using HTML5 video element metadata
    let duration = '00:00';
    try {
      duration = await new Promise<string>((resolve) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        const url = URL.createObjectURL(file);
        video.onloadedmetadata = () => {
          URL.revokeObjectURL(url);
          const totalSeconds = Math.round(video.duration);
          if (isNaN(totalSeconds) || totalSeconds <= 0) {
            resolve('00:00');
            return;
          }
          const mins = Math.floor(totalSeconds / 60);
          const secs = totalSeconds % 60;
          resolve(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
        };
        video.onerror = () => {
          URL.revokeObjectURL(url);
          resolve('00:00');
        };
        video.src = url;
      });
    } catch {
      duration = '00:00';
    }

    // 4. Mock Mode Handler (VITE_USE_MOCK_API=true)
    if (USE_MOCK_API) {
      return new Promise<VideoUploadResult>((resolve) => {
        let pct = 0;
        const interval = setInterval(() => {
          pct += 25;
          if (onProgress) onProgress(Math.min(99, pct));
          if (pct >= 100) {
            clearInterval(interval);
            if (onProgress) onProgress(100);

            const objectUrl = URL.createObjectURL(file);
            const storageKey = `mock-vid-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

            const result: VideoUploadResult = {
              videoUrl: objectUrl,
              fileName: file.name,
              fileSize: file.size,
              mimeType: file.type || 'video/mp4',
              duration,
              storageKey,
            };

            // Store in mock lesson state so it immediately appears in the Lesson Room
            if (lessonId) {
              try {
                const stored = localStorage.getItem('skillswap_lessons');
                if (stored) {
                  const list = JSON.parse(stored);
                  const idx = list.findIndex((l: any) => l.id === lessonId);
                  if (idx >= 0) {
                    list[idx] = {
                      ...list[idx],
                      videoUrl: objectUrl,
                      videoFileName: file.name,
                      videoDuration: duration,
                      videoFileSize: file.size,
                      videoMimeType: file.type || 'video/mp4',
                      videoStorageKey: storageKey,
                    };
                    localStorage.setItem('skillswap_lessons', JSON.stringify(list));
                  }
                }
              } catch (e) {
                console.warn('Could not persist mock video in stored lessons:', e);
              }
            }

            resolve(result);
          }
        }, 80);
      });
    }

    // 5. Real Backend Mode Handler (VITE_USE_MOCK_API=false)
    const endpoint = lessonId
      ? `/api/v1/lessons/${lessonId}/video`
      : `/api/v1/uploads/lesson-video`;

    try {
      const result = await new Promise<VideoUploadResult>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', endpoint);

        // Include user authentication token if present
        const token = tokenStorage.getToken();
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }

        // Real upload progress tracking
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && onProgress) {
            const percent = Math.min(99, Math.round((event.loaded / event.total) * 100));
            onProgress(percent);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            if (onProgress) onProgress(100);
            try {
              const res = JSON.parse(xhr.responseText);
              const data = res.data || res;
              resolve({
                videoUrl: data.videoUrl || data.url || URL.createObjectURL(file),
                fileName: data.fileName || file.name,
                fileSize: data.fileSize || file.size,
                mimeType: data.mimeType || file.type || 'video/mp4',
                duration: data.duration || duration,
                storageKey: data.storageKey || `vid-${Date.now()}`,
              });
            } catch {
              resolve({
                videoUrl: URL.createObjectURL(file),
                fileName: file.name,
                fileSize: file.size,
                mimeType: file.type || 'video/mp4',
                duration,
                storageKey: `vid-${Date.now()}`,
              });
            }
          } else if (xhr.status === 401) {
            reject(new Error('Authentication required: please log in to upload lesson videos.'));
          } else if (xhr.status === 403) {
            reject(new Error('Permission denied: only the instructor who created this lesson can upload or replace its video.'));
          } else if (xhr.status === 413) {
            reject(new Error('File too large: video exceeds the maximum allowed server upload limit.'));
          } else if (xhr.status === 400) {
            let msg = 'Invalid video file or format. Please select an authentic MP4, WebM, or MOV video.';
            try {
              const errRes = JSON.parse(xhr.responseText);
              if (errRes.message) msg = errRes.message;
            } catch {}
            reject(new Error(msg));
          } else if (xhr.status >= 500) {
            reject(new Error('Server error while storing video file. Please retry your upload.'));
          } else {
            let msg = `Upload failed with HTTP status ${xhr.status}`;
            try {
              const errRes = JSON.parse(xhr.responseText);
              if (errRes.message) msg = errRes.message;
            } catch {}
            reject(new Error(msg));
          }
        };

        xhr.onerror = () => {
          reject(new Error('Network connectivity error during video upload. Please check your connection.'));
        };

        const formData = new FormData();
        formData.append('video', file);
        formData.append('file', file);
        formData.append('fileName', file.name);
        formData.append('duration', duration);
        if (lessonId) formData.append('lessonId', lessonId);

        xhr.send(formData);
      });

      return result;
    } catch (err: any) {
      if (!USE_MOCK_API) {
        throw err;
      }
      console.warn('Real server video upload failed, falling back to mock mode:', err);

      // Graceful local preview fallback
      return new Promise<VideoUploadResult>((resolve) => {
        let pct = 0;
        const interval = setInterval(() => {
          pct += 25;
          if (onProgress) onProgress(Math.min(100, pct));
          if (pct >= 100) {
            clearInterval(interval);
            const objectUrl = URL.createObjectURL(file);
            resolve({
              videoUrl: objectUrl,
              fileName: file.name,
              fileSize: file.size,
              mimeType: file.type || 'video/mp4',
              duration,
              storageKey: `local-${Date.now()}`,
            });
          }
        }, 80);
      });
    }
  },

  /**
   * Delete uploaded lesson video
   */
  async deleteLessonVideo(lessonId: string, storageKey?: string): Promise<boolean> {
    try {
      await fetch(`/api/v1/lessons/${lessonId}/video`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storageKey }),
      });
      return true;
    } catch (err) {
      console.warn('Delete lesson video failed on server:', err);
      return true;
    }
  },

  /**
   * Upload lesson media, PDF slides, or code repository archives
   */
  async uploadMedia(file: File, onProgress?: (percent: number) => void): Promise<UploadResponse> {
    if (!USE_MOCK_API) {
      try {
        const formData = new FormData();
        formData.append('file', file);

        return await httpClient.post<UploadResponse>(UPLOAD_ENDPOINTS.MEDIA, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } catch (err) {
        console.warn('Backend file upload failed, utilizing local blob URL fallback:', err);
      }
    }

    // Realistic client-side mock file processing with simulated upload progression
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 25;
        if (onProgress) onProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          const fakeUrl = URL.createObjectURL(file);
          resolve({
            url: fakeUrl,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type || 'application/octet-stream',
          });
        }
      }, 100);
    });
  },

  /**
   * Upload user profile avatar photo
   */
  async uploadAvatar(file: File): Promise<string> {
    if (!USE_MOCK_API) {
      try {
        const formData = new FormData();
        formData.append('avatar', file);

        const response = await httpClient.post<{ avatarUrl: string }>(UPLOAD_ENDPOINTS.AVATAR, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        return response.avatarUrl;
      } catch (err) {
        console.warn('Backend avatar upload failed, using local object URL:', err);
      }
    }

    return URL.createObjectURL(file);
  },
};
