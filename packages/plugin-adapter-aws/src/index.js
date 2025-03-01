import fs from "fs/promises";
import path from "path";
import { checkResourceExists } from "@greenwood/cli/src/lib/resource-utils.js";

// https://docs.aws.amazon.com/lambda/latest/dg/services-apigateway.html#apigateway-example-event
// https://docs.aws.amazon.com/lambda/latest/dg/urls-invocation.html
function generateOutputFormat(id, type) {
  const handlerAlias = "$handler";
  const path = type === "page" ? `${id}.route` : id;

  return `
    import { handler as ${handlerAlias} } from './${path}.js';
    export async function handler (event, context) {
      const { body, headers = {}, rawPath = '', rawQueryString = ''} = event;
      const { method = '' } = event?.requestContext?.http;
      const queryParams = rawQueryString === '' ? '' : \`?\${rawQueryString}\`;
      const contentType = headers['content-type'] || '';
      let format = body;

      if (['GET', 'HEAD'].includes(method.toUpperCase())) {
        format = null
      } else if (contentType.includes('application/x-www-form-urlencoded') && event.isBase64Encoded) {
        const formData = new FormData();
        const formParams = new URLSearchParams(atob(body));

        formParams.forEach((value, key) => {
          formData.append(key, value);
        });

        // when using FormData, let Request set the correct headers
        // or else it will come out as multipart/form-data
        // https://stackoverflow.com/a/43521052/417806
        format = formData;
        delete headers['content-type'];
      } else if(contentType.includes('application/json')) {
        format = JSON.stringify(body);
      }

      const req = new Request(new URL(\`\${rawPath}\${queryParams}\`, \`http://\${headers.host}\`), {
        body: format,
        headers: new Headers(headers),
        method
      });

      const res = await $handler(req);

      return {
        "body": await res.text(),
        "statusCode": res.status,
        "headers": Object.fromEntries(res.headers)
      }
    }
  `;
}

async function setupFunctionBuildFolder(id, outputType, outputRoot) {
  const outputFormat = generateOutputFormat(id, outputType);

  await fs.mkdir(outputRoot, { recursive: true });
  await fs.writeFile(new URL("./index.js", outputRoot), outputFormat);
  await fs.writeFile(
    new URL("./package.json", outputRoot),
    JSON.stringify({
      type: "module",
    }),
  );
}

async function awsAdapter(compilation) {
  const { outputDir, projectDirectory } = compilation.context;
  const { basePath } = compilation.config;
  const adapterOutputUrl = new URL("./.aws-output/", projectDirectory);
  const ssrPages = compilation.graph.filter((page) => page.isSSR);
  const apiRoutes = compilation.manifest.apis;

  if (!(await checkResourceExists(adapterOutputUrl))) {
    await fs.mkdir(adapterOutputUrl, { recursive: true });
  }

  for (const page of ssrPages) {
    const outputType = "page";
    const { id, outputHref } = page;
    const outputRoot = new URL(`./routes/${basePath}/${id}/`, adapterOutputUrl);
    const chunks = (await fs.readdir(outputDir)).filter(
      (file) => file.startsWith(`${id}.route.chunk`) && file.endsWith(".js"),
    );

    await setupFunctionBuildFolder(id, outputType, outputRoot);

    // handle user's actual route entry file
    await fs.cp(
      new URL(outputHref),
      new URL(`./${outputHref.replace(outputDir.href, "")}`, outputRoot),
      { recursive: true },
    );

    // and any (URL) chunks for the page
    for (const chunk of chunks) {
      await fs.cp(new URL(`./${chunk}`, outputDir), new URL(`./${chunk}`, outputRoot), {
        recursive: true,
      });
    }
  }

  for (const [key, value] of apiRoutes.entries()) {
    const outputType = "api";
    const { id, outputHref } = apiRoutes.get(key);
    const outputRoot = new URL(`.${basePath}/api/${id}/`, adapterOutputUrl);
    const { assets = [] } = value;

    await setupFunctionBuildFolder(id, outputType, outputRoot);

    await fs.cp(new URL(outputHref), new URL(`./${id}.js`, outputRoot), { recursive: true });

    for (const asset of assets) {
      const name = path.basename(asset);

      await fs.cp(new URL(asset), new URL(`./${name}`, outputRoot), { recursive: true });
    }
  }
}

/** @type {import('./types/index.d.ts').AwsAdapter} */
const greenwoodPluginAdapterAws = () => [
  {
    type: "adapter",
    name: "plugin-adapter-aws",
    provider: (compilation) => {
      return async () => {
        await awsAdapter(compilation);
      };
    },
  },
];

export { greenwoodPluginAdapterAws };
