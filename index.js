'use strict'
const fs = require('fs')
const { spawnSync } = require('child_process')
const path = require('path')
const PackagePlugin = require('serverless/lib/plugins/package/package')

const IGNORE_OUTPUT = { stdio: ['ignore', process.stdout, process.stderr] }
const NIM_RUNTIME = 'nim'
const PROVIDED_RUNTIME = 'provided'

class ServerlessPlugin {
  constructor(serverless, options) {
    this.serverless = serverless
    this.options = options

    this.hooks = {
      'before:package:createDeploymentArtifacts': this.build.bind(this),
      'after:package:createDeploymentArtifacts': this.cleanup.bind(this),
      'before:deploy:function:packageFunction': this.build.bind(this)
    }

    this.custom = {
      flags: ['-d:release'],
      dockerFlags: '',
      dockerTag: 'nimlang/nim',
      useDocker: false,
      ...((this.serverless.service.custom || {}).nim || {})
    }
  }

  async build() {
    const { config, service } = this.serverless

    if (service.provider.name !== 'aws') {
      this.serverless.cli.log('Nim runtime only supports AWS provider')
      return
    }

    const functionNames = this.nimFunctionNames()

    if (functionNames.length === 0) {
      this.serverless.cli.log('No Nim functions found')
      return
    }

    const packagePlugin = this.serverless.pluginManager.plugins.find(
      plugin => plugin.constructor.name === PackagePlugin.name // TODO: more robust way to access Package plugin?
    )

    if (!packagePlugin) {
      throw new Error('Package plugin not found')
    }

    for (const funcName of functionNames) {
      this.serverless.cli.log(
        `Building and packaging Nim function ${funcName}...`
      )

      const func = service.getFunction(funcName)

      this.compileFunction(func)

      func.package = func.package || {}
      func.package.exclude = ['**/*']
      func.package.include = (func.package.include || []).concat('bootstrap')

      const artifactPath = await packagePlugin.packageFunction(funcName)
      func.package.artifact = path.join(
        '.serverless',
        path.basename(artifactPath)
      )

      // Ensure runtime is set to a sane value for other plugins:
      if (func.runtime === NIM_RUNTIME) {
        func.runtime = PROVIDED_RUNTIME
      }
    }

    if (service.provider.runtime === NIM_RUNTIME) {
      service.provider.runtime = PROVIDED_RUNTIME
    }
  }

  compileFunction(func) {
    const { config } = this.serverless

    const srcPath = path.join(
      config.servicePath,
      path.extname(func.handler) ? func.handler : func.handler + '.nim'
    )
    const binaryPath = path.join(config.servicePath, 'bootstrap')
    const nimFlags = (func.nim || {}).flags || this.custom.flags

    const { status } = this.custom.useDocker
      ? spawnSync(
          'docker',
          [
            'run',
            '--rm',
            '-v',
            `${config.servicePath}:/app`,
            '-w',
            '/app',
            ...this.custom.dockerFlags,
            this.custom.dockerTag,
            'sh',
            '-c',
            `nimble c ${nimFlags.join(' ')} -y -o:bootstrap ${func.handler}`
          ],
          IGNORE_OUTPUT
        )
      : spawnSync(
          'nimble',
          ['c', ...nimFlags, '-y', `-o:${binaryPath}`, srcPath],
          IGNORE_OUTPUT
        )

    if (status !== 0) {
      throw new Error('Compiling Nim function failed - check output above')
    }
  }

  cleanup() {
    const binaryPath = path.join(
      this.serverless.config.servicePath,
      'bootstrap'
    )

    if (fs.existsSync(binaryPath)) {
      fs.unlinkSync(binaryPath)
    }
  }

  nimFunctionNames() {
    const { service } = this.serverless

    const functionNames = this.options.function
      ? [this.options.function]
      : this.serverless.service.getAllFunctions()

    return functionNames.filter(
      name =>
        (service.getFunction(name).runtime || service.provider.runtime) ===
        NIM_RUNTIME
    )
  }
}

module.exports = ServerlessPlugin
