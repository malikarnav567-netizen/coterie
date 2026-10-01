export function levelLabel(level: string | null | undefined): string {
  switch (level) {
    case "AMATEUR":
      return "Amateur";
    case "REVIEWER":
      return "Reviewer";
    case "TRUSTED":
    case "MENTOR_CANDIDATE":
      return "Trusted Reviewer";
    case "MENTOR":
      return "Mentor · Guide";
    default:
      return "Public";
  }
}
