import { build } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve,dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..')
await build({root:resolve(root,'product'),configFile:false,plugins:[react()],publicDir:false,base:'./',build:{outDir:resolve(root,'artifacts/product-preview'),emptyOutDir:true,assetsInlineLimit:4096,rollupOptions:{input:resolve(root,'product/index.html')}}})
