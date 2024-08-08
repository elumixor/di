/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyConstructor<T extends object = object, TArgs extends any[] = any[]> =
    | AbstractConstructor<T, TArgs>
    | Constructor<T, TArgs>;
type Constructor<T extends object = object, TArgs extends any[] = any[]> = new (...params: TArgs) => T;
type AbstractConstructor<T extends object = object, TArgs extends any[] = any[]> = abstract new (...params: TArgs) => T;

const target = globalThis as typeof globalThis & { __di_injectable_map__?: Map<unknown, object> };
if (!Reflect.has(target, "__di_injectable_map__"))
    Reflect.set(target, "__di_injectable_map__", new Map<unknown, object>());

const serviceMap = target.__di_injectable_map__!;

/**
 * Obtains the instance of the required service.
 *
 * Like {@link tryGet}, but throws an error if the service is not found.
 *
 * @returns The instance of the service.
 * @throws {@link Error} If the service is not provided.
 * @param service The class of the service to obtain.
 */
function inject<T extends object>(service: AnyConstructor<T>, options?: { optional?: false }): T;
function inject<T extends object>(service: AnyConstructor<T>, options: { optional: true }): T | undefined;
function inject<T extends object>(service: AnyConstructor<T>, options?: { optional?: boolean }) {
    const instance = serviceMap.get(service);
    if (instance) return instance as T;
    if (options?.optional) return undefined;
    throw new Error(`No provider for ${service.name}`);
}

/**
 * Provides and instance of a service.
 * @param service The class of the service.
 * @param instance The instance of the service to be provided.
 */
function provide<T extends object>(service: AnyConstructor<T>, instance: T) {
    if (serviceMap.has(service)) throw new Error(`Provider ${service.name} is already specified`);

    serviceMap.set(service, instance);
}

/**
 * Checks if a service is provided.
 * @param service The class of the service.
 */
function isProvided(service: AnyConstructor) {
    return serviceMap.has(service);
}

function injectable<TBase extends AnyConstructor>(Base: TBase): TBase {
    if (isProvided(Reflect.getPrototypeOf(Base) as AnyConstructor))
        throw new Error("Trying to provide a different child for the same provided parent");

    class Wrapper extends Base {
        constructor(...args: ConstructorParameters<TBase>) {
            if (isProvided(Wrapper))
                throw new Error("Trying to provide a different child for the same provided parent");

            // Base may either be a constructor or an abstract constructor
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            super(...args);
            provide(Wrapper, this);
        }
    }

    return Wrapper;
}

function uninject(Base: AnyConstructor) {
    serviceMap.delete(Base);
}

export const di = { inject, provide, injectable, uninject };
