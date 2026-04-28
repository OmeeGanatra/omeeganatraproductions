# Omee Ganatra Productions - Deployment Guide

## Prerequisites

- **AWS Account** with admin access
- **Domain name** registered and available for DNS configuration
- **Docker** 24+ installed locally
- **Node.js** 20 LTS
- **pnpm** 9+
- **AWS CLI** v2 configured with credentials
- **AWS CDK** v2 (`npm install -g aws-cdk`)

## Local Development Setup

### 1. Start Infrastructure Services

```bash
docker compose up -d
```

This starts PostgreSQL 16, Redis 7, and MinIO (S3-compatible storage) locally.

### 2. Environment Variables

Copy the example env file at the repo root and configure:

```bash
cp .env.example .env
```

The dev defaults work out of the box with the `docker compose up` services. In production, every secret in `.env.example` must be replaced with a real value — the server refuses to start if any secret is left at its dev placeholder.

### 3. Database Setup

```bash
# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed with sample data
pnpm --filter @ogp/db seed
```

### 4. Start Development Servers

```bash
pnpm dev
```

This starts all apps in development mode via Turborepo:
- **API**: http://localhost:4000
- **Web**: http://localhost:3000

## AWS Infrastructure Setup (CDK)

### 1. Bootstrap CDK

First-time setup for your AWS account/region:

```bash
cd infrastructure/aws-cdk
pnpm install
cdk bootstrap aws://ACCOUNT_ID/us-east-1
```

### 2. Deploy Infrastructure

```bash
# Preview changes
cdk diff -c domainName=yourdomain.com

# Deploy everything
cdk deploy -c domainName=yourdomain.com
```

The stack creates all resources: VPC, RDS, ElastiCache, S3, CloudFront, ECS, ALBs, Route53, ACM certificates, SES, and monitoring.

### 3. Post-Deploy Steps

After CDK deploy completes, note the outputs:
- `APIURL` - API endpoint
- `WebURL` - Web frontend URL
- `MediaCloudFrontDomain` - CDN domain for media
- `S3BucketName` - Media storage bucket
- `DBEndpoint` - PostgreSQL endpoint
- `RedisEndpoint` - Redis endpoint

## CI/CD Pipeline Setup

### GitHub Secrets

Configure the following secrets in your GitHub repository (Settings > Secrets and variables > Actions):

| Secret | Description |
|--------|-------------|
| `AWS_ROLE_ARN` | IAM role ARN for OIDC authentication |
| `DATABASE_URL` | Production RDS connection string |
| `NEXT_PUBLIC_API_URL` | Production API URL (e.g., `https://api.yourdomain.com`) |
| `NEXT_PUBLIC_CLOUDFRONT_URL` | CloudFront media URL |

### Setting Up OIDC Authentication

1. Create an IAM Identity Provider for GitHub Actions:

```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
```

2. Create an IAM role with the trust policy allowing your GitHub repo:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:YOUR_ORG/omeeganatraproductions:*"
        }
      }
    }
  ]
}
```

3. Attach policies for ECR push, ECS deploy, and Secrets Manager read access.

### Pipeline Flow

- **Pull Requests**: The `ci.yml` workflow runs typecheck, lint, format check, and build verification.
- **Push to main**: The `deploy.yml` workflow runs tests, builds Docker images, pushes to ECR, runs database migrations, and deploys to ECS.

## Domain Configuration

### Route53 Setup

1. The CDK stack creates a hosted zone. Update your domain registrar's nameservers to point to the Route53 hosted zone NS records.
2. Verify DNS propagation: `dig NS yourdomain.com`

### ACM Certificates

The CDK stack provisions a wildcard certificate (`*.yourdomain.com` + `yourdomain.com`) with DNS validation. The validation records are created automatically via Route53.

Certificate provisioning may take 10-30 minutes. Monitor progress:

```bash
aws acm describe-certificate --certificate-arn <ARN>
```

## S3 + CloudFront Media Setup

### Media Storage Structure

```
ogp-media-{account}/
  originals/     # Full-resolution uploads (no CDN cache)
  display/       # Optimized display versions (7-day cache)
  thumbnails/    # Small thumbnails (30-day cache)
  zip/           # Temporary zip exports (auto-expire 1 day)
  temp/          # Temporary upload staging (auto-expire 1 day)
