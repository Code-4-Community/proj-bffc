# Media

Public `GET /media/:siteId` lists a site's images and videos.

Stewards and admins upload with multipart form data:

- `POST /image` — jpeg, png, gif, webp; max 10MB
- `POST /video` — mp4, mov; max 100MB

Each request must include `file` and `siteId`. The file is stored in the S3 media bucket (`AWS_MEDIA_BUCKET_NAME`); only the object key and metadata are saved in Postgres. Stewards may upload only to their own site; admins may upload to any site. If the database insert fails after S3 upload, the object is deleted.
