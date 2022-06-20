# birdie

An excuse to experiment with deploying a Rust + TypeScript webapp using shuttle.rs

Easily balances group outing expenses among friends, so that everybody gets to make the fewest money transfers as possible among one another, just at the end of the outing.

There's no access control or anything, so you could totally enter your friend's already used name and impersonate them if you want. The server will be fine, but I'm not making any calls about what that'll do to your friendship 😉

Named after the thing you play badminton with, which is also called a "shuttle" :)

## Secrets

If you check out this repo to try for yourself, you will need to create a `Secrets.toml` file in the repo's directory with keys:

- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- DEPLOY_BUCKET

These should point to an AWS IAM user with permission to use PutObject and GetObject S3 APIs for bucket DEPLOY_BUCKET, which should already exist. This is to ship the built frontend to the Shuttle app at startup time, since it is not yet easy to ship static assets inside the cargo package or anything (it get confused about version control anyway)

## Deploying

You can deploy this app to Shuttle yourself if you like! You'll need to:

1. Change the name in `Shuttle.toml` to something else
2. Create a `Secrets.toml` file with your secrets in it
3. Run `make deploy`! This will handle deployment for both the Rust Shuttle server and the TypeScript frontend.
