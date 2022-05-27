# birdie

An excuse to experiment with deploying a Rust webapp using shuttle.rs

Easily balances group outing expenses among friends, so that everybody gets to make the fewest money transfers as possible among one another, just at the end of the outing.

Named after the thing you play badminton with, which is also called a "shuttle" :)

## Secrets

If you check out this repo to try for yourself, you will need to create a Secrets.toml file in the repo's directory with keys:

- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- DEPLOY_BUCKET

These should point to an AWS IAM user with permission to use PutObject and GetObject S3 APIs for bucket DEPLOY_BUCKET, which should already exist. This is to ship the built frontend to the Shuttle app at startup time, since it is not yet easy to ship static assets inside the cargo package or anything (it get confused about version control anyway)