```

### CORS Configuration

The S3 bucket is configured to accept presigned upload requests from your domain. If you need to add additional origins (e.g., localhost for development), update the CORS configuration in the CDK stack or Terraform config.

### CloudFront Invalidation

To force-invalidate cached media after updates:

```bash
aws cloudfront create-invalidation \
  --distribution-id DISTRIBUTION_ID \
  --paths "/thumbnails/*"
```

## SES Email Setup

### Domain Verification

1. The CDK stack creates the SES domain identity. Verify DKIM records are created in Route53.
2. Check verification status:

```bash
aws ses get-identity-verification-attributes \
  --identities yourdomain.com
```

### Moving Out of Sandbox

By default, SES is in sandbox mode (can only send to verified addresses). Request production access:

```bash
aws sesv2 put-account-details \
  --production-access-enabled \
  --mail-type TRANSACTIONAL \
  --use-case-description "Photographer-client platform sending gallery invites and notifications" \
  --website-url "https://yourdomain.com"
```

## Flutter App Deployment

### iOS (App Store)

1. Configure signing in Xcode:
   ```bash
   cd apps/mobile/ios
   open Runner.xcworkspace
   ```
2. Set bundle identifier, team, and provisioning profile.
3. Update `apps/mobile/lib/config/environment.dart` with production API URL.
4. Build and archive:
   ```bash
   cd apps/mobile
   flutter build ipa --release \
     --dart-define=API_URL=https://api.yourdomain.com \
     --dart-define=CLOUDFRONT_URL=https://media.yourdomain.com
   ```
5. Upload to App Store Connect via Xcode or `xcrun altool`.

### Android (Play Store)

1. Create a signing key:
   ```bash
   keytool -genkey -v -keystore ogp-release.jks \
     -keyalg RSA -keysize 2048 -validity 10000 -alias ogp
   ```
2. Configure `apps/mobile/android/key.properties`.
3. Build the app bundle:
   ```bash
   cd apps/mobile
   flutter build appbundle --release \
     --dart-define=API_URL=https://api.yourdomain.com \
     --dart-define=CLOUDFRONT_URL=https://media.yourdomain.com
   ```
4. Upload the `.aab` to Google Play Console.

## Monitoring and Alerts

### CloudWatch Dashboards

The stack creates alarms for:
- **CPU utilization** > 80% on API, Worker, and DB
- **Memory utilization** > 80% on API and Worker
- **5xx errors** > 10 per minute on the API ALB

Subscribe to the alarm SNS topic to receive notifications:

```bash
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:ogp-alarms-production \
  --protocol email \
  --notification-endpoint alerts@yourdomain.com
```

### Useful Commands

```bash
# View API logs
aws logs tail /ecs/ogp-api-production --follow

# View worker logs
aws logs tail /ecs/ogp-worker-production --follow

# ECS exec into running container
aws ecs execute-command \
  --cluster ogp-production \
  --task TASK_ID \
  --container api \
  --interactive \
  --command "/bin/sh"

# Check service status
aws ecs describe-services \
  --cluster ogp-production \
  --services ogp-api ogp-worker ogp-web
