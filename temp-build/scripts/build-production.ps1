# Production Build Script for Pottur School Connect (PowerShell)
# This script handles the complete production build process with optimizations

param(
    [switch]$SkipDeps,
    [switch]$SkipTests,
    [switch]$Package,
    [switch]$Help
)

# Configuration
$ProjectName = "Pottur School Connect"
$BuildDir = "dist"
$LogFile = "build-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"

# Functions
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogMessage = "[$Timestamp] [$Level] $Message"
    Write-Host $LogMessage
    Add-Content -Path $LogFile -Value $LogMessage
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
    Add-Content -Path $LogFile -Value "[SUCCESS] $Message"
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
    Add-Content -Path $LogFile -Value "[WARNING] $Message"
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
    Add-Content -Path $LogFile -Value "[ERROR] $Message"
    exit 1
}

function Test-Dependencies {
    Write-Log "Checking dependencies..."
    
    # Check Node.js
    try {
        $NodeVersion = node --version
        if ($NodeVersion -match "v(\d+)\.(\d+)\.(\d+)") {
            $Major = [int]$Matches[1]
            if ($Major -lt 18) {
                Write-Error "Node.js version $NodeVersion is too old. Required: v18.0.0+"
            }
            Write-Success "Node.js version $NodeVersion is compatible"
        }
    }
    catch {
        Write-Error "Node.js is not installed or not in PATH"
    }
    
    # Check npm
    try {
        $NpmVersion = npm --version
        Write-Success "npm version $NpmVersion is available"
    }
    catch {
        Write-Error "npm is not installed or not in PATH"
    }
}

function Test-Environment {
    Write-Log "Checking environment configuration..."
    
    # Check if production environment file exists
    if (-not (Test-Path ".env.production")) {
        Write-Error ".env.production file not found"
    }
    
    # Check required environment variables
    $RequiredVars = @("VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLISHABLE_KEY", "VITE_APP_DOMAIN")
    $EnvContent = Get-Content ".env.production" -Raw
    
    foreach ($Var in $RequiredVars) {
        if ($EnvContent -notmatch "^$Var=") {
            Write-Error "Required environment variable $Var not found in .env.production"
        }
    }
    
    Write-Success "Environment configuration is valid"
}

function Install-Dependencies {
    Write-Log "Installing dependencies..."
    
    # Clean install
    if (Test-Path "node_modules") {
        Write-Log "Cleaning existing node_modules..."
        Remove-Item -Recurse -Force "node_modules"
    }
    
    if (Test-Path "package-lock.json") {
        npm ci --production=false
    } else {
        npm install
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to install dependencies"
    }
    
    Write-Success "Dependencies installed successfully"
}

function Invoke-QualityChecks {
    Write-Log "Running quality checks..."
    
    # Type checking
    Write-Log "Running TypeScript type checking..."
    npm run type-check
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Type checking failed"
    }
    Write-Success "Type checking passed"
    
    # Linting
    Write-Log "Running ESLint..."
    npm run lint
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Linting failed"
    }
    Write-Success "Linting passed"
}

function Clear-BuildDirectory {
    Write-Log "Cleaning build directory..."
    
    if (Test-Path $BuildDir) {
        Remove-Item -Recurse -Force $BuildDir
        Write-Success "Build directory cleaned"
    }
}

function Build-Application {
    Write-Log "Building application for production..."
    
    # Set production environment
    $env:NODE_ENV = "production"
    
    # Build the application
    npm run build:prod
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Build failed"
    }
    
    if (-not (Test-Path $BuildDir)) {
        Write-Error "Build failed - $BuildDir directory not created"
    }
    
    Write-Success "Application built successfully"
}

function Optimize-Build {
    Write-Log "Optimizing build..."
    
    # Check build size
    $BuildSize = (Get-ChildItem -Recurse $BuildDir | Measure-Object -Property Length -Sum).Sum
    $BuildSizeHuman = "{0:N2} MB" -f ($BuildSize / 1MB)
    Write-Log "Build size: $BuildSizeHuman"
    
    # Count files
    $FileCount = (Get-ChildItem -Recurse -File $BuildDir).Count
    Write-Log "Total files: $FileCount"
    
    # Check for large files
    Write-Log "Checking for large files (>1MB)..."
    $LargeFiles = Get-ChildItem -Recurse -File $BuildDir | Where-Object { $_.Length -gt 1MB }
    
    if ($LargeFiles) {
        Write-Warning "Large files found:"
        foreach ($File in $LargeFiles) {
            $Size = "{0:N2} MB" -f ($File.Length / 1MB)
            Write-Warning "  $($File.FullName) ($Size)"
        }
    } else {
        Write-Success "No large files found"
    }
    
    # Generate build report
    New-BuildReport
}

