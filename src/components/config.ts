import { register, resolve } from '#di'
import { Argv } from '#type/argv'
import { FS, type FSFile } from '#type/file'

@register({
  singleton: true,
  async factory() {
    const argv = await resolve<Argv>(Argv)
    const fs = await resolve<FS>(FS)

    const configFile = await fs.read('./toma.toml')

    return new Config(argv, configFile)
  },
})
export default class Config {
  constructor(private argv: Argv, private configFile: FSFile) {}
}