```

## Backup Strategy

### Database (RDS)

- **Automated backups**: 7-day retention enabled by default.
- **Manual snapshots** before major releases:
  ```bash
  aws rds create-db-snapshot \
    --db-instance-identifier ogp-production \
    --db-snapshot-identifier ogp-pre-release-$(date +%Y%m%d)
  ```
- **Point-in-time recovery**: Restore to any point within the retention window.

### S3 Media

- **Versioning** is enabled on the media bucket. Deleted or overwritten files can be recovered.
- **Cross-region replication** (optional for disaster recovery):
  ```bash
  aws s3api put-bucket-replication \
    --bucket ogp-media-ACCOUNT_ID \
    --replication-configuration file://replication.json
  ```

### Secrets

- Secrets Manager retains deleted secrets for 7-30 days.
- Export secrets before rotation for backup:
  ```bash
  aws secretsmanager get-secret-value --secret-id ogp/production/db-password
  ```

## Cost Estimation

### Starter Tier (< $50/month)

For small workloads (< 1,000 galleries, < 10 concurrent users):

| Service | Estimated Cost |
|---------|---------------|
| RDS db.t3.micro (free tier eligible) | $0 - $15 |
| ElastiCache cache.t3.micro | $12 |
| ECS Fargate (1 API + 1 Web, 0.25 vCPU) | $10 |
| S3 (< 50 GB) | $1 |
| CloudFront (< 100 GB transfer) | $0 - $9 |
| ALB | $16 |
| NAT Gateway | Replaced with public subnets |
| **Total** | **~$40 - $50** |

> Note: NAT Gateway ($32/mo) is the biggest cost. For starter tier, deploy ECS tasks in public subnets to avoid it.

### Growth Tier (< $200/month)

For moderate workloads (< 10,000 galleries, < 100 concurrent users):

| Service | Estimated Cost |
|---------|---------------|
| RDS db.t3.medium | $50 |
| ElastiCache cache.t3.micro | $12 |
| ECS Fargate (2 API + 1 Worker + 2 Web) | $45 |
| S3 (< 500 GB) | $12 |
| CloudFront (< 500 GB transfer) | $5 - $40 |
| ALB x2 | $32 |
| NAT Gateway | $32 |
| Secrets Manager | $2 |
| CloudWatch | $5 |
| **Total** | **~$150 - $200** |

### Enterprise Tier (< $500/month)

For larger workloads (< 50,000 galleries, < 500 concurrent users):

| Service | Estimated Cost |
|---------|---------------|
| RDS db.t3.large (Multi-AZ) | $150 |
| ElastiCache cache.t3.small (cluster) | $25 |
| ECS Fargate (4 API + 2 Worker + 4 Web) | $120 |
| S3 (< 2 TB) + lifecycle to IA | $35 |
| CloudFront (< 2 TB transfer) | $50 |
| ALB x2 | $32 |
| NAT Gateway x2 | $64 |
| SES | $1 |
| Secrets Manager | $2 |
| CloudWatch + X-Ray | $15 |
| **Total** | **~$400 - $500** |

## Scaling Guide

### Horizontal Scaling (ECS Tasks)

Increase task count for any service:

```bash
aws ecs update-service \
  --cluster ogp-production \
  --service ogp-api \
  --desired-count 4
```

Or configure auto-scaling:

```bash
# Register scalable target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/ogp-production/ogp-api \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 10

# Create CPU-based scaling policy
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --resource-id service/ogp-production/ogp-api \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-name ogp-api-cpu-scaling \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 70.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
    },
    "ScaleInCooldown": 300,
    "ScaleOutCooldown": 60
  }'
```

### Database Scaling

**Vertical**: Change instance class (requires brief downtime):

```bash
aws rds modify-db-instance \
  --db-instance-identifier ogp-production \
  --db-instance-class db.t3.large \
  --apply-immediately
```

**Read replicas** for read-heavy workloads:

```bash
aws rds create-db-instance-read-replica \
  --db-instance-identifier ogp-production-read1 \
  --source-db-instance-identifier ogp-production \
  --db-instance-class db.t3.medium
```

### CloudFront Caching

Optimize cache hit ratio:
- Thumbnails use 30-day TTL (longest cache for smallest, most-requested files)
- Display versions use 7-day TTL (balance between freshness and performance)
- Originals bypass cache (always fresh for downloads)
- Monitor cache hit ratio in CloudFront console; aim for > 85%

### Redis Scaling

For BullMQ queue scaling, upgrade to a larger node type or enable cluster mode:

```bash
# Upgrade node type
aws elasticache modify-cache-cluster \
  --cache-cluster-id ogp-production \
  --cache-node-type cache.t3.small \
  --apply-immediately
```

### Worker Scaling

Scale BullMQ workers independently based on queue depth. Monitor the `media-processing` queue length and scale worker tasks accordingly:

```bash
aws ecs update-service \
  --cluster ogp-production \
  --service ogp-worker \
  --desired-count 3
```
