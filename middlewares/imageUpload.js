const multer = require("multer");
const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(16).toString("hex");
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Check if the file type is allowed (e.g., image)
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
  },
});

const deleteLocalImage = async (req, res) => {
  try {
    const { filename } = req.body;
    const filePath = path.join(uploadDir, filename);
    
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      res.status(200).json({ message: "Image deleted successfully." });
    } else {
      res.status(404).json({ message: "Image not found." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting image." });
  }
};

const dynamicImageUpload = async (
  req,
  res,
  next
) => {
  upload.any()(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      console.log(err);
      return res.status(400).json({ message: "Multer error: " + err.message });
    } else if (err) {
      console.log(err);
      return res.status(500).json({ message: "Error: " + err.message });
    }

    try {
      req.images = {};

      // Organize uploaded files by fieldname
      if (req.files && Array.isArray(req.files)) {
        req.files.forEach((file) => {
          if (!req.images[file.fieldname]) {
            req.images[file.fieldname] = [];
          }
          // Store relative path or filename
          req.images[file.fieldname].push({
            filename: file.filename,
            path: `/uploads/${file.filename}`,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size
          });
        });
      }

      // Proceed to the next middleware or route handler
      next();
    } catch (error) {
      console.log(error);
      res.status(500).send("Error processing uploaded files.");
    }
  });
};

module.exports = {
  dynamicImageUpload,
  deleteLocalImage,
};