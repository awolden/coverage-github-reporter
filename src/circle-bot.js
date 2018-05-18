
const { basename, join } = require('path')
const { execSync } = require('child_process')

ENV = {
  // Required ENV variables
  auth: 'GH_AUTH_TOKEN',
  buildNum: 'CIRCLE_BUILD_NUM',
  buildUrl: 'CIRCLE_BUILD_URL',
  home: 'HOME',
  pr: 'CI_PULL_REQUEST',
  repo: 'CIRCLE_PROJECT_REPONAME',
  sha1: 'CIRCLE_SHA1',
  username: 'CIRCLE_PROJECT_USERNAME',

  // Aux variables, not in ENV. See Bot.create
  // commitMessage : ''
  // prNumber      : ''
  // githubDomain  : 'api.github.com'
  // githubBasePath  : '/api/v3'
  // circleDomain: 'circleci.com'
}

// Synchronously execute command and return trimmed stdout as string
const exec = (command, options) =>
    execSync(command, options).toString('utf8').trim()

// Syncronously POST to `url` with `data` content
class Bot {
  static create(options = {}) {
    const missing = []
    Object.keys(ENV).forEach(key => {
      const name = ENV[key];
      if (!process.env[name]) missing.push(name)
      ENV[key] = process.env[name]
    })
    if (missing.length > 0) throw new Error(`Missing required environment variables:\n\n${missing.join('\n')}\n`)

    ENV.commitMessage = exec('git --no-pager log --pretty=format:"%s" -1').replace(/\\"/g, '\\\\"')
    ENV.prNumber = basename(ENV.pr)
    ENV.githubDomain = options.githubDomain || 'api.github.com'
    ENV.githubBasePath = options.githubBasePath || ''
    ENV.circleDomain = options.circleDomain || 'circleci.com'
    return new Bot(ENV)
  }
  
  constructor(env) {
    this.env = env;
    this.artifactUrl = (artifactPath) =>
      `${env.buildUrl}/artifacts/0/${env.home}/${env.repo}/${artifactPath}`

    this.artifactLink = (artifactPath, text) =>
        `<a href='${this.artifactUrl(artifactPath)}' target='_blank'>${text}</a>`

    this.githubUrl = (path) => 
        `https://${env.githubDomain}${join('/', env.githubBasePath, path)}`

    this.githubRepoUrl = (path) =>
        this.githubUrl(`repos/${env.username}/${env.repo}/${path}`)

    this.commentIssue = (number, body) =>
        this.curl(this.githubRepoUrl(`issues/${number}/comments`), JSON.stringify({body}))

    this.commentCommit = (sha1, body) =>
        this.curl(this.githubRepoUrl(`commits/${sha1}/comments`), JSON.stringify({body}))

    this.comment = (body) => {
      if (env.prNumber)
          return this.commentIssue(env.prNumber, body)
      else
          return this.commentCommit(env.sha1, body)
    }

    this.curl = (url, data, skipAuth) => {
      const auth = skipAuth ? '' : `-H "Authorization: token ${env.auth}"`
      if (data)
        return exec(`curl -H 'Content-Type: application/json' ${auth} --silent --data @- ${url}`, { input: data })
      else 
        return exec(`curl -H 'Content-Type: application/json' ${auth} --silent ${url}`)
    }

  }
}
module.exports = Bot