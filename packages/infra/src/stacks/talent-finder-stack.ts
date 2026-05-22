import { Stack, StackProps, Duration, RemovalPolicy, SecretValue } from 'aws-cdk-lib';
import { Bucket, BucketEncryption, StorageClass } from 'aws-cdk-lib/aws-s3';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

interface TalentFinderStackProps extends StackProps {
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
      removalPolicy: envName === 'prod' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      autoDeleteObjects: envName !== 'prod',
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

    // Secrets Manager secret for Pinecone API key
    const pineconeSecret = new Secret(this, 'PineconeApiKeySecret', {
      secretName: `talent-finder/${envName}/pinecone-api-key`,
      secretStringValue: SecretValue.unsafePlainText('placeholder-pinecone-key'),
    });

    // CloudWatch Log Group for Lambda functions
    const lambdaLogGroup = new LogGroup(this, 'LambdaLogGroup', {
      logGroupName: `/aws/lambda/talent-finder-${envName}`,
      retention: RetentionDays.ONE_WEEK,
      removalPolicy: envName === 'prod' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
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
