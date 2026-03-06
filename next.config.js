/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  serverExternalPackages: ['better-sqlite3'],
  // Prevent Next from incorrectly inferring the monorepo root due to multiple lockfiles.
  // This keeps output file tracing scoped to this app for consistent deploys (e.g. Railway).
  outputFileTracingRoot: path.join(__dirname)
}

module.exports = nextConfig
