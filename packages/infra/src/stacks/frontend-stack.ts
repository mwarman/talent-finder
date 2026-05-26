import { Stack, StackProps, RemovalPolicy, Duration, CfnOutput } from 'aws-cdk-lib';
import { Bucket, BucketEncryption, BlockPublicAccess } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { Construct } from 'constructs';

/**
 * FrontendStackProps extends StackProps to include frontend-specific properties
 * - appName: The name of the application (e.g., "talent-finder")
 * - envName: The environment identifier (e.g., "dev", "prod")
 */
interface FrontendStackProps extends StackProps {
  appName: string;
  envName: string;
}

/**
 * Frontend Stack
 * Provisions frontend hosting resources:
 * - S3 bucket for static assets (no public access, encryption)
 * - CloudFront distribution pointing to S3 origin via OAC
 * - Custom error response for SPA client-side routing (404 → /index.html)
 * - Cache policies for hashed assets (long TTL) and index.html (short TTL)
 * - BucketDeployment to sync Vite dist/ output to S3
 * - CloudFront URL exported as CDK stack output
 *
 * Note: The web package must be built with VITE_API_BASE_URL set before deploying
 * this stack. The built output is expected at packages/web/dist.
 */
export class FrontendStack extends Stack {
  public readonly bucket: Bucket;
  public readonly distribution: cloudfront.Distribution;
  public readonly distributionUrl: string;
  public readonly bucketName: string;

  constructor(scope: Construct, id: string, props: FrontendStackProps) {
    super(scope, id, props);

    // S3 Bucket for frontend assets
    // No public access — all traffic flows through CloudFront
    this.bucket = new Bucket(this, 'FrontendBucket', {
      bucketName: `${props.appName}-frontend-${props.envName}`,
      encryption: BucketEncryption.S3_MANAGED,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: props.envName === 'prod' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      autoDeleteObjects: props.envName !== 'prod',
      versioned: false,
    });

    // CloudFront Distribution with modern OAC pattern
    // S3BucketOrigin.withOriginAccessControl() automatically:
    // - Creates and manages the OAC
    // - Configures S3 origin with OAC
    // - Grants OAC permissions to the bucket (no manual IAM policy needed)
    this.distribution = new cloudfront.Distribution(this, 'FrontendDistribution', {
      defaultBehavior: {
        // Origin: S3 bucket accessed via OAC using the modern CDK pattern
        origin: origins.S3BucketOrigin.withOriginAccessControl(this.bucket),
        // Viewer protocol: Redirect HTTP to HTTPS
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        // Cache policy: Optimized for web applications with hashing
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        // Compress assets for faster transfer
        compress: true,
      },
      // Default root object for SPA
      defaultRootObject: 'index.html',
      // Price class: Cost-optimized, excludes expensive regions (North America, Europe, Asia-Pacific)
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      // Custom error responses for SPA client-side routing fallback
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: Duration.seconds(0), // Don't cache 403 error responses
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: Duration.seconds(0), // Don't cache 404 error responses
        },
      ],
    });

    // Sync Vite dist/ output to S3 bucket
    // This runs as part of `cdk deploy` and ensures CloudFront serves the latest build
    new BucketDeployment(this, 'DeployFrontendAssets', {
      sources: [Source.asset('../web/dist')],
      destinationBucket: this.bucket,
      distribution: this.distribution,
      // Invalidate CloudFront cache after deployment
      distributionPaths: ['/*'],
      retainOnDelete: false, // Remove old assets that are no longer in the new build
    });

    // Store values for export
    this.bucketName = this.bucket.bucketName;
    this.distributionUrl = `https://${this.distribution.distributionDomainName}`;

    // Stack outputs for consumption by end users
    new CfnOutput(this, 'FrontendBucketName', {
      description: 'S3 bucket name for frontend assets',
      value: this.bucketName,
      exportName: `${props.appName}-FrontendBucket-${props.envName}`,
    });

    new CfnOutput(this, 'FrontendDistributionUrl', {
      description: 'CloudFront distribution URL for the frontend',
      value: this.distributionUrl,
      exportName: `${props.appName}-FrontendUrl-${props.envName}`,
    });

    new CfnOutput(this, 'FrontendDistributionId', {
      description: 'CloudFront distribution ID',
      value: this.distribution.distributionId,
      exportName: `${props.appName}-FrontendDistributionId-${props.envName}`,
    });
  }
}
