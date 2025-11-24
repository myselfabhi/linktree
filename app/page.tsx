import { Profile } from "./types/profile";

const profileData: Profile = {
  name: "Your Name",
  bio: "A short description about yourself",
  avatar: "/avatar.jpg",  // or leave undefined
  links: [
    {
      title: "Portfolio",
      url: "https://yourportfolio.com"
    },
    {
      title: "GitHub",
      url: "https://github.com/yourusername"
    },
    {
      title: "Twitter",
      url: "https://twitter.com/yourhandle"
    },
    {
      title: "LinkedIn",
      url: "https://linkedin.com/in/yourprofile"
    }
  ]
};