# Development Workflow for Pottur School Connect

## Overview
This document outlines the safe development workflow for the Pottur School Connect application to ensure zero-downtime deployments and maintain the stability of the live application.

## Branch Structure

### 🌟 **production** branch
- **Purpose**: Mirrors the exact code running on the live PM2 server (port 8080)
- **Status**: Protected - only merge from development after thorough testing
- **Deployment**: Directly deployed to PM2 production server

### 🚀 **development** branch
- **Purpose**: Active development and testing
- **Status**: All new features and fixes are developed here
- **Testing**: Local testing with development server (port 8081)

### 📝 **main** branch
- **Purpose**: Stable codebase, integration point
- **Status**: Receives tested code from development

## Development Workflow

### 1. Starting New Development
```bash
# Switch to development branch
git checkout development

# Pull latest changes
git pull origin development

# Create feature branch (optional for small changes)
git checkout -b feature/your-feature-name
```

### 2. Making Changes
```bash
# Make your code changes
# Test locally using: npm run dev (runs on port 8081)

# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: description of your changes"
```

### 3. Local Testing
```bash
# Start development server
npm run dev

# Test your changes at http://localhost:8081
# Verify all functionality works correctly
# Test with local Supabase (port 54322)
```

### 4. Building and Testing Production Build
```bash
# Build for production
npm run build

# Test production build locally
npx serve -s dist -l 3000

# Verify production build works at http://localhost:3000
```

### 5. Merging to Development
```bash
# Switch to development branch
git checkout development

# Merge your feature (if using feature branch)
git merge feature/your-feature-name

# Push to development
git push origin development
```

### 6. Production Deployment (CRITICAL STEPS)

#### Step 6a: Prepare Production Branch
```bash
# Switch to production branch
git checkout production

# Merge tested development code
git merge development

# Push to production branch
git push origin production
```

#### Step 6b: Deploy to Live Server (Zero Downtime)
```bash
# Build production version
npm run build

# Deploy using PM2 reload (zero downtime)
pm2 reload pottur-school-website

# Verify deployment
pm2 list
curl -I http://localhost:8080
```

## Environment Configuration

### Development Environment
- **Port**: 8081 (npm run dev)
- **Database**: Local Supabase (port 54322)
- **Environment**: `.env` file

### Production Environment
- **Port**: 8080 (PM2 with serve)
- **Database**: Remote Supabase
- **Environment**: `.env.production` file
- **Process Manager**: PM2

## Safety Checklist

### Before Every Deployment ✅
- [ ] All changes tested in development environment
- [ ] Production build created and tested locally
- [ ] No console errors in browser
- [ ] All features working as expected
- [ ] Database migrations applied (if any)
- [ ] Environment variables updated (if needed)

### During Deployment ✅
- [ ] Use `pm2 reload` instead of `pm2 restart` for zero downtime
- [ ] Monitor PM2 logs: `pm2 logs pottur-school-website`
- [ ] Verify application accessibility: `curl -I http://localhost:8080`
- [ ] Check PM2 status: `pm2 list`

### After Deployment ✅
- [ ] Test critical functionality on live site
- [ ] Verify no errors in PM2 logs
- [ ] Confirm all features working correctly
- [ ] Monitor application for 10-15 minutes

## Emergency Rollback

If something goes wrong during deployment:

```bash
# Check PM2 status
pm2 list

# View logs for errors
pm2 logs pottur-school-website

# If needed, rollback to previous commit
git checkout production
git reset --hard HEAD~1
npm run build
pm2 reload pottur-school-website
```

## File Structure

### Important Files
- `.gitignore` - Excludes sensitive files and test scripts
- `start.sh` - PM2 startup script
- `.env` - Development environment variables (NEVER commit)
- `.env.production` - Production environment variables (NEVER commit)
- `package.json` - Dependencies and scripts

### Excluded from Git
- Environment files (`.env*`)
- Test scripts (`test-*.js`, `debug-*.js`)
- Build outputs (`dist/`, `build/`)
- Dependencies (`node_modules/`)
- PM2 files (`.pm2/`)

## Commands Reference

### Development
```bash
npm run dev          # Start development server (port 8081)
npm run build        # Build for production
npm run preview      # Preview production build locally
```

### Git Operations
```bash
git status           # Check current status
git branch -a        # List all branches
git checkout <branch> # Switch branches
git merge <branch>   # Merge branch
git log --oneline    # View commit history
```

### PM2 Operations
```bash
pm2 list             # List all processes
pm2 reload <name>    # Zero-downtime reload
pm2 restart <name>   # Restart process
pm2 logs <name>      # View logs
pm2 show <name>      # Detailed process info
```

## Best Practices

1. **Always test locally first** - Never deploy untested code
2. **Use descriptive commit messages** - Help future debugging
3. **Small, frequent commits** - Easier to track and rollback
4. **Test production builds** - Catch build-specific issues
5. **Monitor after deployment** - Ensure stability
6. **Keep branches updated** - Regular pulls from origin
7. **Use PM2 reload** - Maintain zero downtime
8. **Backup before major changes** - Safety first

## Troubleshooting

### Common Issues
1. **PM2 process not starting**: Check `start.sh` script and port availability
2. **Build failures**: Check for TypeScript errors and missing dependencies
3. **Environment variables**: Ensure correct `.env` files are in place
4. **Database connection**: Verify Supabase configuration

### Getting Help
- Check PM2 logs: `pm2 logs pottur-school-website`
- View application logs in browser console
- Check Git status: `git status`
- Verify build output: `npm run build`

---

**Remember**: The live application serves real users. Always prioritize stability and test thoroughly before deploying to production.