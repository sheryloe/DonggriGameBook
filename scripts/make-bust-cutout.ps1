<#
.SYNOPSIS
  Turn a character bust rendered on a flat backdrop into a transparent PNG.

.DESCRIPTION
  Portrait overlays sit on top of whatever background the scene uses, so the
  generated backdrop has to go. The generator is asked for a flat seamless grey
  precisely so this step is reliable.

  Background removal is a flood fill seeded from the image border, not a global
  colour key: a global key would also erase grey inside the subject (hair
  highlights, a grey collar), while a border fill only removes background that is
  actually connected to the edge.

  The pixel work runs as inline C# because the same loop in PowerShell takes
  minutes on a 650k-pixel image. Both System.Drawing and the C# compiler ship
  with Windows, so this adds no dependency to the repo.

.PARAMETER InputPath   Source PNG rendered on a flat backdrop.
.PARAMETER OutputPath  Destination PNG with alpha.
.PARAMETER MaxWidth    Downscale target. UI portraits never need the full render,
                       and this is a Toss mini-app where payload size matters.
.PARAMETER Tolerance   Per-channel distance from the sampled backdrop colour.
#>
param(
  [Parameter(Mandatory = $true)][string]$InputPath,
  [Parameter(Mandatory = $true)][string]$OutputPath,
  [int]$MaxWidth = 720,
  [int]$Tolerance = 40
)

Add-Type -AssemblyName System.Drawing

if (-not (Test-Path -LiteralPath $InputPath)) { throw "input not found: $InputPath" }

