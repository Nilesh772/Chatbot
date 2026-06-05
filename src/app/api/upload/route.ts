import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validate file type
    const fileName = file.name;
    const allowedExtensions = [".png", ".jpg", ".jpeg", ".gif", ".svg"];
    const ext = fileName.substring(fileName.lastIndexOf(".")).toLowerCase();
    
    if (!allowedExtensions.includes(ext)) {
      return NextResponse.json({ error: "File type not supported. Allowed formats: PNG, JPG, GIF, SVG" }, { status: 400 });
    }

    // Create unique file name to avoid collisions
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${ext}`;
    
    // Path: public/uploads
    const uploadDir = join(process.cwd(), "public", "uploads");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }
    
    const filePath = join(uploadDir, uniqueFileName);
    await writeFile(filePath, buffer);
    
    const basePath = process.env.NODE_ENV === "production" ? "/chetbot" : "";
    const relativeUrl = `${basePath}/uploads/${uniqueFileName}`;
    return NextResponse.json({ success: true, url: relativeUrl });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message || "Failed to upload file" }, { status: 500 });
  }
}
