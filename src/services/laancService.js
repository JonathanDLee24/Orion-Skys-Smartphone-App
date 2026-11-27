// OSPSA-63 — LAANC dashboard.
// Stands in for GET /api/laanc/authorizations/:showId until the backend exists.
// One payload carries the FAA certificate token, the grid ceiling, the approved
// flight window and the per-cohort compliance states, so the dashboard never
// has to hard-code any of them.

export const LAANC_STATUS = {
  APPROVED: 'APPROVED',
  PENDING: 'PENDING',
};

export const LAANC_DISCLAIMER = 'LAANC (Low Altitude Authorization and Notification Capability) is the FAA system for near-real-time drone flight approval in controlled airspace. This screen shows authorization status, altitude, flight area, and approved time window.';

const INITIAL_AUTHORIZATION = {
  certificateId: 'L-0498321',
  status: LAANC_STATUS.APPROVED,
  maxAltitude: '200 FT AGL',
  timeWindow: '19:00 - 21:00 PDT',
  airspace: 'Class D · Surface to 2,500 ft',
  cohorts: [
    {
      id: 'S-01',
      range: 'S-01 to S-48',
      label: 'Show Drones (Primary)',
      required: true,
      status: LAANC_STATUS.APPROVED,
    },
    {
      id: 'S-49',
      range: 'S-49 to S-96',
      label: 'Show Drones (Secondary)',
      required: true,
      status: LAANC_STATUS.APPROVED,
    },
    {
      id: 'R-01',
      range: 'R-01 to R-08',
      label: 'RTK Anchor Transponders',
      required: true,
      status: LAANC_STATUS.PENDING,
    },
    {
      id: 'CAM-01',
      range: 'CAM-01',
      label: 'Gimbal Observer Unit',
      required: false,
      status: LAANC_STATUS.APPROVED,
    },
  ],
};

function cloneAuthorization(source) {
  return { ...source, cohorts: source.cohorts.map((cohort) => ({ ...cohort })) };
}

let authorization = cloneAuthorization(INITIAL_AUTHORIZATION);

export function resetLaancAuthorization() {
  authorization = cloneAuthorization(INITIAL_AUTHORIZATION);
}

export function getLaancAuthorization() {
  return cloneAuthorization(authorization);
}

// Replace the delay with a real request once the airspace service exists.
export async function fetchLaancAuthorization() {
  await new Promise((resolve) => setTimeout(resolve, 350));
  return getLaancAuthorization();
}

// AC-3: every required cohort has to clear its safety evaluation before a
// flight can be initiated, so a pending cohort is a hard blocker.
export function getFlightInitiationClearance() {
  const blockers = authorization.cohorts
    .filter((cohort) => cohort.required && cohort.status !== LAANC_STATUS.APPROVED)
    .map((cohort) => cohort.label);

  return {
    allowed: blockers.length === 0,
    blockers,
    message: blockers.length === 0
      ? 'Flight initiation cleared. Every required cohort is approved.'
      : `Flight initiation blocked: ${blockers.join(', ')} pending LAANC safety evaluation.`,
  };
}

export function requestFlightInitiation() {
  return getFlightInitiationClearance();
}

// Safety staff clear a cohort once its evaluation finishes.
export function approveCohort(cohortId) {
  const cohort = authorization.cohorts.find((entry) => entry.id === cohortId);
  if (!cohort) throw new Error(`Unknown cohort: ${cohortId}`);

  authorization = {
    ...authorization,
    cohorts: authorization.cohorts.map((entry) => (
      entry.id === cohortId ? { ...entry, status: LAANC_STATUS.APPROVED } : entry
    )),
  };
  return { ...cohort, status: LAANC_STATUS.APPROVED };
}
