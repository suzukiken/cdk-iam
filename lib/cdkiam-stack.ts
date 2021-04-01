import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as s3 from '@aws-cdk/aws-s3';
import * as lambda from '@aws-cdk/aws-lambda';
import * as path from 'path';

export class CdkiamStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    const PREFIX_NAME = id.toLowerCase().replace("stack","")
    
    const bucket = new s3.Bucket(this, 'bucket', {
      bucketName: PREFIX_NAME + '-bucket',
    })

    const role = new iam.Role(this, "role", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      roleName: PREFIX_NAME + "-role",
    });

    role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaBasicExecutionRole"
      )
    );

    const statement = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
    });

    statement.addActions(
      "s3:GetObject",
      "s3:ListBucketVersions",
      "s3:GetObjectVersion"
    );

    statement.addResources(
      bucket.bucketArn,
      bucket.bucketArn + "/*"
    );
    
    const policy = new iam.Policy(this, 'policy', {
      policyName: PREFIX_NAME + "-policy",
    });
    
    policy.addStatements(statement);

    role.attachInlinePolicy(policy);
    
    const lambda_function = new lambda.Function(this, 'lambda_function', {
      code: lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda')),
      handler: 'index.lambda_handler',
      functionName: PREFIX_NAME + "-function",
      runtime: lambda.Runtime.PYTHON_3_8,
      role: role
    });
    
    new cdk.CfnOutput(this, "output", { value: lambda_function.functionArn })

  }
}
