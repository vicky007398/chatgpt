import {defineConfig} from 'vite';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
// Change the worker whenever application assets change, so installed apps detect releases.
export default defineConfig({plugins:[{name:'kosrent-release-worker',apply:'build',async writeBundle(options,bundle){const hash=createHash('sha256');for(const name of Object.keys(bundle).sort()){const entry=bundle[name];hash.update(name);hash.update(entry.type==='chunk'?entry.code:entry.source)}const file=path.resolve(options.dir||'dist','sw.js');const worker=await readFile(file,'utf8');await writeFile(file,worker.replace('__APP_RELEASE__',hash.digest('hex').slice(0,16)))}}]});
