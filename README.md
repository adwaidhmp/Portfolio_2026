# Adwaidh MP — Portfolio

An immersive 3D portfolio built with **Astro**, **Three.js**, **GSAP** and **Tailwind CSS**. It deploys as a static site.

- **Hero:** a strip of poster cards glides right → left on a gentle curve under your name. When you scroll, the cards fly past the camera and burst into a 3D network that the camera travels through.
- **Skills:** a bento board of poster tiles (AI leads in a big teal tile) with a pointer spotlight, plus a tile that asks the AI agent about your stack.
- **Experience:** a timeline with an animated agent-flow diagram.
- **Projects:** cards that tilt and flip, plus a "coming soon" card.
- **"Ask my AI agent":** a terminal-style chat that answers from the portfolio data. It needs no API keys.
- **Fallbacks:** a reduced-motion mode, a 2D version for browsers without WebGL, and fully readable HTML for SEO.

## Edit your content

Everything lives in **`src/data/portfolio.ts`**: profile, skills, experience, projects, education, contact and the chat's suggested questions. Add a project or a job there and the page, the 3D scenes, the SEO tags and the chat all update.

| What | Where |
| --- | --- |
| Resume PDF | Put it at `public/resume/Adwaidh-MP-Resume.pdf` |
| Your photo on the centre hero card (optional) | Put it at `public/images/me.jpg` and set `profile.photo = '/images/me.jpg'` |
| Real domain (canonical URL, sitemap, share image) | `src/data/site.config.mjs` |
| Contact form delivery (optional) | Set `contact.formEndpoint` to a Formspree/Web3Forms URL. Without one, the form opens the visitor's email app with the message filled in. |
| Hero strip cards | `src/data/cards.ts` |
| Colours (light + dark mode) | The two token blocks at the top of `src/styles/global.css`. Light is the default; the sun/moon button switches, and the visitor's choice is remembered. |

## Run locally

Requires Node.js 22.12 or newer.

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # outputs dist/
npm run preview   # serve the production build
```

## Deploy (GitHub + Vercel)

1. Create a GitHub repository and push this folder:
   ```bash
   git init && git add . && git commit -m "Portfolio"
   git branch -M main
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```
2. On [vercel.com](https://vercel.com), go to **Add New → Project** and import the repository. Vercel detects Astro automatically (`vercel.json` is included), so click **Deploy**.
3. Every push to `main` redeploys automatically.
4. When you connect a custom domain, update `SITE_URL` in `src/data/site.config.mjs` and push.

After the first deploy, submit `https://<your-domain>/sitemap-index.xml` in [Google Search Console](https://search.google.com/search-console) so Google indexes the site quickly.

## Easter egg

Type **agent** anywhere on the page.
