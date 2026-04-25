export type BlogPost = {
  slug: string;
  title: string;
  content: string;
};

async function getBlogPosts(): Promise<BlogPost[]> {
  return [
    { slug: "first-post", title: "First Post", content: "This is the first post." },
    { slug: "second-post", title: "Second Post", content: "This is the second post." },
    { slug: "third-post", title: "Third Post", content: "This is the third post." },
  ];
}

async function getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
  const posts = await getBlogPosts();
  return posts.find((post) => post.slug === slug);
}

export { getBlogPosts, getBlogPostBySlug };
