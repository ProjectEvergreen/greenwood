import { getBlogPosts, getBlogPostBySlug } from "../../services/blog-posts.ts";
import type { BlogPost } from "../../services/blog-posts.ts";
import type {
  GetStaticPaths,
  GetStaticParams,
  InferGetStaticParamsType,
  InferGetStaticPropsType,
} from "@greenwood/cli";

type Params = InferGetStaticParamsType<typeof getStaticPaths>;
type Props = InferGetStaticPropsType<typeof getStaticParams>;

export const getStaticPaths = async function () {
  const posts = await getBlogPosts();

  return posts.map((post) => {
    return {
      params: {
        slug: post.slug,
      },
    };
  });
} satisfies GetStaticPaths;

export const getStaticParams = async function ({ params }: { params: Params }) {
  const post = (await getBlogPostBySlug(params.slug)) ?? ({} as BlogPost);

  return { post };
} satisfies GetStaticParams;

export default class BlogPostPage extends HTMLElement {
  #post: BlogPost;

  constructor({ params }: { params: Props }) {
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
