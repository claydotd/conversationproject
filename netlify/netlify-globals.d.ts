declare const Netlify: {
  env: {
    get(name: string): string | undefined;
    set(name: string, value: string): void;
  };
};
