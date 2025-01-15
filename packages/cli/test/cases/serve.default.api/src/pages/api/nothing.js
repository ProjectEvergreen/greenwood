// here to test - https://github.com/ProjectEvergreen/greenwood/pull/1384
import * as callBoundIntrinsic from 'call-bind/callBound';

export async function handler() {
  console.log({ callBoundIntrinsic });
  return new Response(null, {
    status: 204
  });
}