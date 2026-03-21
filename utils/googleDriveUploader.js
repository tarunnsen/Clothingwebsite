// utils/googleDriveUploader.js
const { google } = require("googleapis");
const path = require("path");
const stream = require("stream");

// Load credentials from your service account key file (JSON)
const KEYFILE_PATH = path.join(__dirname, "../config/driveCredentials.json"); // change if needed
const SCOPES = ["https://www.googleapis.com/auth/drive"];

const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILE_PATH,
  scopes: SCOPES,
});

const drive = google.drive({ version: "v3", auth });

// 👉 Replace with your actual folder ID on Drive
const FOLDER_ID = "YOUR_GOOGLE_DRIVE_FOLDER_ID";

async function uploadToDrive(file) {
  return new Promise(async (resolve, reject) => {
    try {
      const bufferStream = new stream.PassThrough();
      bufferStream.end(file.buffer);

      const response = await drive.files.create({
        requestBody: {
          name: file.originalname,
          parents: [FOLDER_ID],
        },
        media: {
          mimeType: file.mimetype,
          body: bufferStream,
        },
      });

      const fileId = response.data.id;

      // Make file public
      await drive.permissions.create({
        fileId: fileId,
        requestBody: {
          role: "reader",
          type: "anyone",
        },
      });

      // Get public URL
      const result = await drive.files.get({
        fileId: fileId,
        fields: "webViewLink, webContentLink",
      });

      resolve(result.data.webContentLink); // direct image URL
    } catch (error) {
      console.error("Google Drive Upload Error:", error);
      reject("Upload failed");
    }
  });
}

module.exports = uploadToDrive;
