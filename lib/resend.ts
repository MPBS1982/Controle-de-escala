const FALLBACK_FROM = 'Escala do Talho <onboarding@resend.dev>';

const SIMPLE_EMAIL_RE = /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/;
const DISPLAY_NAME_RE = /^(.*)<([^<>]+)>$/;

function isValidEmail(value: string) {
  return SIMPLE_EMAIL_RE.test(value.trim());
}

export function getResendFromAddress() {
  const raw = (process.env.RESEND_FROM_EMAIL || '').trim().replace(/^["']|["']$/g, '');

  if (!raw) {
    return {
      from: FALLBACK_FROM,
      isConfigured: false,
    };
  }

  const displayMatch = raw.match(DISPLAY_NAME_RE);
  if (displayMatch) {
    const name = displayMatch[1].trim().replace(/^["']|["']$/g, '');
    const email = displayMatch[2].trim();
    if (isValidEmail(email)) {
      return {
        from: `${name} <${email}>`,
        isConfigured: true,
      };
    }
  }

  if (isValidEmail(raw)) {
    return {
      from: raw,
      isConfigured: true,
    };
  }

  const fallbackEmailMatch = raw.match(/[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+/);
  if (fallbackEmailMatch) {
    return {
      from: fallbackEmailMatch[0],
      isConfigured: true,
    };
  }

  return {
    from: FALLBACK_FROM,
    isConfigured: false,
  };
}
