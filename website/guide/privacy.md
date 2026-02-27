# Privacy

VMark respects your privacy. Here's exactly what happens — and what doesn't.

## What VMark Sends

VMark includes an **auto-update checker** that periodically contacts our server to see if a new version is available. This is the only network request VMark makes.

Each check sends:

| Data | Purpose |
|------|---------|
| Your IP address | Inherent in any HTTP request |
| App version | To determine if an update is available |
| Platform (OS) | To serve the correct update package |

That's it. **Nothing else.**

## What VMark Does NOT Send

- Your documents or their contents
- File names or paths
- Usage patterns or feature analytics
- Personal information of any kind
- Crash reports
- Keystroke or editing data

## How We Use the Data

We count **unique IP addresses per day** from update checks to understand how many people actively use VMark. These counts are displayed on our [homepage](/) as live user statistics.

- IP addresses are stored only in standard server access logs
- Logs rotate automatically and are not shared with anyone
- We do not use tracking cookies, fingerprinting, or any analytics SDK
- There is no account system — VMark doesn't know who you are

## Open Source

VMark is fully open source. You can verify everything described here by reading the code:

- Update endpoint: [`tauri.conf.json`](https://github.com/xiaolai/vmark/blob/main/src-tauri/tauri.conf.json)
- No other network calls exist in the codebase

## Disabling Update Checks

If you prefer to disable automatic update checks entirely, you can block the update endpoint at the network level. VMark will continue to work normally without it.
