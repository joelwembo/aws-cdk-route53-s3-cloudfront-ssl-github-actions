import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CloudFrontRoute53Stack } from '../lib/cdk-route53-cloudfront-stack';

const app = new cdk.App();
new CloudFrontRoute53Stack(app, 'CloudFrontRoute53Stack', {
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-east-1' },
});
