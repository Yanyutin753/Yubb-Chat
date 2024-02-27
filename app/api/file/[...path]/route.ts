import { getServerSideConfig } from "@/app/config/server";
import LocalFileStorage from "@/app/utils/local_file_storage";
import S3FileStorage from "@/app/utils/s3_file_storage";
import { NextRequest, NextResponse } from "next/server";


interface MimeTypeMap {
  [extension: string]: string;
}

// 创建一个文件扩展名到MIME类型的映射
const mimeTypeMap: MimeTypeMap = {
  'png': 'image/png',
  'jpg': 'image/jpeg',
  'webp': 'image/webp',
  'gif': 'image/gif',
  'bmp': 'image/bmp',
  'svg': 'image/svg+xml',
  'txt': 'text/plain',
  'pdf': 'application/pdf',
  'doc': 'application/msword',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'xls': 'application/vnd.ms-excel',
  'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'ppt': 'application/vnd.ms-powerpoint',
  'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'zip': 'application/zip',
  'rar': 'application/x-rar-compressed',
  'bin': 'application/octet-stream',

  // Audio
  'mp3': 'audio/mpeg',
  'wav': 'audio/wav',
  'ogg': 'audio/ogg',
  'flac': 'audio/flac',
  'aac': 'audio/aac',
  'weba': 'audio/webm',
  'midi': 'audio/midi',

  // Video
  'mp4': 'video/mp4',
  'webm': 'video/webm',
  'avi': 'video/x-msvideo',
  'wmv': 'video/x-ms-wmv',
  'flv': 'video/x-flv',
  '3gp': 'video/3gpp',
  'mkv': 'video/x-matroska',

  //编程
  'js': 'application/javascript',
  'json': 'application/json',
  'html': 'text/html',
  'css': 'text/css',
  'xml': 'application/xml',
  'csv': 'text/csv',
  'ts': 'text/typescript',
  'java': 'text/x-java-source',
  'py': 'text/x-python',
  'c': 'text/x-csrc',
  'cpp': 'text/x-c++src',
  'h': 'text/x-chdr',
  'hpp': 'text/x-c++hdr',
  'php': 'application/x-httpd-php',
  'rb': 'text/x-ruby',
  'go': 'text/x-go',
  'rs': 'text/rust',
  'swift': 'text/x-swift',
  'kt': 'text/x-kotlin',
  'scala': 'text/x-scala',
};

function getMimeType(filePath: string): string {
  if (typeof filePath !== 'string' || filePath.trim() === '') {
    throw new Error('Invalid file path.');
  }
  const extension = filePath.split('.').pop();
  if (extension) {
    return mimeTypeMap[extension] || 'application/octet-stream';
  } else {
    return 'application/octet-stream';
  }

}

async function handle(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  if (req.method === "OPTIONS") {
    return NextResponse.json({ body: "OK" }, { status: 200 });
  }

  try {
    const serverConfig = getServerSideConfig();
    const filePath = params.path[0];
    const mimeType = getMimeType(filePath); 

    if (serverConfig.isStoreFileToLocal) {
      var fileBuffer = await LocalFileStorage.get(filePath);
      return new Response(fileBuffer, {
        headers: {
          "Content-Type": mimeType, 
        },
      });
    } else {
      var file = await S3FileStorage.get(filePath);
      return new Response(file?.transformToWebStream(), {
        headers: {
          "Content-Type": mimeType, 
        },
      });
    }
  } catch (e) {
    return new Response("not found", {
      status: 404,
    });
  }
}

export const GET = handle;

export const runtime = "nodejs";
export const revalidate = 0;
