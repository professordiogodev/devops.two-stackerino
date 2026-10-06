const express = require("express")
require("dotenv").config()

const app = express()
const port = process.env.PORT || 3000
// WHERE is the backend? This is the most important variable of this project!
const backendUrl = process.env.BACKEND_URL || "http://localhost:5500"

app.get("/", async (req, res) => {
  try {
    // The FRONTEND server calls the BACKEND server (service-to-service call)
    const response = await fetch(`${backendUrl}/api/fact`)
    const data = await response.json()

    res.send(`
      <html>
        <head><title>Two-Stackerino</title></head>
        <body style="font-family: sans-serif; max-width: 600px; margin: 40px auto;">
          <h1>🖥️ Two-Stackerino Frontend</h1>
          <p>I am the <b>frontend</b>. I make pages for humans. I asked the backend for a fact:</p>
          <blockquote style="font-size: 1.4em; background: #eef; padding: 16px; border-radius: 8px;">
            ${data.fact}
          </blockquote>
          <p>Answered by backend number <b>${data.backend_number}</b>
             (hostname <code>${data.backend_hostname}</code>) at ${data.time}</p>
          <p><small>Backend URL used: <code>${backendUrl}</code></small></p>
          <p><a href="/">🔄 Get another fact</a></p>
        </body>
      </html>
    `)
  } catch (err) {
    console.error(`Could not reach backend at ${backendUrl}:`, err.message)
    res.status(502).send(`
      <html>
        <body style="font-family: sans-serif; max-width: 600px; margin: 40px auto;">
          <h1>😢 Frontend is up, but the backend is unreachable</h1>
          <p>I tried to call <code>${backendUrl}/api/fact</code> and failed.</p>
          <p>Error: <code>${err.message}</code></p>
          <p>Check: Is the backend running? Is <code>BACKEND_URL</code> correct? Is a firewall blocking the port?</p>
        </body>
      </html>
    `)
  }
})

app.get("/healthcheck", (req, res) => {
  res.status(200).send("Frontend works!")
})

const server = app.listen(port, () => {
  console.log(`Frontend listening on http://localhost:${port}`)
  console.log(`Frontend will call the backend at ${backendUrl}`)
})

process.on("SIGTERM", () => server.close(() => process.exit(0)))
process.on("SIGINT", () => server.close(() => process.exit(0)))