function New-BuildReport {
    Write-Log "Generating build report..."
    
    $ReportFile = "build-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
    
    $BuildSize = (Get-ChildItem -Recurse $BuildDir | Measure-Object -Property Length -Sum).Sum
    $FileCount = (Get-ChildItem -Recurse -File $BuildDir).Count
    
    try {
        $GitCommit = git rev-parse HEAD 2>$null
        $GitBranch = git rev-parse --abbrev-ref HEAD 2>$null
    }
    catch {
        $GitCommit = "unknown"
        $GitBranch = "unknown"
    }
    
    $Report = @{
        project = $ProjectName
        buildTime = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        buildSize = $BuildSize
        buildSizeHuman = "{0:N2} MB" -f ($BuildSize / 1MB)
        fileCount = $FileCount
        nodeVersion = (node --version)
        npmVersion = (npm --version)
        gitCommit = $GitCommit
        gitBranch = $GitBranch
    }
    
    $Report | ConvertTo-Json -Depth 3 | Out-File -FilePath $ReportFile -Encoding UTF8
    
    Write-Success "Build report generated: $ReportFile"
}

function Test-Build {
    Write-Log "Running build tests..."
    
    # Check if index.html exists
    if (-not (Test-Path "$BuildDir\index.html")) {
        Write-Error "index.html not found in build directory"
    }
    
    # Check if assets directory exists
    if (-not (Test-Path "$BuildDir\assets")) {
        Write-Error "assets directory not found in build directory"
    }
    
    # Check for JavaScript files
    $JsFiles = Get-ChildItem -Recurse -File "$BuildDir\*.js"
    if ($JsFiles.Count -eq 0) {
        Write-Error "No JavaScript files found in build"
    }
    
    # Check for CSS files
    $CssFiles = Get-ChildItem -Recurse -File "$BuildDir\*.css"
    if ($CssFiles.Count -eq 0) {
        Write-Warning "No CSS files found in build"
    }
    
    Write-Success "Build tests passed"
}

function New-Package {
    Write-Log "Packaging build for deployment..."
    
    $PackageName = "pottur-school-connect-$(Get-Date -Format 'yyyyMMdd-HHmmss').zip"
    
    Compress-Archive -Path "$BuildDir\*" -DestinationPath $PackageName -Force
    
    $PackageSize = (Get-Item $PackageName).Length
    $PackageSizeHuman = "{0:N2} MB" -f ($PackageSize / 1MB)
    
    Write-Success "Build packaged: $PackageName ($PackageSizeHuman)"
    
    return $PackageName
}

function Show-Summary {
    param([string]$PackageName = "")
    
    Write-Success "=== BUILD SUMMARY ==="
    Write-Success "Project: $ProjectName"
    Write-Success "Build completed at: $(Get-Date)"
    Write-Success "Build directory: $BuildDir"
    
    $BuildSize = (Get-ChildItem -Recurse $BuildDir | Measure-Object -Property Length -Sum).Sum
    $BuildSizeHuman = "{0:N2} MB" -f ($BuildSize / 1MB)
    Write-Success "Build size: $BuildSizeHuman"
    Write-Success "Log file: $LogFile"
    
    if ($PackageName) {
        Write-Success "Package: $PackageName"
    }
    
    Write-Success "=== NEXT STEPS ==="
    Write-Log "1. Test the build locally: npm run preview:prod"
    Write-Log "2. Deploy using Docker: npm run docker:build && npm run docker:run"
    Write-Log "3. Deploy to VPS: Follow VPS_DEPLOYMENT_GUIDE.md"
}

function Show-Help {
    Write-Host "Usage: .\build-production.ps1 [options]"
    Write-Host "Options:"
    Write-Host "  -SkipDeps     Skip dependency installation"
    Write-Host "  -SkipTests    Skip quality checks"
    Write-Host "  -Package      Create deployment package"
    Write-Host "  -Help         Show this help"
}

# Main execution
function Main {
    if ($Help) {
        Show-Help
        return
    }
    
    Write-Log "Starting production build for $ProjectName"
    
    try {
        # Execute build steps
        Test-Dependencies
        Test-Environment
        
        if (-not $SkipDeps) {
            Install-Dependencies
        }
        
        if (-not $SkipTests) {
            Invoke-QualityChecks
        }
        
        Clear-BuildDirectory
        Build-Application
        Optimize-Build
        Test-Build
        
        $PackageName = ""
        if ($Package) {
            $PackageName = New-Package
        }
        
        Show-Summary -PackageName $PackageName
        
        Write-Success "Production build completed successfully!"
    }
    catch {
        Write-Error "Build failed: $($_.Exception.Message)"
    }
}

# Run main function
Main