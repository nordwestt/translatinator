import { ProgressBar } from '../src/progress';

describe('ProgressBar', () => {
  let writeSpy: jest.SpyInstance;

  beforeEach(() => {
    writeSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    writeSpy.mockRestore();
  });

  it('should render progress updates when enabled', () => {
    const progress = new ProgressBar('de', true);

    progress.update(1, 4, 'greeting');
    progress.finish();

    expect(writeSpy).toHaveBeenCalled();
    const output = writeSpy.mock.calls.map((call) => String(call[0])).join('');
    expect(output).toContain('de');
    expect(output).toContain('25%');
    expect(output).toContain('greeting');
    expect(output.endsWith('\n')).toBe(true);
  });

  it('should not write output when disabled', () => {
    const progress = new ProgressBar('de', false);

    progress.update(1, 4, 'greeting');
    progress.finish();

    expect(writeSpy).not.toHaveBeenCalled();
  });
});
