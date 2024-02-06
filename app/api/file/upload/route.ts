import { NextRequest, NextResponse } from "next/server";
import { ModelProvider } from "@/app/constant";
import { auth } from "@/app/api/auth";
import LocalFileStorage from "@/app/utils/local_file_storage";
import { getServerSideConfig } from "@/app/config/server";
import S3FileStorage from "@/app/utils/s3_file_storage";
import mime from 'mime-types';

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

    // 获取文件的 MIME 类型
    const mimeType = image.type; 
    // 根据 MIME 类型获取文件后缀
    let extension = mime.extension(mimeType); 
    // 如果无法确定文件类型，使用 'png' 作为默认后缀

    if (!extension) {
      extension = 'png';
    }
    while (true) {
      const { done, value } = await imageReader.read();
      if (done) break;
      imageData.push(...value);
    }

    const buffer = Buffer.from(imageData);

    // 使用获取到的文件后缀
    var fileName = `${Date.now()}.${extension}`;
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
