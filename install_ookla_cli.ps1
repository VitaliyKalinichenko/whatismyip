# Install Official Ookla Speedtest CLI for Windows
# This script downloads and installs the official Ookla CLI for maximum accuracy

Write-Host "Installing Official Ookla Speedtest CLI..." -ForegroundColor Green
Write-Host "This will provide maximum accuracy matching Speedtest.net exactly" -ForegroundColor Yellow

# Create temp directory
$tempDir = Join-Path $env:TEMP "speedtest-cli"
if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

# Download URL for Windows
$downloadUrl = "https://install.speedtest.net/app/cli/ookla-speedtest-1.2.0-win64.zip"
$zipPath = Join-Path $tempDir "speedtest-cli.zip"
$extractPath = Join-Path $tempDir "extracted"

try {
    Write-Host "Downloading official Ookla CLI..." -ForegroundColor Blue
    Invoke-WebRequest -Uri $downloadUrl -OutFile $zipPath -UseBasicParsing
    
    Write-Host "Extracting files..." -ForegroundColor Blue
    Expand-Archive -Path $zipPath -DestinationPath $extractPath
    
    # Find the speedtest.exe file
    $speedtestExe = Get-ChildItem -Path $extractPath -Name "speedtest.exe" -Recurse | Select-Object -First 1
    
    if ($speedtestExe) {
        $sourcePath = Join-Path $extractPath $speedtestExe
        
        # Install to a directory in PATH
        $installDir = "C:\Program Files\Ookla"
        if (!(Test-Path $installDir)) {
            New-Item -ItemType Directory -Path $installDir -Force | Out-Null
        }
        
        $destinationPath = Join-Path $installDir "speedtest.exe"
        Copy-Item -Path $sourcePath -Destination $destinationPath -Force
        
        # Add to PATH if not already there
        $currentPath = [Environment]::GetEnvironmentVariable("PATH", [EnvironmentVariableTarget]::Machine)
        if ($currentPath -notlike "*$installDir*") {
            Write-Host "Adding to system PATH..." -ForegroundColor Blue
            [Environment]::SetEnvironmentVariable("PATH", "$currentPath;$installDir", [EnvironmentVariableTarget]::Machine)
            
            # Also add to current session
            $env:PATH += ";$installDir"
        }
        
        Write-Host "✅ Official Ookla CLI installed successfully!" -ForegroundColor Green
        Write-Host "Testing installation..." -ForegroundColor Blue
        
        # Test the installation
        & $destinationPath --version
        
        Write-Host ""
        Write-Host "🎉 Installation complete! Your speed tests will now use the official Ookla CLI." -ForegroundColor Green
        Write-Host "This provides the same accuracy as Speedtest.net website." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Restart your PowerShell/Command Prompt to use 'speedtest' command globally." -ForegroundColor Cyan
        
    } else {
        throw "speedtest.exe not found in downloaded package"
    }
    
} catch {
    Write-Host "❌ Installation failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Manual installation instructions:" -ForegroundColor Yellow
    Write-Host "1. Visit: https://www.speedtest.net/apps/cli" -ForegroundColor White
    Write-Host "2. Download the Windows version" -ForegroundColor White
    Write-Host "3. Extract and add to your PATH" -ForegroundColor White
    Write-Host ""
    Write-Host "The application will still work with fallback HTTP testing." -ForegroundColor Cyan
} finally {
    # Cleanup
    if (Test-Path $tempDir) {
        Remove-Item $tempDir -Recurse -Force
    }
}

Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 