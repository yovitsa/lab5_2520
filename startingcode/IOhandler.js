const fs = require('fs');
const fsPromises = fs.promises;
const PNG = require('pngjs').PNG;
const yauzl = require('yauzl');
const path = require('path');

/**
 * Description: decompress file from given pathIn, write to given pathOut
 *
 * @param {string} pathIn
 * @param {string} pathOut
 * @return {promise}
 */
const unzip = async (pathIn, pathOut) => {
  try {
    await fsPromises.mkdir(pathOut, { recursive: true });

    yauzl.open(pathIn, { lazyEntries: true }, (err, zipFile) => {
      if (err) throw err;

      zipFile.readEntry();
      zipFile.on('entry', async (entry) => {
        if (/\/$/.test(entry.fileName)) {
          // Directory entry, skip it
          zipFile.readEntry();
          return;
        }

        const writePath = path.join(pathOut, entry.fileName);
        await fsPromises.mkdir(path.dirname(writePath), { recursive: true });

        zipFile.openReadStream(entry, (err, readStream) => {
          if (err) throw err;

          readStream.pipe(fs.createWriteStream(writePath));
          readStream.on('end', () => {
            zipFile.readEntry();
          });
        });
      });

      zipFile.on('end', () => {
        zipFile.close();
      });
    });
  } catch (error) {
    console.error('Error during unzip operation:', error);
  }
};

/**
 * Description: Read the contents of a directory
 *
 * @param {string} dir - The directory path
 * @return {Promise<string[]>} - A promise that resolves with an array of filenames
 */
const readDir = async (dir) => {
  try {
    const files = await fsPromises.readdir(dir);
    return files.filter((file) => file.endsWith(".png")).map((file) => path.join(dir, file));
  } catch (error) {
    console.error("Failed to read directory:", error);
    return [];
  }
};

/**
 * Description: Read in png file by given pathIn,
 * convert to grayscale and write to given pathOut
 *
 * @param {string} filePath
 * @param {string} pathProcessed
 * @return {promise}
 */
const grayScale = async (pathIn, pathOut) => {  
  try {
    const data = await fsPromises.readFile(pathIn);
    const png = PNG.sync.read(data);

    for (let y = 0; y < png.height; y++) {
      for (let x = 0; x < png.width; x++) {
        const idx = (png.width * y + x) * 4;
        const r = png.data[idx];
        const g = png.data[idx + 1];
        const b = png.data[idx + 2];

        // Calculate the grayscale value (average of RGB)
        const gray = (r + g + b) / 3;

        // Set R, G, and B to the grayscale value
        png.data[idx] = gray;
        png.data[idx + 1] = gray;
        png.data[idx + 2] = gray;
      }
    }

    const buffer = PNG.sync.write(png);
    await fsPromises.writeFile(pathOut, buffer);
    console.log(`Grayscaled image saved to ${pathOut}`);
  } catch (error) {
    console.error("Failed to grayscale image:", error);
  }
};

module.exports = { unzip, readDir, grayScale };
