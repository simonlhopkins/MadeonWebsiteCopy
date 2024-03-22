const axios = require("axios");
const fs = require("fs");
const path = require("path");

// URL of the OGG file you want to download
const oggUrl =
  "https://adventuremachine.4thfloorcreative.co.uk/adventuremachine/wmas/assets/audio/sounds.1.14.ogg";

// Directory where you want to save the downloaded file
const downloadDirectory = "./oggs";

// Ensure the download directory exists
if (!fs.existsSync(downloadDirectory)) {
  fs.mkdirSync(downloadDirectory, { recursive: true });
}

// Function to download the file
async function downloadFile(url, filePath) {
  const response = await axios({
    url: url,
    method: "GET",
    responseType: "stream",
  });

  response.data.pipe(fs.createWriteStream(filePath));

  return new Promise((resolve, reject) => {
    response.data.on("end", () => {
      resolve();
    });

    response.data.on("error", (err) => {
      reject(err);
    });
  });
}

// Filename for the downloaded file (you can modify this as needed)
const filename = "test.ogg";

// Full path to save the file
const filePath = path.join(downloadDirectory, filename);

const numSounds = 16;
const numBass = 10;
const numDrum = 10;

const urlPrefix =
  "https://adventuremachine.4thfloorcreative.co.uk/adventuremachine/wmas/assets/audio/";

const getOggFiles = (type, number) => {
  let promises = [];

  for (let i = 1; i < number + 1; i++) {
    const filename = `${type}.1.${i}.ogg`;
    promises.push(downloadFile(urlPrefix + filename, "./oggs/" + filename));
  }
  return Promise.all(promises);
};

async function main() {
  await getOggFiles("sounds", numSounds);
  await getOggFiles("bass", numBass);
  await getOggFiles("drum", numDrum);
}

main();
