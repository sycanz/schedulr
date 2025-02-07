## [3.0.3](https://github.com/sycanz/schedulr/commit/afd7bf743148b0f86a15a7710a5bac83597007b1) (8-2-2024)
### Bug Fixes
- Extension wasn't working due to message passing within popup. Fixed the bug by passing message to service worker before going to popup again.
- onInstalled function kept being invoked so added "reasons" for it to be invoked which is during install.

### Documentation
- Added SECURITY.md for my own sake.
- Changed username, hence all links that includes my previous username were broken. So I changed them to my new username to prevent link from breaking.

## [3.0.2](https://github.com/sycanz/schedulr/commit/e177235c99e9e3cd3301786aaef62f543569c122) (1-12-2024)
### Program Flow
- Redirects user to schedulr website's **usage** page after first install.

## [3.0.1](https://github.com/sycanz/schedulr/commit/2d349ff267f37936df757f4045f9a80052f2fd10) (30-10-2024)
### Bug Fixes
- Realise interface didn't change for lecturer so added old algo for lecturer. ([01e7f0c](https://github.com/sycanz/schedulr/commit/166742b9dde793dc64f43bb32a6f7eccaafb5dcd))

## [3.0.0](https://github.com/sycanz/schedulr/commit/3f9ee4edc19c6f783c353df11c183eb6b8088682) (27-10-2024)
### Major update
- Re-scraped/processed data from CLiC to make Schedulr compatible with the newer version of CLiC's interface.
- User flow remains the same as v2.3.2.

## [2.3.2](https://github.com/sycanz/schedulr/commit/7d9b5b3b033816d8e30bdedc528b99114a9704cb) (10-10-2024)
### Bug Fixes
- bug when "Show Instructor" or "Show Class Title" under Display Option in CLiC is checked ([e7369a7](https://github.com/sycanz/schedulr/commit/e7369a775feb13d413b8923e254a489e6d4ba69f)), closes [#19](https://github.com/sycanz/schedulr/issues/19)

### Features
- user can install .ics file and import it into other calendars ([287a37c](https://github.com/sycanz/schedulr/commit/287a37c170bbba86fd47b2bc5fe81b03efb63bf7)) ([f24ca66](https://github.com/sycanz/schedulr/commit/f24ca663f98a038f7ada6c1c2b74dc21f6d42e7c))
- user gets choice like "Transfer to Google Calendar", "Download .ics folder", and "both" before proceeding ([30da55b](https://github.com/sycanz/schedulr/commit/30da55b9ff0db1643f505e85abe43303a6039de3)) ([66bd236](https://github.com/sycanz/schedulr/commit/66bd2362528263c2891cc9d3606f5391560e9f79)) ([7d9b5b3](https://github.com/sycanz/schedulr/commit/7d9b5b3b033816d8e30bdedc528b99114a9704cb))

## 2.3.1 (24-09-2024)
### Features
- Select calendar to import calendar into
- Recurring weeks
- Reminder for events
- Color for events
- Transfer timetable from CLiC to Google Calendar

