# Roboclock

## Deployment
This requires a fairly new version of Node.js and the PXT CLI.
The following instructions already assume you have them installed and configured properly for this workspace.

1. Regenerate `pxt.json` using `build/regenerateTemplate.mjs`: `node build/regenerateTemplate.mjs`
    > This has to be done only if you add/remove files to the src/ directory.
2. Deploy the project via `pxt deploy`

The bundled `deploy.sh` script should do this for you.


## Configuration
See [src/pins.ts](src/pins.ts)