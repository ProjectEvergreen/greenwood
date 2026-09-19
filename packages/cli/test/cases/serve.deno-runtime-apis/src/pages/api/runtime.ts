import { getRuntimeInfo } from "../../services/runtime.ts";

export function handler() {
  return Response.json(getRuntimeInfo());
}
