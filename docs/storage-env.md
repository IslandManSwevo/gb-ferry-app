# Document Storage Environment Configuration

Set these variables for S3/MinIO-backed uploads in the API service:

```env
# Required
AWS_REGION=us-east-1
AWS_S3_BUCKET=documents-prod

# If using MinIO / custom endpoint
MINIO_ENDPOINT=http://localhost:9000
MINIO_BUCKET=documents
MINIO_ACCESS_KEY=minio
MINIO_SECRET_KEY=minio123

# If using AWS S3 credentials
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
# Optional: override endpoint (e.g., LocalStack)
AWS_S3_ENDPOINT=http://localhost:4566
```

Notes:

- When `AWS_S3_ENDPOINT` or `MINIO_ENDPOINT` is set, path-style access is forced (compatible with MinIO/LocalStack).
- `MINIO_BUCKET` is used for non-production by default; `AWS_S3_BUCKET` is used in production.
- Ensure the bucket exists before running uploads; the service will error if a bucket is required but not configured.
