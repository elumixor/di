# @elumixor/di

[![Build](https://github.com/elumixor/di/actions/workflows/build.yml/badge.svg)](https://github.com/elumixor/di/actions/workflows/build.yml)
[![Latest NPM version](https://img.shields.io/npm/v/@elumixor/di.svg)](https://www.npmjs.com/package/@elumixor/di)

Minimal dependency injection for TypeScript. ~76 lines, zero dependencies, singleton-scoped global container.

## Installation

```bash
npm install @elumixor/di
```

## Quick Start

```typescript
import { di } from "@elumixor/di";

// 1. Mark a class as injectable
const UserService = di.injectable(
  class UserService {
    getUser(id: string) {
      return { id, name: "Alice" };
    }
  },
);

// 2. Instantiate it (automatically registered in the container)
new UserService();

// 3. Retrieve it anywhere
const userService = di.inject(UserService);
userService.getUser("1"); // { id: "1", name: "Alice" }
```

## API

All functions are accessed via the `di` namespace object.

### `di.injectable(Class)`

Wraps a class so that instantiating it automatically registers the instance in the global container.

```typescript
const Logger = di.injectable(
  class Logger {
    log(msg: string) {
      console.log(msg);
    }
  },
);

new Logger(); // registered automatically
```

Each injectable class is a singleton — constructing it a second time throws an error.

### `di.inject(Class, options?)`

Retrieves a registered instance from the container.

```typescript
const logger = di.inject(Logger); // throws if not registered
```

Pass `{ optional: true }` to return `undefined` instead of throwing:

```typescript
const logger = di.inject(Logger, { optional: true }); // Logger | undefined
```

### `di.provide(Class, instance)`

Manually registers an instance. Useful for classes you don't control or for providing mock implementations in tests.

```typescript
class ExternalApi {
  fetch(url: string) {
    /* ... */
  }
}

const api = new ExternalApi();
di.provide(ExternalApi, api);

// later
di.inject(ExternalApi); // returns api
```

Throws if the class is already registered.

### `di.uninject(Class)`

Removes a class from the container. Useful for cleanup in tests.

```typescript
di.uninject(Logger);
// Logger can now be re-registered
```

## Patterns

### Abstract base class as a token

You can register against an abstract class, allowing consumers to depend on an abstraction:

```typescript
abstract class Database {
  abstract query(sql: string): unknown;
}

class PostgresDatabase extends Database {
  query(sql: string) {
    /* ... */
  }
}

di.provide(Database, new PostgresDatabase());

// Consumers only know about Database
const db = di.inject(Database);
```

### Testing with mocks

```typescript
// Reset and provide a mock before each test
di.uninject(UserService);
di.provide(UserService, { getUser: () => ({ id: "1", name: "Mock" }) } as any);
```

## Design

- **Singleton scope** — one instance per class, stored in a global `Map` on `globalThis`
- **Class constructors as tokens** — no string keys, no symbols, no interfaces
- **No auto-wiring** — dependencies are resolved explicitly via `di.inject()`
- **No decorators** — `di.injectable()` is a plain function wrapper, no decorator metadata required
