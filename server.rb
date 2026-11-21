require 'webrick'
require 'json'

ROOT = File.expand_path(__dir__)
FEED_PATH = File.join(ROOT, 'indexed_feed.json')
INDEXER_PATH = File.join(ROOT, 'indexer.rb')

MIME = {
  '.html' => 'text/html; charset=utf-8',
  '.css'  => 'text/css; charset=utf-8',
  '.js'   => 'application/javascript; charset=utf-8',
  '.json' => 'application/json; charset=utf-8',
  '.svg'  => 'image/svg+xml',
  '.png'  => 'image/png'
}.freeze

server = WEBrick::HTTPServer.new(Port: 8765)

server.mount_proc('/api/feed') do |_req, res|
  res['Content-Type'] = 'application/json; charset=utf-8'
  if File.file?(FEED_PATH)
    res.status = 200
    res.body = File.binread(FEED_PATH)
  else
    res.status = 200
    res.body = JSON.generate({ lastSyncedAt: nil, totalItems: 0, sources: [], items: [] })
  end
end

server.mount_proc('/api/sync') do |req, res|
  res['Content-Type'] = 'application/json; charset=utf-8'
  if req.request_method != 'POST'
    res.status = 405
    res.body = JSON.generate({ error: 'Use POST /api/sync' })
  else
    ok = system('/usr/bin/ruby', INDEXER_PATH)
    feed = File.file?(FEED_PATH) ? JSON.parse(File.binread(FEED_PATH)) : {}
    res.status = ok ? 200 : 500
    res.body = JSON.generate({ ok: ok, feed: feed })
  end
end

server.mount_proc('/') do |req, res|
  rel = req.path == '/' ? '/index.html' : req.path
  full = File.expand_path(File.join(ROOT, rel))
  if full.start_with?(ROOT) && File.file?(full)
    res.status = 200
    res['Content-Type'] = MIME[File.extname(full)] || 'application/octet-stream'
    res.body = File.binread(full)
  else
    res.status = 404
    res['Content-Type'] = 'text/plain'
    res.body = 'Not Found'
  end
end

trap('INT') { server.shutdown }
trap('TERM') { server.shutdown }
server.start
