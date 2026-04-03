# Deployment Gate: Blogger vs Cloudflare Pages

## 1. Decision Rule (Fixed)

Blogger PoC must pass all four checks. If one or more checks fail, final platform is Cloudflare Pages (and Workers only if dynamic endpoints are required).

## 2. Four Gate Checks

1. SPA deep-link routing stability
2. Git-based automatic deployment feasibility
3. Custom domain + SSL operational stability
4. Dynamic API extension readiness

## 3. Blogger PoC Checklist

| check | pass_criteria | result |
|---|---|---|
| deep-link routing | refresh and direct URL access on major routes | TBD |
| git auto deploy | no manual HTML patching for each release | TBD |
| domain + ssl | stable HTTPS without recurring manual intervention | TBD |
| dynamic extension | maintainable path to API-backed game features | TBD |

## 4. Cloudflare PoC Checklist

| check | pass_criteria | result |
|---|---|---|
| pages deployment | successful build and publish from repo | TBD |
| deep-link routing | `_redirects` fallback works on direct URL | TBD |
| domain + ssl | custom domain HTTPS stable | TBD |
| cache behavior | static cache policy verified | TBD |

## 5. Default Production Shape

- game app: Cloudflare Pages
- optional blog: `blog.<domain>` separated
- Workers/Pages Functions: only for dynamic features

## 6. Go/No-Go Template

```md
# Deployment Decision Report

- Date:
- Reviewer:
- Blogger score: <0~4>
- Cloudflare score: <0~4>
- Final decision: <Blogger|Cloudflare>
- Reason:
```
