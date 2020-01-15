# Serverless Nim plugin

Builds upon [lambci/awslambda.nim](https://github.com/lambci/awslambda.nim), adapted from [softprops/serverless-rust](https://github.com/softprops/serverless-rust/).

## Install

TODO

Easiest way to get started is to use the template: TODO

Or clone example project at https://github.com/epiphone/serverless-nim-sample.

## Usage

### Compile flags

Use the `nim.flags` configuration property to set `nimble compile` command flags (defaults to `-d:release`):

```yaml
# either globally:
custom:
  nim:
    flags: '-d:unsafe'

# or per individual function:
functions:
  myFunction:
    nim:
      flags: '-d:unsafe'
    ...
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
    - 'assets/configuration.json'

# or per individual function:
functions:
  myFunction:
    package:
      include:
        - 'assets/configuration.json'
```

The Nim binary gets automatically included in the package.

## TODO
- [ ] test whether working on `sls deploy`
- [ ] Docker build, parameterize Docker image
- [ ] `individually: false`: for now only individual packages are supported
