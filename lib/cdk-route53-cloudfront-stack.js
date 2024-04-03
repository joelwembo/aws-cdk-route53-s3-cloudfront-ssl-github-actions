"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudFrontRoute53Stack = void 0;
const route53 = require("aws-cdk-lib/aws-route53");
const s3 = require("aws-cdk-lib/aws-s3");
const acm = require("aws-cdk-lib/aws-certificatemanager");
const cloudfront = require("aws-cdk-lib/aws-cloudfront");
const targets = require("aws-cdk-lib/aws-route53-targets");
const cloudfront_origins = require("aws-cdk-lib/aws-cloudfront-origins");
const s3deploy = require("aws-cdk-lib/aws-s3-deployment");
const aws_s3_1 = require("aws-cdk-lib/aws-s3");
const aws_cdk_lib_1 = require("aws-cdk-lib");
class CloudFrontRoute53Stack extends aws_cdk_lib_1.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const domain = 'prodxcloud.net';
        const siteDomain = 'www' + '.' + domain;
        const zone = route53.HostedZone.fromLookup(this, 'Zone', { domainName: domain });
        const certificate = new acm.Certificate(this, 'SiteCertificate', {
            domainName: siteDomain,
            validation: acm.CertificateValidation.fromDns(zone),
        });
        certificate.applyRemovalPolicy(aws_cdk_lib_1.RemovalPolicy.DESTROY);
        new aws_cdk_lib_1.CfnOutput(this, 'Certificate', { value: certificate.certificateArn });
        const siteBucket = new s3.Bucket(this, 'SiteBucket', {
            bucketName: siteDomain,
            publicReadAccess: true,
            removalPolicy: aws_cdk_lib_1.RemovalPolicy.DESTROY,
            // autoDeleteObjects: true,
            blockPublicAccess: aws_s3_1.BlockPublicAccess.BLOCK_ACLS,
            accessControl: aws_s3_1.BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
            websiteIndexDocument: 'index.html',
            websiteErrorDocument: 'error.html'
        });
        new aws_cdk_lib_1.CfnOutput(this, 'Bucket', { value: siteBucket.bucketName });
        const distribution = new cloudfront.Distribution(this, 'SiteDistribution', {
            certificate: certificate,
            defaultRootObject: "index.html",
            domainNames: [siteDomain, domain],
            minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
            errorResponses: [
                {
                    httpStatus: 404,
                    responseHttpStatus: 404,
                    responsePagePath: 'error.html',
                    ttl: aws_cdk_lib_1.Duration.minutes(30),
                }
            ],
            defaultBehavior: {
                origin: new cloudfront_origins.S3Origin(siteBucket),
                compress: true,
                allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            }
        });
        new aws_cdk_lib_1.CfnOutput(this, 'DistributionId', { value: distribution.distributionId });
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
exports.CloudFrontRoute53Stack = CloudFrontRoute53Stack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2RrLXJvdXRlNTMtY2xvdWRmcm9udC1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNkay1yb3V0ZTUzLWNsb3VkZnJvbnQtc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsbURBQW1EO0FBQ25ELHlDQUF5QztBQUN6QywwREFBMEQ7QUFDMUQseURBQXlEO0FBQ3pELDJEQUEyRDtBQUMzRCx5RUFBeUU7QUFDekUsMERBQTBEO0FBRTFELCtDQUE0RTtBQUU1RSw2Q0FBb0Y7QUFHcEYsTUFBYSxzQkFBdUIsU0FBUSxtQkFBSztJQUMvQyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQWtCO1FBQzFELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXRCLE1BQU0sTUFBTSxHQUFHLGdCQUFnQixDQUFDO1FBQ2hDLE1BQU0sVUFBVSxHQUFHLEtBQUssR0FBRyxHQUFHLEdBQUcsTUFBTSxDQUFDO1FBRXhDLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztRQUUvRSxNQUFNLFdBQVcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLGlCQUFpQixFQUFFO1lBQy9ELFVBQVUsRUFBRSxVQUFVO1lBQ3RCLFVBQVUsRUFBRSxHQUFHLENBQUMscUJBQXFCLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQztTQUNwRCxDQUFDLENBQUM7UUFFSCxXQUFXLENBQUMsa0JBQWtCLENBQUMsMkJBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQTtRQUVyRCxJQUFJLHVCQUFTLENBQUMsSUFBSSxFQUFFLGFBQWEsRUFBRSxFQUFFLEtBQUssRUFBRSxXQUFXLENBQUMsY0FBYyxFQUFFLENBQUMsQ0FBQztRQUUxRSxNQUFNLFVBQVUsR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRTtZQUNuRCxVQUFVLEVBQUUsVUFBVTtZQUN0QixnQkFBZ0IsRUFBRSxJQUFJO1lBQ3RCLGFBQWEsRUFBRSwyQkFBYSxDQUFDLE9BQU87WUFDcEMsMkJBQTJCO1lBQzNCLGlCQUFpQixFQUFFLDBCQUFpQixDQUFDLFVBQVU7WUFDL0MsYUFBYSxFQUFFLDRCQUFtQixDQUFDLHlCQUF5QjtZQUM1RCxvQkFBb0IsRUFBRSxZQUFZO1lBQ2xDLG9CQUFvQixFQUFFLFlBQVk7U0FBQyxDQUFDLENBQUE7UUFFcEMsSUFBSSx1QkFBUyxDQUFDLElBQUksRUFBRSxRQUFRLEVBQUUsRUFBRSxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUM7UUFFbEUsTUFBTSxZQUFZLEdBQUcsSUFBSSxVQUFVLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxrQkFBa0IsRUFBRTtZQUN6RSxXQUFXLEVBQUUsV0FBVztZQUN4QixpQkFBaUIsRUFBRSxZQUFZO1lBQy9CLFdBQVcsRUFBRSxDQUFDLFVBQVUsRUFBRSxNQUFNLENBQUM7WUFDakMsc0JBQXNCLEVBQUUsVUFBVSxDQUFDLHNCQUFzQixDQUFDLGFBQWE7WUFDdkUsY0FBYyxFQUFDO2dCQUNiO29CQUNFLFVBQVUsRUFBRSxHQUFHO29CQUNmLGtCQUFrQixFQUFFLEdBQUc7b0JBQ3ZCLGdCQUFnQixFQUFFLFlBQVk7b0JBQzlCLEdBQUcsRUFBRSxzQkFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7aUJBQzFCO2FBQ0Y7WUFDRCxlQUFlLEVBQUU7Z0JBQ2YsTUFBTSxFQUFFLElBQUksa0JBQWtCLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQztnQkFDbkQsUUFBUSxFQUFFLElBQUk7Z0JBQ2QsY0FBYyxFQUFFLFVBQVUsQ0FBQyxjQUFjLENBQUMsc0JBQXNCO2dCQUNoRSxvQkFBb0IsRUFBRSxVQUFVLENBQUMsb0JBQW9CLENBQUMsaUJBQWlCO2FBQ3hFO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsSUFBSSx1QkFBUyxDQUFDLElBQUksRUFBRSxnQkFBZ0IsRUFBRSxFQUFFLEtBQUssRUFBRSxZQUFZLENBQUMsY0FBYyxFQUFFLENBQUMsQ0FBQztRQUU5RSxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLG9CQUFvQixFQUFFO1lBQzlDLElBQUk7WUFDSixVQUFVLEVBQUUsVUFBVTtZQUN0QixNQUFNLEVBQUUsT0FBTyxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsSUFBSSxPQUFPLENBQUMsZ0JBQWdCLENBQUMsWUFBWSxDQUFDLENBQUM7U0FDbkYsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxpQkFBaUIsRUFBRTtZQUMzQyxJQUFJO1lBQ0osVUFBVSxFQUFFLE1BQU07WUFDbEIsTUFBTSxFQUFFLE9BQU8sQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLElBQUksT0FBTyxDQUFDLGdCQUFnQixDQUFDLFlBQVksQ0FBQyxDQUFDO1NBQ25GLENBQUMsQ0FBQztRQUVILElBQUksUUFBUSxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxzQkFBc0IsRUFBRTtZQUMxRCxPQUFPLEVBQUUsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1lBQ3JELGlCQUFpQixFQUFFLFVBQVU7U0FDOUIsQ0FBQyxDQUFDO0lBQ1QsQ0FBQztDQUNGO0FBckVELHdEQXFFQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHJvdXRlNTMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXJvdXRlNTMnO1xyXG5pbXBvcnQgKiBhcyBzMyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMnO1xyXG5pbXBvcnQgKiBhcyBhY20gZnJvbSAnYXdzLWNkay1saWIvYXdzLWNlcnRpZmljYXRlbWFuYWdlcic7XHJcbmltcG9ydCAqIGFzIGNsb3VkZnJvbnQgZnJvbSAnYXdzLWNkay1saWIvYXdzLWNsb3VkZnJvbnQnO1xyXG5pbXBvcnQgKiBhcyB0YXJnZXRzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1yb3V0ZTUzLXRhcmdldHMnO1xyXG5pbXBvcnQgKiBhcyBjbG91ZGZyb250X29yaWdpbnMgZnJvbSAnYXdzLWNkay1saWIvYXdzLWNsb3VkZnJvbnQtb3JpZ2lucyc7XHJcbmltcG9ydCAqIGFzIHMzZGVwbG95IGZyb20gJ2F3cy1jZGstbGliL2F3cy1zMy1kZXBsb3ltZW50JztcclxuXHJcbmltcG9ydCB7IEJsb2NrUHVibGljQWNjZXNzLCBCdWNrZXRBY2Nlc3NDb250cm9sIH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLXMzJztcclxuXHJcbmltcG9ydCB7IENmbk91dHB1dCwgRHVyYXRpb24sIFJlbW92YWxQb2xpY3ksIFN0YWNrLCBTdGFja1Byb3BzIH0gZnJvbSAnYXdzLWNkay1saWInO1xyXG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcclxuXHJcbmV4cG9ydCBjbGFzcyBDbG91ZEZyb250Um91dGU1M1N0YWNrIGV4dGVuZHMgU3RhY2sge1xyXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogU3RhY2tQcm9wcykge1xyXG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XHJcblxyXG4gICAgICBjb25zdCBkb21haW4gPSAncHJvZHhjbG91ZC5uZXQnO1xyXG4gICAgICBjb25zdCBzaXRlRG9tYWluID0gJ3d3dycgKyAnLicgKyBkb21haW47XHJcblxyXG4gICAgICBjb25zdCB6b25lID0gcm91dGU1My5Ib3N0ZWRab25lLmZyb21Mb29rdXAodGhpcywgJ1pvbmUnLCB7IGRvbWFpbk5hbWU6IGRvbWFpbiB9KTtcclxuXHJcbiAgICAgICAgY29uc3QgY2VydGlmaWNhdGUgPSBuZXcgYWNtLkNlcnRpZmljYXRlKHRoaXMsICdTaXRlQ2VydGlmaWNhdGUnLCB7XHJcbiAgICAgICAgICBkb21haW5OYW1lOiBzaXRlRG9tYWluLCAgICAgXHJcbiAgICAgICAgICB2YWxpZGF0aW9uOiBhY20uQ2VydGlmaWNhdGVWYWxpZGF0aW9uLmZyb21EbnMoem9uZSksXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGNlcnRpZmljYXRlLmFwcGx5UmVtb3ZhbFBvbGljeShSZW1vdmFsUG9saWN5LkRFU1RST1kpXHJcblxyXG4gICAgICAgIG5ldyBDZm5PdXRwdXQodGhpcywgJ0NlcnRpZmljYXRlJywgeyB2YWx1ZTogY2VydGlmaWNhdGUuY2VydGlmaWNhdGVBcm4gfSk7XHJcblxyXG4gICAgICAgIGNvbnN0IHNpdGVCdWNrZXQgPSBuZXcgczMuQnVja2V0KHRoaXMsICdTaXRlQnVja2V0Jywge1xyXG4gICAgICAgICAgYnVja2V0TmFtZTogc2l0ZURvbWFpbixcclxuICAgICAgICAgIHB1YmxpY1JlYWRBY2Nlc3M6IHRydWUsXHJcbiAgICAgICAgICByZW1vdmFsUG9saWN5OiBSZW1vdmFsUG9saWN5LkRFU1RST1ksXHJcbiAgICAgICAgICAvLyBhdXRvRGVsZXRlT2JqZWN0czogdHJ1ZSxcclxuICAgICAgICAgIGJsb2NrUHVibGljQWNjZXNzOiBCbG9ja1B1YmxpY0FjY2Vzcy5CTE9DS19BQ0xTLFxyXG4gICAgICAgICAgYWNjZXNzQ29udHJvbDogQnVja2V0QWNjZXNzQ29udHJvbC5CVUNLRVRfT1dORVJfRlVMTF9DT05UUk9MLFxyXG4gICAgICAgICAgd2Vic2l0ZUluZGV4RG9jdW1lbnQ6ICdpbmRleC5odG1sJyxcclxuICAgICAgICAgIHdlYnNpdGVFcnJvckRvY3VtZW50OiAnZXJyb3IuaHRtbCd9KVxyXG5cclxuICAgICAgICAgIG5ldyBDZm5PdXRwdXQodGhpcywgJ0J1Y2tldCcsIHsgdmFsdWU6IHNpdGVCdWNrZXQuYnVja2V0TmFtZSB9KTtcclxuXHJcbiAgICAgICAgY29uc3QgZGlzdHJpYnV0aW9uID0gbmV3IGNsb3VkZnJvbnQuRGlzdHJpYnV0aW9uKHRoaXMsICdTaXRlRGlzdHJpYnV0aW9uJywge1xyXG4gICAgICAgICAgY2VydGlmaWNhdGU6IGNlcnRpZmljYXRlLFxyXG4gICAgICAgICAgZGVmYXVsdFJvb3RPYmplY3Q6IFwiaW5kZXguaHRtbFwiLFxyXG4gICAgICAgICAgZG9tYWluTmFtZXM6IFtzaXRlRG9tYWluLCBkb21haW5dLFxyXG4gICAgICAgICAgbWluaW11bVByb3RvY29sVmVyc2lvbjogY2xvdWRmcm9udC5TZWN1cml0eVBvbGljeVByb3RvY29sLlRMU19WMV8yXzIwMjEsXHJcbiAgICAgICAgICBlcnJvclJlc3BvbnNlczpbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBodHRwU3RhdHVzOiA0MDQsXHJcbiAgICAgICAgICAgICAgcmVzcG9uc2VIdHRwU3RhdHVzOiA0MDQsXHJcbiAgICAgICAgICAgICAgcmVzcG9uc2VQYWdlUGF0aDogJ2Vycm9yLmh0bWwnLFxyXG4gICAgICAgICAgICAgIHR0bDogRHVyYXRpb24ubWludXRlcygzMCksXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIF0sXHJcbiAgICAgICAgICBkZWZhdWx0QmVoYXZpb3I6IHtcclxuICAgICAgICAgICAgb3JpZ2luOiBuZXcgY2xvdWRmcm9udF9vcmlnaW5zLlMzT3JpZ2luKHNpdGVCdWNrZXQpLFxyXG4gICAgICAgICAgICBjb21wcmVzczogdHJ1ZSxcclxuICAgICAgICAgICAgYWxsb3dlZE1ldGhvZHM6IGNsb3VkZnJvbnQuQWxsb3dlZE1ldGhvZHMuQUxMT1dfR0VUX0hFQURfT1BUSU9OUyxcclxuICAgICAgICAgICAgdmlld2VyUHJvdG9jb2xQb2xpY3k6IGNsb3VkZnJvbnQuVmlld2VyUHJvdG9jb2xQb2xpY3kuUkVESVJFQ1RfVE9fSFRUUFMsXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIG5ldyBDZm5PdXRwdXQodGhpcywgJ0Rpc3RyaWJ1dGlvbklkJywgeyB2YWx1ZTogZGlzdHJpYnV0aW9uLmRpc3RyaWJ1dGlvbklkIH0pO1xyXG5cclxuICAgICAgICBuZXcgcm91dGU1My5BUmVjb3JkKHRoaXMsICdXV1dTaXRlQWxpYXNSZWNvcmQnLCB7XHJcbiAgICAgICAgICB6b25lLFxyXG4gICAgICAgICAgcmVjb3JkTmFtZTogc2l0ZURvbWFpbixcclxuICAgICAgICAgIHRhcmdldDogcm91dGU1My5SZWNvcmRUYXJnZXQuZnJvbUFsaWFzKG5ldyB0YXJnZXRzLkNsb3VkRnJvbnRUYXJnZXQoZGlzdHJpYnV0aW9uKSlcclxuICAgICAgICB9KTtcclxuICAgICAgICBuZXcgcm91dGU1My5BUmVjb3JkKHRoaXMsICdTaXRlQWxpYXNSZWNvcmQnLCB7XHJcbiAgICAgICAgICB6b25lLFxyXG4gICAgICAgICAgcmVjb3JkTmFtZTogZG9tYWluLFxyXG4gICAgICAgICAgdGFyZ2V0OiByb3V0ZTUzLlJlY29yZFRhcmdldC5mcm9tQWxpYXMobmV3IHRhcmdldHMuQ2xvdWRGcm9udFRhcmdldChkaXN0cmlidXRpb24pKVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBuZXcgczNkZXBsb3kuQnVja2V0RGVwbG95bWVudCh0aGlzLCAnVXBsb2FkV2Vic2l0ZUNvbnRlbnQnLCB7XHJcbiAgICAgICAgICBzb3VyY2VzOiBbczNkZXBsb3kuU291cmNlLmFzc2V0KCcuL3dlYnNpdGUtY29udGVudCcpXSxcclxuICAgICAgICAgIGRlc3RpbmF0aW9uQnVja2V0OiBzaXRlQnVja2V0LFxyXG4gICAgICAgIH0pO1xyXG4gIH1cclxufVxyXG4iXX0=