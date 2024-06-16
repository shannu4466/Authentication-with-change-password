const express = require('express')
const sqlite3 = require('sqlite3')
const {open} = require('sqlite')
const path = require('path')
const bcrypt = require('bcrypt')
const app = express()
const datapth = path.join(__dirname, 'userData.db')
let db = null
app.use(express.json())
const initialiseDatabseAndServer = async () => {
  try {
    db = await open({
      filename: datapth,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is running at PORT 3000')
    })
  } catch (e) {
    console.log(`ERROR IS ${e.message}`)
    process.exit(1)
  }
}
initialiseDatabseAndServer()

//User registration
app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  if (password.length < 5) {
    response.status(400)
    response.send('Password is too short')
    return
  }
  const hashedPassword = await bcrypt.hash(request.body.password, 10)
  const getUserQuery = `
    SELECT * FROM user WHERE username = '${username}';
  `
  const dbresponse = await db.get(getUserQuery)
  if (dbresponse === undefined) {
    const createUserQuery = `
      INSERT INTO user (username,name,password,gender,location)
      VALUES (
        '${username}',
        '${name}',
        '${hashedPassword}',
        '${gender}',
        '${location}'
      );
    `
    await db.run(createUserQuery)
    response.send('User created successfully')
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

//User login after registratoin
app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password)
    if (isPasswordMatched === true) {
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

//Change password of the already existing user
app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const selectPreviousUser = `
    SELECT * FROM user WHERE username = '${username}';
  `
  const dbUser = await db.get(selectPreviousUser)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatched = await bcrypt.compare(oldPassword, dbUser.password)
    if (isPasswordMatched === true) {
      if (newPassword.length < 5) {
        response.status(400)
        response.send('Password is too short')
      } else {
        const hashNewPassword = await bcrypt.hash(request.body.newPassword, 10)
        const updateUserdetails = `
          UPDATE user 
          SET password = '${hashNewPassword}'
        `
        await db.run(updateUserdetails)
        response.send('Password updated')
      }
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }
})

module.exports = app
