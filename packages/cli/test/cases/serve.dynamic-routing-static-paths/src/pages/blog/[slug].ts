import { getBlogPosts, getBlogPostBySlug } from "../../services/blog-posts.ts";
import type { BlogPost } from "../../services/blog-posts.ts";

// TODO: types for all this would be nice: StaticPaths / Params / SSR page / etc?  can they be inferred?
interface StaticPaths {
  params: {
    slug: string;
  };
}

interface StaticParams {
  post: BlogPost;
}

interface BlogPostPageProps {
  params: {
    post: BlogPost;
  };
}

export async function getStaticPaths(): Promise<StaticPaths[]> {
  const posts = await getBlogPosts();

  return posts.map((post) => {
    return {
      params: {
        slug: post.slug,
      },
    };
  });
}

export async function getStaticParams({ params }: StaticPaths): Promise<StaticParams> {
  const post = (await getBlogPostBySlug(params.slug)) ?? ({} as BlogPost);

  return { post };
}

export default class BlogPostPage extends HTMLElement {
  #post: BlogPost;

  constructor({ params }: BlogPostPageProps) {
    super();
    this.#post = params?.post;
  }

  connectedCallback() {
    this.innerHTML = `
      <body>
        <h1>${this.#post.title}</h1>
        <p>${this.#post.content}</p>
      </body>
    `;
  }
}
