import { ReaderId } from '../types';
import Reader from './Reader';
import Mangareader from './Mangareader';
import { Option } from '../utils';

const mangareader = new Mangareader();

export const all: Array<Reader> = [
  mangareader
];

export function get(id: ReaderId): Option<Reader> {
  return Option.wrap(all.filter(function (reader) { return reader.id === id; })[0]);
}
