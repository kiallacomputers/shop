const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export const extensionForImageMime = (mimeType: string) =>
  IMAGE_EXTENSIONS[mimeType] || "bin";

export const imageBytesMatchMime = (data: Uint8Array, mimeType: string) => {
  if (!data || data.length < 12) return false;

  if (mimeType === "image/jpeg") {
    return data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
  }

  if (mimeType === "image/png") {
    return (
      data[0] === 0x89 &&
      data[1] === 0x50 &&
      data[2] === 0x4e &&
      data[3] === 0x47 &&
      data[4] === 0x0d &&
      data[5] === 0x0a &&
      data[6] === 0x1a &&
      data[7] === 0x0a
    );
  }

  if (mimeType === "image/webp") {
    return (
      String.fromCharCode(...data.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...data.slice(8, 12)) === "WEBP"
    );
  }

  if (mimeType === "image/gif") {
    const header = String.fromCharCode(...data.slice(0, 6));
    return header === "GIF87a" || header === "GIF89a";
  }

  return false;
};
