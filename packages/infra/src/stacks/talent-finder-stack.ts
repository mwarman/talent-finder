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
import { Table, AttributeType, BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import { Effect, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { CfnDataSource, CfnKnowledgeBase } from 'aws-cdk-lib/aws-bedrock';
import { Construct } from 'constructs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * TalentFinderStackProps extends StackProps to include application-specific properties
 * - appName: The name of the application (e.g., "talent-finder")
 * - envName: The environment identifier (e.g., "dev", "prod")
 * - logLevel: Lambda logging level
 * - logFormat: Lambda logging format
 * - logEnabled: Enable Lambda logging
 * - pineconeIndexHost: Pinecone Serverless index host URL for the Bedrock Knowledge Base
 * - pineconeApiKey: Pinecone API key written into Secrets Manager at deploy time
 */
interface TalentFinderStackProps extends StackProps {
  appName: string;
  envName: string;
  logLevel: string;
  logFormat: string;
  logEnabled: string;
  cloudFrontUrl: string;
  pineconeIndexHost: string;
  pineconeApiKey: string;
}

/**
 * Base Talent Finder Stack
 * Provisions foundational AWS resources:
 * - S3 bucket for document corpus (with versioning, encryption, lifecycle rules)
 * - DynamoDB table for document metadata (with documentId partition key, PAY_PER_REQUEST billing)
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
  public readonly knowledgeBaseId: string;
  public readonly dataSourceId: string;

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

    // DynamoDB Table for document metadata
    const documentsTable = new Table(this, 'DocumentsTable', {
      tableName: `${props.appName}-documents-${props.envName}`,
      partitionKey: {
        name: 'documentId',
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: props.envName === 'prod' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    });

    // Secrets Manager secret for Pinecone API key
    // The value is written at deploy time from CDK_PINECONE_API_KEY so Bedrock can
    // authenticate to the Pinecone vector store during Knowledge Base provisioning.
    const pineconeSecret = new Secret(this, 'PineconeApiKeySecret', {
      secretName: `${props.appName}/${props.envName}/pinecone-api-key`,
      // Bedrock requires the secret to be a JSON object with an "apiKey" key.
      secretStringValue: SecretValue.unsafePlainText(JSON.stringify({ apiKey: props.pineconeApiKey })),
    });

    // HTTP API Gateway
    const httpApi = new HttpApi(this, 'HttpApi', {
      description: `Talent Finder API for ${props.envName} environment`,
    });

    // IAM execution role assumed by the Bedrock service to read documents and access the vector store
    const knowledgeBaseRole = new Role(this, 'KnowledgeBaseRole', {
      roleName: `${props.appName}-kb-role-${props.envName}`,
      assumedBy: new ServicePrincipal('bedrock.amazonaws.com'),
    });

    // s3:GetObject — scoped to the documents/ prefix in the corpus bucket
    knowledgeBaseRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['s3:GetObject'],
        resources: [`${documentBucket.bucketArn}/documents/*`],
      }),
    );

    // s3:ListBucket — scoped to the corpus bucket (required for prefix scanning)
    knowledgeBaseRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['s3:ListBucket'],
        resources: [documentBucket.bucketArn],
      }),
    );

    // secretsmanager:GetSecretValue — scoped to the Pinecone API key secret
    knowledgeBaseRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['secretsmanager:GetSecretValue'],
        resources: [pineconeSecret.secretArn],
      }),
    );

    // bedrock:InvokeModel — required for the Bedrock service to call Amazon Titan Embeddings v2
    knowledgeBaseRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['bedrock:InvokeModel'],
        resources: [`arn:aws:bedrock:${this.region}::foundation-model/amazon.titan-embed-text-v2:0`],
      }),
    );

    // Bedrock Knowledge Base — Amazon Titan Embeddings v2 + Pinecone Serverless vector store
    const knowledgeBase = new CfnKnowledgeBase(this, 'KnowledgeBase', {
      name: `${props.appName}-kb-${props.envName}`,
      roleArn: knowledgeBaseRole.roleArn,
      knowledgeBaseConfiguration: {
        type: 'VECTOR',
        vectorKnowledgeBaseConfiguration: {
          // Amazon Titan Embeddings v2 produces 1536-dimensional vectors
          embeddingModelArn: `arn:aws:bedrock:${this.region}::foundation-model/amazon.titan-embed-text-v2:0`,
        },
      },
      storageConfiguration: {
        type: 'PINECONE',
        pineconeConfiguration: {
          connectionString: props.pineconeIndexHost,
          credentialsSecretArn: pineconeSecret.secretArn,
          fieldMapping: {
            metadataField: 'metadata',
            textField: 'text',
          },
        },
      },
    });

    // Ensure the KB resource waits for the role's inline policy to be fully attached before
    // CloudFormation attempts to create it. Without this, Bedrock validates the role permissions
    // immediately on KB creation and may find the policy not yet propagated (IAM eventual
    // consistency), causing an "not authorized to perform: secretsmanager:GetSecretValue" error.
    knowledgeBase.node.addDependency(knowledgeBaseRole);

    // S3 data source wired to the documents/ prefix with hierarchical chunking
    // Tunable chunking parameters:
    //   - Parent chunk max tokens: 1500 (broad context window)
    //   - Child chunk max tokens:   300 (fine-grained retrieval unit)
    //   - Overlap tokens:            60 (continuity across chunk boundaries)
    const knowledgeBaseDataSource = new CfnDataSource(this, 'KnowledgeBaseDataSource', {
      knowledgeBaseId: knowledgeBase.attrKnowledgeBaseId,
      name: `${props.appName}-documents-${props.envName}`,
      dataSourceConfiguration: {
        type: 'S3',
        s3Configuration: {
          bucketArn: documentBucket.bucketArn,
          inclusionPrefixes: ['documents/'],
        },
      },
      vectorIngestionConfiguration: {
        chunkingConfiguration: {
          chunkingStrategy: 'HIERARCHICAL',
          hierarchicalChunkingConfiguration: {
            levelConfigurations: [
              { maxTokens: 1500 }, // parent chunk
              { maxTokens: 300 }, //  child chunk
            ],
            overlapTokens: 60,
          },
        },
      },
    });

    // Store KB values for export
    this.knowledgeBaseId = knowledgeBase.attrKnowledgeBaseId;
    this.dataSourceId = knowledgeBaseDataSource.attrDataSourceId;

    // Base Lambda environment variables for all functions in this stack
    // Includes Bedrock Knowledge Base configuration for vector-based document search
    const baseLambdaEnvironment = {
      LOG_LEVEL: props.logLevel,
      LOG_FORMAT: props.logFormat,
      LOG_ENABLED: props.logEnabled,
      DOCUMENTS_BUCKET_NAME: documentBucket.bucketName,
      DOCUMENTS_TABLE_NAME: documentsTable.tableName,
      BEDROCK_KB_ID: knowledgeBase.attrKnowledgeBaseId,
      BEDROCK_KB_DATA_SOURCE_ID: knowledgeBaseDataSource.attrDataSourceId,
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

    // Grant upload Lambda read and write permissions to DynamoDB
    documentsTable.grantReadWriteData(uploadLambda);

    // Wire upload Lambda to POST /documents/upload-url route
    const uploadIntegration = new HttpLambdaIntegration('UploadIntegration', uploadLambda);
    httpApi.addRoutes({
      path: '/documents/upload-url',
      methods: [HttpMethod.POST],
      integration: uploadIntegration,
    });

    // Documents List Lambda Function — retrieves all documents from DynamoDB
    const documentsListLambda = new NodejsFunction(this, 'DocumentsListFunction', {
      functionName: `${props.appName}-documents-list-${props.envName}`,
      entry: path.join(__dirname, '../../../api/src/handlers/documents-list.ts'),
      handler: 'handle',
      runtime: Runtime.NODEJS_24_X,
      memorySize: 256,
      timeout: Duration.seconds(10),
      loggingFormat: LoggingFormat.JSON,
      applicationLogLevelV2: ApplicationLogLevel.DEBUG,
      systemLogLevelV2: SystemLogLevel.INFO,
      logGroup: new LogGroup(this, 'DocumentsListFunctionLogGroup', {
        logGroupName: `/aws/lambda/${props.appName}-documents-list-${props.envName}`,
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

    // Grant documents list Lambda read-only permissions to DynamoDB
    documentsTable.grantReadData(documentsListLambda);

    // Wire documents list Lambda to GET /documents route
    const documentsListIntegration = new HttpLambdaIntegration('DocumentsListIntegration', documentsListLambda);
    httpApi.addRoutes({
      path: '/documents',
      methods: [HttpMethod.GET],
      integration: documentsListIntegration,
    });

    // Document Delete Lambda Function — deletes document from S3 and DynamoDB
    const documentDeleteLambda = new NodejsFunction(this, 'DocumentDeleteFunction', {
      functionName: `${props.appName}-document-delete-${props.envName}`,
      entry: path.join(__dirname, '../../../api/src/handlers/document-delete.ts'),
      handler: 'handle',
      runtime: Runtime.NODEJS_24_X,
      memorySize: 256,
      timeout: Duration.seconds(10),
      loggingFormat: LoggingFormat.JSON,
      applicationLogLevelV2: ApplicationLogLevel.DEBUG,
      systemLogLevelV2: SystemLogLevel.INFO,
      logGroup: new LogGroup(this, 'DocumentDeleteFunctionLogGroup', {
        logGroupName: `/aws/lambda/${props.appName}-document-delete-${props.envName}`,
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

    // Grant document delete Lambda s3:DeleteObject scoped to the documents/* prefix
    documentBucket.grantDelete(documentDeleteLambda, 'documents/*');

    // Grant document delete Lambda delete permissions to DynamoDB (scoped to the Documents table)
    documentsTable.grantWriteData(documentDeleteLambda);

    // Wire document delete Lambda to DELETE /documents/:id route
    const documentDeleteIntegration = new HttpLambdaIntegration('DocumentDeleteIntegration', documentDeleteLambda);
    httpApi.addRoutes({
      path: '/documents/{id}',
      methods: [HttpMethod.DELETE],
      integration: documentDeleteIntegration,
    });

    // Sync Start Lambda Function — initiates synchronization of a document to Bedrock Knowledge Base
    const syncStartLambda = new NodejsFunction(this, 'SyncStartFunction', {
      functionName: `${props.appName}-sync-start-${props.envName}`,
      entry: path.join(__dirname, '../../../api/src/handlers/sync-start.ts'),
      handler: 'handle',
      runtime: Runtime.NODEJS_24_X,
      memorySize: 512,
      timeout: Duration.seconds(30),
      loggingFormat: LoggingFormat.JSON,
      applicationLogLevelV2: ApplicationLogLevel.DEBUG,
      systemLogLevelV2: SystemLogLevel.INFO,
      logGroup: new LogGroup(this, 'SyncStartFunctionLogGroup', {
        logGroupName: `/aws/lambda/${props.appName}-sync-start-${props.envName}`,
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

    // Grant sync start Lambda read and write permissions to DynamoDB
    documentsTable.grantReadWriteData(syncStartLambda);

    // Grant sync start Lambda permissions to call Bedrock StartIngestionJob API for the Knowledge Base
    syncStartLambda.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['bedrock:StartIngestionJob', 'bedrock:AssociateThirdPartyKnowledgeBase'],
        resources: [knowledgeBase.attrKnowledgeBaseArn],
      }),
    );

    // Wire sync start Lambda to POST /documents/{id}/sync route
    const syncStartIntegration = new HttpLambdaIntegration('SyncStartIntegration', syncStartLambda);
    httpApi.addRoutes({
      path: '/documents/{id}/sync',
      methods: [HttpMethod.POST],
      integration: syncStartIntegration,
    });

    // Sync Status Lambda Function — retrieves synchronization status of a document
    const syncStatusLambda = new NodejsFunction(this, 'SyncStatusFunction', {
      functionName: `${props.appName}-sync-status-${props.envName}`,
      entry: path.join(__dirname, '../../../api/src/handlers/sync-status.ts'),
      handler: 'handle',
      runtime: Runtime.NODEJS_24_X,
      memorySize: 512,
      timeout: Duration.seconds(30),
      loggingFormat: LoggingFormat.JSON,
      applicationLogLevelV2: ApplicationLogLevel.DEBUG,
      systemLogLevelV2: SystemLogLevel.INFO,
      logGroup: new LogGroup(this, 'SyncStatusFunctionLogGroup', {
        logGroupName: `/aws/lambda/${props.appName}-sync-status-${props.envName}`,
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

    // Grant sync status Lambda read and write permissions to DynamoDB
    documentsTable.grantReadWriteData(syncStatusLambda);

    // Grant sync status Lambda permissions to call Bedrock ListIngestionJobs and GetIngestionJob APIs for the Knowledge Base
    syncStatusLambda.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['bedrock:ListIngestionJobs', 'bedrock:GetIngestionJob'],
        resources: [knowledgeBase.attrKnowledgeBaseArn],
      }),
    );

    // Wire sync status Lambda to GET /documents/{id}/sync-status route
    const syncStatusIntegration = new HttpLambdaIntegration('SyncStatusIntegration', syncStatusLambda);
    httpApi.addRoutes({
      path: '/documents/{id}/sync-status',
      methods: [HttpMethod.GET],
      integration: syncStatusIntegration,
    });

    // Store values for export
    this.s3BucketName = documentBucket.bucketName;
    this.secretArn = pineconeSecret.secretArn;
    this.apiEndpointUrl = httpApi.url || '';

    // Stack outputs for consumption by feature stacks and end users
    this.exportValue(this.s3BucketName, { name: `TalentFinder-S3BucketName-${props.envName}` });
    this.exportValue(this.secretArn, { name: `TalentFinder-SecretArn-${props.envName}` });
    this.exportValue(this.apiEndpointUrl, { name: `TalentFinder-ApiEndpoint-${props.envName}` });
    this.exportValue(this.knowledgeBaseId, { name: `TalentFinder-KnowledgeBaseId-${props.envName}` });
    this.exportValue(this.dataSourceId, { name: `TalentFinder-DataSourceId-${props.envName}` });
  }
}
