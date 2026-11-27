// Add one entry per S3 bucket your project uses.
// Example: DOCUMENTS = 'DOCUMENTS'
// Then add the matching env var to .env / example.env and a case in mapBucket (aws-s3.service.ts).
export enum S3Buckets {
  MEDIA = 'MEDIA',
}
