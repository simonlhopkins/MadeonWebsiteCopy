const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");

function convertOggToMp3(inputFolder, outputFolder) {
  // Create the output folder if it doesn't exist
  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
  }

  // Get a list of files in the input folder
  fs.readdir(inputFolder, (err, files) => {
    if (err) {
      console.error("Error reading input folder:", err);
      return;
    }

    // Iterate through the files
    files.forEach((file) => {
      const inputFile = path.join(inputFolder, file);
      const outputFile = path.join(
        outputFolder,
        path.parse(file).name + ".mp3"
      );

      // Check if the file is an OGG file
      if (path.extname(file).toLowerCase() === ".ogg") {
        // Convert OGG to MP3
        ffmpeg(inputFile)
          .noVideo()
          .audioCodec("libmp3lame")
          .format("mp3")
          .save(outputFile)
          .on("end", () => {
            console.log(`Converted ${file} to MP3`);
          })
          .on("error", (err) => {
            console.error(`Error converting ${file}:`, err);
          });
      } else {
        console.log(`${file} is not an OGG file. Skipping...`);
      }
    });
  });
}

// Usage example:
const inputFolder = "./oggs";
const outputFolder = "./mp3";

convertOggToMp3(inputFolder, outputFolder);
