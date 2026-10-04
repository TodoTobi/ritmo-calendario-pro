import { NextResponse } from 'next/server';

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  invalidParams?: Array<{ name: string; reason: string }>;
}

/**
 * Standard RFC 7807 Problem Details HTTP Response Generator
 * Adheres to ADR-014 and RFC 7807 spec.
 */
export function createProblemResponse(
  status: number,
  title: string,
  detail: string,
  type: string,
  instance: string,
  invalidParams?: Array<{ name: string; reason: string }>
): NextResponse {
  const payload: ProblemDetails = {
    type: `https://ritmo.app/errors/${type}`,
    title,
    status,
    detail,
    instance,
  };

  if (invalidParams && invalidParams.length > 0) {
    payload.invalidParams = invalidParams;
  }

  return new NextResponse(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/problem+json',
    },
  });
}
