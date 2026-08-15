import { createError, defineEventHandler, readMultipartFormData } from "h3";

import { createClient } from "@supabase/supabase-js";

export default defineEventHandler(async (event) => {
  // ==================================================
  // RUNTIME CONFIG
  // ==================================================

  const config = useRuntimeConfig();

  const supabaseUrl = config.public.supabaseUrl;
  const supabaseSecretKey = config.supabaseSecretKey;

  if (!supabaseUrl || !supabaseSecretKey) {
    throw createError({
      statusCode: 500,
      statusMessage: "Supabase server configuration is missing.",
    });
  }

  // ==================================================
  // GET AUTHORIZATION HEADER
  // ==================================================

  const authHeader = event.node.req.headers.authorization;

  if (!authHeader) {
    throw createError({
      statusCode: 401,
      statusMessage: "Authentication required.",
    });
  }

  const token = authHeader.replace("Bearer ", "").trim();

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: "Authentication required.",
    });
  }

  // ==================================================
  // SERVER SUPABASE CLIENT
  // ==================================================

  const supabase = createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // ==================================================
  // VERIFY USER
  // ==================================================

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !user) {
    console.error("UPLOAD USER ERROR:", userError);

    throw createError({
      statusCode: 401,
      statusMessage: "Invalid authentication.",
    });
  }

  console.log("IMAGE UPLOAD USER:", user.email);

  // ==================================================
  // CHECK ADMIN
  // ==================================================

  const { data: adminUser, error: adminError } = await supabase
    .from("admin_users")
    .select("*")
    .eq("email", user.email)
    .maybeSingle();

  if (adminError) {
    console.error("ADMIN CHECK ERROR:", adminError);

    throw createError({
      statusCode: 500,
      statusMessage: "Unable to verify administrator.",
    });
  }

  if (!adminUser) {
    throw createError({
      statusCode: 403,
      statusMessage: "Administrator access required.",
    });
  }

  // ==================================================
  // READ FILE
  // ==================================================

  const formData = await readMultipartFormData(event);

  if (!formData) {
    throw createError({
      statusCode: 400,
      statusMessage: "No upload data received.",
    });
  }

  const file = formData.find((item) => item.name === "file" && item.filename);

  if (!file) {
    throw createError({
      statusCode: 400,
      statusMessage: "No image file selected.",
    });
  }

  // ==================================================
  // CHECK FILE TYPE
  // ==================================================

  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ];

  if (file.type && !allowedTypes.includes(file.type)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Only JPG, PNG, WEBP and GIF images are allowed.",
    });
  }

  // ==================================================
  // CHECK FILE SIZE
  // 5MB MAX
  // ==================================================

  const maxSize = 5 * 1024 * 1024;

  if (file.data.length > maxSize) {
    throw createError({
      statusCode: 400,
      statusMessage: "Image must be smaller than 5MB.",
    });
  }

  // ==================================================
  // GET ORIGINAL FILENAME
  // ==================================================

  const originalName = file.filename || "image";

  // Remove unsafe characters
  const cleanName = originalName
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .toLowerCase();

  // ==================================================
  // CREATE UNIQUE FILENAME
  // ==================================================

  const extension = cleanName.includes(".")
    ? cleanName.substring(cleanName.lastIndexOf("."))
    : "";

  const baseName = cleanName
    .replace(extension, "")
    .replace(/[^a-zA-Z0-9-]/g, "");

  const uniqueName = `${baseName}-${Date.now()}${extension}`;

  const filePath = `products/${uniqueName}`;

  console.log("🔥 UPLOADING IMAGE:", filePath);

  // ==================================================
  // UPLOAD TO SUPABASE STORAGE
  // ==================================================

  const { error: uploadError } = await supabase.storage
    .from("products")
    .upload(filePath, file.data, {
      contentType: file.type || "application/octet-stream",

      cacheControl: "3600",

      upsert: false,
    });

  if (uploadError) {
    console.error("🔥 STORAGE UPLOAD ERROR:", uploadError);

    throw createError({
      statusCode: 500,
      statusMessage: uploadError.message || "Unable to upload image.",
    });
  }

  // ==================================================
  // GET PUBLIC URL
  // ==================================================

  const { data: publicUrlData } = supabase.storage
    .from("products")
    .getPublicUrl(filePath);

  const publicUrl = publicUrlData.publicUrl;

  console.log("🔥 IMAGE URL:", publicUrl);

  // ==================================================
  // RETURN IMAGE INFORMATION
  // ==================================================

  return {
    success: true,

    filename: cleanName,

    path: filePath,

    url: publicUrl,
  };
});
