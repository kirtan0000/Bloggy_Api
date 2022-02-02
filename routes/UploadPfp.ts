import express, { Request, Response } from 'express'
const router = express.Router()
const rep = require('../util/replace_sql')
const run_query = require('../util/run_query')
import path from 'path'
const multer = require('multer')
import fs from 'fs'
import random_uuid from '../util/uuid'
import validate_jwt_and_refresh from '../auth/validate_jwt_and_refresh'
import { ServerUrl } from '../Url'

const CurrentServer = ServerUrl.url

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
    limits: { fileSize: 1 * 1024 * 1024 }, // 1 MB file limit
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

      await run_query(rep([file_uuid.split('.')[0]], 'ADD/upload_pfp.sql')) // Create a temporary row in the MySQL database. This will be used to determine if an image exists
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

// The change pfp router
router.post('/change-pfp', async (req: Request, res: Response) => {
  const jwt_token = req.body?.jwt_token
  const refresh_token = req.body?.refresh_token
  const image_id = req.body?.image_id
  let needs_new_jwt = [false, null]

  // If any body data is missing then send an error message
  if (
    jwt_token === undefined ||
    refresh_token === undefined ||
    image_id === undefined
  ) {
    res.status(401).json({
      success: false,
      message: 'Missing valid credentials.',
      status_code: 401
    })
    return
  }

  // Fix/validate any problems with the JWT
  const validate = await validate_jwt_and_refresh(jwt_token, refresh_token)
  if (validate.error) {
    res.json({ success: false, message: validate.message })
    return
  }
  if (validate.needs_new_jwt) needs_new_jwt = [true, validate.new_jwt] // If needs new jwt, update variable
  const username = validate.username

  // Check if the image exists in the database
  const image_exists = !!(
    await run_query(rep([image_id], 'GET/check_pfp_exists.sql'))
  ).length

  // If the image doesn't exist in the database, send an error
  if (!image_exists) {
    res.status(404).json({
      success: false,
      message: "The image doesn't exist. Please try adding a VALID image id. (This id could have been already used, in that case, upload a pfp from the route '/upload-pfp' and try again.)",
      status_code: 404
    })
    return
  }

  // Now that we passed all of the checks, create a url for the image and update the users profile picture with that url, then delete the temporary pfp id used for checks
  const pfp_url = `${CurrentServer}/pfps/${image_id}.jpg`
  await run_query(rep([pfp_url, username], 'UPDATE/set_pfp.sql')) // Set pfp
  await run_query(rep([image_id], 'DELETE/delete_temp_pfp.sql')) // Delete temp pfp

  // Send different results depending on the status of the new JWT token
  if (!needs_new_jwt[0]) {
    res.json({
      success: true,
      message: 'Success!',
      url: pfp_url,
      needs_new_jwt: false
    })
  } else {
    res.json({
      success: true,
      message: 'Success!',
      url: pfp_url,
      needs_new_jwt: true,
      jwt_token: needs_new_jwt[1]
    })
  }
})

export default router
