# Start the local Next.js dev server.
#
# Usage:
#   .\scripts\dev.ps1
#   .\scripts\dev.ps1 -Clean    # stop anything on the dev port first
#
# Or: npm run dev:local

param(
  [switch]$Clean
)

$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

$args = @("scripts/dev.mjs")
if ($Clean) {
  $args += "--clean"
}

node @args
