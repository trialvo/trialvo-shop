type CropAreaPixels = { x: number; y: number; width: number; height: number };

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", (err) => reject(err));
    img.setAttribute("crossOrigin", "anonymous");
    img.src = url;
  });
}

function getExtFromType(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

export async function getCroppedFile(
  imageSrc: string,
  crop: CropAreaPixels,
  fileNameBase: string,
  mimeType: string
): Promise<File> {
  const image = await createImage(imageSrc);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas context not available");
  }

  canvas.width = Math.max(1, Math.floor(crop.width));
  canvas.height = Math.max(1, Math.floor(crop.height));

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (!b) return reject(new Error("Failed to crop image"));
        resolve(b);
      },
      mimeType,
      0.92
    );
  });

  const ext = getExtFromType(mimeType);
  const name = `${fileNameBase}.${ext}`;

  return new File([blob], name, { type: mimeType });
}
