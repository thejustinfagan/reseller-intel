const TRUSTED_ZIP_IN_ADDRESS_REGEX = /,\s*[A-Z]{2}\s+(\d{5})(?:-\d{4})?\s*$/;

export function sanitizeDisplayedZip(fullAddress: string | null, zipCode: string | null): string | null {
  if (!fullAddress || !zipCode) {
    return null;
  }

  const addressZipMatch = fullAddress.match(TRUSTED_ZIP_IN_ADDRESS_REGEX);
  if (!addressZipMatch) {
    return null;
  }

  return addressZipMatch[1] === zipCode.trim() ? addressZipMatch[1] : null;
}
