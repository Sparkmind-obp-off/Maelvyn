import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const landing = readFileSync('web/src/pages/Landing.tsx', 'utf8')
const app = readFileSync('web/src/App.tsx', 'utf8')
const products = readFileSync('web/src/pages/Products.tsx', 'utf8')
const index = readFileSync('web/index.html', 'utf8')
const robots = readFileSync('public/robots.txt', 'utf8')
const sitemap = readFileSync('public/sitemap.xml', 'utf8')
const routeManifest = JSON.parse(readFileSync('public/manus-routes.json', 'utf8')) as {
  routes: Array<{ path: string; title?: string }>
}

describe('public MAELVYN site contract', () => {
  it('presents the approved product descriptor and tagline', () => {
    expect(landing).toContain('Agentic Shared Venture Studio OS')
    expect(app).toContain('Building Ventures. Creating Value. Growing Together.')
  })

  it('publishes the five-stage product roadmap with LEADINTEL privacy and provider-binding boundaries', () => {
    for (const stage of ['Intelligence Products', 'Workflow Products', 'Content & Commerce', 'Agentic Workforce', 'Product Marketplace']) {
      expect(products).toContain(stage)
    }
    expect(products).toContain('LEADINTEL')
    expect(products).toContain('Tidak ada private-data inference, sensitive personal profiling, atau outreach')
    expect(products).toContain('Provider candidates · not a binding claim')
  })

  it('keeps the route manifest synchronized with declared application routes', () => {
    const sourceRoutes = [...app.matchAll(/<Route path="([^"]+)"/g)]
      .map((match) => match[1])
      .filter((path) => path !== '*')
      .sort()
    const manifestRoutes = routeManifest.routes.map(({ path }) => path).sort()

    expect(manifestRoutes).toEqual(sourceRoutes)
  })

  it('keeps every image alternative explicit and removes the known form-template placeholder', () => {
    const images = [...app.matchAll(/<img\b[^>]*>/g)].map((match) => match[0])
    expect(images.every((image) => /\balt="[^"]*"/.test(image))).toBe(true)
    expect(`${landing}\n${app}`).not.toContain('Sizes, wood, finish, timing')
  })

  it('keeps the external documentation actions on the canonical repository', () => {
    expect(landing).toContain('https://github.com/Sparkmind-obp-off/Maelvyn')
    expect(landing).toContain('https://github.com/Sparkmind-obp-off/Maelvyn/blob/main/docs/MAELVYN-CONNECT.md')
  })

  it('publishes crawler documents for the canonical production origin', () => {
    expect(robots).toContain('User-agent: *')
    expect(robots).toContain('Disallow: /api/')
    expect(robots).toContain('Sitemap: https://maelvyn.biz.id/sitemap.xml')
    expect(sitemap).toContain('<loc>https://maelvyn.biz.id/</loc>')
    expect(sitemap).toContain('<loc>https://maelvyn.biz.id/products</loc>')
    expect(sitemap).not.toContain('/w/')
  })

  it('keeps meaningful public fallback content and share metadata in the initial document', () => {
    expect(index).toContain('<link rel="canonical" href="https://maelvyn.biz.id/" />')
    expect(index).toContain('property="og:title"')
    expect(index).toContain('property="og:description"')
    expect(index).toContain('<noscript>')
    expect(index).toContain('Agentic Shared Venture Studio OS')
  })
})
