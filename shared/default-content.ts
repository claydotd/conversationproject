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
      headingAlign: "left",
      bodyAlign: "left",
    },
    {
      id: "home-work-with-us",
      type: "text",
      background: "default",
      heading: "Ways we work",
      body: "Facilitation for offsites and difficult decisions. Coaching for leaders who want a more honest room. Workshops that give teams a shared language for feedback, conflict, and care.\n\nEvery engagement is tailored. Tell us what is stuck, and we will help you find the conversation that unlocks it.",
      headingAlign: "left",
      bodyAlign: "left",
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
      headingAlign: "left",
      bodyAlign: "left",
    },
    {
      id: "about-approach",
      type: "text",
      background: "default",
      heading: "How we show up",
      body: "We prepare carefully, hold the room firmly, and leave people with language they can keep using without us. You will not get a slide deck of values. You will get a way of speaking that can survive Monday morning.",
      headingAlign: "left",
      bodyAlign: "left",
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
      headingAlign: "left",
      bodyAlign: "left",
    },
    {
      id: "contact-form",
      type: "contact-form",
      background: "default",
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

const terms: PageContent = {
  slug: "terms",
  title: "Terms and conditions",
  sections: [
    {
      id: "terms-hero",
      type: "hero",
      background: "default",
      eyebrow: "Legal",
      heading: "Terms and conditions",
      subheading:
        "How this site works, and how we use your details if you get in touch or sign up.",
    },
    {
      id: "terms-using-the-site",
      type: "text",
      background: "default",
      heading: "Using this website",
      body: "This website is provided by The Conversation Project to share our work and make it easy to get in touch. Please use it in good faith. Do not attempt to disrupt the site, misuse forms, or copy content without permission.\n\nEvent listings may link out to Eventbrite or other third-party pages. Those services have their own terms, and we are not responsible for their content or booking processes.",
      headingAlign: "left",
      bodyAlign: "left",
    },
    {
      id: "terms-newsletter",
      type: "text",
      background: "default",
      heading: "Newsletter and contact details",
      body: "If you sign up to the newsletter, we use your first name, last name, and email address to send news and updates about upcoming workshops and related work. The consent checkbox is required: we will not add you unless you agree.\n\nYou can unsubscribe at any time using the link in our emails, or by contacting us. If you write to us through the contact form, we will use the details you send only to reply and to follow up on your enquiry.\n\nWe do not sell your personal details.",
      headingAlign: "left",
      bodyAlign: "left",
    },
    {
      id: "terms-changes",
      type: "text",
      background: "default",
      heading: "Changes",
      body: "We may update these terms as the site or our work changes. The latest version will always appear on this page. If you have questions, please contact us.",
      headingAlign: "left",
      bodyAlign: "left",
    },
  ],
  seoTitle: "Terms and conditions — The Conversation Project",
  seoDescription:
    "Terms for using The Conversation Project website, including newsletter signup and contact details.",
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
      body: "These are relaxed, structured conversations — not networking, not a lecture. A few prompts, a room of people willing to talk, and enough time to say the thing that usually stays unsaid.\n\nChoose an upcoming date below. Each card takes you to Eventbrite for tickets and the practical details.",
      headingAlign: "left",
      bodyAlign: "left",
    },
    {
      id: "events-list",
      type: "events-list",
      background: "default",
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
    newsletterHeading: "Stay in the loop",
    newsletterParagraph:
      "Sign up with your email address to receive news and updates on upcoming workshops.",
    newsletterConsentLabel:
      "I consent to receiving news and updates by email.",
    social: [],
  },
  pages: {
    home,
    about,
    events,
    contact,
    terms,
  },
  testimonials: [],
  publishedAt: null,
};
