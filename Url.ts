// This file contains the server/client development and production urls

class ServerUrl {
  static dev = 'http://localhost:7090'
  static prod = 'https://bloggy.raakeshpatel.com/api'

  static get url () {
    return process.env.NODE_ENV == 'development'
      ? this.dev
      : this.prod
  }
}

class ClientUrl {
  static dev = 'http://localhost:3000'
  static prod = 'https://bloggy.raakeshpatel.com'

  static get url () {
    return process.env.NODE_ENV == 'development' ? this.dev : this.prod
  }
}

export { ServerUrl, ClientUrl }
