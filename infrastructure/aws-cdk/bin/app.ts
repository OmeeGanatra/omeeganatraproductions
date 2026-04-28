#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { OGPStack } from "../lib/ogp-stack";

const app = new cdk.App();

const domainName = app.node.tryGetContext("domainName") || "omeeganatra.com";
const envName = app.node.tryGetContext("env") || "production";

new OGPStack(app, `OGP-${envName}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || "us-east-1",
  },
  domainName,
  envName,
});

app.synth();
