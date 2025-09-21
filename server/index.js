import 'dotenv/config'
import express from 'express'
import adminUsers from './routes/admin-users.js'
import adminAnalytics from './routes/admin-analytics.js'
import courierPanel from './routes/courier-panel.js'
import ordersCheckout from './routes/orders-checkout.js'
import ordersLive from './routes/orders-live.js'
import publicCore from './routes/02-public-core.js'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

// DB ist optional; Health prüft, ob sie antwortet
let dbQuery = async ()=>({ rows: [] })
try {
  const dbmod = await import('./db/index.js')
  dbQuery = dbmod.query || (dbmod.default && dbmod.default.query) || dbQuery
} catch (_) {}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
app.disable('x-powered-by')
app.use(cors({ origin: '*'}));
app.use(express.json({ limit: '1mb' }));
app.use('/api/courier', courierPanel);

app.use('/api', ordersCheckout);
app.use('/api', ordersLive);
app.use('/api', publicCore);

// --- Health
app.get('/api/health', async (_req,res)=>{
  let db = true
  try { await dbQuery('SELECT 1', []) } catch { db = false }
  res.json({ ok:true, db })
})

// --- Vorhandene Router aus ./routes automatisch mounten
const routesDir = path.join(__dirname, 'routes')
if (fs.existsSync(routesDir)) {
  for (const f of fs.readdirSync(routesDir)) {
    if (!f.endsWith('.js')) continue
    try {
      const mod = await import(path.join(routesDir, f))
      const router = mod.default || mod.router
      if (typeof router === 'function') {
        app.use('/api', router);
        console.log('[routes] mounted:', f)
      }
    } catch (e) {
      console.warn('[routes] skip', f, '-', e?.message)
    }
  }
}

// --- Statische Website (Vite build)
const dist = path.join(__dirname, '../web/dist')
if (fs.existsSync(dist)) {
  app.use(express.static(dist, { index: 'index.html', extensions: ['html'] }));
  // SPA-Fallback
  app.get(/^(?!\/api\/).*/, (_req,res)=> res.sendFile(path.join(dist, 'index.html')))
} else {
  console.warn('[web] dist/ fehlt – baue das Frontend und starte neu.')
}

const PORT = Number(process.env.PORT || 8080)
app.use('/api', require('./routes/courier_compat.js'));
app.listen(PORT, ()=> console.log(`[server] Plug Fusion läuft auf http://localhost:${PORT}`))
\n// Galerie-Uploads\nconst adminUploadRoute = require('./routes/admin-upload')\napp.use('/api/admin/upload', adminUploadRoute)

// plug-fusion auto-added routes (fallback register)
try { require("./routes/ui-extra")(app); } catch {}
try { require("./routes/courier-panel-compat")(app); } catch {}

// auto-added: chat SSE compat routes
try { require("./routes/chat-sse-compat")(app); } catch (e) { console.warn("chat-sse-compat failed:", e && e.message); }

// auto-added: ui extras
try { require("./routes/ui-extra")(app); } catch (e) { console.warn("auto-added: ui extras failed:", e && e.message); }

// auto-added: catalog compat
try { require("./routes/catalog-compat")(app); } catch (e) { console.warn("auto-added: catalog compat failed:", e && e.message); }

// auto-added: orders compat
try { require("./routes/orders-compat")(app); } catch (e) { console.warn("auto-added: orders compat failed:", e && e.message); }

// auto-added: orders live compat
try { require("./routes/orders-live-compat")(app); } catch (e) { console.warn("auto-added: orders live compat failed:", e && e.message); }
