import express, { Request, Response } from 'express'
const router = express.Router()
const rep = require('../util/replace_sql')
const run_query = require('../util/run_query')
import path from 'path'
const multer = require('multer')
import fs from 'fs'
import random_uuid from '../util/uuid'

// The upload pfp router
router.post('/upload-pfp', async (req: Request, res: Response) => {
  let file_uuid = random_uuid() // Generate a random uuid

  const storage = multer.diskStorage({
    destination: './tmp/pfps/', // The location to temporarily store images
    filename: function (req: Request, file: any, cb: any) {
      if (
        path.extname(file.originalname) === undefined ||
        path.extname(file.originalname) === null
      ) {
        cb(new Error('Only images are allowed.'))
        return
      }
      file_uuid += '.jpg'
      cb(null, file_uuid)
    }
  })

  const upload = multer({
    storage: storage,
    limits: { fileSize: 3 * 1024 * 1024 }, // 3 MB file limit
    fileFilter: function (req: Request, file: any, cb: any) {
      var ext = path.extname(file.originalname)
      if (
        ext.toLowerCase() !== '.png' &&
        ext.toLowerCase() !== '.jpg' &&
        ext.toLowerCase() !== '.jpeg'
      ) {
        cb(new Error('Only images are allowed.'))
        return
      }
      cb(null, true)
    }
  }).single('pfp')

  upload(req, res, async err => {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      if (err.code == 'LIMIT_FILE_SIZE') {
        res.json({ success: false, message: 'The file is too big.' })
        return
      }
    } else if (err) {
      // An unknown error occurred when uploading.
      res.json({ success: false, message: err })
      return
    }
    try {
      await fs.renameSync(
        path.join(__dirname, `../tmp/pfps/${file_uuid}`),
        path.join(__dirname, `../public/pfps/${file_uuid}`) // Move images from /tmp to /pfps
      )
    } catch (error) {
      res.json({
        success: false,
        message: 'An unknown error occured.'
      })
      return
    }
    res.json({
      success: true,
      message: 'Success',
      id: file_uuid.split('.')[0] // Name of file without extension
    })
  })
})

export default router
