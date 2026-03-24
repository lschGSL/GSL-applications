export interface PasswordValidation {
  valid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = [];

  if (password.length < 12) {
    errors.push("Must be at least 12 characters");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Must contain at least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Must contain at least one lowercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Must contain at least one number");
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push("Must contain at least one special character");
  }

  return { valid: errors.length === 0, errors };
}

export function getPasswordStrength(password: string): {
  score: number;
  label: string;
} {
  let score = 0;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const labels = ["Very Weak", "Weak", "Fair", "Strong", "Very Strong"];
  return { score, label: labels[Math.min(score, labels.length - 1)] };
}
