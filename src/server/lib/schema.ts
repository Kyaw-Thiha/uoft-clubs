// https://dev.to/drprime01/how-to-validate-a-file-input-with-zod-5739

import { z } from "zod";
const fileSizeLimit = 8 * 1024 * 1024; // 8MB

// Document Schema
export const documentSchema = z
  .instanceof(File)
  .refine(
    (file) =>
      [
        "application/pdf",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ].includes(file.type),
    { message: "Invalid document file type" },
  )
  .refine((file) => file.size <= fileSizeLimit, {
    message: "File size should not exceed 8MB",
  });

// Image Schema
export const imageSchema = z
  .instanceof(File)
  .refine(
    (file) =>
      [
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/svg+xml",
        "image/gif",
      ].includes(file.type),
    { message: "Invalid image file type" },
  )
  .refine((file) => file.size <= fileSizeLimit, {
    message: "File size should not exceed 8MB",
  });
