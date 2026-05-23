import path from 'path';
import { fileURLToPath } from 'url';
import { Stack, StackProps, Duration, RemovalPolicy, SecretValue } from 'aws-cdk-lib';
import { Bucket, BucketEncryption, CorsRule, HttpMethods, StorageClass } from 'aws-cdk-lib/aws-s3';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { HttpApi, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { ApplicationLogLevel, LoggingFormat, Runtime, SystemLogLevel } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * TalentFinderStackProps extends StackProps to include application-specific properties
 * - appName: The name of the application (e.g., "talent-finder")
 * - envName: The environment identifier (e.g., "dev", "prod")
 * - logLevel: Lambda logging level
 * - logFormat: Lambda logging format
 * - logEnabled: Enable Lambda logging
 */
interface TalentFinderStackProps extends StackProps {
  appName: string;
  envName: string;
  logLevel: string;
  logFormat: string;
  logEnabled: string;
  cloudFrontUrl: string;
}

/**
 * Base Talent Finder Stack
 * Provisions foundational AWS resources:
 * - S3 bucket for document corpus (with versioning, encryption, lifecycle rules)
 * - Secrets Manager secret for Pinecone API key
 * - CloudWatch log group for Lambda functions
 * - HTTP API Gateway for serverless API endpoints
 * - Base Lambda IAM execution role with CloudWatch Logs permissions
 * - Health check Lambda function wired to GET /health route
 */
export class TalentFinderStack extends Stack {
  public readonly s3BucketName: string;
  public readonly secretArn: string;
  public readonly apiEndpointUrl: string;

  constructor(scope: Construct, id: string, props: TalentFinderStackProps) {
    super(scope, id, props);

    // S3 CORS rule — permits PUT uploads from the CloudFront distribution only
    const documentBucketCors: CorsRule[] = [
      {
        allowedOrigins: [props.cloudFrontUrl],
        allowedMethods: [HttpMethods.PUT],
        allowedHeaders: ['*'],
        maxAge: 3000,
      },
    ];

    // S3 Bucket for document corpus
    const documentBucket = new Bucket(this, 'DocumentBucket', {
      versioned: true,
      encryption: BucketEncryption.S3_MANAGED,
      removalPolicy: props.envName === 'prod' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      autoDeleteObjects: props.envName !== 'prod',
      cors: documentBucketCors,
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
      secretName: `${props.appName}/${props.envName}/pinecone-api-key`,
      secretStringValue: SecretValue.unsafePlainText('placeholder-pinecone-key'),
    });

    // HTTP API Gateway
    const httpApi = new HttpApi(this, 'HttpApi', {
      description: `Talent Finder API for ${props.envName} environment`,
    });

    // Base Lambda environment variables for all functions in this stack
    const baseLambdaEnvironment = {
      LOG_LEVEL: props.logLevel,
      LOG_FORMAT: props.logFormat,
      LOG_ENABLED: props.logEnabled,
      DOCUMENTS_BUCKET_NAME: documentBucket.bucketName,
    };

    // Health Check Lambda Function using NodejsFunction for esbuild bundling
    const healthLambda = new NodejsFunction(this, 'HealthFunction', {
      functionName: `${props.appName}-health-${props.envName}`,
      entry: path.join(__dirname, '../../../api/src/handlers/health.ts'),
      handler: 'handle',
      runtime: Runtime.NODEJS_24_X,
      memorySize: 128,
      timeout: Duration.seconds(6),
      loggingFormat: LoggingFormat.JSON,
      applicationLogLevelV2: ApplicationLogLevel.DEBUG,
      systemLogLevelV2: SystemLogLevel.INFO,
      logGroup: new LogGroup(this, 'HealthFunctionLogGroup', {
        logGroupName: `/aws/lambda/${props.appName}-health-${props.envName}`,
        retention: props.envName === 'prod' ? RetentionDays.ONE_MONTH : RetentionDays.ONE_WEEK,
        removalPolicy: props.envName === 'prod' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      }),
      environment: baseLambdaEnvironment,
      bundling: {
        minify: true,
        target: 'esnext',
        sourceMap: false,
      },
    });

    // Wire health Lambda to GET /health route
    const healthIntegration = new HttpLambdaIntegration('HealthIntegration', healthLambda);
    httpApi.addRoutes({
      path: '/health',
      methods: [HttpMethod.GET],
      integration: healthIntegration,
    });

    // Upload Lambda Function — generates pre-signed S3 PUT URLs
    const uploadLambda = new NodejsFunction(this, 'UploadFunction', {
      functionName: `${props.appName}-upload-${props.envName}`,
      entry: path.join(__dirname, '../../../api/src/handlers/upload.ts'),
      handler: 'handle',
      runtime: Runtime.NODEJS_24_X,
      memorySize: 512,
      timeout: Duration.seconds(10),
      loggingFormat: LoggingFormat.JSON,
      applicationLogLevelV2: ApplicationLogLevel.DEBUG,
      systemLogLevelV2: SystemLogLevel.INFO,
      logGroup: new LogGroup(this, 'UploadFunctionLogGroup', {
        logGroupName: `/aws/lambda/${props.appName}-upload-${props.envName}`,
        retention: props.envName === 'prod' ? RetentionDays.ONE_MONTH : RetentionDays.ONE_WEEK,
        removalPolicy: props.envName === 'prod' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      }),
      environment: {
        ...baseLambdaEnvironment,
      },
      bundling: {
        minify: true,
        target: 'esnext',
        sourceMap: false,
      },
    });

    // Grant upload Lambda s3:PutObject scoped to the documents/* prefix
    documentBucket.grantPut(uploadLambda, 'documents/*');

    // Wire upload Lambda to POST /documents/upload-url route
    const uploadIntegration = new HttpLambdaIntegration('UploadIntegration', uploadLambda);
    httpApi.addRoutes({
      path: '/documents/upload-url',
      methods: [HttpMethod.POST],
      integration: uploadIntegration,
    });

    // Store values for export
    this.s3BucketName = documentBucket.bucketName;
    this.secretArn = pineconeSecret.secretArn;
    this.apiEndpointUrl = httpApi.url || '';

    // Stack outputs for consumption by feature stacks and end users
    this.exportValue(this.s3BucketName, { name: `TalentFinder-S3BucketName-${props.envName}` });
    this.exportValue(this.secretArn, { name: `TalentFinder-SecretArn-${props.envName}` });
    this.exportValue(this.apiEndpointUrl, { name: `TalentFinder-ApiEndpoint-${props.envName}` });
  }
}
