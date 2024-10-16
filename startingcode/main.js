const fs = require('fs');
const path = require('path');
const IOhandler = require('./IOhandler'); 
const zipFilePath = path.join(__dirname, "myfile.zip");
const pathUnzipped = path.join(__dirname, "unzipped");
const pathProcessed = path.join(__dirname, "grayscaled");

(async () => {
  // Unzip the zip file
  await IOhandler.unzip(zipFilePath, pathUnzipped);

  // Read the unzipped directory and get all PNG files
  const pngFiles = await IOhandler.readDir(pathUnzipped);

  // Ensure the output directory exists
  await fs.promises.mkdir(pathProcessed, { recursive: true });

  // Process each PNG file and save grayscaled version
  for (const file of pngFiles) {
    const outputFile = path.join(pathProcessed, path.basename(file));
    await IOhandler.grayScale(file, outputFile);
  }
})();