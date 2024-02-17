"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InfraStack = void 0;
const route53 = require("aws-cdk-lib/aws-route53");
const s3 = require("aws-cdk-lib/aws-s3");
const acm = require("aws-cdk-lib/aws-certificatemanager");
const cloudfront = require("aws-cdk-lib/aws-cloudfront");
const targets = require("aws-cdk-lib/aws-route53-targets");
const cloudfront_origins = require("aws-cdk-lib/aws-cloudfront-origins");
const s3deploy = require("aws-cdk-lib/aws-s3-deployment");
const aws_s3_1 = require("aws-cdk-lib/aws-s3");
const aws_cdk_lib_1 = require("aws-cdk-lib");
class InfraStack extends aws_cdk_lib_1.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // 1. Define the domain name by changing'prodxcloud.net'.
        const domainName = 'prodxcloud.net';
        const siteDomain = 'www' + '.' + domainName;
        // 1.1 Create a Route 53 hosted zone (optional - you will need to update the NS records).
        /*
        const hostedZone = new route53.PublicHostedZone(this, 'MyHostedZone', {
            zoneName: domainName,
            });
              
        new CfnOutput(this, 'Site', { value: 'https://' + siteDomain });
        */
        // 1.2 Find the current hosted zone in Route 53 
        const zone = route53.HostedZone.fromLookup(this, 'Zone', { domainName: domainName });
        console.log(zone);
        // 2. Create a TLS/SSL certificate for HTTPS
        const certificate = new acm.DnsValidatedCertificate(this, 'SiteCertificate', {
            domainName: domainName,
            subjectAlternativeNames: ['*.' + domainName],
            hostedZone: zone,
            region: 'us-east-1', // Cloudfront only checks this region for certificates
        });
        // 2.1 The removal policy for the certificate can be set to 'Retain' or 'Destroy'
        certificate.applyRemovalPolicy(aws_cdk_lib_1.RemovalPolicy.DESTROY);
        new aws_cdk_lib_1.CfnOutput(this, 'Certificate', { value: certificate.certificateArn });
        // 3. Create an S3 bucket to store content, and set the removal policy to either 'Retain' or 'Destroy'
        // Please be aware that all content stored in the S3 bucket is publicly available.
        const siteBucket = new s3.Bucket(this, 'SiteBucket', {
            bucketName: siteDomain,
            publicReadAccess: true,
            removalPolicy: aws_cdk_lib_1.RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
            blockPublicAccess: aws_s3_1.BlockPublicAccess.BLOCK_ACLS,
            accessControl: aws_s3_1.BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
            websiteIndexDocument: 'index.html',
            websiteErrorDocument: 'error/index.html'
        });
        new aws_cdk_lib_1.CfnOutput(this, 'Bucket', { value: siteBucket.bucketName });
        // 4. Deploy CloudFront distribution
        const distribution = new cloudfront.Distribution(this, 'SiteDistribution', {
            certificate: certificate,
            defaultRootObject: "index.html",
            domainNames: [siteDomain, domainName],
            minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
            errorResponses: [
                {
                    httpStatus: 404,
                    responseHttpStatus: 404,
                    responsePagePath: '/error/index.html',
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
        // 5. Create a Route 53 alias record for the CloudFront distribution
        //5.1  Add an 'A' record to Route 53 for 'www.example.com'
        new route53.ARecord(this, 'WWWSiteAliasRecord', {
            zone,
            recordName: siteDomain,
            target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution))
        });
        //5.2 Add an 'A' record to Route 53 for 'example.com'
        new route53.ARecord(this, 'SiteAliasRecord', {
            zone,
            recordName: domainName,
            target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution))
        });
        //6. Deploy the files from the 'html-website' folder in Github to an S3 bucket
        new s3deploy.BucketDeployment(this, 'DeployWebsite', {
            sources: [s3deploy.Source.asset('./html-website')],
            destinationBucket: siteBucket,
        });
    }
}
exports.InfraStack = InfraStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2RrLWV4YW1wbGUtczMtY2xvdWRmcm9udC1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNkay1leGFtcGxlLXMzLWNsb3VkZnJvbnQtc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsbURBQW1EO0FBQ25ELHlDQUF5QztBQUN6QywwREFBMEQ7QUFDMUQseURBQXlEO0FBQ3pELDJEQUEyRDtBQUMzRCx5RUFBeUU7QUFDekUsMERBQTBEO0FBRTFELCtDQUE0RTtBQUU1RSw2Q0FBb0Y7QUFHcEYsTUFBYSxVQUFXLFNBQVEsbUJBQUs7SUFDbkMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFrQjtRQUMxRCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUUxQix5REFBeUQ7UUFDekQsTUFBTSxVQUFVLEdBQUcsZ0JBQWdCLENBQUM7UUFDcEMsTUFBTSxVQUFVLEdBQUcsS0FBSyxHQUFHLEdBQUcsR0FBRyxVQUFVLENBQUM7UUFFMUMseUZBQXlGO1FBQ3pGOzs7Ozs7VUFNRTtRQUVGLGdEQUFnRDtRQUM5QyxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUM7UUFDckYsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUV0Qiw0Q0FBNEM7UUFDdEMsTUFBTSxXQUFXLEdBQUcsSUFBSSxHQUFHLENBQUMsdUJBQXVCLENBQUMsSUFBSSxFQUFFLGlCQUFpQixFQUFFO1lBQzNFLFVBQVUsRUFBRSxVQUFVO1lBQ3RCLHVCQUF1QixFQUFFLENBQUMsSUFBSSxHQUFHLFVBQVUsQ0FBQztZQUN4QyxVQUFVLEVBQUUsSUFBSTtZQUNoQixNQUFNLEVBQUUsV0FBVyxFQUFFLHNEQUFzRDtTQUNoRixDQUFDLENBQUM7UUFFUCxpRkFBaUY7UUFDN0Us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QUE3RkQsZ0NBNkZDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgcm91dGU1MyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtcm91dGU1Myc7XHJcbmltcG9ydCAqIGFzIHMzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zMyc7XHJcbmltcG9ydCAqIGFzIGFjbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2VydGlmaWNhdGVtYW5hZ2VyJztcclxuaW1wb3J0ICogYXMgY2xvdWRmcm9udCBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2xvdWRmcm9udCc7XHJcbmltcG9ydCAqIGFzIHRhcmdldHMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXJvdXRlNTMtdGFyZ2V0cyc7XHJcbmltcG9ydCAqIGFzIGNsb3VkZnJvbnRfb3JpZ2lucyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2xvdWRmcm9udC1vcmlnaW5zJztcclxuaW1wb3J0ICogYXMgczNkZXBsb3kgZnJvbSAnYXdzLWNkay1saWIvYXdzLXMzLWRlcGxveW1lbnQnO1xyXG5cclxuaW1wb3J0IHsgQmxvY2tQdWJsaWNBY2Nlc3MsIEJ1Y2tldEFjY2Vzc0NvbnRyb2wgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMnO1xyXG5cclxuaW1wb3J0IHsgQ2ZuT3V0cHV0LCBEdXJhdGlvbiwgUmVtb3ZhbFBvbGljeSwgU3RhY2ssIFN0YWNrUHJvcHMgfSBmcm9tICdhd3MtY2RrLWxpYic7XHJcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xyXG5cclxuZXhwb3J0IGNsYXNzIEluZnJhU3RhY2sgZXh0ZW5kcyBTdGFjayB7XHJcbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBTdGFja1Byb3BzKSB7XHJcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcclxuXHJcbiAgLy8gMS4gRGVmaW5lIHRoZSBkb21haW4gbmFtZSBieSBjaGFuZ2luZydwcm9keGNsb3VkLm5ldCcuXHJcbiAgY29uc3QgZG9tYWluTmFtZSA9ICdwcm9keGNsb3VkLm5ldCc7XHJcbiAgY29uc3Qgc2l0ZURvbWFpbiA9ICd3d3cnICsgJy4nICsgZG9tYWluTmFtZTtcclxuXHJcbiAgICAvLyAxLjEgQ3JlYXRlIGEgUm91dGUgNTMgaG9zdGVkIHpvbmUgKG9wdGlvbmFsIC0geW91IHdpbGwgbmVlZCB0byB1cGRhdGUgdGhlIE5TIHJlY29yZHMpLlxyXG4gICAgLypcclxuICAgIGNvbnN0IGhvc3RlZFpvbmUgPSBuZXcgcm91dGU1My5QdWJsaWNIb3N0ZWRab25lKHRoaXMsICdNeUhvc3RlZFpvbmUnLCB7XHJcbiAgICAgICAgem9uZU5hbWU6IGRvbWFpbk5hbWUsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgICBcclxuICAgIG5ldyBDZm5PdXRwdXQodGhpcywgJ1NpdGUnLCB7IHZhbHVlOiAnaHR0cHM6Ly8nICsgc2l0ZURvbWFpbiB9KTtcclxuICAgICovXHJcblxyXG4gICAgLy8gMS4yIEZpbmQgdGhlIGN1cnJlbnQgaG9zdGVkIHpvbmUgaW4gUm91dGUgNTMgXHJcbiAgICAgIGNvbnN0IHpvbmUgPSByb3V0ZTUzLkhvc3RlZFpvbmUuZnJvbUxvb2t1cCh0aGlzLCAnWm9uZScsIHsgZG9tYWluTmFtZTogZG9tYWluTmFtZSB9KTtcclxuICAgICAgY29uc29sZS5sb2coem9uZSk7XHJcbiAgICBcclxuICAvLyAyLiBDcmVhdGUgYSBUTFMvU1NMIGNlcnRpZmljYXRlIGZvciBIVFRQU1xyXG4gICAgICAgIGNvbnN0IGNlcnRpZmljYXRlID0gbmV3IGFjbS5EbnNWYWxpZGF0ZWRDZXJ0aWZpY2F0ZSh0aGlzLCAnU2l0ZUNlcnRpZmljYXRlJywge1xyXG4gICAgICAgICAgZG9tYWluTmFtZTogZG9tYWluTmFtZSxcclxuICAgICAgICAgIHN1YmplY3RBbHRlcm5hdGl2ZU5hbWVzOiBbJyouJyArIGRvbWFpbk5hbWVdLFxyXG4gICAgICAgICAgICAgIGhvc3RlZFpvbmU6IHpvbmUsXHJcbiAgICAgICAgICAgICAgcmVnaW9uOiAndXMtZWFzdC0xJywgLy8gQ2xvdWRmcm9udCBvbmx5IGNoZWNrcyB0aGlzIHJlZ2lvbiBmb3IgY2VydGlmaWNhdGVzXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgLy8gMi4xIFRoZSByZW1vdmFsIHBvbGljeSBmb3IgdGhlIGNlcnRpZmljYXRlIGNhbiBiZSBzZXQgdG8gJ1JldGFpbicgb3IgJ0Rlc3Ryb3knXHJcbiAgICAgICAgY2VydGlmaWNhdGUuYXBwbHlSZW1vdmFsUG9saWN5KFJlbW92YWxQb2xpY3kuREVTVFJPWSlcclxuXHJcbiAgICAgICAgbmV3IENmbk91dHB1dCh0aGlzLCAnQ2VydGlmaWNhdGUnLCB7IHZhbHVlOiBjZXJ0aWZpY2F0ZS5jZXJ0aWZpY2F0ZUFybiB9KTtcclxuICAgIFxyXG5cclxuICAvLyAzLiBDcmVhdGUgYW4gUzMgYnVja2V0IHRvIHN0b3JlIGNvbnRlbnQsIGFuZCBzZXQgdGhlIHJlbW92YWwgcG9saWN5IHRvIGVpdGhlciAnUmV0YWluJyBvciAnRGVzdHJveSdcclxuICAgIC8vIFBsZWFzZSBiZSBhd2FyZSB0aGF0IGFsbCBjb250ZW50IHN0b3JlZCBpbiB0aGUgUzMgYnVja2V0IGlzIHB1YmxpY2x5IGF2YWlsYWJsZS5cclxuICAgICAgICBjb25zdCBzaXRlQnVja2V0ID0gbmV3IHMzLkJ1Y2tldCh0aGlzLCAnU2l0ZUJ1Y2tldCcsIHtcclxuICAgICAgICAgIGJ1Y2tldE5hbWU6IHNpdGVEb21haW4sXHJcbiAgICAgICAgICBwdWJsaWNSZWFkQWNjZXNzOiB0cnVlLFxyXG4gICAgICAgICAgcmVtb3ZhbFBvbGljeTogUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxyXG4gICAgICAgICAgYXV0b0RlbGV0ZU9iamVjdHM6IHRydWUsXHJcbiAgICAgICAgICBibG9ja1B1YmxpY0FjY2VzczogQmxvY2tQdWJsaWNBY2Nlc3MuQkxPQ0tfQUNMUyxcclxuICAgICAgICAgIGFjY2Vzc0NvbnRyb2w6IEJ1Y2tldEFjY2Vzc0NvbnRyb2wuQlVDS0VUX09XTkVSX0ZVTExfQ09OVFJPTCxcclxuICAgICAgICAgIHdlYnNpdGVJbmRleERvY3VtZW50OiAnaW5kZXguaHRtbCcsXHJcbiAgICAgICAgICB3ZWJzaXRlRXJyb3JEb2N1bWVudDogJ2Vycm9yL2luZGV4Lmh0bWwnfSlcclxuXHJcbiAgICAgICAgICBuZXcgQ2ZuT3V0cHV0KHRoaXMsICdCdWNrZXQnLCB7IHZhbHVlOiBzaXRlQnVja2V0LmJ1Y2tldE5hbWUgfSk7XHJcblxyXG4gIC8vIDQuIERlcGxveSBDbG91ZEZyb250IGRpc3RyaWJ1dGlvblxyXG4gICAgICAgIGNvbnN0IGRpc3RyaWJ1dGlvbiA9IG5ldyBjbG91ZGZyb250LkRpc3RyaWJ1dGlvbih0aGlzLCAnU2l0ZURpc3RyaWJ1dGlvbicsIHtcclxuICAgICAgICAgIGNlcnRpZmljYXRlOiBjZXJ0aWZpY2F0ZSxcclxuICAgICAgICAgIGRlZmF1bHRSb290T2JqZWN0OiBcImluZGV4Lmh0bWxcIixcclxuICAgICAgICAgIGRvbWFpbk5hbWVzOiBbc2l0ZURvbWFpbiwgZG9tYWluTmFtZV0sXHJcbiAgICAgICAgICBtaW5pbXVtUHJvdG9jb2xWZXJzaW9uOiBjbG91ZGZyb250LlNlY3VyaXR5UG9saWN5UHJvdG9jb2wuVExTX1YxXzJfMjAyMSxcclxuICAgICAgICAgIGVycm9yUmVzcG9uc2VzOltcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIGh0dHBTdGF0dXM6IDQwNCxcclxuICAgICAgICAgICAgICByZXNwb25zZUh0dHBTdGF0dXM6IDQwNCxcclxuICAgICAgICAgICAgICByZXNwb25zZVBhZ2VQYXRoOiAnL2Vycm9yL2luZGV4Lmh0bWwnLFxyXG4gICAgICAgICAgICAgIHR0bDogRHVyYXRpb24ubWludXRlcygzMCksXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIF0sXHJcbiAgICAgICAgICBkZWZhdWx0QmVoYXZpb3I6IHtcclxuICAgICAgICAgICAgb3JpZ2luOiBuZXcgY2xvdWRmcm9udF9vcmlnaW5zLlMzT3JpZ2luKHNpdGVCdWNrZXQpLFxyXG4gICAgICAgICAgICBjb21wcmVzczogdHJ1ZSxcclxuICAgICAgICAgICAgYWxsb3dlZE1ldGhvZHM6IGNsb3VkZnJvbnQuQWxsb3dlZE1ldGhvZHMuQUxMT1dfR0VUX0hFQURfT1BUSU9OUyxcclxuICAgICAgICAgICAgdmlld2VyUHJvdG9jb2xQb2xpY3k6IGNsb3VkZnJvbnQuVmlld2VyUHJvdG9jb2xQb2xpY3kuUkVESVJFQ1RfVE9fSFRUUFMsXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIG5ldyBDZm5PdXRwdXQodGhpcywgJ0Rpc3RyaWJ1dGlvbklkJywgeyB2YWx1ZTogZGlzdHJpYnV0aW9uLmRpc3RyaWJ1dGlvbklkIH0pO1xyXG5cclxuICAvLyA1LiBDcmVhdGUgYSBSb3V0ZSA1MyBhbGlhcyByZWNvcmQgZm9yIHRoZSBDbG91ZEZyb250IGRpc3RyaWJ1dGlvblxyXG4gICAgICAgIC8vNS4xICBBZGQgYW4gJ0EnIHJlY29yZCB0byBSb3V0ZSA1MyBmb3IgJ3d3dy5leGFtcGxlLmNvbSdcclxuICAgICAgICBuZXcgcm91dGU1My5BUmVjb3JkKHRoaXMsICdXV1dTaXRlQWxpYXNSZWNvcmQnLCB7XHJcbiAgICAgICAgICB6b25lLFxyXG4gICAgICAgICAgcmVjb3JkTmFtZTogc2l0ZURvbWFpbixcclxuICAgICAgICAgIHRhcmdldDogcm91dGU1My5SZWNvcmRUYXJnZXQuZnJvbUFsaWFzKG5ldyB0YXJnZXRzLkNsb3VkRnJvbnRUYXJnZXQoZGlzdHJpYnV0aW9uKSlcclxuICAgICAgICB9KTtcclxuICAgICAgICAvLzUuMiBBZGQgYW4gJ0EnIHJlY29yZCB0byBSb3V0ZSA1MyBmb3IgJ2V4YW1wbGUuY29tJ1xyXG4gICAgICAgIG5ldyByb3V0ZTUzLkFSZWNvcmQodGhpcywgJ1NpdGVBbGlhc1JlY29yZCcsIHtcclxuICAgICAgICAgIHpvbmUsXHJcbiAgICAgICAgICByZWNvcmROYW1lOiBkb21haW5OYW1lLFxyXG4gICAgICAgICAgdGFyZ2V0OiByb3V0ZTUzLlJlY29yZFRhcmdldC5mcm9tQWxpYXMobmV3IHRhcmdldHMuQ2xvdWRGcm9udFRhcmdldChkaXN0cmlidXRpb24pKVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIC8vNi4gRGVwbG95IHRoZSBmaWxlcyBmcm9tIHRoZSAnaHRtbC13ZWJzaXRlJyBmb2xkZXIgaW4gR2l0aHViIHRvIGFuIFMzIGJ1Y2tldFxyXG4gICAgICAgIG5ldyBzM2RlcGxveS5CdWNrZXREZXBsb3ltZW50KHRoaXMsICdEZXBsb3lXZWJzaXRlJywge1xyXG4gICAgICAgICAgc291cmNlczogW3MzZGVwbG95LlNvdXJjZS5hc3NldCgnLi9odG1sLXdlYnNpdGUnKV0sXHJcbiAgICAgICAgICBkZXN0aW5hdGlvbkJ1Y2tldDogc2l0ZUJ1Y2tldCxcclxuICAgICAgICB9KTtcclxuICB9XHJcbn1cclxuIl19