/*
 *                            *** MIT LICENSE ***
 * -------------------------------------------------------------------------
 * This code may be modified and distributed under the MIT license.
 * See the LICENSE file for details.
 * -------------------------------------------------------------------------
 *
 * @summary   Definitions for redux-logic
 *
 * @author    Alvis HT Tang <alvis@hilbert.space>
 * @license   MIT
 * @copyright Copyright (c) 2018 - All Rights Reserved.
 * -------------------------------------------------------------------------
 */

import { Object } from './utilities';

//
// ACTION
//

/*                     *    *    *    *                     *
 | The following definitions are bascially identical to     |
 | flux-standard-action without an extra package. It also   |
 | makes use of conditional type to make the type of        |
 | payload and meta more accurate.                          |
 *                     *    *    *    *                     */

/** Action as an agrument */
export type ArgumentAction<
  Type extends string = string,
  Payload extends Object = undefined,
  Meta extends Object = undefined
> = ActionBasis<Type> & Partial<Action<string, object, object>>;

/** all different types of Action */
export type Action<
  Type extends string = string,
  Payload extends Object = undefined,
  Meta extends Object = undefined
> =
  | ErroneousAction<Type, Meta>
  | (StandardAction<Type, Payload, Meta> & { error?: false });

/** Action without any error */
export type StandardAction<
  Type extends string = string,
  Payload extends Object = undefined,
  Meta extends Object = undefined
> = ActionBasis<Type> & PayloadBasis<Payload> & MetaBasis<Meta>;

/** Action with an Error */
export type ErroneousAction<
  Type extends string = string,
  Meta extends Object = undefined
> = ActionBasis<Type> & PayloadBasis<Error> & MetaBasis<Meta> & { error: true };

/* ----- Auxiliary Types ----- */

/** the most basic action object */
export interface ActionBasis<Type extends string = string> {
  type: Type extends infer U ? U : string;
}

/** return an interface with payload only if it presents */
export type PayloadBasis<
  Payload extends Object = undefined
> = Payload extends undefined ? {} : { payload: Payload };

/** return an interface with meta only if it presents */
export type MetaBasis<Meta extends Object = undefined> = Meta extends undefined
  ? {}
  : { meta: Meta };

// ---------------------------------------- //
