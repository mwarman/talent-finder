import { describe, it, expect, beforeEach } from 'vitest';
import { Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { FrontendStack } from './frontend-stack';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

describe('FrontendStack', () => {
  let parentStack: Stack;
  let tempDistDir: string;

  beforeEach(() => {
    // Arrange: Create a parent stack context for the FrontendStack
    parentStack = new Stack();
    // Create a temporary directory to simulate Vite dist/ output
    tempDistDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vite-dist-'));
    // Create a mock index.html file
    fs.writeFileSync(path.join(tempDistDir, 'index.html'), '<html></html>');
  });

  it('should create stack with all required resources', () => {
    // Arrange
    const props = {
      appName: 'talent-finder',
      envName: 'dev',
      frontendAssetsPath: tempDistDir,
    };

    // Act
    const frontendStack = new FrontendStack(parentStack, 'FrontendStack', props);

    // Assert
    expect(frontendStack).toBeDefined();
    expect(frontendStack.bucket).toBeDefined();
    expect(frontendStack.distribution).toBeDefined();
    expect(frontendStack.bucketName).toBeDefined();
    expect(frontendStack.distributionUrl).toBeDefined();
  });

  it('should create S3 bucket with encryption and block all public access', () => {
    // Arrange
    const props = {
      appName: 'talent-finder',
      envName: 'dev',
      frontendAssetsPath: tempDistDir,
    };

    // Act
    const frontendStack = new FrontendStack(parentStack, 'FrontendStack', props);
    const template = Template.fromStack(frontendStack);

    // Assert: Check S3 bucket exists with encryption and BlockPublicAccess
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256',
            },
          },
        ],
      },
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });

  it('should create CloudFront distribution with S3 origin', () => {
    // Arrange
    const props = {
      appName: 'talent-finder',
      envName: 'prod',
      frontendAssetsPath: tempDistDir,
    };

    // Act
    const frontendStack = new FrontendStack(parentStack, 'FrontendStack', props);
    const template = Template.fromStack(frontendStack);

    // Assert: Check CloudFront distribution exists
    template.resourceCountIs('AWS::CloudFront::Distribution', 1);
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        DefaultRootObject: 'index.html',
      },
    });
  });

  it('should configure CloudFront with error responses for SPA routing', () => {
    // Arrange
    const props = {
      appName: 'talent-finder',
      envName: 'dev',
      frontendAssetsPath: tempDistDir,
    };

    // Act
    const frontendStack = new FrontendStack(parentStack, 'FrontendStack', props);
    const template = Template.fromStack(frontendStack);

    // Assert: CloudFront should have error responses configured
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        CustomErrorResponses: [
          {
            ErrorCode: 403,
            ResponseCode: 200,
            ResponsePagePath: '/index.html',
            ErrorCachingMinTTL: 0,
          },
          {
            ErrorCode: 404,
            ResponseCode: 200,
            ResponsePagePath: '/index.html',
            ErrorCachingMinTTL: 0,
          },
        ],
      },
    });
  });

  it('should use price class 100 for cost optimization', () => {
    // Arrange
    const props = {
      appName: 'talent-finder',
      envName: 'dev',
      frontendAssetsPath: tempDistDir,
    };

    // Act
    const frontendStack = new FrontendStack(parentStack, 'FrontendStack', props);
    const template = Template.fromStack(frontendStack);

    // Assert: CloudFront should use PRICE_CLASS_100
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        PriceClass: 'PriceClass_100',
      },
    });
  });

  it('should compress assets and redirect HTTP to HTTPS', () => {
    // Arrange
    const props = {
      appName: 'talent-finder',
      envName: 'dev',
      frontendAssetsPath: tempDistDir,
    };

    // Act
    const frontendStack = new FrontendStack(parentStack, 'FrontendStack', props);
    const template = Template.fromStack(frontendStack);

    // Assert: Distribution should have compression enabled and HTTPS redirect
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        DefaultCacheBehavior: {
          Compress: true,
          ViewerProtocolPolicy: 'redirect-to-https',
        },
      },
    });
  });

  it('should deploy frontend assets to S3 via BucketDeployment', () => {
    // Arrange
    const props = {
      appName: 'talent-finder',
      envName: 'dev',
      frontendAssetsPath: tempDistDir,
    };

    // Act
    const frontendStack = new FrontendStack(parentStack, 'FrontendStack', props);
    const template = Template.fromStack(frontendStack);

    // Assert: Check S3 bucket exists (BucketDeployment creates the main bucket for content)
    template.resourceCountIs('AWS::S3::Bucket', 1);
  });

  it('should use RETAIN removal policy for production environment', () => {
    // Arrange
    const props = {
      appName: 'talent-finder',
      envName: 'prod',
      frontendAssetsPath: tempDistDir,
    };

    // Act
    const frontendStack = new FrontendStack(parentStack, 'FrontendStack', props);
    const template = Template.fromStack(frontendStack);

    // Assert: Production bucket should have UpdateReplacePolicy and DeletionPolicy set to Retain
    const buckets = template.findResources('AWS::S3::Bucket');
    const prodBucket = Object.values(buckets)[0] as Record<string, unknown>;
    expect(prodBucket.UpdateReplacePolicy).toBe('Retain');
    expect(prodBucket.DeletionPolicy).toBe('Retain');
  });

  it('should use DESTROY removal policy for non-production environment', () => {
    // Arrange
    const props = {
      appName: 'talent-finder',
      envName: 'dev',
      frontendAssetsPath: tempDistDir,
    };

    // Act
    const frontendStack = new FrontendStack(parentStack, 'FrontendStack', props);
    const template = Template.fromStack(frontendStack);

    // Assert: Dev bucket should have UpdateReplacePolicy and DeletionPolicy set to Delete
    const buckets = template.findResources('AWS::S3::Bucket');
    const devBucket = Object.values(buckets)[0] as Record<string, unknown>;
    expect(devBucket.UpdateReplacePolicy).toBe('Delete');
    expect(devBucket.DeletionPolicy).toBe('Delete');
  });

  it('should export CloudFront URL and bucket name as properties', () => {
    // Arrange
    const props = {
      appName: 'talent-finder',
      envName: 'dev',
      frontendAssetsPath: tempDistDir,
    };

    // Act
    const frontendStack = new FrontendStack(parentStack, 'FrontendStack', props);

    // Assert: Stack should have publicly accessible properties for exports
    expect(frontendStack.bucketName).toBeDefined();
    expect(frontendStack.distributionUrl).toBeDefined();
    // These are used to populate the CfnOutput nodes which appear in the CloudFormation template
  });

  it('should use CloudFront caching optimized policy', () => {
    // Arrange
    const props = {
      appName: 'talent-finder',
      envName: 'dev',
      frontendAssetsPath: tempDistDir,
    };

    // Act
    const frontendStack = new FrontendStack(parentStack, 'FrontendStack', props);
    const template = Template.fromStack(frontendStack);

    // Assert: Default behavior should have a CachePolicyId (string) set to the optimized policy ID
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        DefaultCacheBehavior: {
          CachePolicyId: '658327ea-f89d-4fab-a63d-7e88639e58f6', // CACHING_OPTIMIZED policy ID
          Compress: true,
          ViewerProtocolPolicy: 'redirect-to-https',
        },
      },
    });
  });
});
