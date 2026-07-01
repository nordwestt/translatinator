import { setAtPath } from '../src/json-path';

describe('setAtPath', () => {
  it('should set a nested object value', () => {
    const root: Record<string, unknown> = { server: { deployment: {} } };

    setAtPath(root, ['server', 'deployment', 'starter'], 'Starter');

    expect(root).toEqual({
      server: {
        deployment: {
          starter: 'Starter'
        }
      }
    });
  });

  it('should create missing intermediate objects', () => {
    const root: Record<string, unknown> = {};

    setAtPath(root, ['section', 'label'], 'Label');

    expect(root).toEqual({
      section: {
        label: 'Label'
      }
    });
  });

  it('should set array values by index', () => {
    const root: Record<string, unknown> = { items: ['First'] };

    setAtPath(root, ['items', '1'], 'Second');

    expect(root).toEqual({ items: ['First', 'Second'] });
  });
});
