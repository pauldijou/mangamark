import { refresh } from './storage';

const start: Promise<any> = Promise.resolve({}).then(refresh);

export default start;