$cs = @'
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public static class BustCutout
{
    public struct Result { public int Width, Height, R, G, B, Cleared, Islands, Despilled; public long Bytes; }

    public static Result Run(string inputPath, string outputPath, int maxWidth, int tolerance)
    {
        Bitmap bmp;
        using (var src = Image.FromFile(inputPath))
        {
            double scale = src.Width > maxWidth ? (double)maxWidth / src.Width : 1.0;
            int w = (int)Math.Round(src.Width * scale);
            int h = (int)Math.Round(src.Height * scale);
            bmp = new Bitmap(w, h, PixelFormat.Format32bppArgb);
            using (var g = Graphics.FromImage(bmp))
            {
                g.InterpolationMode = InterpolationMode.HighQualityBicubic;
                g.PixelOffsetMode = PixelOffsetMode.HighQuality;
                g.DrawImage(src, 0, 0, w, h);
            }
        }

        int W = bmp.Width, H = bmp.Height;
        var rect = new Rectangle(0, 0, W, H);
        var data = bmp.LockBits(rect, ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
        int stride = data.Stride;
        byte[] px = new byte[stride * H];
        Marshal.Copy(data.Scan0, px, 0, px.Length);

        // Sample the backdrop from points along the border.
        int[][] pts = new int[][] {
            new[]{2,2}, new[]{W-3,2}, new[]{2,H-3}, new[]{W-3,H-3},
            new[]{W/2,2}, new[]{2,H/2}, new[]{W-3,H/2}
        };
        long sb = 0, sg = 0, sr = 0;
        foreach (var p in pts) { int i = p[1]*stride + p[0]*4; sb += px[i]; sg += px[i+1]; sr += px[i+2]; }
        int bgB = (int)(sb / pts.Length), bgG = (int)(sg / pts.Length), bgR = (int)(sr / pts.Length);

        // Border-seeded flood fill.
        bool[] seen = new bool[W * H];
        int[] stack = new int[W * H];
        int sp = 0, cleared = 0;
        for (int x = 0; x < W; x++) { stack[sp++] = x; stack[sp++] = (H-1)*W + x; }
        for (int y = 0; y < H; y++) { stack[sp++] = y*W; stack[sp++] = y*W + (W-1); }

        while (sp > 0)
        {
            int p = stack[--sp];
            if (seen[p]) continue;
            int x = p % W, y = p / W;
            int i = y*stride + x*4;
            if (Math.Abs(px[i] - bgB) > tolerance || Math.Abs(px[i+1] - bgG) > tolerance || Math.Abs(px[i+2] - bgR) > tolerance) continue;
            seen[p] = true;
            px[i+3] = 0;
            cleared++;
            if (x > 0     && !seen[p-1]) stack[sp++] = p-1;
            if (x < W-1   && !seen[p+1]) stack[sp++] = p+1;
            if (y > 0     && !seen[p-W]) stack[sp++] = p-W;
            if (y < H-1   && !seen[p+W]) stack[sp++] = p+W;
            if (sp > stack.Length - 8) { Array.Resize(ref stack, stack.Length * 2); }
        }

        // Keep only the largest surviving blob. The generator stamps a watermark in
        // a corner, and because it is not backdrop-coloured the flood fill stops at
        // it and leaves it floating in the transparent area.
        int[] label = new int[W * H];
        int best = 0, bestSize = 0, nextLabel = 0;
        int[] queue = new int[W * H];
        for (int start = 0; start < W * H; start++)
        {
            if (label[start] != 0) continue;
            if (px[(start / W) * stride + (start % W) * 4 + 3] == 0) continue;
            nextLabel++;
            int qh = 0, qt = 0, size = 0;
            queue[qt++] = start; label[start] = nextLabel;
            while (qh < qt)
            {
                int p = queue[qh++]; size++;
                int x = p % W, y = p / W;
                if (x > 0     && label[p-1] == 0 && px[y*stride + (x-1)*4 + 3] != 0) { label[p-1] = nextLabel; queue[qt++] = p-1; }
                if (x < W-1   && label[p+1] == 0 && px[y*stride + (x+1)*4 + 3] != 0) { label[p+1] = nextLabel; queue[qt++] = p+1; }
                if (y > 0     && label[p-W] == 0 && px[(y-1)*stride + x*4 + 3] != 0) { label[p-W] = nextLabel; queue[qt++] = p-W; }
                if (y < H-1   && label[p+W] == 0 && px[(y+1)*stride + x*4 + 3] != 0) { label[p+W] = nextLabel; queue[qt++] = p+W; }
            }
            if (size > bestSize) { bestSize = size; best = nextLabel; }
        }
        int islandsRemoved = 0;
        for (int p = 0; p < W * H; p++)
        {
            if (label[p] == 0 || label[p] == best) continue;
            px[(p / W) * stride + (p % W) * 4 + 3] = 0;
            islandsRemoved++;
        }

        byte[] alpha = new byte[W * H];
        for (int y = 0; y < H; y++)
            for (int x = 0; x < W; x++)
                alpha[y*W + x] = px[y*stride + x*4 + 3];

        // A chroma-key backdrop bounces onto the subject, leaving a green rim that
        // survives the fill because those pixels are part of the subject. Clamp the
        // green channel back to the red/blue average, but only near the cutout edge
        // where spill actually lives, so genuinely green pixels further in are safe.
        // Only for a green backdrop; the grey-backdrop renders have no spill to fix.
        int despilled = 0;
        if (bgG > bgR + 60 && bgG > bgB + 60)
        {
            const int reach = 3;
            for (int y = 0; y < H; y++)
            {
                for (int x = 0; x < W; x++)
                {
                    int p = y*W + x;
                    if (alpha[p] == 0) continue;
                    bool nearEdge = false;
                    for (int dy = -reach; dy <= reach && !nearEdge; dy++)
                    {
                        int ny = y + dy; if (ny < 0 || ny >= H) continue;
                        for (int dx = -reach; dx <= reach; dx++)
                        {
                            int nx = x + dx; if (nx < 0 || nx >= W) continue;
                            if (alpha[ny*W + nx] == 0) { nearEdge = true; break; }
                        }
                    }
                    if (!nearEdge) continue;
                    int i = y*stride + x*4;
                    int cap = (px[i] + px[i+2]) / 2;
                    if (px[i+1] > cap) { px[i+1] = (byte)cap; despilled++; }
                }
            }
        }

        // One feather pass so the cutout does not read as a sticker on a dark scene.
        for (int y = 1; y < H-1; y++)
        {
            for (int x = 1; x < W-1; x++)
            {
                int p = y*W + x;
                if (alpha[p] == 0) continue;
                int clear = 0;
                if (alpha[p-1] == 0) clear++;
                if (alpha[p+1] == 0) clear++;
                if (alpha[p-W] == 0) clear++;
                if (alpha[p+W] == 0) clear++;
                if (clear > 0) px[y*stride + x*4 + 3] = (byte)Math.Max(0, 255 - clear * 55);
            }
        }

        Marshal.Copy(px, 0, data.Scan0, px.Length);
        bmp.UnlockBits(data);
        bmp.Save(outputPath, ImageFormat.Png);
        bmp.Dispose();

        var res = new Result();
        res.Width = W; res.Height = H; res.R = bgR; res.G = bgG; res.B = bgB;
        res.Cleared = cleared; res.Islands = islandsRemoved; res.Despilled = despilled;
        res.Bytes = new System.IO.FileInfo(outputPath).Length;
        return res;
    }
}
'@

if (-not ([System.Management.Automation.PSTypeName]'BustCutout').Type) {
  Add-Type -TypeDefinition $cs -ReferencedAssemblies System.Drawing
}

$inFull = (Resolve-Path -LiteralPath $InputPath).Path
$outDir = Split-Path -Parent $OutputPath
if ($outDir -and -not (Test-Path -LiteralPath $outDir)) { New-Item -ItemType Directory -Force -Path $outDir | Out-Null }
$outFull = if ([System.IO.Path]::IsPathRooted($OutputPath)) { [System.IO.Path]::GetFullPath($OutputPath) }
           else { [System.IO.Path]::GetFullPath((Join-Path (Get-Location).ProviderPath $OutputPath)) }

$r = [BustCutout]::Run($inFull, $outFull, $MaxWidth, $Tolerance)

[pscustomobject]@{
  output          = $outFull
  size            = "$($r.Width) x $($r.Height)"
  backdrop_sample = "R$($r.R) G$($r.G) B$($r.B)"
  cleared_pixels  = $r.Cleared
  cleared_percent = [math]::Round((($r.Cleared + $r.Islands) / ($r.Width * $r.Height)) * 100, 1)
  islands_removed = $r.Islands
  despilled       = $r.Despilled
  bytes           = $r.Bytes
} | Format-List


