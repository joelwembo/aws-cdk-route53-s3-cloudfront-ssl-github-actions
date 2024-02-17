## cdk route53 s3 cloudfront ssl with Github Actions

# Most imporants codes

## Compilation Steps
npm install
npm run build
cdk bootstrap --trust=xxxxxxxxx aws://xxxxxxxxx/ap-southeast-1 --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess aws://xxxxxxxx/ap-southeast-1 --verbose --profile=default

cdk deploy --force --method=direct --require-approval never  --verbose --no-previous-parameters --profile=default