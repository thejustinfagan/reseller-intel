# Fleet Intel & Reseller Intel Synchronization

## Purpose
Maintain consistency between Fleet Intel and Reseller Intel by:
- Sharing UI components
- Keeping dependencies in sync
- Tracking version compatibility

## Synchronization Strategy
- Automated script `sync_with_fleet_intel.sh`
- Copies shared components
- Updates dependencies
- Tracks Fleet Intel version

## Shared Components
- Tailwind configuration
- Next.js configuration
- Base UI components
- Utility functions
- Global styles

## Usage
```bash
./sync_with_fleet_intel.sh
```

## Best Practices
- Run sync before major deployments
- Review copied components manually
- Keep project-specific code separate
- Maintain clear separation of concerns