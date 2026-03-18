deploy-dev-wrangler:
	cd ./backend/cloudflare-workers && npx wrangler secret bulk .dev.vars --env dev

deploy-stg-wrangler:
	cd ./backend/cloudflare-workers && npx wrangler secret bulk .dev.vars.stg --env stg
	cd ./backend/cloudflare-workers && npx wrangler deploy --env stg

deploy-prd-wrangler:
	cd ./backend/cloudflare-workers && npx wrangler secret bulk .dev.vars.prd --env prd
	cd ./backend/cloudflare-workers && npx wrangler deploy --env prd

package-firefox:
	bash scripts/package-firefox.sh
