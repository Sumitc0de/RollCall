import { NextResponse } from "next/server";
import { existsSync, statSync, createReadStream } from "fs";
import { join } from "path";

/**
 * GET /download
 *
 * Efficiently streams the Rollcall APK file located at /public/rollcall.apk.
 */
export async function GET() {
  const apkPath = join(process.cwd(), "public", "rollcall.apk");

  if (!existsSync(apkPath)) {
    return NextResponse.json(
      {
        error: "APK not available yet",
        message: "The Rollcall APK file was not found at website/public/rollcall.apk.",
      },
      { status: 404 }
    );
  }

  const stat = statSync(apkPath);
  const nodeStream = createReadStream(apkPath);

  const stream = new ReadableStream({
    start(controller) {
      nodeStream.on("data", (chunk) => controller.enqueue(chunk));
      nodeStream.on("end", () => controller.close());
      nodeStream.on("error", (err) => controller.error(err));
    },
    cancel() {
      nodeStream.destroy();
    },
  });

  return new NextResponse(stream, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.android.package-archive",
      "Content-Disposition": 'attachment; filename="rollcall.apk"',
      "Content-Length": stat.size.toString(),
      "Cache-Control": "public, max-age=3600, must-revalidate",
    },
  });
}
