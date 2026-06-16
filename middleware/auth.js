const STATUS_CODES = require('../utils/statuscode')

async function authenticate(
  request,
  reply
) {

  try {

    await request.jwtVerify()

  } catch (error) {

    return reply.code(STATUS_CODES.UNAUTHORIZED).send({
      success: false,
      message: 'Unauthorized'
    })

  }

}

module.exports = authenticate