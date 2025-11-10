export async function flagValidator(submission: string, expected: string): Promise<boolean> {
  if (!submission || !expected) return false;
  return submission.trim().includes(expected.trim());
}
