import { Command } from './command'
import * as Parser from './parser/type'

const argumentMetadataKey = Symbol('Argument')

/**
 * Creates CLI argument based on the passed `options` and assigns its value to the property
 *
 * @param options IOption object, which defines the argument of the command
 */
export function Argument(options: Parser.Argument): PropertyDecorator {
  return Reflect.metadata(argumentMetadataKey, options)
}

/**
 * Get the yargs argument option key from ExternalOption metadata on the given property
 *
 * @param target Command instance
 * @param propertyKey Property of the command instance
 */
export function getArgument<T extends Command, K extends Extract<keyof T, string>>(
  target: T,
  propertyKey: K,
): Parser.Argument<T> {
  return Reflect.getMetadata(argumentMetadataKey, target, propertyKey)
}
