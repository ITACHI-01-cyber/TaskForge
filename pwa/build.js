import { createHash } from 'node:crypto'
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

export default function taskforgePwa() {
  let output

  return {
    name:'taskforge-pwa',
    apply:'build',
    configResolved(config) {
      if (config.build.write && !config.build.ssr) output = resolve(config.root,config.build.outDir)
    },
    transformIndexHtml() {
      return [{tag:'script',attrs:{src:'/register-sw.js',defer:true},injectTo:'body'}]
    },
    async closeBundle() {
      if (!output) return
      const emitted = await readdir(join(output,'assets'),{recursive:true,withFileTypes:true})
      const assets = emitted.filter(file => file.isFile()).map(file => {
        const parent = file.parentPath.replaceAll('\\','/')
        const root = output.replaceAll('\\','/')
        return parent.slice(root.length) + '/' + file.name
      })
      const paths = ['/index.html','/images/auth-mountains.webp',...assets].sort()
      const hash = createHash('sha256')
      const worker = await readFile(new URL('service-worker.js',import.meta.url),'utf8')
      hash.update(worker)
      for (const path of paths) {
        hash.update(path)
        hash.update(await readFile(join(output,path.slice(1))))
      }
      const release = {cache:'taskforge-static-'+hash.digest('hex').slice(0,16),paths}
      const source = 'const release = ' + JSON.stringify(release) + '\n' + worker
      await writeFile(join(output,'sw.js'),source)
    },
  }
}
