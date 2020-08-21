import { Command, flags } from '@oclif/command'
import swaggerToTS from '@manifoldco/swagger-to-ts'
import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'
import chalk from 'chalk'

class SwaggerToTs extends Command {
  static description = 'Generate TypeScript types from Swagger OpenAPI specs'

  static examples = [
    `$ npx @kykungz/swagger-to-ts http://localhost:5000/doc-json --output schema.ts --shallow`,
    `$ npx @kykungz/swagger-to-ts schema.yaml --output schema.ts --shallow`,
  ]

  static flags = {
    version: flags.version({ char: 'v' }),
    help: flags.help({ char: 'h' }),

    output: flags.string({
      char: 'o',
      description: 'Location of the output file',
      default: 'schema.ts',
    }),

    shallow: flags.boolean({
      char: 's',
      description: 'Add shallow TypeScript interfaces',
    }),
  }

  static args = [{ name: 'path' }]

  async run() {
    const { args, flags } = this.parse(SwaggerToTs)
    const timeStart = process.hrtime()

    let json = null
    let output = ''

    this.log(chalk.yellow(`\n# 🤞 Loading spec from ${args.path}...`))

    if ((args.path as string).startsWith('http')) {
      const res = await fetch(args.path)
      json = await res.json()
      output = swaggerToTS(json)
    } else {
      json = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), args.path), 'utf8'),
      )

      output = swaggerToTS(json)
    }

    if (flags.shallow) {
      const shallow = Object.keys(json.components.schemas)
        .map((dto) => `export type ${dto} = components['schemas']['${dto}']`)
        .join('\n\n')

      output += '\n' + shallow
    }

    fs.writeFileSync(path.join(process.cwd(), flags.output), output)

    const timeEnd = process.hrtime(timeStart)
    const time = timeEnd[0] + Math.round(timeEnd[1] / 1e6)

    this.log(
      chalk.green(
        `# 🚀 ${args.path} -> ${chalk.bold(flags.output)} [${time}ms]`,
      ),
    )
  }
}

export = SwaggerToTs
