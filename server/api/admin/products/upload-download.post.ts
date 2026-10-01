import { getAdminSupabase, requireAdmin } from "~~/server/utils/adminAuth";
import { auditRejectedUpload, filenameLooksDangerous, isPdf, isZip, safeUploadBaseName, uploadExtension } from "~~/server/utils/fileUploadSecurity";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED: Record<string, { mime: string; signature?: "pdf" | "zip" }> = {
  pdf: { mime: "application/pdf", signature: "pdf" },
  zip: { mime: "application/zip", signature: "zip" },
  docx: { mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", signature: "zip" },
  xlsx: { mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", signature: "zip" },
  pptx: { mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation", signature: "zip" },
  txt: { mime: "text/plain" },
  csv: { mime: "text/csv" },
};

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const parts = await readMultipartFormData(event);
  const files = parts?.filter((part) => part.name === "file" && part.filename) || [];
  const file = files[0];
  if (files.length !== 1 || !file?.data || !file.filename) {
    await auditRejectedUpload(event, files.length > 1 ? "multiple_files" : "missing_file");
    throw createError({ statusCode: 400, statusMessage: "Supply exactly one download file" });
  }
  if (filenameLooksDangerous(file.filename)) {
    await auditRejectedUpload(event, "unsafe_filename", file.filename);
    throw createError({ statusCode: 400, statusMessage: "The download filename is not allowed" });
  }
  if (file.data.length > MAX_FILE_SIZE) {
    await auditRejectedUpload(event, "download_too_large", file.filename);
    throw createError({ statusCode: 413, statusMessage: "Each download file must be 50 MB or smaller" });
  }

  const ext = uploadExtension(file.filename);
  const rule = ALLOWED[ext];
  if (!rule) {
    await auditRejectedUpload(event, "disallowed_download_extension", file.filename);
    throw createError({ statusCode: 415, statusMessage: "Allowed downloads are PDF, ZIP, DOCX, XLSX, PPTX, TXT and CSV files" });
  }
  if (rule.signature === "pdf" && !isPdf(file.data)) {
    await auditRejectedUpload(event, "pdf_signature_mismatch", file.filename);
    throw createError({ statusCode: 415, statusMessage: "The uploaded file is not a valid PDF" });
  }
  if (rule.signature === "zip" && !isZip(file.data)) {
    await auditRejectedUpload(event, "zip_signature_mismatch", file.filename);
    throw createError({ statusCode: 415, statusMessage: "The uploaded archive/document does not match its file type" });
  }

  const path = `downloads/${safeUploadBaseName(file.filename, "download")}-${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const supabase = getAdminSupabase();
  const { error } = await supabase.storage.from("products").upload(path, file.data, {
    contentType: rule.mime,
    cacheControl: "3600",
    upsert: false,
  });
  if (error) {
    console.error("ADMIN PRODUCT DOWNLOAD UPLOAD ERROR:", error);
    throw createError({ statusCode: 500, statusMessage: "Unable to upload download file" });
  }
  const { data } = supabase.storage.from("products").getPublicUrl(path);
  return { path, url: data.publicUrl, filename: file.filename.replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 180), size: file.data.length, fileType: ext.toUpperCase() };
});
