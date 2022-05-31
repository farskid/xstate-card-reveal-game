export function chunk<T>(array: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    out.push(array.slice(i, i + size));
  }
  return out;
}

function getAllDivisors(
  number: number
): { divisors: number[]; pairs: number[][] } {
  const divisors: number[] = [],
    tuples: number[][] = [];
  let i = 0;
  while (i <= Math.sqrt(number)) {
    if (number % i === 0) {
      tuples.push([number / i, i]);
      if (number / i === i) {
        divisors.push(i);
      } else {
        divisors.push(number / i, i);
      }
    }
    i++;
  }
  return { divisors, pairs: tuples };
}

// function sortLowToHigh(array: number[]): number[] {
//   return array.sort((a, b) => (a < b ? -1 : 0));
// }

export function getMidDivisors(number: number) {
  const { pairs } = getAllDivisors(number);
  return pairs.pop() as [number, number];
}

export function shuffleArray<T>(array: T[]): T[] {
  return array.sort((a, b) => (Math.random() > 0.5 ? 1 : -1));
}
