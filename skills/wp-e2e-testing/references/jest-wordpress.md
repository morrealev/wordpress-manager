# Jest for WordPress JavaScript Testing

Use this file when writing or configuring Jest unit tests for WordPress JavaScript code.

## Setup with @wordpress/scripts

`@wordpress/scripts` includes a preconfigured Jest setup. No separate Jest config needed:

```bash
npm install -D @wordpress/scripts
```

Add to `package.json`:
```json
{
  "scripts": {
    "test:unit": "wp-scripts test-unit-js",
    "test:unit:watch": "wp-scripts test-unit-js --watch"
  }
}
```

## Test file location

By convention, tests go in:
- `src/component/__tests__/component.test.js` — colocated with source
- `src/component/test/component.test.js` — `test/` subdirectory
- `tests/js/` — separate test directory (configure in `jest.config.js`)

## Writing tests

```js
import { render, screen } from '@testing-library/react';
import MyBlock from '../edit';

describe('MyBlock', () => {
  it('renders the block content', () => {
    const attributes = { content: 'Hello World' };
    render(<MyBlock attributes={attributes} />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });
});
```

## Mocking WordPress globals

Create `tests/js/setup-globals.js`:

```js
// Mock wp global
global.wp = {
  element: require('@wordpress/element'),
  data: require('@wordpress/data'),
  i18n: { __: (str) => str, _n: (s, p, n) => (n === 1 ? s : p) },
};

// Mock jQuery if needed
global.jQuery = jest.fn(() => ({
  on: jest.fn(),
  off: jest.fn(),
  trigger: jest.fn(),
  ready: jest.fn((fn) => fn()),
}));
```

Reference in `jest.config.js`:
```js
module.exports = {
  ...require('@wordpress/scripts/config/jest-unit.config'),
  setupFiles: ['./tests/js/setup-globals.js'],
};
```

## Testing @wordpress/data stores

```js
import { createRegistry } from '@wordpress/data';
import { store as myStore } from '../store';

describe('My Store', () => {
  let registry;

  beforeEach(() => {
    registry = createRegistry();
    registry.register(myStore);
  });

  it('returns default state', () => {
    const result = registry.select(myStore).getItems();
    expect(result).toEqual([]);
  });

  it('adds an item via action', () => {
    registry.dispatch(myStore).addItem({ id: 1, title: 'Test' });
    const result = registry.select(myStore).getItems();
    expect(result).toHaveLength(1);
  });
});
```

## Running

```bash
npx wp-scripts test-unit-js                  # Run all tests
npx wp-scripts test-unit-js --watch          # Watch mode
npx wp-scripts test-unit-js --coverage       # With coverage report
npx wp-scripts test-unit-js -- path/to/test  # Run specific test
```

## Common issues

- **"Cannot find module @wordpress/..."**: ensure the package is in dependencies; `@wordpress/scripts` provides many but not all
- **JSX transform errors**: `@wordpress/scripts` handles this; don't add a separate Babel config unless needed
- **Snapshot mismatches after update**: review changes, then `npx wp-scripts test-unit-js --updateSnapshot`
