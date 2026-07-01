const { Jimp } = require('jimp');
const fs = require('fs');

const processSignatureTransparency = async (filePath, pngPath) => {
  const image = await Jimp.read(filePath);
  let backgroundPixels = 0;
  const totalPixels = image.bitmap.width * image.bitmap.height;

  // First pass: check heuristic
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
    const r = this.bitmap.data[idx + 0];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];
    const a = this.bitmap.data[idx + 3];
    if (a < 50 || (r > 220 && g > 220 && b > 220)) backgroundPixels++;
  });

  if ((backgroundPixels / totalPixels) < 0.65) {
    fs.unlinkSync(filePath);
    throw new Error('Invalid image detected. Please upload a clear signature on a white or transparent background.');
  }

  // Second pass: Remove background
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
    const r = this.bitmap.data[idx + 0];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];
    if (r > 180 && g > 180 && b > 180) {
      this.bitmap.data[idx + 3] = 0;
    }
  });

  await image.write(pngPath);
  fs.unlinkSync(filePath);
};

module.exports = { processSignatureTransparency };
