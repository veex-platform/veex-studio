# VEEX Studio (Visual Editor) 

A Low-Code visual design environment for creating complex industrial flows.

## Features:
- **Visual Flow Editor**: Interactive canvas based on React Flow.
- **One-Click Deploy**: Direct integration with the Registry Cloud.
- **VDL Live Export**: Automatic diagram export to the canonical `.vdl` format.
- **Aesthetics**: Premium Interface with Dark Mode and Glassmorphism.

## Tech Stack:
- React / Vite / TypeScript.
- Vanilla CSS for maximum performance.

## Registry Configuration

The Studio connects to the VEEX Platform API for template fetching and firmware builds.

**Default**: `https://registry.veexplatform.com/api/v1` (production cloud registry)

### Development Setup

For local development with a self-hosted registry:

```bash
# Create .env.local file
echo "VITE_REGISTRY_URL=http://localhost:80/api/v1" > .env.local

# Start dev server
npm run dev
```

### Docker Deployment

```bash
# Build with custom registry
docker build --build-arg VITE_REGISTRY_URL=https://registry.example.com/api/v1 -t veex-studio .

# Or set at runtime (requires rebuild)
docker run -e VITE_REGISTRY_URL=http://192.168.1.100:80/api/v1 veex-studio
```

### Production Build

```bash
# Build for production with custom registry
VITE_REGISTRY_URL=https://registry.example.com/api/v1 npm run build
```

---
[View Online](https://veex-platform.github.io/veex-studio) | [Documentation](https://github.com/veex-platform/veex-docs)




