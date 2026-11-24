param([int]$Port = 8765, [switch]$NoBrowser)
# Tiny local web server for Claude Quest (YouTube videos need the game to run from a web address).
$root = [IO.Path]::GetFullPath((Split-Path -Parent $MyInvocation.MyCommand.Path))
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host ""
Write-Host "  Claude Quest is running at http://localhost:$Port/" -ForegroundColor Magenta
Write-Host "  Keep this window open while you play. Close it to stop the game." -ForegroundColor Gray
Write-Host ""
if (-not $NoBrowser) { Start-Process "http://localhost:$Port/" }
$mime = @{
  '.html' = 'text/html; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'; '.css' = 'text/css; charset=utf-8'
  '.json' = 'application/json'; '.png' = 'image/png'; '.jpg' = 'image/jpeg'; '.svg' = 'image/svg+xml'
  '.mp3' = 'audio/mpeg'; '.ogg' = 'audio/ogg'; '.ico' = 'image/x-icon'; '.md' = 'text/plain; charset=utf-8'
}
while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  try {
    $path = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath)
    if ($path -eq '/') { $path = '/index.html' }
    $file = [IO.Path]::GetFullPath((Join-Path $root $path.TrimStart('/')))
    if ($file.StartsWith($root) -and (Test-Path -LiteralPath $file -PathType Leaf)) {
      $bytes = [IO.File]::ReadAllBytes($file)
      $ext = [IO.Path]::GetExtension($file).ToLower()
      $type = $mime[$ext]; if (-not $type) { $type = 'application/octet-stream' }
      $ctx.Response.ContentType = $type
      $ctx.Response.Headers.Add('Cache-Control', 'no-cache')
      $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $ctx.Response.StatusCode = 404
    }
  } catch {
  } finally {
    $ctx.Response.Close()
  }
}
