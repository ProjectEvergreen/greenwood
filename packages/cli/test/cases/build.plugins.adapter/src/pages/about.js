import * as AWS from "@aws-sdk/client-cloudfront";

const CONFIG = {
  region: "us-east-1",
  accessKeyId: "process.env.AWS_ACCESS_KEY_ID",
  secretAccessKey: "process.env.AWS_SECRET_ACCESS_KEY",
  distributionId: "process.env.AWS_CLOUDFRONT_ID",
};

export default class AboutPage extends HTMLElement {
  async connectedCallback() {
    const cfClient = new AWS.CloudFront(CONFIG);

    this.innerHTML = `<h1>About Page (${cfClient.initConfig.serviceId})</h1>`;
  }
}
