import validateNpmPackageName from 'validate-npm-package-name';

export function validateProjectName(name: string): string | true {
  const { validForNewPackages, errors, warnings } = validateNpmPackageName(name);
  if (validForNewPackages) return true;
  return [...(errors ?? []), ...(warnings ?? [])].join('\n');
}
