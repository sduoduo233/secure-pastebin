import { HTML_INDEX, HTML_VIEW, JS_QRCODE } from "./html/html";

export interface Env {
	db: KVNamespace;
}

function newHTMLResponse(content: string): Response {
	return new Response(content, {
		headers: {
			"content-type": "text/html"
		}
	})
}

function bytes2hex(buffer: Uint8Array) {
	return [...new Uint8Array(buffer)]
		.map(x => x.toString(16).padStart(2, '0'))
		.join('');
}

const DESTROY_WHEN_VIEWED = -2;

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {

		switch (new URL(request.url).pathname) {

			case "/qrcode.js":

				return new Response(JS_QRCODE, { headers: { "content-type": "application/javascript" } });

			case "/":

				if (request.method == "POST") {

					const formData = await request.formData();
					const cipherText = formData.get("ciphertext") as string;
					const iv = formData.get("iv") as string;
					const salt = formData.get("salt") as string;
					const destroy = parseInt(formData.get("destroy") as string);

					if (destroy < -2 || destroy === 0) {
						return new Response("invalid parameters", { status: 400 });
					}

					if (
						!new RegExp("^[A-Za-z0-9\\/\\+=]+$").test(cipherText) ||
						!new RegExp("^[1234567890abcdef]{32}$").test(iv) ||
						!new RegExp("^[1234567890abcdef]{32}$").test(salt)
					) {
						return new Response("invalid parameters", { status: 400 });
					}

					const id = bytes2hex(crypto.getRandomValues(new Uint8Array(5)));
					await env.db.put(id, cipherText + "." + iv + "." + salt, {
						expirationTtl: destroy > 0 ? destroy : undefined,
					});

					if (destroy === DESTROY_WHEN_VIEWED) {
						await env.db.put("DESTROY-" + id, DESTROY_WHEN_VIEWED.toString());
					}

					return new Response(id, { headers: { "content-type": "text/plain" } });

				} else if (request.method == "GET") {

					return newHTMLResponse(HTML_INDEX);

				}

				return new Response("method not allowed", { status: 405 });

			case "/i":

				const search = new URL(request.url).search.substring(1);
				if (search === "") {
					return new Response("invalid parameters", { status: 400 });
				}

				const splits = search.split(".", 2);

				const id = splits[0].replaceAll("-", ""); // remove the dash

				const data = await env.db.get(id);
				if (data === null) {
					return new Response("not found", { status: 404 });
				}

				if (await env.db.get("DESTROY-" + id) === DESTROY_WHEN_VIEWED.toString()) {
					await env.db.delete(id);
					await env.db.delete("DESTROY-" + id);
				}

				return newHTMLResponse(HTML_VIEW.replace("[[DATA]]", data));

		}

		return new Response("not found", { status: 404 });
	},
};
