---
title: 'AWS S3 & CloudFront Deployment'
collection: guides
tocHeading: 3
order: 7
---

## Deployment from AWS S3 & CloudFront

This requires an [AWS](https://aws.amazon.com/) account and compiled code for your project from running `greenwood build`.

### Setup S3 for Hosting

Create a new bucket in S3, change the permissions to be open to all.

Upload the contents of your 'public' directory (drag and drop all the files and folders, using the interface only grabs files).

Within your bucket, click the "Properties" tab, select "Static website hosting" and check "Use this bucket to host a website
" enter `index.html` to the "index document" input and save.

If you did not set your permissions to open when you created the bucket, go to "Permissions" tab, edit "Block Public Access" to turn those off and save.

Still in (or click on) the "Permissions" tab, click "Bucket Policy" and add the following snippet (putting in your buckets name)

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::your-bucket-name-here/*"
        }
    ]
}
```

...and save. Your site will now be at the address visible in the "Static website hosting" card.

### AWS CloudFront for CDN

Navigate to CloudFront in your AWS account. Click "get started" in the web section. In the "Origin Domain Name" input, select the bucket you are setting up. Further down that form find "Default Root Object" and enter `index.html`, click "Create Distribution", then just wait for the Status to update to "deployed".

Your site is now hosted on S3 with a CloudFront CDN.

### GitHub Actions for Automatic Deployment

Add your AWS Secret KEY and KEY ID to the repositories GitHub secrets.

At the root of your project add '.github/workflows/main.yml'

```yml
name: Upload Website to S3

on:
  push:
    branches:
    - master

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v1
      - name: Navigate to repo
        run: cd $GITHUB_WORKSPACE
      - uses: actions/setup-node@v1
        with:
          node-version: "14.x"
      - name: Install deps
        run: npm install
      - name: Build docs
        run: npm run build
      - name: Publish to AWS S3
        uses: opspresso/action-s3-sync@master
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_SECRET_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_REGION: "us-east-2"
          FROM_PATH: "./public"
          DEST_PATH: "s3://your-s3-bucket-name" #your target s3 bucket name goes here
          OPTIONS: "--acl public-read"
```

Push your updates to your repo and the action will begin automatically.