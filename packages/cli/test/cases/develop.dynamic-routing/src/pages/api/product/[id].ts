type ProductProps = {
  props: {
    id: string;
  };
};

export async function handler(request: Request, { props }: ProductProps): Promise<Response> {
  console.log({ props });
  return new Response(`Product id is => ${props.id}`);
}
