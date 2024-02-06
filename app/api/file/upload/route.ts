import { NextRequest, NextResponse } from "next/server";
import { ModelProvider } from "@/app/constant";
import { auth } from "@/app/api/auth";
import LocalFileStorage from "@/app/utils/local_file_storage";
import { getServerSideConfig } from "@/app/config/server";
import S3FileStorage from "@/app/utils/s3_file_storage";

async function handle(req: NextRequest) {
  if (req.method === "OPTIONS") {
    return NextResponse.json({ body: "OK" }, { status: 200 });
  }

  const authResult = auth(req, ModelProvider.GPT);
  if (authResult.error) {
    return NextResponse.json(authResult, {
      status: 401,
    });
  }

  try {
    const formData = await req.formData();
    const image = formData.get("file") as File;

    const imageReader = image.stream().getReader();
    const imageData: number[] = [];

    // // 获取文件名
    // const true_fileName = image.name;
    // console.log(true_fileName);

    // const mimeToExtension: { [key: string]: string } = {
    //   'image/png': 'png',
    //   'image/jpeg': 'jpg',
    //   'image/webp': 'webp',
    //   'image/gif': 'gif',
    //   'image/bmp': 'bmp',
    //   'image/svg+xml': 'svg',
    //   'text/plain': 'txt',
    //   'text/html': 'html',
    //   'text/css': 'css',
    //   'text/csv': 'csv',
    //   'application/pdf': 'pdf',
    //   'application/msword': 'doc',
    //   'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    //   'application/vnd.ms-excel': 'xls',
    //   'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    //   'application/vnd.ms-powerpoint': 'ppt',
    //   'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    //   'application/json': 'json',
    //   'application/xml': 'xml',
    //   'application/zip': 'zip',
    //   'application/x-rar-compressed': 'rar',
    //   'application/javascript': 'js',
    //   'application/octet-stream': 'bin',
    // };    
    
    // const extension = mimeToExtension[image.type] || 'txt';    

    while (true) {
      const { done, value } = await imageReader.read();
      if (done) break;
      imageData.push(...value);
    }

    const buffer = Buffer.from(imageData);

    // 使用获取到的文件后缀
    var fileName = image.name;
    var filePath = "";
    const serverConfig = getServerSideConfig();
    if (serverConfig.isStoreFileToLocal) {
      filePath = await LocalFileStorage.put(fileName, buffer);
    } else {
      filePath = await S3FileStorage.put(fileName, buffer);
    }
    return NextResponse.json(
      {
        fileName: fileName,
        filePath: filePath,
      },
      {
        status: 200,
      },
    );
  } catch (e) {
    return NextResponse.json(
      {
        error: true,
        msg: (e as Error).message,
      },
      {
        status: 500,
      },
    );
  }
}

export const POST = handle;

export const runtime = "nodejs";
