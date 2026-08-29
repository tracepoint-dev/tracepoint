/**
 * Stroke the picked element's bounding box onto the screenshot. Freehand
 * annotation is deferred past M1; this is the one mark the flow needs.
 */
import type { Rect, Screenshot } from "../types.js";

const STROKE = "#e1522a";
const STROKE_WIDTH = 2;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("could not load screenshot for annotation"));
    img.src = src;
  });
}

/**
 * @param shot   the (viewport-clipped) screenshot
 * @param rect   the element box in CSS pixels, viewport-relative
 * @returns a new screenshot with the box drawn, or the original on any failure
 */
export async function drawSelectionRect(shot: Screenshot, rect: Rect): Promise<Screenshot> {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = shot.width;
    canvas.height = shot.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return shot;

    const img = await loadImage(shot.dataUrl);
    ctx.drawImage(img, 0, 0, shot.width, shot.height);

    const scale = shot.width / (window.innerWidth || shot.width);
    ctx.strokeStyle = STROKE;
    ctx.lineWidth = STROKE_WIDTH;
    ctx.strokeRect(rect.x * scale, rect.y * scale, rect.width * scale, rect.height * scale);

    return {
      mimeType: "image/png",
      dataUrl: canvas.toDataURL("image/png"),
      width: shot.width,
      height: shot.height,
    };
  } catch {
    return shot;
  }
}
