# Serverless Nim plugin
[![npm version](https://badge.fury.io/js/%40epiphone%2Fserverless-nim.svg)](https://badge.fury.io/js/%40epiphone%2Fserverless-nim)

Easier builds/packaging for Nim Lambda functions on the AWS `provided` runtime.

- Compile Nim functions automatically on serverless workflow commands such as `deploy` or `package` - no need for a manual build step
- Choose between local or dockerized builds ([see below](#build-in-docker))

Built upon [lambci/awslambda.nim](https://github.com/lambci/awslambda.nim), adapted from [softprops/serverless-rust](https://github.com/softprops/serverless-rust/).

Check the **sample project** at https://github.com/epiphone/serverless-nim-sample.

## Setup

### Template

~~The easiest way to get started is via the template:~~ **TODO**

```bash
serverless create --template-url https://github.com/epiphone/serverless-nim-template
```

Alternatively try cloning the sample project from https://github.com/epiphone/serverless-nim-sample.

### Manual setup

First install the NPM dependency with

```bash
yarn add @epiphone/serverless-nim
```

and then include the following configuration in  `serverless.yml`:

```yaml
provider:
  name: aws
  runtime: nim # or use function-specific runtime option

package:
  excludeDevDependencies: false # Not necessary, but speeds up builds since dev dependencies are anyway ignored in case of Nim functions
  individually: true

plugins:
  - "@epiphone/serverless-nim" # Note the parenthesis
```

You also need set up a `.nimble` file with the [`awslambda`](https://github.com/lambci/awslambda.nim) dependency to integrate Nim functions with the custom Lambda runtime.

## Configuration

### Compile flags

Use the `nim.flags` configuration property to set `nimble compile` command flags (defaults to `['-d:release']`):

```yaml
# either globally:
custom:
  nim:
    flags:
      - -d:unsafe

# or per individual function:
functions:
  myFunction:
    nim:
      flags:
        - -d:unsafe
    ...
```

### Build in Docker

Depending on your OS you might want to build Nim functions inside a Docker container to better match the Lambda runtime. Use the following configuration properties to achieve this:

```yaml
custom:
  nim:
    dockerFlags: [] # defaults to []
    dockerTag: nimlang/nim # defaults to nimlang/nim
    useDocker: true # defaults to false
```

One way to speed up Docker builds is to mount your local `~/.nimble` folder as a Docker volume and thus avoid re-fetching dependencies for every Nim function build:

```yaml
custom:
  nim:
    dockerFlags:
      - -v
      - /home/user/.nimble/pkgs:/root/.nimble/pkgs
      - -v
      - /home/user/.nimble/packages_official.json:/root/.nimble/packages_official.json
    useDocker: true
```

### Include files in Lambda package

`serverless-nim` overrides Nim functions packaging configuration with the following configuration:

```yaml
exclude:
  - '**/*'
include:
  - bootstrap
```

If you want to include other files such as static assets in the package, use the [`include` configuration in `serverless.yml`](https://serverless.com/framework/docs/providers/aws/guide/packaging/#exclude--include):

```yaml
# either globally:
package:
  include:
    - assets/configuration.json

# or per individual function:
functions:
  myFunction:
    package:
      include:
        - assets/configuration.json
```

The Nim binary gets automatically included in the package.
