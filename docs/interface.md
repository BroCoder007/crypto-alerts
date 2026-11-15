# Interface and motion notes

## Reference study

The redesign follows the visual rhythm of https://launch.joinautopilot.com/: a dark, fine-grained backdrop; oversized typography; a large bottom-aligned wordmark; floating glass cards around a point-cloud centrepiece; compact pill navigation that expands into a frosted menu; numbered scroll scenes; and a bright FAQ section near the footer. Desktop and mobile layouts and the expanded menu were inspected in the browser.

Crypto Alerts uses its own brand, copy and code. The central Bitcoin artwork is generated with Canvas rather than copied portraits, videos or third-party models. The floating cards show data from this application's API. They lead directly to the selected asset in the market terminal.

## Motion system

- A projected point cloud slowly rotates, responds to pointer movement and disperses as the hero scrolls away.
- Four glass cards float independently. Hover and focus provide visual feedback; clicking opens the selected asset.
- The compact menu expands with staggered links. Escape and outside clicks close it, and Escape restores focus to the menu button.
- Section reveals combine a small upward movement, opacity and blur. A pinned three-step scene changes the illustration and active number as its anchors pass through the viewport.
- The ticker, card motion, scene and chart transitions obey the motion control. The preference persists in local storage; the operating system's reduced-motion preference takes priority.

The decorative Canvas is capped at 30 frames per second with a device-pixel ratio limit of 1.6. It pauses when outside the viewport or when the tab is hidden. Charts load separately from the hero. The page uses system fonts and no external visual asset downloads.

## Interaction and data states

The terminal provides asset selection, comparison, sample inspection and CSV export. Comparison points are grouped by complete UTC epoch minute, preserving different dates that share a clock time. Invalid prices and timestamps are excluded; missing comparison points remain gaps.

The API proxy allowlists operations and symbols and uses an eight-second upstream timeout. Polling runs serially every five seconds, pauses in hidden tabs and resumes when visible. Successful responses update the display; failures retain previous observations and show partial/offline status. Prices older than three minutes are labelled delayed even when the API responds successfully.

Empty history shows a waiting state, and RSI is withheld until at least 15 loaded observations exist. No fabricated prices, 24-hour returns or verified delivery claims are included in the normal app. Local screenshot testing uses a disposable synthetic database and an explicit fixture banner; those records are not committed.

## Verification

Automated market tests cover timestamp offsets, separate dates, gaps, invalid data, chronological ordering and CSV export. Production compilation also checks TypeScript. Browser checks cover menu dismissal, motion persistence, chart selection, CSV export, FAQ, responsive layouts and backend outage/recovery. Live price-provider reliability, OAuth callbacks and Telegram delivery require the owner's configuration and are separate from interface verification.
