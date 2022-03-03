import express, { Request, Response } from 'express'
const router = express.Router()
const rep = require('../util/replace_sql')
const run_query = require('../util/run_query')
import create_new_jwt from '../auth/create_new_jwt'
import check_jwt_valid from '../auth/check_jwt_valid'
import validate_jwt_and_refresh from '../auth/validate_jwt_and_refresh'
import check_user_exists from '../auth/check_user_exists'

// The route to retrieve user info
router.post('/get-my-info', async (req: Request, res: Response) => {
  const jwt_token = req.body?.jwt_token
  const refresh_token = req.body?.refresh_token
  let needs_new_jwt = [false, null]

  // If any body data is missing then send an error message
  if (jwt_token === undefined || refresh_token === undefined) {
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

  let user_name: string = validate.username // The username from the JWT

  // Check if the user exists from the database, not the JWT token.
  const user_exists = await check_user_exists('non-existent', user_name) // Using 'non-existent' because this file also checks for email.
  if (!user_exists) {
    res.status(404).json({
      success: false,
      message: 'The user does not exist.',
      status_code: 404
    })
    return
  }
  // If user exists, proceed fetching user info.
  let user_pfp: string = ''
  const pfp_info = await run_query(
    rep([refresh_token], 'GET/get_user_info.sql')
  )
  user_pfp = pfp_info[0].user_pfp

  // Send different results depending on the status of the new JWT token
  if (!needs_new_jwt[0]) {
    res.json({
      success: true,
      message: 'Success!',
      user_name,
      user_pfp,
      needs_new_jwt: false
    })
  } else {
    res.json({
      success: true,
      message: 'Success!',
      user_name,
      user_pfp,
      needs_new_jwt: true,
      jwt_token: needs_new_jwt[1]
    })
  }
})

export default router
