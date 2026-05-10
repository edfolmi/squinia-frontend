export type DefaultPersonaAvatar = {
  id: string;
  label: string;
  gender: "female" | "male";
  skin_tone_group: "dark" | "fair" | "east_asian" | "south_asian" | "latina_or_mixed" | "latino_or_mixed";
  image_url: string;
};

export const DEFAULT_PERSONA_AVATARS: DefaultPersonaAvatar[] = [
  {
    id: "female-dark",
    label: "Female professional, dark skin",
    gender: "female",
    skin_tone_group: "dark",
    image_url: "/persona-avatars/female-dark.webp",
  },
  {
    id: "female-fair",
    label: "Female professional, fair skin",
    gender: "female",
    skin_tone_group: "fair",
    image_url: "/persona-avatars/female-fair.webp",
  },
  {
    id: "female-east-asian",
    label: "Female professional, East Asian",
    gender: "female",
    skin_tone_group: "east_asian",
    image_url: "/persona-avatars/female-east-asian.webp",
  },
  {
    id: "female-south-asian",
    label: "Female professional, South Asian",
    gender: "female",
    skin_tone_group: "south_asian",
    image_url: "/persona-avatars/female-south-asian.webp",
  },
  {
    id: "female-latina",
    label: "Female professional, Latina or mixed heritage",
    gender: "female",
    skin_tone_group: "latina_or_mixed",
    image_url: "/persona-avatars/female-latina.webp",
  },
  {
    id: "male-dark",
    label: "Male professional, dark skin",
    gender: "male",
    skin_tone_group: "dark",
    image_url: "/persona-avatars/male-dark.webp",
  },
  {
    id: "male-fair",
    label: "Male professional, fair skin",
    gender: "male",
    skin_tone_group: "fair",
    image_url: "/persona-avatars/male-fair.webp",
  },
  {
    id: "male-east-asian",
    label: "Male professional, East Asian",
    gender: "male",
    skin_tone_group: "east_asian",
    image_url: "/persona-avatars/male-east-asian.webp",
  },
  {
    id: "male-south-asian",
    label: "Male professional, South Asian",
    gender: "male",
    skin_tone_group: "south_asian",
    image_url: "/persona-avatars/male-south-asian.webp",
  },
  {
    id: "male-latino",
    label: "Male professional, Latino or mixed heritage",
    gender: "male",
    skin_tone_group: "latino_or_mixed",
    image_url: "/persona-avatars/male-latino.webp",
  },
];
