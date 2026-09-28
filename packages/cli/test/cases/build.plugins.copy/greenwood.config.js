import {
  derivePackageRoot,
  resolveBareSpecifier,
} from "@greenwood/cli/src/lib/walker-package-ranger.js";

// the directory copy is registered first and is what creates the destination, so when copies
// overlap the override runs before that directory exists and is dropped; only in series does
// the last copy registered for the shared destination win
const themesUrl = new URL("./themes/", derivePackageRoot(resolveBareSpecifier("prismjs")));
const overrideUrl = new URL("./duplicate-destination.css", import.meta.url);

export default {
  plugins: [
    {
      type: "copy",
      name: "plugin-copy-prismjs",
      provider: (compilation) => {
        const { outputDir } = compilation.context;
        const prismSpecifier = "prismjs";
        const prismResolved = resolveBareSpecifier(prismSpecifier);
        const prismRoot = derivePackageRoot(prismResolved);

        const from = new URL("./themes/", prismRoot);
        const to = new URL("./node_modules/prismjs/themes/", outputDir);

        return [{ from, to }];
      },
    },
    {
      type: "copy",
      name: "plugin-copy-duplicate-destination-themes",
      provider: (compilation) => {
        const { outputDir } = compilation.context;

        return [
          {
            from: themesUrl,
            to: new URL("./duplicate-destination-plugins/", outputDir),
          },
        ];
      },
    },
    {
      type: "copy",
      name: "plugin-copy-duplicate-destination-override",
      provider: (compilation) => {
        const { outputDir } = compilation.context;

        return [
          {
            from: overrideUrl,
            to: new URL("./duplicate-destination-plugins/prism.min.css", outputDir),
          },
        ];
      },
    },
    {
      type: "copy",
      name: "plugin-copy-duplicate-destination-locations",
      provider: (compilation) => {
        const { outputDir } = compilation.context;

        return [
          {
            from: themesUrl,
            to: new URL("./duplicate-destination-locations/", outputDir),
          },
          {
            from: overrideUrl,
            to: new URL("./duplicate-destination-locations/prism.min.css", outputDir),
          },
        ];
      },
    },
  ],
};
