import handler from "../../dist/server/server.js";

const fetchHandler = handler.fetch ?? handler.default?.fetch ?? handler.default ?? handler;

export default async (request, _context) => {
  return await fetchHandler(request);
};

export const config = {
  path: "/*",
};
