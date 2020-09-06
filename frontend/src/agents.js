import superagentPromise from 'superagent-promise'
import _superagent from 'superagent'

const superagent = superagentPromise(_superagent, global.Promise)
export const MAIN_API_ROOT = "https://localhost:5000"

const responseBody = res => res.body
const responseFile = res => res

let token = null
const tokenPlugin = req => {
  if (token) {
    req.set('authorization', `Bearer ${token}`)
  }
}

const requests = {
  del: (API, url, body) =>
    superagent
      .del(`${API}${url}`)
      .send(body)
      .use(tokenPlugin)
      .then(responseBody),
  get: (API, url) =>
    superagent
      .get(`${API}${url}`)
      .use(tokenPlugin)
      .then(responseBody),
  getFile: (API, url) =>
    superagent
      .get(`${API}${url}`)
      .use(tokenPlugin)
      .then(responseFile),
  put: (API, url, body) =>
    superagent
      .put(`${API}${url}`, body)
      .use(tokenPlugin)
      .then(responseBody),
  post: (API, url, body) =>
    superagent
      .post(`${API}${url}`, body)
      .use(tokenPlugin)
      .then(responseBody)
}

export default {
  requests,
  setToken: _token => {
    token = _token
  }
}
