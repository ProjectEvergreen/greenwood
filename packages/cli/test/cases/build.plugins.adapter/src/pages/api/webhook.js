import * as AWS from "@aws-sdk/client-cloudfront";

const CONFIG = {
  region: "us-east-1",
  accessKeyId: "process.env.AWS_ACCESS_KEY_ID",
  secretAccessKey: "process.env.AWS_SECRET_ACCESS_KEY",
  distributionId: "process.env.AWS_CLOUDFRONT_ID",
};

export async function handler(request) {
  const cfClient = new AWS.CloudFront(CONFIG);
  const body = await request.json();
  const entity = body?.sys?.contentType?.sys?.id || "";

  await cfClient.createInvalidation({
    DistributionId: CONFIG.distributionId ?? "",
    InvalidationBatch: {
      CallerReference: new Date().getTime().toString(),
      Paths: {
        Quantity: 1,
        Items: [`/api/v2/${entity}s*`],
      },
    },
  });

  return new Response(JSON.stringify({ msg: "success" }), {
    headers: new Headers({
      "Content-Type": "application/json",
    }),
  });
}
