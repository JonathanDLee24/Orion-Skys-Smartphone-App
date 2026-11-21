// Credits are a local mock, like the rest of the prototype. The ledger lives
// in memory so the workspace can show a realistic balance and recent activity.
const CREDIT_ACCOUNT = {
  availableCredits: 1120,
  usdPerCredit: 1,
  activity: [
    {
      id: 'credit-top-up',
      date: '1 Nov 2026',
      label: 'Credit top-up',
      detail: 'Card ending 4242',
      amount: 1000,
    },
    {
      id: 'apex-partner-night',
      date: '30 Oct 2026',
      label: 'Apex Partner Night',
      detail: 'Reservation applied',
      amount: -180,
    },
    {
      id: 'apex-global-summit',
      date: '28 Oct 2026',
      label: 'Apex Global Summit',
      detail: 'Reservation applied',
      amount: -200,
    },
    {
      id: 'apex-summer-showcase',
      date: '22 Aug 2026',
      label: 'Apex Summer Showcase',
      detail: 'Completed show',
      amount: -120,
    },
    {
      id: 'opening-balance',
      date: '5 Jan 2026',
      label: 'Opening balance',
      detail: 'Carried forward',
      amount: 620,
    },
  ],
};

export function formatCredits(value) {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function getCreditAccount() {
  return {
    ...CREDIT_ACCOUNT,
    activity: CREDIT_ACCOUNT.activity.map((entry) => ({ ...entry })),
  };
}
