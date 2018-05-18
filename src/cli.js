#!/usr/bin/env node

const args = require('args')

args
  .option(['j', 'coverage-json'], 'Relative path to istanbul coverage JSON', 'coverage/coverage-final.json')
  .option(['c', 'coverage-html'], 'Relative path to coverage html root (for artifact links)', 'coverage/lcov-report')
  .option(['g', 'github-domain'], 'Github Domain', 'api.github.com')
  .option(['d', 'circle-domain'], 'Circle Domain', 'circleci.com')
  .option(['p', 'github-base-path'], 'Github Base Path', '/')
  .option(['b', 'branch'], 'Base branch to use if not PR', 'master')

const {
  coverageJson,
  coverageHtml,
  githubDomain,
  githubBasePath,
  circleDomain,
  branch
} = args.parse(process.argv)

const { postComment } = require('./github-comment')

try {
  const params = {
    root: process.cwd(),
    coverageJsonFilename: coverageJson,
    coverageHtmlRoot: coverageHtml,
    githubDomain,
    githubBasePath,
    circleDomain,
    defaultBaseBranch: branch
  }
  const url = postComment(params)
  console.log('Posted to ', url)
} catch (err) {
  console.error(err)
}
