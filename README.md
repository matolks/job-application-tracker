# Job Application Tracker

A desktop application for tracking job applications. It keeps track of company names, job titles, locations, links, cover letter and reference usage, and application status. App data is stored locally with SQLite and includes backup and restore tools through the settings menu.

## Features

- Add, edit, delete, and search job applications
- Track application status: Saved, Applied, Accepted, Rejected, or Ghosted
- Search across company name, job title, and location
- Group applications by location
- Mark whether a cover letter or reference was used
- Store application data locally with SQLite
- Export, import, restore, and manage JSON backups

## How to Run

**Via code:**

```bash
git clone https://github.com/matolks/job-application-tracker.git
cd job-application-tracker
npm install
npm run desktop
```

**Via application:**

Windows:

```bash
git clone https://github.com/matolks/job-application-tracker.git
cd job-application-tracker
npm install
npm run dist:win
```

Then open the `.exe` file from the `release/` folder.

Mac:

```bash
git clone https://github.com/matolks/job-application-tracker.git
cd job-application-tracker
npm install
npm run dist:mac
```

Then open the `.dmg` file from the `release/` folder.

## Tech Stack

- TypeScript
- React
- Electron
- Vite
- SQLite
- CSS

## Screenshots

![Main](Screenshots/Main.png)

<table>
<tr>
<td align="center">
<img src="Screenshots/Add-Application.png" alt="Add Application" width="420">
<br>
<sub>Add Application</sub>
</td>
<td align="center">
<img src="Screenshots/Database-Settings.png" alt="Database Settings" width="420">
<br>
<sub>Database Settings</sub>
</td>
</tr>
</table>

## Future Improvements

- Allow upload and download of cover letters
- Auto-move to Ghosted after a configurable number of days
- Graph export to visually display application history and outcomes
- Better restore UX (currently only toggles to the latest backup)

## License

MIT
