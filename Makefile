deploy-dev-wrangler:
	cd ./backend/cloudflare-workers && npx wrangler secret bulk .dev.vars --env dev

deploy-prd-wrangler:
	cd ./backend/cloudflare-workers && npx wrangler secret bulk .dev.vars.prd --env prd