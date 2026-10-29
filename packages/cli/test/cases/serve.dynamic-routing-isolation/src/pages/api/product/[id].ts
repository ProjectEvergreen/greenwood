type ProductProps = {
  params: {
    id: string;
  };
};

export async function handler(request: Request, { params }: ProductProps): Promise<Response> {
  return new Response(`Product id is => ${params.id}`);
}
