import { InitialsPipe } from './initials.pipe';
import { RenderCountPipe } from './render-count.pipe';
import { TenurePipe } from './tenure.pipe';

describe('InitialsPipe', () => {
  const pipe = new InitialsPipe();

  it('takes the first letter of the first two words', () => {
    expect(pipe.transform('Aarav Mehta')).toBe('AM');
    expect(pipe.transform('Liam Patrick O’Connor')).toBe('LP');
  });

  it('handles a single name and collapses extra whitespace', () => {
    expect(pipe.transform('Cher')).toBe('C');
    expect(pipe.transform('  Mei   Tanaka  ')).toBe('MT');
  });

  it('falls back for empty input', () => {
    expect(pipe.transform('')).toBe('??');
    expect(pipe.transform(null)).toBe('??');
    expect(pipe.transform(undefined)).toBe('??');
  });
});

describe('TenurePipe', () => {
  const pipe = new TenurePipe();
  // Fixed "now" so the assertions do not drift with the wall clock.
  const now = new Date('2026-01-01T00:00:00Z').getTime();

  it('reports whole years for tenures over a year', () => {
    expect(pipe.transform('2021-01-01', now)).toBe('5.0 yr');
  });

  it('reports months for tenures under a year', () => {
    expect(pipe.transform('2025-10-01', now)).toBe('3 mo');
  });

  it('renders a dash for a missing date', () => {
    expect(pipe.transform(null)).toBe('—');
  });
});

describe('RenderCountPipe', () => {
  it('counts every invocation, which is what makes it a CD probe', () => {
    const pipe = new RenderCountPipe();

    expect(pipe.transform()).toBe(1);
    expect(pipe.transform()).toBe(2);
    expect(pipe.transform()).toBe(3);
  });
});
