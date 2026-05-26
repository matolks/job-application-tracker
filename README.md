# Job Application Tracker

A desktop application for tracking job applications. It keeps track of company names, company links, if cover letters/references were used, and application status. The app stores data locally with SQLite and includes backup and restore tools through the settings menu.

## Features

- Add, edit, delete, and search job applications
- Track application status: Pending, Accepted, Rejected, or Ghosted
- Mark whether a cover letter or reference was used
- Store application data locally
- Export, import, restore, and manage JSON backups

## Tech Stack

- TypeScript
- React
- Electron
- Vite
- SQLite
- CSS

## How to Run

In a terminal run:

```bash
git clone https://github.com/matolks/job-application-tracker.git
cd job-application-tracker
npm install
npm run desktop
```

## License

- Allow uplaod and download of cover letters
- Auto move to ghosted after X amount of time
- Allow a graph export to visually display all your applications

## License

MIT
