import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { Bucket } from "encore.dev/storage/objects";

const avatars = new Bucket("avatars", { public: true });

interface UploadAvatarResponse {
  uploadUrl: string;
  publicUrl: string;
}

export const uploadAvatar = api<void, UploadAvatarResponse>(
  { auth: true, expose: true, method: "POST", path: "/users/me/avatar/upload-url" },
  async () => {
    const auth = getAuthData()!;
    const userId = auth.userID;
    const filename = `${userId}-${Date.now()}.jpg`;
    const { url: uploadUrl } = await avatars.signedUploadUrl(filename, {
      ttl: 3600,
    });
    const publicUrl = avatars.publicUrl(filename);

    return { uploadUrl, publicUrl };
  }
);
