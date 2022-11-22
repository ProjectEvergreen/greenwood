export async function handler(request, response) {
  console.debug({ request, response });

  return { message: 'Greenwood' };
}