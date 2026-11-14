export default function myCustomRehypePlugin() {
  return (tree) => {
    const heading = tree.children.find((node) => node.tagName === "h1");

    heading.properties["data-project-plugin"] = "my-custom-rehype-plugin resolved!";
  };
}
