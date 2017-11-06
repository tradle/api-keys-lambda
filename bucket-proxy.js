const co = require('co')
const { S3 } = require('aws-sdk')
const s3 = new S3()
const Bucket = process.env.FS_BUCKET
const Key = 'blinkid.json'

module.exports.handler = co.wrap(function* (event, context, callback) {
  const respond = responder(callback)
  try {
    const result = yield handleEvent(event)
    respond(200, result)
  } catch (err) {
    console.error(err.stack)
    respond(err.code || 500, { message: err.message })
  }
})

const handleEvent = co.wrap(function* (event) {
  const {
    pathParameters={}
  } = event

  const { file } = pathParameters
  if (!file) {
    throw httpError(400, 'expected "file"')
  }

  try {
    return yield getJSON(`fs/${file}`)
  } catch (err) {
    console.error(err.stack)
    throw httpError(500, 'file not found')
  }
})

const getJSON = co.wrap(function* (Key) {
  console.log('looking up', { Bucket, Key })
  const { Body } = yield s3.getObject({ Bucket, Key }).promise()
  return JSON.parse(Body)
})

const responder = callback => (statusCode, body) => {
  callback(null, {
    statusCode,
    body: JSON.stringify(body)
  })
}

const httpError = (code, message) => {
  const err = new Error(message)
  err.code = code
  return err
}
