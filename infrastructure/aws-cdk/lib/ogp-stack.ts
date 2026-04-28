import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as rds from "aws-cdk-lib/aws-rds";
import * as elasticache from "aws-cdk-lib/aws-elasticache";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as route53Targets from "aws-cdk-lib/aws-route53-targets";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as ses from "aws-cdk-lib/aws-ses";
import * as sns from "aws-cdk-lib/aws-sns";
import * as iam from "aws-cdk-lib/aws-iam";
import * as logs from "aws-cdk-lib/aws-logs";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as cloudwatchActions from "aws-cdk-lib/aws-cloudwatch-actions";

interface OGPStackProps extends cdk.StackProps {
  domainName: string;
  envName: string;
}

export class OGPStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: OGPStackProps) {
    super(scope, id, props);

    const { domainName, envName } = props;

    // ================================================================
    // NETWORKING
    // ================================================================

    const vpc = new ec2.Vpc(this, "VPC", {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          name: "Public",
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: "Private",
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: "Isolated",
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    // ================================================================
    // SECURITY GROUPS
    // ================================================================

    const albSg = new ec2.SecurityGroup(this, "ALB-SG", {
      vpc,
      description: "Security group for Application Load Balancer",
      allowAllOutbound: true,
    });
    albSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), "HTTP");
    albSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), "HTTPS");

    const apiSg = new ec2.SecurityGroup(this, "API-SG", {
      vpc,
      description: "Security group for API service",
      allowAllOutbound: true,
    });
    apiSg.addIngressRule(albSg, ec2.Port.tcp(4000), "API from ALB");

    const webSg = new ec2.SecurityGroup(this, "Web-SG", {
      vpc,
      description: "Security group for Web frontend service",
      allowAllOutbound: true,
    });
    webSg.addIngressRule(albSg, ec2.Port.tcp(3000), "Web from ALB");

    const dbSg = new ec2.SecurityGroup(this, "DB-SG", {
      vpc,
      description: "Security group for RDS PostgreSQL",
      allowAllOutbound: false,
    });
    dbSg.addIngressRule(apiSg, ec2.Port.tcp(5432), "Postgres from API");

    const redisSg = new ec2.SecurityGroup(this, "Redis-SG", {
      vpc,
      description: "Security group for ElastiCache Redis",
      allowAllOutbound: false,
    });
    redisSg.addIngressRule(apiSg, ec2.Port.tcp(6379), "Redis from API");

    // ================================================================
    // SECRETS
    // ================================================================

    const dbSecret = new secretsmanager.Secret(this, "DBSecret", {
      secretName: `ogp/${envName}/db-password`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: "ogp_admin" }),
        generateStringKey: "password",
        excludePunctuation: true,
        passwordLength: 32,
      },
    });

    const jwtSecret = new secretsmanager.Secret(this, "JWTSecret", {
      secretName: `ogp/${envName}/jwt-secret`,
      generateSecretString: {
        excludePunctuation: false,
        passwordLength: 64,
      },
    });

    const apiKeysSecret = new secretsmanager.Secret(this, "APIKeysSecret", {
      secretName: `ogp/${envName}/api-keys`,
      description: "Third-party API keys (FCM, Stripe, etc.)",
    });

    // ================================================================
    // DATABASE - RDS PostgreSQL
    // ================================================================

    const dbInstance = new rds.DatabaseInstance(this, "PostgreSQL", {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MEDIUM
      ),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [dbSg],
      credentials: rds.Credentials.fromSecret(dbSecret),
      databaseName: "ogp",
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      storageEncrypted: true,
      multiAz: envName === "production",
      backupRetention: cdk.Duration.days(7),
      deletionProtection: envName === "production",
      removalPolicy:
        envName === "production"
          ? cdk.RemovalPolicy.RETAIN
          : cdk.RemovalPolicy.DESTROY,
      enablePerformanceInsights: true,
    });

    // ================================================================
    // CACHE - ElastiCache Redis
    // ================================================================

    const redisSubnetGroup = new elasticache.CfnSubnetGroup(
      this,
      "RedisSubnetGroup",
      {
        description: "Subnet group for OGP Redis",
        subnetIds: vpc.selectSubnets({
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        }).subnetIds,
      }
    );

    const redisCluster = new elasticache.CfnCacheCluster(this, "Redis", {
      engine: "redis",
      cacheNodeType: "cache.t3.micro",
      numCacheNodes: 1,
      vpcSecurityGroupIds: [redisSg.securityGroupId],
      cacheSubnetGroupName: redisSubnetGroup.ref,
      engineVersion: "7.1",
      port: 6379,
    });

    // ================================================================
    // STORAGE - S3
    // ================================================================

    const mediaBucket = new s3.Bucket(this, "MediaBucket", {
      bucketName: `ogp-media-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy:
        envName === "production"
          ? cdk.RemovalPolicy.RETAIN
          : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: envName !== "production",
      cors: [
        {
          allowedHeaders: ["*"],
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
          ],
          allowedOrigins: [`https://${domainName}`, `https://app.${domainName}`],
          exposedHeaders: ["ETag", "x-amz-meta-custom-header"],
          maxAge: 3600,
        },
      ],
      lifecycleRules: [
        {
          id: "expire-zip-exports",
          prefix: "zip/",
          expiration: cdk.Duration.days(1),
          enabled: true,
        },
        {
          id: "expire-temp-uploads",
          prefix: "temp/",
          expiration: cdk.Duration.days(1),
          enabled: true,
        },
        {
          id: "transition-originals-to-ia",
          prefix: "originals/",
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
          enabled: true,
        },
      ],
    });

    // ================================================================
    // CDN - CloudFront for Media
    // ================================================================

    const mediaOai = new cloudfront.OriginAccessIdentity(this, "MediaOAI", {
      comment: "OAI for OGP media bucket",
    });
    mediaBucket.grantRead(mediaOai);

    const mediaCachePolicy = new cloudfront.CachePolicy(
      this,
      "MediaCachePolicy",
      {
        cachePolicyName: `ogp-media-cache-${envName}`,
        defaultTtl: cdk.Duration.days(7),
        maxTtl: cdk.Duration.days(365),
        minTtl: cdk.Duration.seconds(0),
        enableAcceptEncodingGzip: true,
        enableAcceptEncodingBrotli: true,
        headerBehavior: cloudfront.CacheHeaderBehavior.none(),
        queryStringBehavior: cloudfront.CacheQueryStringBehavior.allowList(
          "w",
          "h",
          "q"
        ),
      }
    );

    const thumbnailCachePolicy = new cloudfront.CachePolicy(
      this,
      "ThumbnailCachePolicy",
      {
        cachePolicyName: `ogp-thumbnail-cache-${envName}`,
        defaultTtl: cdk.Duration.days(30),
        maxTtl: cdk.Duration.days(365),
        minTtl: cdk.Duration.days(1),
        enableAcceptEncodingGzip: true,
        enableAcceptEncodingBrotli: true,
      }
    );

    const noCachePolicy = new cloudfront.CachePolicy(this, "NoCachePolicy", {
      cachePolicyName: `ogp-no-cache-${envName}`,
      defaultTtl: cdk.Duration.seconds(0),
      maxTtl: cdk.Duration.seconds(0),
      minTtl: cdk.Duration.seconds(0),
    });

    const mediaDistribution = new cloudfront.Distribution(
      this,
      "MediaDistribution",
      {
        defaultBehavior: {
          origin: new origins.S3Origin(mediaBucket, {
            originAccessIdentity: mediaOai,
          }),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: mediaCachePolicy,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        },
        additionalBehaviors: {
          "thumbnails/*": {
            origin: new origins.S3Origin(mediaBucket, {
              originAccessIdentity: mediaOai,
            }),
            viewerProtocolPolicy:
              cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            cachePolicy: thumbnailCachePolicy,
          },
          "display/*": {
            origin: new origins.S3Origin(mediaBucket, {
              originAccessIdentity: mediaOai,
            }),
            viewerProtocolPolicy:
              cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            cachePolicy: mediaCachePolicy,
          },
          "originals/*": {
            origin: new origins.S3Origin(mediaBucket, {
              originAccessIdentity: mediaOai,
            }),
            viewerProtocolPolicy:
              cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            cachePolicy: noCachePolicy,
          },
        },
        priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
        httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
        comment: `OGP Media CDN (${envName})`,
      }
    );

    // ================================================================
    // DNS & CERTIFICATES
    // ================================================================

    const hostedZone = new route53.HostedZone(this, "HostedZone", {
      zoneName: domainName,
    });

    const certificate = new acm.Certificate(this, "Certificate", {
      domainName,
      subjectAlternativeNames: [`*.${domainName}`],
      validation: acm.CertificateValidation.fromDns(hostedZone),
    });

    // ================================================================
    // ECR REPOSITORIES
    // ================================================================

    const apiRepo = new ecr.Repository(this, "APIRepo", {
      repositoryName: "ogp/api",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      lifecycleRules: [
        { maxImageCount: 10, description: "Keep last 10 images" },
      ],
    });

    const webRepo = new ecr.Repository(this, "WebRepo", {
      repositoryName: "ogp/web",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      lifecycleRules: [
        { maxImageCount: 10, description: "Keep last 10 images" },
      ],
    });

    // ================================================================
    // ECS CLUSTER
    // ================================================================

    const cluster = new ecs.Cluster(this, "Cluster", {
      vpc,
      clusterName: `ogp-${envName}`,
      containerInsights: true,
    });

    // ================================================================
    // IAM ROLES
    // ================================================================

    const apiTaskRole = new iam.Role(this, "APITaskRole", {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
      description: "Task role for OGP API service",
    });

    mediaBucket.grantReadWrite(apiTaskRole);
    apiTaskRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ["ses:SendEmail", "ses:SendRawEmail"],
        resources: ["*"],
      })
    );
    apiTaskRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ],
        resources: ["*"],
      })
    );
    apiTaskRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ["xray:PutTraceSegments", "xray:PutTelemetryRecords"],
        resources: ["*"],
      })
    );
    apiTaskRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ["sns:Publish"],
        resources: ["*"],
      })
    );
    dbSecret.grantRead(apiTaskRole);
    jwtSecret.grantRead(apiTaskRole);
    apiKeysSecret.grantRead(apiTaskRole);

    const workerTaskRole = new iam.Role(this, "WorkerTaskRole", {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
      description: "Task role for OGP media worker service",
    });

    mediaBucket.grantReadWrite(workerTaskRole);
    workerTaskRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ["ses:SendEmail", "ses:SendRawEmail"],
        resources: ["*"],
      })
    );
    dbSecret.grantRead(workerTaskRole);
    jwtSecret.grantRead(workerTaskRole);
    apiKeysSecret.grantRead(workerTaskRole);

    const executionRole = new iam.Role(this, "ECSExecutionRole", {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AmazonECSTaskExecutionRolePolicy"
        ),
      ],
    });
    dbSecret.grantRead(executionRole);
    jwtSecret.grantRead(executionRole);
    apiKeysSecret.grantRead(executionRole);

    // ================================================================
    // LOG GROUPS
    // ================================================================

    const apiLogGroup = new logs.LogGroup(this, "APILogGroup", {
      logGroupName: `/ecs/ogp-api-${envName}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const workerLogGroup = new logs.LogGroup(this, "WorkerLogGroup", {
      logGroupName: `/ecs/ogp-worker-${envName}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const webLogGroup = new logs.LogGroup(this, "WebLogGroup", {
      logGroupName: `/ecs/ogp-web-${envName}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ================================================================
    // SHARED ENV VARS
    // ================================================================

    const redisHost = redisCluster.attrRedisEndpointAddress;
    const redisPort = redisCluster.attrRedisEndpointPort;

    const sharedEnv: Record<string, string> = {
      NODE_ENV: "production",
      AWS_REGION: this.region,
      S3_BUCKET: mediaBucket.bucketName,
      CLOUDFRONT_URL: `https://${mediaDistribution.distributionDomainName}`,
      REDIS_URL: `redis://${redisHost}:${redisPort}`,
    };

    // ================================================================
    // ECS - API SERVICE
    // ================================================================

    const apiTaskDef = new ecs.FargateTaskDefinition(this, "APITaskDef", {
      memoryLimitMiB: 1024,
      cpu: 512,
      taskRole: apiTaskRole,
      executionRole,
    });

    apiTaskDef.addContainer("api", {
      image: ecs.ContainerImage.fromEcrRepository(apiRepo, "latest"),
      portMappings: [{ containerPort: 4000 }],
      environment: {
        ...sharedEnv,
        PORT: "4000",
      },
      secrets: {
        DATABASE_URL: ecs.Secret.fromSecretsManager(dbSecret),
        JWT_SECRET: ecs.Secret.fromSecretsManager(jwtSecret),
        API_KEYS: ecs.Secret.fromSecretsManager(apiKeysSecret),
      },
      logging: ecs.LogDrivers.awsLogs({
        logGroup: apiLogGroup,
        streamPrefix: "api",
      }),
      healthCheck: {
        command: [
          "CMD-SHELL",
          "curl -f http://localhost:4000/health || exit 1",
        ],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(60),
      },
    });

    const apiAlb = new elbv2.ApplicationLoadBalancer(this, "API-ALB", {
      vpc,
      internetFacing: true,
      securityGroup: albSg,
    });

    const apiListener = apiAlb.addListener("APIListener", {
      port: 443,
      certificates: [certificate],
      protocol: elbv2.ApplicationProtocol.HTTPS,
    });

    apiAlb.addListener("APIRedirect", {
      port: 80,
      defaultAction: elbv2.ListenerAction.redirect({
        protocol: "HTTPS",
        port: "443",
        permanent: true,
      }),
    });

    const apiService = new ecs.FargateService(this, "APIService", {
      cluster,
      taskDefinition: apiTaskDef,
      desiredCount: 2,
      securityGroups: [apiSg],
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      enableExecuteCommand: true,
      circuitBreaker: { rollback: true },
    });

    const apiTargetGroup = apiListener.addTargets("APITargets", {
      port: 4000,
      targets: [apiService],
      healthCheck: {
        path: "/health",
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
      deregistrationDelay: cdk.Duration.seconds(30),
    });

    // ================================================================
    // ECS - WORKER SERVICE (BullMQ media processor)
    // ================================================================

    const workerTaskDef = new ecs.FargateTaskDefinition(
      this,
      "WorkerTaskDef",
      {
        memoryLimitMiB: 2048,
        cpu: 1024,
        taskRole: workerTaskRole,
        executionRole,
      }
    );

    workerTaskDef.addContainer("worker", {
      image: ecs.ContainerImage.fromEcrRepository(apiRepo, "latest"),
      command: ["node", "dist/workers/index.js"],
      environment: {
        ...sharedEnv,
        WORKER_MODE: "true",
      },
      secrets: {
        DATABASE_URL: ecs.Secret.fromSecretsManager(dbSecret),
        JWT_SECRET: ecs.Secret.fromSecretsManager(jwtSecret),
        API_KEYS: ecs.Secret.fromSecretsManager(apiKeysSecret),
      },
      logging: ecs.LogDrivers.awsLogs({
        logGroup: workerLogGroup,
        streamPrefix: "worker",
      }),
    });

    const workerService = new ecs.FargateService(this, "WorkerService", {
      cluster,
      taskDefinition: workerTaskDef,
      desiredCount: 1,
      securityGroups: [apiSg],
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      enableExecuteCommand: true,
      circuitBreaker: { rollback: true },
    });

    // ================================================================
    // ECS - WEB SERVICE
    // ================================================================

    const webTaskDef = new ecs.FargateTaskDefinition(this, "WebTaskDef", {
      memoryLimitMiB: 512,
      cpu: 256,
      executionRole,
    });

    webTaskDef.addContainer("web", {
      image: ecs.ContainerImage.fromEcrRepository(webRepo, "latest"),
      portMappings: [{ containerPort: 3000 }],
      environment: {
        NODE_ENV: "production",
        NEXT_PUBLIC_API_URL: `https://api.${domainName}`,
        NEXT_PUBLIC_CLOUDFRONT_URL: `https://${mediaDistribution.distributionDomainName}`,
      },
      logging: ecs.LogDrivers.awsLogs({
        logGroup: webLogGroup,
        streamPrefix: "web",
      }),
    });

    const webAlb = new elbv2.ApplicationLoadBalancer(this, "Web-ALB", {
      vpc,
      internetFacing: true,
      securityGroup: albSg,
    });

    const webListener = webAlb.addListener("WebListener", {
      port: 443,
      certificates: [certificate],
      protocol: elbv2.ApplicationProtocol.HTTPS,
    });

    webAlb.addListener("WebRedirect", {
      port: 80,
      defaultAction: elbv2.ListenerAction.redirect({
        protocol: "HTTPS",
        port: "443",
        permanent: true,
      }),
    });

    const webService = new ecs.FargateService(this, "WebService", {
      cluster,
      taskDefinition: webTaskDef,
      desiredCount: 2,
      securityGroups: [webSg],
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      circuitBreaker: { rollback: true },
    });

    webListener.addTargets("WebTargets", {
      port: 3000,
      targets: [webService],
      healthCheck: {
        path: "/",
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
      deregistrationDelay: cdk.Duration.seconds(30),
    });

    // ================================================================
    // CDN - CloudFront for Web Frontend
    // ================================================================

    const webDistribution = new cloudfront.Distribution(
      this,
      "WebDistribution",
      {
        defaultBehavior: {
          origin: new origins.HttpOrigin(webAlb.loadBalancerDnsName, {
            protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
          }),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy:
            cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        },
        additionalBehaviors: {
          "_next/static/*": {
            origin: new origins.HttpOrigin(webAlb.loadBalancerDnsName, {
              protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
            }),
            viewerProtocolPolicy:
              cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          },
        },
        domainNames: [domainName, `app.${domainName}`],
        certificate,
        priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
        httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
        comment: `OGP Web Frontend (${envName})`,
      }
    );

    // ================================================================
    // DNS RECORDS
    // ================================================================

    new route53.ARecord(this, "APIDNSRecord", {
      zone: hostedZone,
      recordName: `api.${domainName}`,
      target: route53.RecordTarget.fromAlias(
        new route53Targets.LoadBalancerTarget(apiAlb)
      ),
    });

    new route53.ARecord(this, "WebDNSRecord", {
      zone: hostedZone,
      recordName: domainName,
      target: route53.RecordTarget.fromAlias(
        new route53Targets.CloudFrontTarget(webDistribution)
      ),
    });

    new route53.ARecord(this, "AppDNSRecord", {
      zone: hostedZone,
      recordName: `app.${domainName}`,
      target: route53.RecordTarget.fromAlias(
        new route53Targets.CloudFrontTarget(webDistribution)
      ),
    });

    new route53.ARecord(this, "MediaDNSRecord", {
      zone: hostedZone,
      recordName: `media.${domainName}`,
      target: route53.RecordTarget.fromAlias(
        new route53Targets.CloudFrontTarget(mediaDistribution)
      ),
    });

    // ================================================================
    // NOTIFICATIONS - SES
    // ================================================================

    new ses.EmailIdentity(this, "SESIdentity", {
      identity: ses.Identity.domain(domainName),
    });

    // ================================================================
    // NOTIFICATIONS - SNS (for push notifications via FCM)
    // ================================================================

    const pushTopic = new sns.Topic(this, "PushNotificationTopic", {
      topicName: `ogp-push-${envName}`,
      displayName: "OGP Push Notifications",
    });

    // ================================================================
    // MONITORING - CloudWatch Alarms
    // ================================================================

    const alarmTopic = new sns.Topic(this, "AlarmTopic", {
      topicName: `ogp-alarms-${envName}`,
      displayName: "OGP Infrastructure Alarms",
    });

    // CPU Alarm - API
    new cloudwatch.Alarm(this, "APICpuAlarm", {
      alarmName: `ogp-api-cpu-high-${envName}`,
      metric: apiService.metricCpuUtilization(),
      threshold: 80,
      evaluationPeriods: 3,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      alarmDescription: "API service CPU utilization above 80%",
    }).addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    // Memory Alarm - API
    new cloudwatch.Alarm(this, "APIMemoryAlarm", {
      alarmName: `ogp-api-memory-high-${envName}`,
      metric: apiService.metricMemoryUtilization(),
      threshold: 80,
      evaluationPeriods: 3,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      alarmDescription: "API service memory utilization above 80%",
    }).addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    // 5xx Errors Alarm
    new cloudwatch.Alarm(this, "API5xxAlarm", {
      alarmName: `ogp-api-5xx-high-${envName}`,
      metric: apiAlb.metrics.httpCodeTarget(
        elbv2.HttpCodeTarget.TARGET_5XX_COUNT,
        { period: cdk.Duration.minutes(1) }
      ),
      threshold: 10,
      evaluationPeriods: 1,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      alarmDescription: "More than 10 5xx errors per minute",
    }).addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    // CPU Alarm - Worker
    new cloudwatch.Alarm(this, "WorkerCpuAlarm", {
      alarmName: `ogp-worker-cpu-high-${envName}`,
      metric: workerService.metricCpuUtilization(),
      threshold: 80,
      evaluationPeriods: 3,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      alarmDescription: "Worker service CPU utilization above 80%",
    }).addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    // Memory Alarm - Worker
    new cloudwatch.Alarm(this, "WorkerMemoryAlarm", {
      alarmName: `ogp-worker-memory-high-${envName}`,
      metric: workerService.metricMemoryUtilization(),
      threshold: 80,
      evaluationPeriods: 3,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      alarmDescription: "Worker service memory utilization above 80%",
    }).addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    // DB CPU Alarm
    new cloudwatch.Alarm(this, "DBCpuAlarm", {
      alarmName: `ogp-db-cpu-high-${envName}`,
      metric: dbInstance.metricCPUUtilization(),
      threshold: 80,
      evaluationPeriods: 3,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      alarmDescription: "RDS CPU utilization above 80%",
    }).addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    // ================================================================
    // OUTPUTS
    // ================================================================

    new cdk.CfnOutput(this, "APIURL", {
      value: `https://api.${domainName}`,
      description: "API endpoint URL",
    });

    new cdk.CfnOutput(this, "WebURL", {
      value: `https://${domainName}`,
      description: "Web frontend URL",
    });

    new cdk.CfnOutput(this, "MediaCloudFrontDomain", {
      value: mediaDistribution.distributionDomainName,
      description: "CloudFront domain for media assets",
    });

    new cdk.CfnOutput(this, "WebCloudFrontDomain", {
      value: webDistribution.distributionDomainName,
      description: "CloudFront domain for web frontend",
    });

    new cdk.CfnOutput(this, "S3BucketName", {
      value: mediaBucket.bucketName,
      description: "S3 media bucket name",
    });

    new cdk.CfnOutput(this, "DBEndpoint", {
      value: dbInstance.dbInstanceEndpointAddress,
      description: "RDS PostgreSQL endpoint",
    });

    new cdk.CfnOutput(this, "RedisEndpoint", {
      value: `${redisHost}:${redisPort}`,
      description: "ElastiCache Redis endpoint",
    });

    new cdk.CfnOutput(this, "ECSCluster", {
      value: cluster.clusterName,
      description: "ECS cluster name",
    });

    new cdk.CfnOutput(this, "APIRepoUri", {
      value: apiRepo.repositoryUri,
      description: "ECR repository URI for API image",
    });

    new cdk.CfnOutput(this, "WebRepoUri", {
      value: webRepo.repositoryUri,
      description: "ECR repository URI for Web image",
    });

    new cdk.CfnOutput(this, "PushTopicArn", {
      value: pushTopic.topicArn,
      description: "SNS topic ARN for push notifications",
    });

    new cdk.CfnOutput(this, "AlarmTopicArn", {
      value: alarmTopic.topicArn,
      description: "SNS topic ARN for infrastructure alarms",
    });
  }
}
