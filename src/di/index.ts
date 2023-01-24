import { Constructor, Registration, RegistrationDetails, Token } from './types'

const registrations = new Map<Token, Registration<any> & RegistrationDetails<any>>()
const singletons = new Map<Token, any>()

export function register<T>(token: Token, value: T): void
export function register<T>(registration?: Registration<T>): (ctor: Constructor<T>) => void
export function register<T>(...args: [token: Token, value: T] | [registration?: Registration<T>]) {
  if (args.length === 2) {
    const [token, value] = args
    singletons.set(token, value)

    registrations.set(token, {
      as: token,
      ctor: null,
      singleton: true,
    })

    return
  }

  const [registration] = args

  return function (ctor: Constructor<T>) {
    registrations.set(ctor, {
      ...registration,
      ctor: ctor,
    })

    if (registration?.as) {
      registrations.set(registration.as, {
        ...registration,
        ctor: ctor,
      })
    }
  }
}

export function provide(token: Token) {}

export async function resolve<T, AS extends any[] = any[], C extends Constructor<T, AS> = Constructor<T, AS>>(
  token: Token<T> | Constructor<T>,
  ...args: AS
): Promise<T> {
  const registration = registrations.get(token)

  if (!registration) {
    console.log(registrations, singletons)
    throw new Error(`Cannot resolve token ${String(token)}`)
  }
  let instance: T

  if (registration.singleton && singletons.has(token)) {
    return singletons.get(token)!
  }

  let argumentsList: any[]

  if (registration.inject) {
    argumentsList = [...(await Promise.all(registration.inject.map((token) => resolve(token)))), ...args]
  } else {
    argumentsList = [...args]
  }

  if (registration.factory) {
    instance = await registration.factory()
  } else if (registration.ctor) {
    instance = Reflect.construct(registration.ctor, argumentsList, registration.ctor)
  } else {
    throw new Error(`Cannot construct token ${String(token)}: not a class`)
  }

  if (registration.singleton) {
    singletons.set(token, instance)
  }

  return instance
}
