// https://greenwoodjs.dev/docs/pages/api-routes/
type Params = {
  props: object;
};

export type ApiRouteHandler = (request: Request, params?: Params) => Response;
