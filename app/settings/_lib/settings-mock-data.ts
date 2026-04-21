/** Preview workspace — replace with API + session. */

export type SettingsMember = {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "member";
  status: "active" | "pending";
  joinedAt: string;
};

export const MOCK_ORG = {
  id: "org-acme",
  name: "Acme Learning",
  slug: "acme-learning",
  logoUrl: "",
  primaryColor: "#32a852",
  planName: "Team",
  planSeats: 50,
  seatsUsed: 23,
  billingEmail: "finance@acme.example.com",
  renewsAt: "2026-06-01T00:00:00",
} as const;

export const MOCK_MEMBERS: SettingsMember[] = [
  {
    id: "m1",
    name: "Jordan Lee",
    email: "jordan@acme.example.com",
    role: "owner",
    status: "active",
    joinedAt: "2025-08-12T10:00:00",
  },
  {
    id: "m2",
    name: "Sam Rivera",
    email: "sam@acme.example.com",
    role: "admin",
    status: "active",
    joinedAt: "2025-09-01T14:20:00",
  },
  {
    id: "m3",
    name: "Taylor Kim",
    email: "taylor@acme.example.com",
    role: "member",
    status: "pending",
    joinedAt: "2026-04-18T09:00:00",
  },
];

export const MOCK_PROFILE = {
  fullName: "Jordan Lee",
  email: "jordan@acme.example.com",
} as const;
