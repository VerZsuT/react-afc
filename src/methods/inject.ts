import type { Constructable, IInjectable } from '../types'

/**
 * Mark class as injectable
 */
export function Injectable<T extends Constructable<any>>(Constructable: T): IInjectable & T {
    return class extends Constructable {
        static __injectInstance__ = null
        constructor(...args: any[]) {
            super(...args)
        }
    }
}

/**
 * Returns the only instance of the passed injectable Type
 */
export function inject<T extends IInjectable>(Type: T): InstanceType<T> {
    switch (Type.__injectInstance__) {
    case undefined:
        throw new Error(`Type ${Type} is not injectable`)
    case null:
        Type.__injectInstance__ = new Type()
        break
    }

    return Type.__injectInstance__
}
