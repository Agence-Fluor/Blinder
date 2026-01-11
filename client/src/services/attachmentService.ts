// Service for handling file attachments in chat

export interface Attachment {
  id: string;
  type: 'image' | 'video' | 'audio' | 'pdf' | 'other';
  fileName: string;
  mimeType: string;
  size: number;
  data: Uint8Array; // Encrypted file data
  thumbnail?: Uint8Array; // For images/videos (encrypted)
  duration?: number; // For audio/video in seconds
  encrypted: boolean;
}

export interface AttachmentPreview {
  id: string;
  type: 'image' | 'video' | 'audio';
  url: string; // Blob URL for preview
  thumbnail?: string; // Blob URL for thumbnail
  duration?: number;
}

// Supported file types
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];
const SUPPORTED_AUDIO_TYPES = ['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/webm'];
const SUPPORTED_PDF_TYPES = ['application/pdf'];

// Maximum file sizes (in bytes)
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB
const MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50 MB
const MAX_PDF_SIZE = 20 * 1024 * 1024; // 20 MB
const MAX_OTHER_SIZE = 10 * 1024 * 1024; // 10 MB

// Process file for attachment
export async function processFile(file: File): Promise<Attachment> {
  // Validate file type and size
  const fileType = getFileType(file.type);
  const maxSize = getMaxSize(fileType);
  
  if (file.size > maxSize) {
    throw new Error(`File too large. Maximum size: ${formatFileSize(maxSize)}`);
  }

  // Read file as ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);

  // Generate attachment ID
  const id = crypto.randomUUID();

  // Generate thumbnail for images/videos
  let thumbnail: Uint8Array | undefined;
  if (fileType === 'image' || fileType === 'video') {
    thumbnail = await generateThumbnail(file, fileType);
  }

  // Get duration for audio/video
  let duration: number | undefined;
  if (fileType === 'audio' || fileType === 'video') {
    duration = await getMediaDuration(file);
  }

  return {
    id,
    type: fileType,
    fileName: file.name,
    mimeType: file.type,
    size: file.size,
    data,
    thumbnail,
    duration,
    encrypted: false, // Will be encrypted before sending
  };
}

// Generate preview for attachment
export async function createPreview(attachment: Attachment): Promise<AttachmentPreview | null> {
  if (attachment.type !== 'image' && attachment.type !== 'video' && attachment.type !== 'audio') {
    return null;
  }

  // Decrypt if needed (for received attachments)
  let data = attachment.data;
  if (attachment.encrypted) {
    // TODO: Decrypt using session key
    // For now, assume not encrypted for preview
  }

  // Create blob URL
  const blob = new Blob([data], { type: attachment.mimeType });
  const url = URL.createObjectURL(blob);

  let thumbnailUrl: string | undefined;
  if (attachment.thumbnail) {
    const thumbnailBlob = new Blob([attachment.thumbnail], { type: 'image/jpeg' });
    thumbnailUrl = URL.createObjectURL(thumbnailBlob);
  }

  return {
    id: attachment.id,
    type: attachment.type,
    url,
    thumbnail: thumbnailUrl,
    duration: attachment.duration,
  };
}

// Generate thumbnail for image/video
async function generateThumbnail(file: File, type: 'image' | 'video'): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    if (type === 'image') {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Resize to max 200x200
        const maxSize = 200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to create thumbnail'));
            return;
          }
          blob.arrayBuffer().then(buffer => {
            resolve(new Uint8Array(buffer));
          });
        }, 'image/jpeg', 0.8);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    } else if (type === 'video') {
      const video = document.createElement('video');
      video.onloadedmetadata = () => {
        video.currentTime = 1; // Seek to 1 second
      };
      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to create thumbnail'));
            return;
          }
          blob.arrayBuffer().then(buffer => {
            resolve(new Uint8Array(buffer));
          });
        }, 'image/jpeg', 0.8);
      };
      video.onerror = () => reject(new Error('Failed to load video'));
      video.src = URL.createObjectURL(file);
      video.load();
    } else {
      reject(new Error('Unsupported type for thumbnail'));
    }
  });
}

// Get media duration
async function getMediaDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const media = document.createElement(file.type.startsWith('audio') ? 'audio' : 'video');
    media.onloadedmetadata = () => {
      resolve(media.duration);
      URL.revokeObjectURL(media.src);
    };
    media.onerror = () => reject(new Error('Failed to load media'));
    media.src = URL.createObjectURL(file);
  });
}

// Get file type from MIME type
function getFileType(mimeType: string): Attachment['type'] {
  if (SUPPORTED_IMAGE_TYPES.includes(mimeType)) return 'image';
  if (SUPPORTED_VIDEO_TYPES.includes(mimeType)) return 'video';
  if (SUPPORTED_AUDIO_TYPES.includes(mimeType)) return 'audio';
  if (SUPPORTED_PDF_TYPES.includes(mimeType)) return 'pdf';
  return 'other';
}

// Get max size for file type
function getMaxSize(type: Attachment['type']): number {
  switch (type) {
    case 'image': return MAX_IMAGE_SIZE;
    case 'video': return MAX_VIDEO_SIZE;
    case 'audio': return MAX_AUDIO_SIZE;
    case 'pdf': return MAX_PDF_SIZE;
    default: return MAX_OTHER_SIZE;
  }
}

// Format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// GIF menu options
export const GIF_OPTIONS = [
  { id: 'happy', url: 'https://media.giphy.com/media/3o7aCTPPm4OHfRLSH6/giphy.gif', label: 'Happy' },
  { id: 'sad', url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif', label: 'Sad' },
  { id: 'love', url: 'https://media.giphy.com/media/3o7aD2saalv6jF3k2k/giphy.gif', label: 'Love' },
  { id: 'angry', url: 'https://media.giphy.com/media/3o7abldf0bM8T2x8Q0/giphy.gif', label: 'Angry' },
  { id: 'surprised', url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif', label: 'Surprised' },
  { id: 'laughing', url: 'https://media.giphy.com/media/3o7aD2saalv6jF3k2k/giphy.gif', label: 'Laughing' },
];

// Process GIF from URL
export async function processGIF(gifUrl: string, label: string): Promise<Attachment> {
  const response = await fetch(gifUrl);
  if (!response.ok) {
    throw new Error('Failed to fetch GIF');
  }

  const arrayBuffer = await response.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);

  return {
    id: crypto.randomUUID(),
    type: 'image',
    fileName: `${label}.gif`,
    mimeType: 'image/gif',
    size: data.length,
    data,
    encrypted: false,
  };
}

