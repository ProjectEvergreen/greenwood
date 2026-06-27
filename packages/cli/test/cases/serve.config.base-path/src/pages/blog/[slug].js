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

export async function getBody(compilation, request, page, params) {
  return `<h1>${params.post.title}</h1>`;
}
