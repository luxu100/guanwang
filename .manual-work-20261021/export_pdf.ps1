$ErrorActionPreference = 'Stop'
if ($env:MANUAL_SRC) { $src = $env:MANUAL_SRC }
else { $src = (Get-ChildItem -LiteralPath 'D:\guanwang\guanwang\outputs' -Filter '*.docx' | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName }
$pdf = 'D:\guanwang\guanwang\.manual-work-20261021\render-v2\manual.pdf'
if (Test-Path -LiteralPath $pdf) { Remove-Item -LiteralPath $pdf -Force }
$w = New-Object -ComObject Word.Application
$w.Visible = $false
$doc = $w.Documents.Open($src, $false, $true)
$doc.ExportAsFixedFormat($pdf, 17)
$doc.Close($false)
try { $w.Quit() } catch { }
Write-Output ('PDF_OK ' + (Test-Path -LiteralPath $pdf) + ' ' + (Get-Item -LiteralPath $pdf).Length)
