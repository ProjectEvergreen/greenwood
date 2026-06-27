import { LitElement, html } from "lit";

function getPosts() {
  return [
    {
      slug: "first-post",
      title: "First Post",
      content: "This is the first post",
    },
    {
      slug: "second-post",
      title: "Second Post",
      content: "This is the second post",
    },
    {
      slug: "third-post",
      title: "Third Post",
      content: "This is the third post",
    },
  ];
}

export async function getStaticPaths() {
  return getPosts().map((post) => {
    return {
      params: {
        slug: post.slug,
      },
    };
  });
}

export async function getStaticParams({ params }) {
  const post = getPosts().find((post) => post.slug === params.slug);

  return { post };
}

export default class BlogPostDetailsPage extends LitElement {
  static get properties() {
    return {
      post: { type: Object },
    };
  }

  render() {
    const { post } = this;
    console.log("render post", { post });

    return html`
      <h1>${post.title}</h1>
      <p>${post.content}</p>
    `;
  }
}
