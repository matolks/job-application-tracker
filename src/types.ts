export type ApplicationStatus = "Pending" | "Accepted" | "Rejected" | "Ghosted";

export type JobApplication = {
  id: number;
  dateApplied: string;
  companyName: string;
  link: string;
  coverLetter: boolean;
  reference: boolean;
  status: ApplicationStatus;
};
