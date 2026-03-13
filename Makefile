deploy-dev-wrangler:
	cd ./backend/cloudflare-workers && npx wrangler secret bulk .dev.vars --env dev

deploy-stg-wrangler:
	cd ./backend/cloudflare-workers && npx wrangler secret bulk .dev.vars.stg --env dev
	cd ./backend/cloudflare-workers && npx wrangler deploy --env dev

deploy-prd-wrangler:
	cd ./backend/cloudflare-workers && npx wrangler secret bulk .dev.vars.prd --env prd
	cd ./backend/cloudflare-workers && npx wrangler deploy --env prd