import * as route53 from 'aws-cdk-lib/aws-route53';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as cloudfront_origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';

import { BlockPublicAccess, BucketAccessControl } from 'aws-cdk-lib/aws-s3';

import { CfnOutput, Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class CloudFrontRoute53Stack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

      const domain = 'toplivecommerce.com';
      const siteDomain = 'www' + '.' + domain;

      const zone = route53.HostedZone.fromLookup(this, 'Zone', { domainName: domain });

        const certificate = new acm.DnsValidatedCertificate(this, 'SiteCertificate', {
          domainName: domain,
          subjectAlternativeNames: ['*.' + domain],
              hostedZone: zone,
              region: 'us-east-1', 
        });

        certificate.applyRemovalPolicy(RemovalPolicy.DESTROY)

        new CfnOutput(this, 'Certificate', { value: certificate.certificateArn });

        const siteBucket = new s3.Bucket(this, 'SiteBucket', {
          bucketName: siteDomain,
          publicReadAccess: true,
          removalPolicy: RemovalPolicy.DESTROY,
          autoDeleteObjects: true,
          blockPublicAccess: BlockPublicAccess.BLOCK_ACLS,
          accessControl: BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
          websiteIndexDocument: 'index.html',
          websiteErrorDocument: 'error.html'})

          new CfnOutput(this, 'Bucket', { value: siteBucket.bucketName });

        const distribution = new cloudfront.Distribution(this, 'SiteDistribution', {
          certificate: certificate,
          defaultRootObject: "index.html",
          domainNames: [siteDomain, domain],
          minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
          errorResponses:[
            {
              httpStatus: 404,
              responseHttpStatus: 404,
              responsePagePath: 'error.html',
              ttl: Duration.minutes(30),
            }
          ],
          defaultBehavior: {
            origin: new cloudfront_origins.S3Origin(siteBucket),
            compress: true,
            allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
            viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          }
        });

        new CfnOutput(this, 'DistributionId', { value: distribution.distributionId });

        new route53.ARecord(this, 'WWWSiteAliasRecord', {
          zone,
          recordName: siteDomain,
          target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution))
        });
        new route53.ARecord(this, 'SiteAliasRecord', {
          zone,
          recordName: domain,
          target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution))
        });

        new s3deploy.BucketDeployment(this, 'UploadWebsiteContent', {
          sources: [s3deploy.Source.asset('./website-content')],
          destinationBucket: siteBucket,
        });
  }
}
