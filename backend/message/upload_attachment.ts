import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { Bucket } from "encore.dev/storage/objects";

const attachments = new Bucket("attachments", { public: true });

interface UploadAttachmentRequest {
  fileType?: string;
  fileName?: string;
}

interface UploadAttachmentResponse {
  uploadUrl: string;
  publicUrl: string;
}

export const uploadAttachment = api<UploadAttachmentRequest, UploadAttachmentResponse>(
  { auth: true, expose: true, method: "POST", path: "/messages/attachment/upload-url" },
  async ({ fileType, fileName }) => {
    const auth = getAuthData()!;
    const userId = auth.userID;
    
    let extension = 'bin';
    if (fileName) {
      const parts = fileName.split('.');
      if (parts.length > 1) {
        extension = parts[parts.length - 1];
      }
    } else if (fileType) {
      const typeMap: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp',
        'video/mp4': 'mp4',
        'video/webm': 'webm',
        'video/quicktime': 'mov',
        'audio/mpeg': 'mp3',
        'audio/mp4': 'm4a',
        'audio/webm': 'webm',
        'audio/ogg': 'ogg',
        'application/pdf': 'pdf',
        'application/zip': 'zip',
        'text/plain': 'txt',
      };
      extension = typeMap[fileType] || 'bin';
    }
    
    const filename = `${userId}-${Date.now()}.${extension}`;
    const { url: uploadUrl } = await attachments.signedUploadUrl(filename, {
      ttl: 3600,
    });
    const publicUrl = attachments.publicUrl(filename);

    return { uploadUrl, publicUrl };
  }
);
