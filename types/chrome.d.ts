declare namespace chrome {
  const runtime: any;
  const storage: any;
  const notifications: any;
}

declare module "chrome" {
  export = chrome;
}
