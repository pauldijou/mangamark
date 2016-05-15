import { ReaderId } from '../types';
import { Reader } from './Reader';
import Mangareader from './Mangareader';

const mangareader = new Mangareader();

export const all: Array<Reader> = [
  mangareader
];

export function get(id: ReaderId): Reader {
  return all.filter(function (reader) { return reader.id === id; })[0];
}
