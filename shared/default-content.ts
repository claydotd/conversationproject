import type { PageContent, SiteContent } from "./types";

const home: PageContent = {
  slug: "home",
  title: "Home",
  sections: [
    {
      id: "home-hero",
      type: "hero",
      background: "default",
      eyebrow: "The Conversation Project",
      heading: "Conversations that change how people work together.",
      subheading:
        "We help teams and leaders speak with more clarity, honesty, and care — so the important work can actually move.",
    },
    {
      id: "home-practice",
      type: "text",
      background: "default",
      heading: "A practice, not a script",
      body: "Most workplaces are full of meetings and short on meaning. We design spaces where people can say the thing that has been sitting unspoken, then leave with a shared next step.\n\nWhether you are gathering a leadership team, a community, or a room of strangers, the work is the same: listen well, name what is true, and keep the conversation human.",
    },
    {
      id: "home-work-with-us",
      type: "text",
      background: "default",
      heading: "Ways we work",
      body: "Facilitation for offsites and difficult decisions. Coaching for leaders who want a more honest room. Workshops that give teams a shared language for feedback, conflict, and care.\n\nEvery engagement is tailored. Tell us what is stuck, and we will help you find the conversation that unlocks it.",
    },
    {
      id: "00000000-0000-4000-8000-000000000001",
      type: "testimonial",
      background: "default",
      quote:
        "They held a conversation our board had been circling for two years. We left with a decision, and with relationships that were stronger than when we arrived.",
      authorName: "Priya N.",
      authorRole: "Chair, cultural organisation",
      imageUrl: "",
    },
    {
      id: "00000000-0000-4000-8000-000000000002",
      type: "testimonial",
      background: "default",
      quote:
        "It did not feel like corporate training. It felt like being taken seriously. The team still uses the phrases we found in that room.",
      authorName: "James Okafor",
      authorRole: "Head of Product",
      imageUrl: "",
    },
  ],
  seoTitle: "The Conversation Project",
  seoDescription:
    "Facilitation, coaching, and workshops that help people have the conversations that matter.",
};

const about: PageContent = {
  slug: "about",
  title: "About",
  sections: [
    {
      id: "about-hero",
      type: "hero",
      background: "default",
      eyebrow: "About",
      heading: "Built around the belief that talk is real work.",
      subheading:
        "The Conversation Project exists to make ambitious, kind, useful dialogue ordinary — in rooms where it is usually rare.",
    },
    {
      id: "about-story",
      type: "text",
      background: "default",
      heading: "Why this exists",
      body: "We started this work after sitting in too many rooms where the real conversation happened in the corridor afterwards. The project is a response to that: slower on purpose, structured enough to feel safe, and honest enough to be useful.\n\nOur background sits at the meeting point of facilitation, coaching, and organisational development. We are less interested in performance and more interested in what becomes possible when people tell the truth kindly.",
    },
    {
      id: "about-approach",
      type: "text",
      background: "default",
      heading: "How we show up",
      body: "We prepare carefully, hold the room firmly, and leave people with language they can keep using without us. You will not get a slide deck of values. You will get a way of speaking that can survive Monday morning.",
    },
    {
      id: "00000000-0000-4000-8000-000000000003",
      type: "testimonial",
      background: "default",
      quote:
        "Rare to find facilitators who can be both gentle and exacting. Nothing was fluffy, and nobody was made small.",
      authorName: "Dr. Helen Marsh",
      authorRole: "Clinical lead",
      imageUrl: "",
    },
  ],
  seoTitle: "About — The Conversation Project",
  seoDescription:
    "Learn about The Conversation Project, our approach to facilitation, and the people behind the work.",
};

const contact: PageContent = {
  slug: "contact",
  title: "Contact",
  sections: [
    {
      id: "contact-hero",
      type: "hero",
      background: "default",
      eyebrow: "Contact",
      heading: "Tell us about the conversation you need.",
      subheading:
        "Share a little context and we will come back with availability, an outline, and a clear next step.",
    },
    {
      id: "contact-note",
      type: "text",
      background: "default",
      heading: "What to include",
      body: "A few sentences is enough: who would be in the room, what you are hoping will be different afterwards, and any dates you already have in mind. If you are not sure yet, that is useful information too.",
    },
    {
      id: "00000000-0000-4000-8000-000000000004",
      type: "testimonial",
      background: "default",
      quote:
        "From the first reply to the day itself, the process was calm, clear, and human. Booking them was the easiest decision we made all year.",
      authorName: "Samir Patel",
      authorRole: "Operations director",
      imageUrl: "",
    },
  ],
  seoTitle: "Contact — The Conversation Project",
  seoDescription:
    "Get in touch with The Conversation Project about facilitation, coaching, or a workshop for your team.",
};

const events: PageContent = {
  slug: "events",
  title: "Events",
  sections: [
    {
      id: "events-hero",
      type: "hero",
      background: "default",
      eyebrow: "Events",
      heading: "Come and sit in a room with us.",
      subheading:
        "Upcoming gatherings from The Conversation Project. Booking and full details live on Eventbrite.",
    },
    {
      id: "events-intro",
      type: "text",
      background: "default",
      heading: "What to expect",
      body: "These are relaxed, structured conversations — not networking, not a lecture. A few prompts, a room of people willing to talk, and enough time to say the thing that usually stays unsaid.\n\nChoose an upcoming date below, or look back at past events. Each card takes you to Eventbrite for tickets and the practical details.",
    },
  ],
  seoTitle: "Events — The Conversation Project",
  seoDescription:
    "See upcoming Conversation Project events and book via Eventbrite.",
};

export const defaultContent: SiteContent = {
  site: {
    name: "The Conversation Project",
    tagline: "Facilitation, coaching, and rooms where people tell the truth kindly.",
    footerText: "Conversations worth having.",
    contactEmail: "hello@example.com",
    contactPhone: "",
    contactAddress: "",
    social: [],
  },
  pages: {
    home,
    about,
    events,
    contact,
  },
  testimonials: [],
  publishedAt: null,
};
