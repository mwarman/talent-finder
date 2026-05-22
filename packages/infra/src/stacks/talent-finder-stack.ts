import { Stack, StackProps, Duration, RemovalPolicy, SecretValue } from 'aws-cdk-lib';
import { Bucket, BucketEncryption, StorageClass } from 'aws-cdk-lib/aws-s3';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

interface TalentFinderStackProps extends StackProps {
  tags: Record<string, string>;
  envName: string;
}

/**
 * Base Talent Finder Stack
 * Provisions foundational AWS resources:
 * - S3 bucket for document corpus (with versioning, encryption, lifecycle rules)
 * - Secrets Manager secret for Pinecone API key
 * - CloudWatch log group for Lambda functions
 */
export class TalentFinderStack extends Stack {
  public readonly s3BucketName: string;
  public readonly secretArn: string;
  public readonly logGroupName: string;

  constructor(scope: Construct, id: string, props: TalentFinderStackProps) {
    super(scope, id, props);

    const { envName } = props;

    // S3 Bucket for document corpus
    const documentBucket = new Bucket(this, 'DocumentBucket', {
      versioned: true,
      encryption: BucketEncryption.S3_MANAGED,
      removalPolicy: RemovalPolicy.RETAIN,
      lifecycleRules: [
        {
          transitions: [
            {
              storageClass: StorageClass.GLACIER,
              transitionAfter: Duration.days(90),
            },
          ],
        },
      ],
    });

    // Apply tags to S3 bucket
    Object.entries(props.tags).forEach(([key, value]) => {
      documentBucket.node.addMetadata('tags', { [key]: value });
    });

    // Secrets Manager secret for Pinecone API key
    const pineconeSecret = new Secret(this, 'PineconeApiKeySecret', {
      secretName: `talent-finder/${envName}/pinecone-api-key`,
      secretStringValue: SecretValue.unsafePlainText('placeholder-pinecone-key'),
    });

    // Apply tags to Secret
    Object.entries(props.tags).forEach(([key, value]) => {
      pineconeSecret.node.addMetadata('tags', { [key]: value });
    });

    // CloudWatch Log Group for Lambda functions
    const lambdaLogGroup = new LogGroup(this, 'LambdaLogGroup', {
      logGroupName: `/aws/lambda/talent-finder-${envName}`,
      retention: RetentionDays.ONE_WEEK,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // Apply tags to Log Group
    Object.entries(props.tags).forEach(([key, value]) => {
      lambdaLogGroup.node.addMetadata('tags', { [key]: value });
    });

    // Store values for export
    this.s3BucketName = documentBucket.bucketName;
    this.secretArn = pineconeSecret.secretArn;
    this.logGroupName = lambdaLogGroup.logGroupName;

    // Stack outputs for consumption by feature stacks
    this.exportValue(this.s3BucketName, { name: `TalentFinder-S3BucketName-${envName}` });
    this.exportValue(this.secretArn, { name: `TalentFinder-SecretArn-${envName}` });
    this.exportValue(this.logGroupName, { name: `TalentFinder-LogGroupName-${envName}` });
  }
}
