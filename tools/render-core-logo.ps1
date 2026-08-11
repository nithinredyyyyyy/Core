$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$w = 738
$h = 742
$bmp = New-Object System.Drawing.Bitmap($w, $h)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.Clear([System.Drawing.Color]::Transparent)

$s = $w / 64.0
$g.ScaleTransform($s, $s)
$g.TranslateTransform(0, (($h - $w) / 2.0) / $s)

$cream = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 248, 241))
$ink   = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 15, 23, 42))
$inkDim= New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(235, 15, 23, 42))

# Disc (r = 31 centered at 32,32)
$g.FillEllipse($cream, 1.0, 1.0, 62.0, 62.0)

# Gradient ring (r = 23, stroke width 8, dasharray 112 38, rotate -32)
$ringRect = New-Object System.Drawing.RectangleF(9.0, 9.0, 46.0, 46.0)
$grad = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  $ringRect,
  [System.Drawing.Color]::FromArgb(255, 251, 146, 60),
  [System.Drawing.Color]::FromArgb(255, 252, 211, 77),
  [System.Drawing.Drawing2D.LinearGradientMode]::ForwardDiagonal
)
$ringPen = New-Object System.Drawing.Pen($grad, 8.0)
$ringPen.DashPattern = @([float]14.0, [float]4.75)
$ringPen.DashCap = [System.Drawing.Drawing2D.DashCap]::Round
$ringPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
$ringPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
$state = $g.Save()
$g.TranslateTransform(32, 32)
$g.RotateTransform(-32)
$g.TranslateTransform(-32, -32)
$g.DrawEllipse($ringPen, 9.0, 9.0, 46.0, 46.0)
$g.Restore($state)

# Inner dot (r = 7)
$g.FillEllipse($inkDim, 25.0, 25.0, 14.0, 14.0)

# C swoosh
$inkPen = New-Object System.Drawing.Pen($ink, 4.5)
$inkPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
$inkPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
$inkPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
$pts = [System.Drawing.PointF[]]@(
  (New-Object System.Drawing.PointF(43.0, 20.0)),
  (New-Object System.Drawing.PointF(39.9, 17.2)),
  (New-Object System.Drawing.PointF(36.2, 15.8)),
  (New-Object System.Drawing.PointF(31.9, 15.8)),
  (New-Object System.Drawing.PointF(23.0, 15.8)),
  (New-Object System.Drawing.PointF(15.8, 23.0)),
  (New-Object System.Drawing.PointF(15.8, 31.9)),
  (New-Object System.Drawing.PointF(15.8, 40.8)),
  (New-Object System.Drawing.PointF(23.0, 48.0)),
  (New-Object System.Drawing.PointF(31.9, 48.0)),
  (New-Object System.Drawing.PointF(36.2, 48.0)),
  (New-Object System.Drawing.PointF(39.9, 46.6)),
  (New-Object System.Drawing.PointF(43.0, 43.8))
)
$g.DrawBeziers($inkPen, $pts)

$outPath = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) "..\public\images\core-logo.png"
$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)

$inkPen.Dispose()
$ringPen.Dispose()
$grad.Dispose()
$cream.Dispose()
$ink.Dispose()
$inkDim.Dispose()
$g.Dispose()
$bmp.Dispose()
Write-Output "Wrote $outPath ($w x $h)"
