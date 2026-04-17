# Next.js & Docker Integration Best Practices

This guide covers critical setup and behavioral considerations when containerizing the Grand Bahama Ferry Platform.

## 1. Environment Variable Behavior

Next.js handles environment variables differently depending on their prefix:

- **`NEXT_PUBLIC_` Prefix**: These variables are **frozen at build time**. They are inlined into the client-side JavaScript bundles. Changing them requires a complete image rebuild.
- **Server-Side Variables**: Variables without the `NEXT_PUBLIC_` prefix (e.g., `API_URL`, `DATABASE_URL`) are read from `process.env` at runtime.
- **Runtime Fallback Strategy**:
  The platform uses a BFF (Backend-for-Frontend) proxy in `apps/web/src/app/api/v1/[...path]/route.ts`. This proxy prioritizes the runtime-only `API_URL` over any build-time `NEXT_PUBLIC_API_URL`, allowing the image to point to different backends (staging, production, internal Docker network) without a rebuild.

## 2. Standalone Output Mode

To optimize images for production, `apps/web/next.config.js` is configured with:
```javascript
output: 'standalone'
```
This causes Next.js to automatically trace dependencies and copy only the necessary files into a `.next/standalone` folder. This drastically reduces image size and removes the need to include thousands of `node_modules` in the final layer.

## 3. Caching and Promotion

- **Build Cache**: Next.js stores cache in `.next/cache`. In CI/CD, this should be persisted across builds to speed up compilation.
- **Image Promotion**: Since we use runtime environment variables for the API and database, the *same* Docker image produced in a "build" step can be promoted across environments (Staging -> Production) simply by changing the environment variables provided to the container at startup.

## 4. Internationalization and UTF-8

To ensure consistent handling of filenames and seafarer data containing special characters (e.g., French or Spanish accents in crew names), the containers should ensure a UTF-8 compatible locale.

In the `Dockerfile`, this is handled by setting the `LANG` environment variable:
```dockerfile
ENV LANG=C.UTF-8
```
This ensures that the Node.js runtime and underlying filesystem operations correctly interpret non-ASCII characters without data corruption.
