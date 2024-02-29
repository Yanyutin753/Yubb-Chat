import { getServerSideConfig } from "@/app/config/server";
import LocalFileStorage from "@/app/utils/local_file_storage";
import S3FileStorage from "@/app/utils/s3_file_storage";
import { NextRequest, NextResponse } from "next/server";
import mime from 'mime';

function getMimeType(filePath: string): string {
  if (typeof filePath !== 'string' || filePath.trim() === '') {
    throw new Error('Invalid file path.');
  }
  const extension = filePath.split('.').pop();
  if (extension) {
    const mimeType = mime.getType(extension);
    return mimeType || 'application/octet-stream';
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
